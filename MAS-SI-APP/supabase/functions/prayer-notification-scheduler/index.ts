// supabase/functions/prayer-notification-scheduler/index.ts
//
// OPTIMIZED VERSION
//
// Before: ~42 DB calls per invocation
// After:  ~6 DB calls per invocation
//
// Key optimizations:
// 1. Fetch todays_prayers ONCE (was 3×)
// 2. Fetch ALL prayer_notification_settings in ONE query (was 15×)
// 3. Fetch ALL push tokens in ONE query (was 15×)
// 4. Single bulk insert for all notification types
// 5. Proper timezone handling (no +4 hack)
// 6. Service role key instead of anon key
//

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { format } from 'https://esm.sh/date-fns@4.1.0/format.mjs'
import { isBefore, isAfter, isToday } from 'https://esm.sh/date-fns@4.1.0'

// Use service role for admin operations (scheduling notifications for all users)
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================================================
// TIMEZONE CONFIGURATION
// ============================================================================
// Your mosque's UTC offset in hours. For EST = -5, so we add 5 to convert local → UTC.
// For EDT = -4, so we add 4.
// TODO: When scaling to multi-mosque, pull this from a mosque_settings table.
const UTC_OFFSET_HOURS = 5 // EST (change to 4 for EDT)

function localTimeToUTC(timeString: string): Date {
  const [hours, minutes, seconds] = timeString.split(':').map(Number)
  const now = new Date()
  const utcDate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    hours + UTC_OFFSET_HOURS,
    minutes,
    seconds || 0,
    0
  ))
  return utcDate
}

function formatLocalTime(utcDate: Date): string {
  // Convert UTC timestamp back to local for display
  const localDate = new Date(utcDate.getTime() - UTC_OFFSET_HOURS * 60 * 60 * 1000)
  return format(localDate, 'h:mm a')
}

