// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {Expo} from 'https://esm.sh/expo-server-sdk';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {format} from 'https://esm.sh/date-fns@4.1.0/format.mjs'
import { isBefore, isAfter } from 'https://esm.sh/date-fns@4.1.0'

console.log("Hello from Functions!")

const supabaseUrl = Deno.env.get('EXPO_PUBLIC_SUPABASE_URL');
const supabaseKey = Deno.env.get('EXPO_PUBLIC_SUPABASE_ANON');
const supabase = createClient(supabaseUrl, supabaseKey);

function setTimeToCurrentDate(timeString) {

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

// Optimized function to process prayer notifications
async function processPrayerNotifications() {
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
    const { data: userPushTokens, error: tokenError } = await supabase
      .from('profiles')
      .select('id, push_notification_token')
      .in('id', userIds);
    if (tokenError) {
      console.error('Error fetching push tokens:', tokenError);
      continue;
    }

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
  const scheduler = async () => {
    const todaysDate = new Date()
    if( todaysDate.getDay() == 5 ){
      //Get the 2 Diff Settings at Athan Time & 30 Mins Before
      const { data : JummahAthanNotifications, error } = await supabase.from('jummah_notifications').select('*').contains('notification_settings', ['Alert at Athan Time'])
      const { data : Jummah30MinsNotifications, error: Jummah30MinsNotificationsError } = await supabase.from('jummah_notifications').select('*').contains('notification_settings', ['Alert 30 Mins Before'])

      await Promise.all(
        JummahAthanNotifications.map( async (JummahDetails : { jummah : string, user_id : string }) => {
          const JummahTime = JummahDetails.jummah == 'first' ? '12:15:00' : JummahDetails.jummah == 'second' ? '13:00:00' : JummahDetails.jummah == 'third' ? '13:45:00' : '15:45:00'
          // Get Push Token From USER_ID
          const { data : push_token , error } = await supabase.from('profiles').select('push_notification_token').eq('id', JummahDetails.user_id).single()
          const PushToken = push_token.push_notification_token
          if( PushToken ){ 
            const JummahNotificationTime = setTimeToCurrentDate(JummahTime)
            // schedule the notification at the jummah time assigned to the proper user
            const { error : ScheduleJummahNotification } = await supabase.from('prayer_notification_schedule').insert({ 
              user_id : JummahDetails.user_id, 
              prayer : `${JummahDetails.jummah} jummah`, 
              notification_time : JummahNotificationTime, 
              message : `${JummahDetails.jummah[0].toUpperCase() + JummahDetails.jummah.slice(1)} Jummah Prayer ${ JummahDetails.jummah == 'first' ? '12:15 PM' : JummahDetails.jummah == 'second' ? '1:00 PM' : JummahDetails.jummah == 'third' ? '1:45 PM' : '3:45 PM'}`,
              push_notification_token : PushToken,
              notification_type : 'Alert at Athan Time',
              title : JummahDetails.jummah == 'first' ? '12:15 PM Jummah' : JummahDetails.jummah == 'second' ? '1:00 PM Jummah' : JummahDetails.jummah == 'third' ? '1:45 PM Jummah' : '3:45 PM Jummah'
            })
          } 
        })
      )


      await Promise.all(
        Jummah30MinsNotifications.map( async (JummahDetails : { jummah : string, user_id : string }) => {
          const JummahTime = JummahDetails.jummah == 'first' ? '12:15:00' : JummahDetails.jummah == 'second' ? '13:00:00' : JummahDetails.jummah == 'third' ? '13:45:00' : '15:45:00'
           // Get Push Token From USER_ID
           const { data : push_token , error } = await supabase.from('profiles').select('push_notification_token').eq('id', JummahDetails.user_id).single()
           const PushToken = push_token.push_notification_token
           if ( PushToken ){
            const JummahNotificationTime = setTimeToCurrentDate(JummahTime)
            // schedule the notification at the jummah time assigned to the proper user
            JummahNotificationTime.setMinutes(JummahNotificationTime.getMinutes() - 30)
            const { error : ScheduleJummahNotification } = await supabase.from('prayer_notification_schedule').insert({ 
              user_id : JummahDetails.user_id, 
              prayer : `${JummahDetails.jummah} jummah`, 
              notification_time : JummahNotificationTime, 
              message : `${JummahDetails.jummah[0].toUpperCase() + JummahDetails.jummah.slice(1)} Jummah Prayer will begin in 30 minutes`,
              push_notification_token : PushToken,
              notification_type : 'Alert 30 Mins Before',
              title : JummahDetails.jummah == 'first' ? '12:15 PM Jummah' : JummahDetails.jummah == 'second' ? '1:00 PM Jummah' : JummahDetails.jummah == 'third' ? '1:45 PM Jummah' : '3:45 PM Jummah'
            })
          }
        })
      )

    }

    const { data : UserSettings, error : settingError } = await supabase.from('prayer_notification_settings').select('*')
    const { data : TodaysPrayers, error : todayError} = await supabase.from('todays_prayers').select('*')
      // Loop through todays prayers

      //Alert At Athan Time
        TodaysPrayers.map( async ( prayer ) => {
          // get users who have alert at athan on for this prayer
          const { data : AthanAlertOn, error } = await supabase.from('prayer_notification_settings').select('*').eq('prayer', prayer.prayer_name == 'zuhr' ? 'dhuhr' : prayer.prayer_name).contains('notification_settings', ['Alert at Athan time'])
          if( error ){
            console.log(error)
          }
          if( AthanAlertOn ){
            await Promise.all(
              AthanAlertOn.map( async ( user ) => {
                const { data : UserPushToken, error } = await supabase.from('profiles').select('push_notification_token').eq('id', user.user_id).single()
                if( UserPushToken && UserPushToken.push_notification_token ){
                  const PrayerTime = setTimeToCurrentDate(prayer.athan_time)
                  const IqaPrayerTime = setTimeToCurrentDate(prayer.iqamah_time)
                  const TimeToFormat = new Date(PrayerTime)
                  const IqaTimeToFormat = new Date(IqaPrayerTime)
                  const FormatAthTime = format(TimeToFormat.setHours(TimeToFormat.getHours() - 5), 'p')
                  const FormatIqaTime = format(IqaTimeToFormat.setHours(IqaTimeToFormat.getHours() - 5), 'p')
                  const { error } = await supabase.from('prayer_notification_schedule').insert({ user_id : user.user_id, notification_time : PrayerTime, prayer : prayer.prayer_name == 'zuhr' ? 'dhuhr' : prayer.prayer_name, 
                    message : `Time to pray ${prayer.prayer_name == 'zuhr' ? 'Dhuhr' : prayer.prayer_name[0].toUpperCase() + prayer.prayer_name.slice(1)} ${FormatAthTime} \n Iqamah Time ${FormatIqaTime} `, 
                    push_notification_token : UserPushToken.push_notification_token, notification_type : 'Alert at Athan time'})
                  if( error ){
                    console.log(error)
                  }
                }
              })
            )
          }
          // save these users to the notification_schedule table 
        })

      console.log('Alert At Athan Done')

      //Alert At Iqamah Time
      await Promise.all(
        TodaysPrayers.map( async ( prayer ) => {
          // get users who have alert at iqamah on for this prayer
          const { data : AthanAlertOn, error } = await supabase.from('prayer_notification_settings').select('*').eq('prayer', prayer.prayer_name == 'zuhr' ? 'dhuhr' : prayer.prayer_name).contains('notification_settings', ['Alert at Iqamah time'])
          if( error ){
            console.log(error)
          }
          if( AthanAlertOn ){
            await Promise.all(
              AthanAlertOn.map( async ( user ) => {
                const { data : UserPushToken, error } = await supabase.from('profiles').select('push_notification_token').eq('id', user.user_id).single()
                if( UserPushToken &&  UserPushToken.push_notification_token ){
                  const PrayerTime = setTimeToCurrentDate(prayer.iqamah_time)
                  const TimeToFormat = new Date(PrayerTime)
                  const FormatIqaTime = format(TimeToFormat.setHours(TimeToFormat.getHours() - 5), 'p')
                  const { error } = await supabase.from('prayer_notification_schedule').insert({ user_id : user.user_id, notification_time : PrayerTime, prayer : prayer.prayer_name == 'zuhr' ? 'dhuhr' : prayer.prayer_name, message : `Iqamah for ${prayer.prayer_name == 'zuhr' ? 'dhuhr' : prayer.prayer_name[0].toUpperCase() + prayer.prayer_name.slice(1)} at ${FormatIqaTime}`, push_notification_token : UserPushToken.push_notification_token,  notification_type : 'Alert at Iqamah time'})
                  if( error ){
                    console.log(error)
                  }
                }
              })
            )
          }
          // save these users to the notification_schedule table 
        })
      )
      console.log('Alert At Iqamah Time')

      //Alert 30 Mins Before Next Prayer
      await Promise.all(
      TodaysPrayers.map( async ( prayer ) => {
        // get users who have alert 30 mins before next prayer on
        const { data : AthanAlertOn, error } = await supabase.from('prayer_notification_settings').select('*').eq('prayer', prayer.prayer_name == 'zuhr' ? 'dhuhr' : prayer.prayer_name).contains('notification_settings', ['Alert 30 mins before next prayer'])
        if( error ){
          console.log(error)
        }
        if( AthanAlertOn ){
          await Promise.all(
            AthanAlertOn.map( async ( user ) => {
              const { data : UserPushToken, error } = await supabase.from('profiles').select('push_notification_token').eq('id', user.user_id).single()
              if( UserPushToken && UserPushToken.push_notification_token ){
                if( prayer.prayer_name == 'fajr' ){
                  const nextPrayerInfo = TodaysPrayers.filter(e => e.prayer_name == 'zuhr')
                  const nextPrayerTime = nextPrayerInfo[0].athan_time
                  const PrayerTime = setTimeToCurrentDate(nextPrayerTime)
                  PrayerTime.setMinutes(PrayerTime.getMinutes() - 30)
                  const { error } = await supabase.from('prayer_notification_schedule').insert({ user_id : user.user_id, notification_time : PrayerTime, prayer : prayer.prayer_name, message : `30 mins before Dhuhr!`, push_notification_token : UserPushToken.push_notification_token, notification_type : 'Alert 30mins before next prayer'})
                  if( error ){
                    console.log(error)
                  }
                }
                
                if( prayer.prayer_name == 'zuhr' ) {
                  const nextPrayerInfo = TodaysPrayers.filter(e => e.prayer_name == 'asr')
                  const nextPrayerTime = nextPrayerInfo[0].athan_time
                  const PrayerTime = setTimeToCurrentDate(nextPrayerTime)
                  PrayerTime.setMinutes(PrayerTime.getMinutes() - 30)
                  const { error } = await supabase.from('prayer_notification_schedule').insert({ user_id : user.user_id, notification_time : PrayerTime, prayer : 'dhuhr', message : `30 mins before Asr!`, push_notification_token : UserPushToken.push_notification_token, notification_type : 'Alert 30mins before next prayer'})
                  if( error ){
                    console.log(error)
                  }
                }

                if( prayer.prayer_name == 'asr' ){
                  const nextPrayerInfo = TodaysPrayers.filter(e => e.prayer_name == 'maghrib')
                  const nextPrayerTime = nextPrayerInfo[0].athan_time
                  const PrayerTime = setTimeToCurrentDate(nextPrayerTime)
                  PrayerTime.setMinutes(PrayerTime.getMinutes() - 30)
                  const { error } = await supabase.from('prayer_notification_schedule').insert({ user_id : user.user_id, notification_time : PrayerTime, prayer : prayer.prayer_name, message : `30 mins before Maghrib!`, push_notification_token : UserPushToken.push_notification_token, notification_type : 'Alert 30mins before next prayer'})
                  if( error ){
                    console.log(error)
                  }
                }

                if( prayer.prayer_name == 'maghrib' ){
                  const nextPrayerInfo = TodaysPrayers.filter(e => e.prayer_name == 'isha')
                  const nextPrayerTime = nextPrayerInfo[0].athan_time
                  const PrayerTime = setTimeToCurrentDate(nextPrayerTime)
                  PrayerTime.setMinutes(PrayerTime.getMinutes() - 30)
                  const { error } = await supabase.from('prayer_notification_schedule').insert({ user_id : user.user_id, notification_time : PrayerTime, prayer : prayer.prayer_name, message : `30 mins before Isha!`, push_notification_token : UserPushToken.push_notification_token, notification_type : 'Alert 30mins before next prayer'})
                  if( error ){
                    console.log(error)
                  }
                }

                if( prayer.prayer_name == 'isha' ){
                  const { data : nextPrayerInfo, error : nextPrayerError } = await supabase.from('prayers').select('prayerData').single()
                  const nextPrayerTime = nextPrayerInfo[1]['fajr']
                  const PrayerTime = setTimeToCurrentDate(nextPrayerTime)
                  PrayerTime.setDate(PrayerTime.getDate() + 1)
                  const { error } = await supabase.from('prayer_notification_schedule').insert({ user_id : user.user_id, notification_time : PrayerTime, prayer : prayer.prayer_name, message : `30 mins before Fajr!`, push_notification_token : UserPushToken.push_notification_token, notification_type : 'Alert 30mins before next prayer'})
                  if( error ){
                    console.log(error)
                  }
                }

              }
            })
          )
        }
        // save these users to the notification_schedule table 
      })
      )
      console.log('Alert At Iqamah Time')


      if( isBefore(todaysDate, new Date(2025, 2, 30)) ){
                  const {data : UsersWithAlertOnFirst, error : UsersAthanFirstError } = await supabase.from('prayer_notification_settings').select('*').eq('prayer', 'tarawih one').contains('notification_settings', ['Alert at Athan time'])
                  const {data : Users30MinsBeforeFirst, error : Users30MinsFirstError} = await supabase.from('prayer_notification_settings').select('*').eq('prayer', 'tarawih one').contains('notification_settings', ['Alert 30 Mins Before'])
                  const {data : UsersWithAlertOnSecond, error : UsersAthanSecondError } = await supabase.from('prayer_notification_settings').select('*').eq('prayer', 'tarawih two').contains('notification_settings', ['Alert at Athan time'])
                  const {data : Users30MinsBeforeSecond, error : Users30MinsSecondError} = await supabase.from('prayer_notification_settings').select('*').eq('prayer', 'tarawih two').contains('notification_settings', ['Alert 30 Mins Before'])
                  const { data : IshaTime, error : todayError} = await supabase.from('todays_prayers').select('*').eq('prayer_name', 'isha').single()
                  const FirstTaraweehTime = setTimeToCurrentDate(IshaTime.iqamah_time)
                  let FirstTaraweehTime30MinBefore = setTimeToCurrentDate(IshaTime.iqamah_time)
                  FirstTaraweehTime30MinBefore.setMinutes(FirstTaraweehTime30MinBefore.getMinutes() - 30)
                  const SecondTaraweehTime = setTimeToCurrentDate(IshaTime.iqamah_time)
                  SecondTaraweehTime.setHours(SecondTaraweehTime.getHours() + 1, SecondTaraweehTime.getMinutes() + 20)
      
                  let SecondTaraweehTime30MinBefore = new Date(SecondTaraweehTime)
      
                  SecondTaraweehTime30MinBefore.setMinutes(SecondTaraweehTime30MinBefore.getMinutes() - 30)
                  console.log(SecondTaraweehTime30MinBefore)
                  let FormattedFirst = new Date(FirstTaraweehTime)
                  FormattedFirst = format(FormattedFirst.setHours(FormattedFirst.getHours() - 5), 'p')
                  let FormattedSecond = new Date(SecondTaraweehTime)
                  FormattedSecond = format(FormattedSecond.setHours(FormattedSecond.getHours() - 5), 'p')
                  let FormattedFirst30 = new Date( FirstTaraweehTime30MinBefore )
                  let FormattedSecond30 = new Date( SecondTaraweehTime30MinBefore )
                  FormattedFirst30 = format(FormattedFirst30.setHours(FormattedFirst30.getHours() - 5), 'p')
                  FormattedSecond30 = format(FormattedSecond30.setHours(FormattedSecond30.getHours() - 5), 'p')
      
                  //First Taraweeh Alert at Athan
                  await Promise.all(
                    UsersWithAlertOnFirst.map( async (UserSettings) => {
          
                      const { data : UserPushToken, error } = await supabase.from('profiles').select('push_notification_token').eq('id', UserSettings.user_id).single()
                      if( UserPushToken && UserPushToken.push_notification_token ){
                          const { error : ScheduleError } = await supabase.from('prayer_notification_schedule').insert({ user_id : UserSettings.user_id, 
                            notification_time : FirstTaraweehTime, prayer : 'tarawih one', 
                            message : `First Taraweeh Starting Now!\n${FormattedFirst}`, 
                            push_notification_token : UserPushToken.push_notification_token, notification_type : 'Alert at Athan time'})
                            if(ScheduleError){
                              console.log(ScheduleError)
                            }
                          }
                    })
                    
                  )
                  //First Taraweeh alert 30 mins before
                  await Promise.all(
                    Users30MinsBeforeFirst.map( async ( UserSettings ) => {
                      const { data : UserPushToken, error } = await supabase.from('profiles').select('push_notification_token').eq('id', UserSettings.user_id).single()
                      if( UserPushToken && UserPushToken.push_notification_token ){

                          const { error : ScheduleError } = await supabase.from('prayer_notification_schedule').insert({ user_id : UserSettings.user_id, 
                            notification_time : FirstTaraweehTime30MinBefore, prayer : 'tarawih one', 
                            message : `First Tarawih Starting in 30 Mins!\n${FormattedFirst30}`, 
                            push_notification_token : UserPushToken.push_notification_token, notification_type : 'Alert 30 Mins Before'})
                            if(ScheduleError){
                              console.log(ScheduleError)
                            }

                          }
                    })
                  )
                  
                  //Second Taraweeh Alert at Athan
                  await Promise.all(
                    UsersWithAlertOnSecond.map( async (UserSettings) => {
          
                      const { data : UserPushToken, error } = await supabase.from('profiles').select('push_notification_token').eq('id', UserSettings.user_id).single()
                      if( UserPushToken && UserPushToken.push_notification_token ){

                          const { error : ScheduleError } = await supabase.from('prayer_notification_schedule').insert({ user_id : UserSettings.user_id, 
                            notification_time : SecondTaraweehTime, prayer : 'tarawih two', 
                            message : `Second Taraweeh Starting Now!\n${FormattedSecond}`, 
                            push_notification_token : UserPushToken.push_notification_token, notification_type : 'Alert at Athan time'})
                            if(ScheduleError){
                              console.log(ScheduleError)
                            }

                          }
          
                    })
                  )
                  
                  //Second Taraweeh alert 30 mins before
                  await Promise.all(
                    Users30MinsBeforeSecond.map( async ( UserSettings ) => {
                      const { data : UserPushToken, error } = await supabase.from('profiles').select('push_notification_token').eq('id', UserSettings.user_id).single()
                      if( UserPushToken && UserPushToken.push_notification_token ){

                          const { error : ScheduleError } = await supabase.from('prayer_notification_schedule').insert({ user_id : UserSettings.user_id, 
                            notification_time : SecondTaraweehTime30MinBefore, prayer : 'tarawih two', 
                            message : `Second Taraweeh Starting in 30 Mins!\n${FormattedSecond30}`, 
                            push_notification_token : UserPushToken.push_notification_token, notification_type : 'Alert 30 Mins Before'})
                            if(ScheduleError){
                              console.log(ScheduleError)
                            }
                            
                          }
                    })
                  )
          
      }
}

  await scheduler()

  return new Response(
    JSON.stringify(''),
    { headers: { "Content-Type": "application/json" } },
  )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/prayer-notification-scheduler' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' 
*/
