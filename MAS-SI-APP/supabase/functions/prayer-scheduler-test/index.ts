// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {Expo} from 'https://esm.sh/expo-server-sdk';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { format } from 'https://esm.sh/date-fns@4.1.0/format.mjs'
import { isBefore, isAfter } from 'https://esm.sh/date-fns@4.1.0'

console.log("Hello from Functions!")

const supabaseUrl = Deno.env.get('EXPO_PUBLIC_SUPABASE_URL');
const supabaseKey = Deno.env.get('EXPO_PUBLIC_SUPABASE_ANON');
const supabase = createClient(supabaseUrl, supabaseKey);
function setTimeToCurrentDate(timeString : string) {

  const currentDate = new Date(); // Get current date
 
   // Split the time string into hours, minutes, and seconds
   const [hours, minutes, seconds] = timeString.split(':').map(Number);
 
   // Create a new Date object with the current date
   const timestampWithTimeZone = new Date();
 
   // Set the time with setHours (adjust based on local timezone or UTC as needed)
   timestampWithTimeZone.setHours(hours + 5, minutes, seconds, 0); // No milliseconds
 
   // Convert to ISO format with timezone (to ensure it's interpreted as a TIMESTAMPTZ)
   const timestampISO = timestampWithTimeZone // This gives a full timestamp with timezone in UTC
 
   return timestampISO
}
// Helper function to split an array into chunks
function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

async function fetchPushTokens(userIds) {
  const chunks = chunkArray(userIds, 100); // adjust chunk size as needed
  let combinedData = [];
  
  for (const chunk of chunks) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, push_notification_token')
      .in('id', chunk);
    if (error) {
      console.error('Error fetching push tokens:', error);
      continue;
    }
    combinedData = combinedData.concat(data);
  }
  return combinedData;
}

async function ProcessAlertAtAthan() {
  // Get today's prayers
  const { data: todaysPrayers, error: todayError } = await supabase
    .from('todays_prayers')
    .select('*');
  if (todayError) {
    console.error('TodaysPrayers error:', todayError);
    return;
  }

  const insertRows = [];

  // Loop through today's prayers
  for (const prayer of todaysPrayers) {
    // Normalize prayer name: if 'zuhr' then use 'dhuhr'
    const normalizedPrayer = prayer.prayer_name === 'zuhr' ? 'dhuhr' : prayer.prayer_name;
    // Query all users with "Alert at Athan time" for this prayer
    const { data: athanAlertOn, error: notifError } = await supabase
      .from('prayer_notification_settings')
      .select('*')
      .eq('prayer', normalizedPrayer)
      .contains('notification_settings', ['Alert at Athan time']);
    if (notifError) {
      console.error(`Error fetching notification settings for ${normalizedPrayer}:`, notifError);
      continue;
    }
    if (!athanAlertOn || athanAlertOn.length === 0) continue;

    // Collect user IDs for this prayer
    const userIds = athanAlertOn.map((u) => u.user_id);
    // Fetch all push tokens for these users in one query
    const userPushTokens = await fetchPushTokens(userIds);

    // Create a mapping from user id to push_notification_token
    const pushTokenMap = {};
    userPushTokens.forEach((user) => {
      if (user.push_notification_token) {
        pushTokenMap[user.id] = user.push_notification_token;
      }
    });

      // For each user in athanAlertOn, if they have a push token, prepare an insert object
       for (const user of athanAlertOn) {
        const pushToken = pushTokenMap[user.user_id];
        if (pushToken) {
          const PrayerTime = setTimeToCurrentDate(prayer.athan_time);
          const IqaPrayerTime = setTimeToCurrentDate(prayer.iqamah_time);
          const TimeToFormat = new Date(PrayerTime);
          const IqaTimeToFormat = new Date(IqaPrayerTime);
          const FormatAthTime = format(TimeToFormat.setHours(TimeToFormat.getHours() - 5), 'p');
          const FormatIqaTime = format(IqaTimeToFormat.setHours(IqaTimeToFormat.getHours() - 5), 'p');
          const message = `Time to pray ${normalizedPrayer === 'dhuhr' ? 'Dhuhr' : normalizedPrayer[0].toUpperCase() + normalizedPrayer.slice(1)} ${FormatAthTime} \n Iqamah Time ${FormatIqaTime}`;
  
          insertRows.push({
            user_id: user.user_id,
            notification_time: PrayerTime,
            prayer: normalizedPrayer,
            message,
            push_notification_token: pushToken,
            notification_type: 'Alert at Athan time'
          });
        }
      }
    }
    console.log(insertRows)
    // Bulk insert into prayer_notification_schedule if there are rows to insert
    if (insertRows.length > 0) {
      const { error: insertError } = await supabase
        .from('prayer_notification_schedule')
        .insert(insertRows);
      if (insertError) {
        console.error('Error during bulk insert:', insertError);
      }
    }
}

