// supabase/functions/program-notification-scheduler/index.ts
//
// OPTIMIZED VERSION
//
// Before: ~300+ DB calls (N+1 on tokens, programs, events, and inserts)
// After:  ~6 DB calls total
//
// Bugs fixed:
// 1. Cache check used = (assignment) instead of === (comparison)
// 2. "Day Before" broke on Sunday: (-1) % 7 = -1 in JS, not 6
// 3. Operator precedence: (event_day) - 1 % 7 ≠ (event_day - 1) % 7
// 4. Copy-paste error: 30 Mins Before had wrong message/type for events
// 5. Service role key instead of anon key for admin operations
//

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================================================
// CONFIGURATION
// ============================================================================
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const UTC_OFFSET_HOURS = 5 // EST. Change to 4 for EDT.

// ============================================================================
// TYPES
// ============================================================================
interface ProgramSetting {
  user_id: string
  program_id: string
  notification_settings: string[]
}

interface EventSetting {
  user_id: string
  event_id: string
  notification_settings: string[]
}

interface ProgramInfo {
  program_id: string
  program_name: string
  program_days: string[]
  program_start_time: string
}

interface EventInfo {
  event_id: string
  event_name: string
  event_days: string[]
  event_start_time: string
}

interface NotificationRow {
  user_id: string
  push_notification_token: string
  message: string
  notification_type: string
  program_event_name: string
  notification_time: Date
  title: string
  is_event: boolean
}

// ============================================================================
// UTILITIES
// ============================================================================
function localTimeToUTC(timeString: string): Date {
  const [hours, minutes, seconds] = timeString.split(':').map(Number)
  const now = new Date()
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    hours + UTC_OFFSET_HOURS,
    minutes,
    seconds || 0,
    0
  ))
}

// Correct "day before" calculation that handles Sunday properly
function isDayBefore(today: number, targetDay: number): boolean {
  // Returns true if today is the day before targetDay
  // Uses +7 to avoid negative modulo: (0 - 1 + 7) % 7 = 6 (Saturday)
  return today === ((targetDay - 1 + 7) % 7)
}

function isToday(today: number, dayName: string): boolean {
  return DAYS_OF_WEEK[today] === dayName
}

// ============================================================================
// NOTIFICATION BUILDER
// Generic function that handles both programs and events identically
// ============================================================================
function buildNotifications(
  settings: Array<{ user_id: string; item_id: string; notification_settings: string[] }>,
  itemMap: Map<string, { name: string; days: string[]; start_time: string }>,
  tokenMap: Map<string, string>,
  today: number,
  isEvent: boolean
): NotificationRow[] {
  const rows: NotificationRow[] = []

  for (const setting of settings) {
    const pushToken = tokenMap.get(setting.user_id)
    if (!pushToken) continue

    const item = itemMap.get(setting.item_id)
    if (!item) continue

    const startTimeUTC = localTimeToUTC(item.start_time)
    const itemName = item.name

    for (const notifType of setting.notification_settings || []) {

      // --- Day Before ---
      if (notifType === 'Day Before') {
        for (const dayName of item.days) {
          const targetDay = DAYS_OF_WEEK.indexOf(dayName)
          if (targetDay === -1) continue

          if (isDayBefore(today, targetDay)) {
            rows.push({
              user_id: setting.user_id,
              push_notification_token: pushToken,
              message: `${itemName} is Tomorrow, Don't Forget!`,
              notification_type: 'Day Before',
              program_event_name: itemName,
              notification_time: startTimeUTC,
              title: itemName,
              is_event: isEvent,
            })
          }
        }
      }

      // Only schedule "When Starts" and "30 Mins Before" if the item runs today
      const runsToday = item.days.some(dayName => isToday(today, dayName))
      if (!runsToday) continue

      // --- When Program/Event Starts ---
      if (notifType === 'When Program Starts') {
        rows.push({
          user_id: setting.user_id,
          push_notification_token: pushToken,
          message: `${itemName} is Starting Now!`,
          notification_type: 'When Program Starts',
          program_event_name: itemName,
          notification_time: startTimeUTC,
          title: itemName,
          is_event: isEvent,
        })
      }

      // --- 30 Mins Before ---
      if (notifType === '30 Mins Before') {
        const thirtyBefore = new Date(startTimeUTC.getTime() - 30 * 60 * 1000)
        rows.push({
          user_id: setting.user_id,
          push_notification_token: pushToken,
          message: `${itemName} is Starting in 30 Mins!`,
          notification_type: '30 Mins Before',
          program_event_name: itemName,
          notification_time: thirtyBefore,
          title: itemName,
          is_event: isEvent,
        })
      }
    }
  }

  return rows
}