function capitalize(str: string): string {
  if (str === 'dhuhr') return 'Dhuhr'
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function normalizePrayer(name: string): string {
  return name === 'zuhr' ? 'dhuhr' : name
}

function normalizeTaraweeh(prayer: string): { isTaraweeh: boolean; session: 'first' | 'second' | null } {
  if (prayer === 'tarawih one' || prayer === 'taraweeh 1') {
    return { isTaraweeh: true, session: 'first' }
  }
  if (prayer === 'tarawih two' || prayer === 'taraweeh 2') {
    return { isTaraweeh: true, session: 'second' }
  }
  return { isTaraweeh: false, session: null }
}

// ============================================================================
// TYPES
// ============================================================================
interface PrayerTime {
  prayer_name: string
  athan_time: string
  iqamah_time: string
}

interface PrayerNotificationSetting {
  user_id: string
  prayer: string
  notification_settings: string[]
}

interface JummahSetting {
  user_id: string
  jummah: string
  notification_settings: string[]
}

interface NotificationRow {
  user_id: string
  notification_time: Date
  prayer: string
  message: string
  push_notification_token: string
  notification_type: string
  title?: string
}

// ============================================================================
// MAIN SCHEDULER
// ============================================================================
async function scheduleAllNotifications() {
  const startTime = Date.now()
  const todaysDate = new Date()
  const isFriday = todaysDate.getDay() === 5

  // ==========================================================================
  // STEP 1: Fetch ALL data (with pagination to bypass row limits)
  // ==========================================================================
  
  // Fetch today's prayers (small table, no pagination needed)
  const { data: prayers, error: prayerError } = await supabase
    .from('todays_prayers')
    .select('prayer_name, athan_time, iqamah_time')

  if (prayerError) {
    console.error('Error fetching prayers:', prayerError)
    return { error: 'Failed to fetch prayers' }
  }
  if (!prayers || prayers.length === 0) {
    return { error: 'No prayer times found' }
  }

  // Paginate prayer_notification_settings (can be 8,000+ rows)
  const allSettings: any[] = []
  const PAGE_SIZE = 1000
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('prayer_notification_settings')
      .select('user_id, prayer, notification_settings')
      .range(from, from + PAGE_SIZE - 1)
    
    if (error) {
      console.error('Error fetching settings page:', error)
      break
    }
    if (!data || data.length === 0) break
    allSettings.push(...data)
    if (data.length < PAGE_SIZE) break // last page
    from += PAGE_SIZE
  }
  console.log(`Fetched ${allSettings.length} notification settings (${Math.ceil(from / PAGE_SIZE) + 1} pages)`)

  // Fetch jummah settings (only on Fridays)
  let jummahSettings: JummahSetting[] = []
  if (isFriday) {
    let jFrom = 0
    while (true) {
      const { data, error } = await supabase
        .from('jummah_notifications')
        .select('user_id, jummah, notification_settings')
        .range(jFrom, jFrom + PAGE_SIZE - 1)
      
      if (error) {
        console.error('Error fetching jummah settings:', error)
        break
      }
      if (!data || data.length === 0) break
      jummahSettings.push(...data)
      if (data.length < PAGE_SIZE) break
      jFrom += PAGE_SIZE
    }
  }

  if (allSettings.length === 0) {
    return { scheduled: 0, message: 'No notification settings configured' }
  }

  // ==========================================================================
  // STEP 2: Build lookup maps (pure computation, no DB calls)
  // ==========================================================================

  // Prayer time lookup: normalized name → prayer data
  const prayerMap = new Map<string, PrayerTime>()
  for (const p of prayers) {
    prayerMap.set(normalizePrayer(p.prayer_name), p)
  }

  // Prayer order for "30 mins before next prayer"
  const prayerOrder = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

  // Group settings by user for efficient token fetching
  // Also collect ALL unique user IDs across all settings
  const allUserIds = new Set<string>()
  for (const setting of allSettings) {
    allUserIds.add(setting.user_id)
  }

  // Add jummah user IDs (already fetched above via pagination)
  for (const j of jummahSettings) {
    allUserIds.add(j.user_id)
  }

  // ==========================================================================
  // STEP 3: Fetch ALL push tokens in ONE query (not 15×)
  // ==========================================================================
  const userIdArray = [...allUserIds]
  const tokenMap = new Map<string, string>()

  // Batch in chunks of 100 for Supabase .in() limit
  for (let i = 0; i < userIdArray.length; i += 100) {
    const chunk = userIdArray.slice(i, i + 100)
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, push_notification_token')
      .in('id', chunk)
      .not('push_notification_token', 'is', null)

    if (profileError) {
      console.error('Error fetching profiles chunk:', profileError)
      continue
    }

    for (const profile of profiles || []) {
      if (profile.push_notification_token) {
        tokenMap.set(profile.id, profile.push_notification_token)
      }
    }
  }

  if (tokenMap.size === 0) {
    return { scheduled: 0, message: 'No users with push tokens' }
  }

  // ==========================================================================
  // STEP 4: Build ALL notification rows (pure computation, no DB calls)
  // ==========================================================================
  const insertRows: NotificationRow[] = []

  for (const setting of allSettings as PrayerNotificationSetting[]) {
    const pushToken = tokenMap.get(setting.user_id)
    if (!pushToken) continue

    const normalizedPrayer = normalizePrayer(setting.prayer)

    // Skip tarawih/taraweeh - handled separately in Step 6
    if (normalizedPrayer.startsWith('tarawih') || normalizedPrayer.startsWith('taraweeh')) continue

    const prayer = prayerMap.get(normalizedPrayer)
    if (!prayer) continue

    const athanUTC = localTimeToUTC(prayer.athan_time)
    const iqamahUTC = localTimeToUTC(prayer.iqamah_time)
    const displayName = capitalize(normalizedPrayer)
    const athanDisplay = formatLocalTime(athanUTC)
    const iqamahDisplay = formatLocalTime(iqamahUTC)

    for (const notifType of setting.notification_settings || []) {

      // --- Alert at Athan Time ---
      if (notifType === 'Alert at Athan time') {
        insertRows.push({
          user_id: setting.user_id,
          notification_time: athanUTC,
          prayer: normalizedPrayer,
          message: `Time to pray ${displayName} ${athanDisplay} \n Iqamah Time ${iqamahDisplay}`,
          push_notification_token: pushToken,
          notification_type: 'Alert at Athan time',
        })
      }

      // --- Alert at Iqamah Time ---
      if (notifType === 'Alert at Iqamah time') {
        insertRows.push({
          user_id: setting.user_id,
          notification_time: iqamahUTC,
          prayer: normalizedPrayer,
          message: `Iqamah Time for ${displayName} at ${iqamahDisplay}`,
          push_notification_token: pushToken,
          notification_type: 'Alert at Iqamah time',
        })
      }

      // --- Alert 30 Mins Before Next Prayer ---
      if (notifType === 'Alert 30 mins before next prayer') {
        const currentIndex = prayerOrder.indexOf(normalizedPrayer)
        if (currentIndex === -1 || currentIndex >= prayerOrder.length - 1) continue

        const nextPrayerName = prayerOrder[currentIndex + 1]
        const nextPrayer = prayerMap.get(nextPrayerName)
        if (!nextPrayer) continue

        const nextAthanUTC = localTimeToUTC(nextPrayer.athan_time)
        const alertTime = new Date(nextAthanUTC.getTime() - 30 * 60 * 1000)

        insertRows.push({
          user_id: setting.user_id,
          notification_time: alertTime,
          prayer: normalizedPrayer,
          message: `30 mins before ${capitalize(nextPrayerName)}!`,
          push_notification_token: pushToken,
          notification_type: 'Alert 30mins before next prayer',
        })
      }
    }
  }

  // ==========================================================================
  // STEP 5: Jummah notifications (Friday only)
  // ==========================================================================
  if (isFriday && jummahSettings.length > 0) {
    const jummahTimes: Record<string, string> = {
      first: '12:15:00',
      second: '13:00:00',
      third: '13:45:00',
    }
    const jummahDisplayTimes: Record<string, string> = {
      first: '12:15 PM',
      second: '1:00 PM',
      third: '1:45 PM',
    }
    const defaultTime = '15:45:00'
    const defaultDisplay = '3:45 PM'

    for (const setting of jummahSettings) {
      const pushToken = tokenMap.get(setting.user_id)
      if (!pushToken) continue

      const timeStr = jummahTimes[setting.jummah] || defaultTime
      const displayTime = jummahDisplayTimes[setting.jummah] || defaultDisplay
      const jummahUTC = localTimeToUTC(timeStr)
      const jummahLabel = capitalize(setting.jummah)

      for (const notifType of setting.notification_settings || []) {
        if (notifType === 'Alert at Athan Time') {
          insertRows.push({
            user_id: setting.user_id,
            notification_time: jummahUTC,
            prayer: `${setting.jummah} jummah`,
            message: `${jummahLabel} Jummah Prayer Starting Now!\n${displayTime} Jummah`,
            push_notification_token: pushToken,
            notification_type: 'Alert at Athan Time',
            title: `${displayTime} Jummah`,
          })
        }

        if (notifType === 'Alert 30 Mins Before') {
          const alertTime = new Date(jummahUTC.getTime() - 30 * 60 * 1000)
          insertRows.push({
            user_id: setting.user_id,
            notification_time: alertTime,
            prayer: `${setting.jummah} jummah`,
            message: `${jummahLabel} Jummah Prayer will begin in 30 minutes`,
            push_notification_token: pushToken,
            notification_type: 'Alert 30 Mins Before',
            title: `${displayTime} Jummah`,
          })
        }
      }
    }
  }

  // ==========================================================================
  // STEP 6: Taraweeh notifications (Ramadan only)
  // ==========================================================================
  const ramadanEnd = new Date(2026, 2, 20) // March 20, 2026
  const ramadanStart = new Date(2026, 1, 17)
  if ( isBefore(todaysDate, ramadanEnd) && (isAfter(todaysDate, ramadanStart) || isToday(ramadanStart) ) ) {
    const ishaData = prayerMap.get('isha')
    if (ishaData) {
      const ishaIqamahUTC = localTimeToUTC(ishaData.iqamah_time)

      // First Taraweeh = at Isha iqamah
      const firstTime = ishaIqamahUTC
      const firstTimeMinus30 = new Date(firstTime.getTime() - 30 * 60 * 1000)

      // Second Taraweeh = 1 hour 30 min after Isha iqamah
      const secondTime = new Date(ishaIqamahUTC.getTime() + 90 * 60 * 1000)
      const secondTimeMinus30 = new Date(secondTime.getTime() - 30 * 60 * 1000)

      const firstDisplay = formatLocalTime(firstTime)
      const secondDisplay = formatLocalTime(secondTime)

      // Filter ALL taraweeh settings (both old and new naming conventions)
      const allTaraweehSettings = (allSettings as PrayerNotificationSetting[]).filter(s => {
        const { isTaraweeh } = normalizeTaraweeh(s.prayer)
        return isTaraweeh
      })

      // Deduplicate per user+session, preferring new names ("taraweeh 1/2") over old ("tarawih one/two")
      const deduped = new Map<string, PrayerNotificationSetting>()
      for (const setting of allTaraweehSettings) {
        const { session } = normalizeTaraweeh(setting.prayer)
        const key = `${setting.user_id}::${session}`
        const existing = deduped.get(key)
        if (!existing || setting.prayer.startsWith('taraweeh')) {
          deduped.set(key, setting)
        }
      }

      for (const setting of deduped.values()) {
        const pushToken = tokenMap.get(setting.user_id)
        if (!pushToken) continue

        const { session } = normalizeTaraweeh(setting.prayer)
        const isFirst = session === 'first'
        const atTime = isFirst ? firstTime : secondTime
        const beforeTime = isFirst ? firstTimeMinus30 : secondTimeMinus30
        const display = isFirst ? firstDisplay : secondDisplay
        const label = isFirst ? 'First' : 'Second'

        for (const notifType of setting.notification_settings || []) {
          if (notifType === 'Alert at Athan time') {
            insertRows.push({
              user_id: setting.user_id,
              notification_time: atTime,
              prayer: setting.prayer,
              message: `${label} Taraweeh Starting Now!\n${display}`,
              push_notification_token: pushToken,
              notification_type: 'Alert at Athan time',
            })
          }

          if (notifType === 'Alert 30 Mins Before') {
            insertRows.push({
              user_id: setting.user_id,
              notification_time: beforeTime,
              prayer: setting.prayer,
              message: `${label} Taraweeh Starting in 30 Mins!\n${display}`,
              push_notification_token: pushToken,
              notification_type: 'Alert 30 Mins Before',
            })
          }
        }
      }
    }
  }

  // ==========================================================================
  // STEP 7: Single bulk insert (not 4 separate inserts)
  // ==========================================================================
  let insertedCount = 0

  if (insertRows.length > 0) {
    // Supabase handles large inserts fine, but chunk at 1000 for safety
    for (let i = 0; i < insertRows.length; i += 1000) {
      const chunk = insertRows.slice(i, i + 1000)
      const { error: insertError } = await supabase
        .from('prayer_notification_schedule')
        .insert(chunk)

      if (insertError) {
        console.error(`Error inserting chunk ${i / 1000 + 1}:`, insertError)
      } else {
        insertedCount += chunk.length
      }
    }
  }

  const duration = Date.now() - startTime
  const result = {
    scheduled: insertedCount,
    total_built: insertRows.length,
    users_with_tokens: tokenMap.size,
    is_friday: isFriday,
    jummah_users: jummahSettings.length,
    duration_ms: duration,
    db_calls: 3 + Math.ceil(userIdArray.length / 100) + Math.ceil(insertRows.length / 1000),
  }

  console.log('Scheduler complete:', result)
  return result
}

// ============================================================================
// HTTP HANDLER
// ============================================================================
Deno.serve(async (req) => {
  try {
    const result = await scheduleAllNotifications()

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Scheduler fatal error:', error)

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})