serve(async (req) => {
  const todaysDate = new Date()
  const scheduler = async () => {
    // if( isBefore(todaysDate, new Date(2025, 2, 30)) ){
    //               const {data : UsersWithAlertOnFirst, error : UsersAthanFirstError } = await supabase.from('prayer_notification_settings').select('*').eq('prayer', 'tarawih one').contains('notification_settings', ['Alert at Athan time'])
    //               const {data : Users30MinsBeforeFirst, error : Users30MinsFirstError} = await supabase.from('prayer_notification_settings').select('*').eq('prayer', 'tarawih one').contains('notification_settings', ['Alert 30 Mins Before'])
    //               const {data : UsersWithAlertOnSecond, error : UsersAthanSecondError } = await supabase.from('prayer_notification_settings').select('*').eq('prayer', 'tarawih two').contains('notification_settings', ['Alert at Athan time'])
    //               const {data : Users30MinsBeforeSecond, error : Users30MinsSecondError} = await supabase.from('prayer_notification_settings').select('*').eq('prayer', 'tarawih two').contains('notification_settings', ['Alert 30 Mins Before'])
    //               const { data : IshaTime, error : todayError} = await supabase.from('todays_prayers').select('*').eq('prayer_name', 'isha').single()
    //               const FirstTaraweehTime = setTimeToCurrentDate(IshaTime.iqamah_time)
    //               let FirstTaraweehTime30MinBefore = setTimeToCurrentDate(IshaTime.iqamah_time)
    //               FirstTaraweehTime30MinBefore.setMinutes(FirstTaraweehTime30MinBefore.getMinutes() - 30)
    //               const SecondTaraweehTime = setTimeToCurrentDate(IshaTime.iqamah_time)
    //               SecondTaraweehTime.setHours(SecondTaraweehTime.getHours() + 1, SecondTaraweehTime.getMinutes() + 20)
      
    //               let SecondTaraweehTime30MinBefore = new Date(SecondTaraweehTime)
      
    //               SecondTaraweehTime30MinBefore.setMinutes(SecondTaraweehTime30MinBefore.getMinutes() - 30)
    //               console.log(SecondTaraweehTime30MinBefore)
    //               let FormattedFirst = new Date(FirstTaraweehTime)
    //               FormattedFirst = format(FormattedFirst.setHours(FormattedFirst.getHours() - 5), 'p')
    //               let FormattedSecond = new Date(SecondTaraweehTime)
    //               FormattedSecond = format(FormattedSecond.setHours(FormattedSecond.getHours() - 5), 'p')
    //               let FormattedFirst30 = new Date( FirstTaraweehTime30MinBefore )
    //               let FormattedSecond30 = new Date( SecondTaraweehTime30MinBefore )
    //               FormattedFirst30 = format(FormattedFirst30.setHours(FormattedFirst30.getHours() - 5), 'p')
    //               FormattedSecond30 = format(FormattedSecond30.setHours(FormattedSecond30.getHours() - 5), 'p')
      
    //               //First Taraweeh Alert at Athan
    //               await Promise.all(
    //                 UsersWithAlertOnFirst.map( async (UserSettings) => {
          
    //                   const { data : UserPushToken, error } = await supabase.from('profiles').select('push_notification_token').eq('id', UserSettings.user_id).single()
    //                   if( UserPushToken && UserPushToken.push_notification_token ){
    //                       const { error : ScheduleError } = await supabase.from('prayer_notification_schedule').insert({ user_id : UserSettings.user_id, 
    //                         notification_time : FirstTaraweehTime, prayer : 'tarawih one', 
    //                         message : `First Taraweeh Starting Now!\n${FormattedFirst}`, 
    //                         push_notification_token : UserPushToken.push_notification_token, notification_type : 'Alert at Athan time'})
    //                         if(ScheduleError){
    //                           console.log(ScheduleError)
    //                         }
    //                       }
    //                 })
                    
    //               )
    //               //First Taraweeh alert 30 mins before
    //               await Promise.all(
    //                 Users30MinsBeforeFirst.map( async ( UserSettings ) => {
    //                   const { data : UserPushToken, error } = await supabase.from('profiles').select('push_notification_token').eq('id', UserSettings.user_id).single()
    //                   if( UserPushToken && UserPushToken.push_notification_token ){

    //                       const { error : ScheduleError } = await supabase.from('prayer_notification_schedule').insert({ user_id : UserSettings.user_id, 
    //                         notification_time : FirstTaraweehTime30MinBefore, prayer : 'tarawih one', 
    //                         message : `First Tarawih Starting in 30 Mins!\n${FormattedFirst30}`, 
    //                         push_notification_token : UserPushToken.push_notification_token, notification_type : 'Alert 30 Mins Before'})
    //                         if(ScheduleError){
    //                           console.log(ScheduleError)
    //                         }

    //                       }
    //                 })
    //               )
                  
    //               //Second Taraweeh Alert at Athan
    //               await Promise.all(
    //                 UsersWithAlertOnSecond.map( async (UserSettings) => {
          
    //                   const { data : UserPushToken, error } = await supabase.from('profiles').select('push_notification_token').eq('id', UserSettings.user_id).single()
    //                   if( UserPushToken && UserPushToken.push_notification_token ){

    //                       const { error : ScheduleError } = await supabase.from('prayer_notification_schedule').insert({ user_id : UserSettings.user_id, 
    //                         notification_time : SecondTaraweehTime, prayer : 'tarawih two', 
    //                         message : `Second Taraweeh Starting Now!\n${FormattedSecond}`, 
    //                         push_notification_token : UserPushToken.push_notification_token, notification_type : 'Alert at Athan time'})
    //                         if(ScheduleError){
    //                           console.log(ScheduleError)
    //                         }

    //                       }
          
    //                 })
    //               )
                  
    //               //Second Taraweeh alert 30 mins before
    //               await Promise.all(
    //                 Users30MinsBeforeSecond.map( async ( UserSettings ) => {
    //                   const { data : UserPushToken, error } = await supabase.from('profiles').select('push_notification_token').eq('id', UserSettings.user_id).single()
    //                   if( UserPushToken && UserPushToken.push_notification_token ){

    //                       const { error : ScheduleError } = await supabase.from('prayer_notification_schedule').insert({ user_id : UserSettings.user_id, 
    //                         notification_time : SecondTaraweehTime30MinBefore, prayer : 'tarawih two', 
    //                         message : `Second Taraweeh Starting in 30 Mins!\n${FormattedSecond30}`, 
    //                         push_notification_token : UserPushToken.push_notification_token, notification_type : 'Alert 30 Mins Before'})
    //                         if(ScheduleError){
    //                           console.log(ScheduleError)
    //                         }
                            
    //                       }
    //                 })
    //               )
          
    // }
    await Promise.all(
     [ 
      processTaraweehNotifications(todaysDate)
      ]
    )
  }

  await scheduler()
  return new Response(
  )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/prayer-scheduler-test' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' 

*/


async function ProcessAlertAtIqamah() {
  // Get today's prayers
  const { data: todaysPrayers, error: todayError } = await supabase
    .from('todays_prayers')
    .select('*');
  if (todayError) {
    console.error('TodaysPrayers error:', todayError);
    return;
  }

  const insertRows = [];

  // Loop through today's prayers
  for (const prayer of todaysPrayers) {
    // Normalize prayer name: if 'zuhr' then use 'dhuhr'
    const normalizedPrayer = prayer.prayer_name === 'zuhr' ? 'dhuhr' : prayer.prayer_name;
    // Query all users with "Alert at Athan time" for this prayer
    const { data: athanAlertOn, error: notifError } = await supabase
      .from('prayer_notification_settings')
      .select('*')
      .eq('prayer', normalizedPrayer)
      .contains('notification_settings', ['Alert at Iqamah time']);
    if (notifError) {
      console.error(`Error fetching notification settings for ${normalizedPrayer}:`, notifError);
      continue;
    }
    if (!athanAlertOn || athanAlertOn.length === 0) continue;

    // Collect user IDs for this prayer
    const userIds = athanAlertOn.map((u) => u.user_id);
    // Fetch all push tokens for these users in one query
    const userPushTokens = await fetchPushTokens(userIds);

    // Create a mapping from user id to push_notification_token
    const pushTokenMap = {};
    userPushTokens.forEach((user) => {
      if (user.push_notification_token) {
        pushTokenMap[user.id] = user.push_notification_token;
      }
    });

      // For each user in athanAlertOn, if they have a push token, prepare an insert object
       for (const user of athanAlertOn) {
        const pushToken = pushTokenMap[user.user_id];
        if (pushToken) {
          const PrayerTime = setTimeToCurrentDate(prayer.athan_time);
          const IqaPrayerTime = setTimeToCurrentDate(prayer.iqamah_time);
          const TimeToFormat = new Date(PrayerTime);
          const IqaTimeToFormat = new Date(IqaPrayerTime);
          const FormatAthTime = format(TimeToFormat.setHours(TimeToFormat.getHours() - 5), 'p');
          const FormatIqaTime = format(IqaTimeToFormat.setHours(IqaTimeToFormat.getHours() - 5), 'p');
          const message = `Iqamah Time for ${normalizedPrayer === 'dhuhr' ? 'Dhuhr' : normalizedPrayer[0].toUpperCase() + normalizedPrayer.slice(1)} at ${FormatIqaTime}`;
  
          insertRows.push({
            user_id: user.user_id,
            notification_time: IqaPrayerTime,
            prayer: normalizedPrayer,
            message,
            push_notification_token: pushToken,
            notification_type: 'Alert at Iqamah time'
          });
        }
      }
    }
    console.log(insertRows)
    // Bulk insert into prayer_notification_schedule if there are rows to insert
    if (insertRows.length > 0) {
      const { error: insertError } = await supabase
        .from('prayer_notification_schedule')
        .insert(insertRows);
      if (insertError) {
        console.error('Error during bulk insert:', insertError);
      }
    }
}

async function processPrayerNotifications30Mins() {
  const { data: TodaysPrayers, error: todayError } = await supabase
    .from('todays_prayers')
    .select('*');
  if (todayError) {
    console.error('Error fetching today\'s prayers:', todayError);
    return;
  }

  const insertRows = [];

  for (const prayer of TodaysPrayers) {
    // Normalize prayer name for settings lookup:
    const normalizedPrayer = prayer.prayer_name === 'zuhr' ? 'dhuhr' : prayer.prayer_name;
    const { data: AthanAlertOn, error: settingsError } = await supabase
      .from('prayer_notification_settings')
      .select('*')
      .eq('prayer', normalizedPrayer)
      .contains('notification_settings', ['Alert 30 mins before next prayer']);
    if (settingsError) {
      console.error(`Error fetching settings for ${normalizedPrayer}:`, settingsError);
      continue;
    }
    if (!AthanAlertOn || AthanAlertOn.length === 0) continue;

    // Batch query profiles for push tokens.
    const userIds = AthanAlertOn.map(u => u.user_id);
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, push_notification_token')
      .in('id', userIds);
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      continue;
    }
    // Create mapping from user_id to push token.
    const tokenMap = {};
    profilesData.forEach(profile => {
      if (profile.push_notification_token) {
        tokenMap[profile.id] = profile.push_notification_token;
      }
    });

    // Process each user in the current prayer's settings.
    for (const userSetting of AthanAlertOn) {
      const pushToken = tokenMap[userSetting.user_id];
      if (!pushToken) continue;

      let nextPrayerTime;
      let message = '';
      if (prayer.prayer_name === 'fajr') {
        // Next prayer: zuhr
        const nextPrayer = TodaysPrayers.find(p => p.prayer_name === 'zuhr');
        if (!nextPrayer) continue;
        nextPrayerTime = setTimeToCurrentDate(nextPrayer.athan_time);
        nextPrayerTime.setMinutes(nextPrayerTime.getMinutes() - 30);
        message = '30 mins before Dhuhr!';
      } else if (prayer.prayer_name === 'zuhr') {
        // Next prayer: asr
        const nextPrayer = TodaysPrayers.find(p => p.prayer_name === 'asr');
        if (!nextPrayer) continue;
        nextPrayerTime = setTimeToCurrentDate(nextPrayer.athan_time);
        nextPrayerTime.setMinutes(nextPrayerTime.getMinutes() - 30);
        message = '30 mins before Asr!';
      } else if (prayer.prayer_name === 'asr') {
        // Next prayer: maghrib
        const nextPrayer = TodaysPrayers.find(p => p.prayer_name === 'maghrib');
        if (!nextPrayer) continue;
        nextPrayerTime = setTimeToCurrentDate(nextPrayer.athan_time);
        nextPrayerTime.setMinutes(nextPrayerTime.getMinutes() - 30);
        message = '30 mins before Maghrib!';
      } else if (prayer.prayer_name === 'maghrib') {
        // Next prayer: isha
        const nextPrayer = TodaysPrayers.find(p => p.prayer_name === 'isha');
        if (!nextPrayer) continue;
        nextPrayerTime = setTimeToCurrentDate(nextPrayer.athan_time);
        nextPrayerTime.setMinutes(nextPrayerTime.getMinutes() - 30);
        message = '30 mins before Isha!';
      }  else {
        continue;
      }
      
      insertRows.push({
        user_id: userSetting.user_id,
        notification_time: nextPrayerTime,
        prayer: prayer.prayer_name === 'zuhr' ? 'dhuhr' : prayer.prayer_name,
        message,
        push_notification_token: pushToken,
        notification_type: 'Alert 30mins before next prayer'
      });
    }
  }

  if (insertRows.length > 0) {
    const { error: insertError } = await supabase
      .from('prayer_notification_schedule')
      .insert(insertRows);
    if (insertError) {
      console.error('Error during bulk insert:', insertError);
    }
  }
}

async function processTaraweehNotifications(todaysDate : Date) {
  if (!isBefore(todaysDate, new Date(2025, 2, 30))) return;

  // Fetch all notification settings for tarawih one and two at both alert types.
  const [
    { data: UsersWithAlertOnFirst, error: err1 },
    { data: Users30MinsBeforeFirst, error: err2 },
    { data: UsersWithAlertOnSecond, error: err3 },
    { data: Users30MinsBeforeSecond, error: err4 },
    { data: IshaTime, error: errIsha }
  ] = await Promise.all([
    supabase.from('prayer_notification_settings')
      .select('*')
      .eq('prayer', 'tarawih one')
      .contains('notification_settings', ['Alert at Athan time']),
    supabase.from('prayer_notification_settings')
      .select('*')
      .eq('prayer', 'tarawih one')
      .contains('notification_settings', ['Alert 30 Mins Before']),
    supabase.from('prayer_notification_settings')
      .select('*')
      .eq('prayer', 'tarawih two')
      .contains('notification_settings', ['Alert at Athan time']),
    supabase.from('prayer_notification_settings')
      .select('*')
      .eq('prayer', 'tarawih two')
      .contains('notification_settings', ['Alert 30 Mins Before']),
    supabase.from('todays_prayers')
      .select('*')
      .eq('prayer_name', 'isha')
      .single()
  ]);
  if (err1 || err2 || err3 || err4 || errIsha) {
    console.error(err1, err2, err3, err4, errIsha);
    return;
  }

  // Pre-calculate times and formatted strings.
  const FirstTaraweehTime = setTimeToCurrentDate(IshaTime.iqamah_time);
  let FirstTaraweehTime30MinBefore = setTimeToCurrentDate(IshaTime.iqamah_time);
  FirstTaraweehTime30MinBefore.setMinutes(FirstTaraweehTime30MinBefore.getMinutes() - 30);

  const SecondTaraweehTime = setTimeToCurrentDate(IshaTime.iqamah_time);
  SecondTaraweehTime.setHours(SecondTaraweehTime.getHours() + 1, SecondTaraweehTime.getMinutes() + 20);
  let SecondTaraweehTime30MinBefore = new Date(SecondTaraweehTime);
  SecondTaraweehTime30MinBefore.setMinutes(SecondTaraweehTime30MinBefore.getMinutes() - 30);

  let FormattedFirst = setTimeToCurrentDate(IshaTime.iqamah_time)
  let FormattedFirst30 = setTimeToCurrentDate(IshaTime.iqamah_time)
  FormattedFirst30.setMinutes(FormattedFirst30.getMinutes() - 30);

  let FormattedSecond = setTimeToCurrentDate(IshaTime.iqamah_time);
  FormattedSecond.setHours(FormattedSecond.getHours() + 1, FormattedSecond.getMinutes() + 20);
  let FormattedSecond30 = new Date(SecondTaraweehTime);
  FormattedSecond30.setMinutes(FormattedSecond30.getMinutes() - 30);

  FormattedFirst = format(FormattedFirst.setHours(FormattedFirst.getHours() - 5), 'p');
  FormattedFirst30 = format(FormattedFirst30.setHours(FormattedFirst30.getHours() - 5), 'p');
  FormattedSecond = format(FormattedSecond.setHours(FormattedSecond.getHours() - 5), 'p');
  FormattedSecond30 = format(FormattedSecond30.setHours(FormattedSecond30.getHours() - 5), 'p');

  // Helper to process each notification group.
  async function processNotificationGroup(users, notificationTime, prayerName, message, notificationType) {
    if (!users || users.length === 0) return;
    const userIds = users.map(u => u.user_id);
    const profilesData = await fetchPushTokens(userIds)
    if (!profilesData) {
      console.error('Error fetching profiles:', !profilesData);
      return;
    }
    const insertRows = [];
    profilesData.forEach(profile => {
      if (profile.push_notification_token) {
        insertRows.push({
          user_id: profile.id,
          notification_time: notificationTime,
          prayer: prayerName,
          message,
          push_notification_token: profile.push_notification_token,
          notification_type: notificationType
        });
      }
    });
    console.log(insertRows[0])
    if (insertRows.length > 0) {
      const { error: insertError } = await supabase
        .from('prayer_notification_schedule')
        .insert(insertRows);
      if (insertError) console.error('Error inserting notifications:', insertError);
    }
  }

  // Process each group.
  await Promise.all([
    processNotificationGroup(
      UsersWithAlertOnFirst,
      FirstTaraweehTime,
      'tarawih one',
      `First Taraweeh Starting Now!\n${FormattedFirst}`,
      'Alert at Athan time'
    ),
    processNotificationGroup(
      Users30MinsBeforeFirst,
      FirstTaraweehTime30MinBefore,
      'tarawih one',
      `First Taraweeh Starting in 30 Mins!\n${FormattedFirst30}`,
      'Alert 30 Mins Before'
    ),
    processNotificationGroup(
      UsersWithAlertOnSecond,
      SecondTaraweehTime,
      'tarawih two',
      `Second Taraweeh Starting Now!\n${FormattedSecond}`,
      'Alert at Athan time'
    ),
    processNotificationGroup(
      Users30MinsBeforeSecond,
      SecondTaraweehTime30MinBefore,
      'tarawih two',
      `Second Taraweeh Starting in 30 Mins!\n${FormattedSecond30}`,
      'Alert 30 Mins Before'
    )
  ]);
}