// ============================================================================
// MAIN SCHEDULER
// ============================================================================
async function scheduleAllNotifications() {
  const startTime = Date.now()
  const today = new Date().getDay()

  // ==========================================================================
  // STEP 1: Fetch all settings in parallel (2 queries)
  // ==========================================================================
  const [
    { data: programSettings, error: progSettingsErr },
    { data: eventSettings, error: eventSettingsErr }
  ] = await Promise.all([
    supabase.from('program_notifications_settings').select('user_id, program_id, notification_settings'),
    supabase.from('event_notification_settings').select('user_id, event_id, notification_settings'),
  ])

  if (progSettingsErr) console.error('Error fetching program settings:', progSettingsErr)
  if (eventSettingsErr) console.error('Error fetching event settings:', eventSettingsErr)

  const allProgramSettings = (programSettings || []) as ProgramSetting[]
  const allEventSettings = (eventSettings || []) as EventSetting[]

  // Early exit if no settings
  if (allProgramSettings.length === 0 && allEventSettings.length === 0) {
    return { scheduled: 0, message: 'No notification settings configured', duration_ms: Date.now() - startTime }
  }

  // ==========================================================================
  // STEP 2: Collect unique IDs for batch fetching
  // ==========================================================================
  const uniqueUserIds = new Set<string>()
  const uniqueProgramIds = new Set<string>()
  const uniqueEventIds = new Set<string>()

  for (const s of allProgramSettings) {
    uniqueUserIds.add(s.user_id)
    uniqueProgramIds.add(s.program_id)
  }
  for (const s of allEventSettings) {
    uniqueUserIds.add(s.user_id)
    uniqueEventIds.add(s.event_id)
  }

  // ==========================================================================
  // STEP 3: Fetch all data in parallel (tokens + programs + events)
  // ==========================================================================
  const fetchPromises: Promise<any>[] = []

  // Fetch push tokens in chunks of 100
  const userIdArray = [...uniqueUserIds]
  const tokenChunkPromises = []
  for (let i = 0; i < userIdArray.length; i += 100) {
    const chunk = userIdArray.slice(i, i + 100)
    tokenChunkPromises.push(
      supabase
        .from('profiles')
        .select('id, push_notification_token')
        .in('id', chunk)
        .not('push_notification_token', 'is', null)
    )
  }

  // Fetch all relevant programs in ONE query
  const programIdArray = [...uniqueProgramIds]
  let programPromise: Promise<any> | null = null
  if (programIdArray.length > 0) {
    // Chunk if > 100 programs (unlikely but safe)
    const programChunks = []
    for (let i = 0; i < programIdArray.length; i += 100) {
      programChunks.push(
        supabase
          .from('programs')
          .select('program_id, program_name, program_days, program_start_time')
          .in('program_id', programIdArray.slice(i, i + 100))
          .gte('program_end_date', new Date().toISOString())
      )
    }
    programPromise = Promise.all(programChunks)
  }

  // Fetch all relevant events in ONE query
  const eventIdArray = [...uniqueEventIds]
  let eventPromise: Promise<any> | null = null
  if (eventIdArray.length > 0) {
    const eventChunks = []
    for (let i = 0; i < eventIdArray.length; i += 100) {
      eventChunks.push(
        supabase
          .from('events')
          .select('event_id, event_name, event_days, event_start_time')
          .in('event_id', eventIdArray.slice(i, i + 100))
          .gte('event_end_date', new Date().toISOString())
      )
    }
    eventPromise = Promise.all(eventChunks)
  }

  // Execute all fetches in parallel
  const [tokenResults, programResults, eventResults] = await Promise.all([
    Promise.all(tokenChunkPromises),
    programPromise,
    eventPromise,
  ])

  // ==========================================================================
  // STEP 4: Build lookup maps (pure computation, no DB calls)
  // ==========================================================================

  // Token map: user_id → push_token
  const tokenMap = new Map<string, string>()
  for (const { data, error } of tokenResults) {
    if (error) {
      console.error('Error fetching tokens:', error)
      continue
    }
    for (const profile of data || []) {
      if (profile.push_notification_token) {
        tokenMap.set(profile.id, profile.push_notification_token)
      }
    }
  }

  // Program map: program_id → { name, days, start_time }
  const programMap = new Map<string, { name: string; days: string[]; start_time: string }>()
  if (programResults) {
    for (const { data, error } of programResults) {
      if (error) {
        console.error('Error fetching programs:', error)
        continue
      }
      for (const p of (data || []) as ProgramInfo[]) {
        programMap.set(p.program_id, {
          name: p.program_name,
          days: p.program_days || [],
          start_time: p.program_start_time,
        })
      }
    }
  }

  // Event map: event_id → { name, days, start_time }
  const eventMap = new Map<string, { name: string; days: string[]; start_time: string }>()
  if (eventResults) {
    for (const { data, error } of eventResults) {
      if (error) {
        console.error('Error fetching events:', error)
        continue
      }
      for (const e of (data || []) as EventInfo[]) {
        eventMap.set(e.event_id, {
          name: e.event_name,
          days: e.event_days || [],
          start_time: e.event_start_time,
        })
      }
    }
  }

  if (tokenMap.size === 0) {
    return { scheduled: 0, message: 'No users with push tokens', duration_ms: Date.now() - startTime }
  }

  // ==========================================================================
  // STEP 5: Build all notification rows (pure computation)
  // ==========================================================================

  // Normalize program settings to generic format
  const normalizedProgramSettings = allProgramSettings.map(s => ({
    user_id: s.user_id,
    item_id: s.program_id,
    notification_settings: s.notification_settings,
  }))

  const normalizedEventSettings = allEventSettings.map(s => ({
    user_id: s.user_id,
    item_id: s.event_id,
    notification_settings: s.notification_settings,
  }))

  const programRows = buildNotifications(normalizedProgramSettings, programMap, tokenMap, today, false)
  const eventRows = buildNotifications(normalizedEventSettings, eventMap, tokenMap, today, true)

  const allRows = [...programRows, ...eventRows]

  // ==========================================================================
  // STEP 6: Single bulk insert (not 150 individual inserts)
  // ==========================================================================
  let insertedCount = 0

  if (allRows.length > 0) {
    for (let i = 0; i < allRows.length; i += 1000) {
      const chunk = allRows.slice(i, i + 1000)
      const { error: insertError } = await supabase
        .from('program_notification_schedule')
        .insert(chunk)

      if (insertError) {
        console.error(`Error inserting chunk ${i / 1000 + 1}:`, insertError)
      } else {
        insertedCount += chunk.length
      }
    }
  }

  // ==========================================================================
  // STEP 7: Return metrics
  // ==========================================================================
  const duration = Date.now() - startTime
  const dbCalls = 2
    + Math.ceil(userIdArray.length / 100)
    + (programIdArray.length > 0 ? Math.ceil(programIdArray.length / 100) : 0)
    + (eventIdArray.length > 0 ? Math.ceil(eventIdArray.length / 100) : 0)
    + Math.ceil(allRows.length / 1000)

  const result = {
    scheduled: insertedCount,
    total_built: allRows.length,
    programs: programRows.length,
    events: eventRows.length,
    unique_users: uniqueUserIds.size,
    unique_programs: uniqueProgramIds.size,
    unique_events: uniqueEventIds.size,
    users_with_tokens: tokenMap.size,
    db_calls: dbCalls,
    duration_ms: duration,
  }

  console.log('Program scheduler complete:', result)
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