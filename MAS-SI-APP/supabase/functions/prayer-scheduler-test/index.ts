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
serve(async (req) => {
  const todaysDate = new Date()
  const scheduler = async () => {
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
                    const { error : ScheduleError } = await supabase.from('prayer_notification_schedule').insert({ user_id : UserSettings.user_id, 
                      notification_time : FirstTaraweehTime, prayer : 'tarawih one', 
                      message : `First Taraweeh Starting Now!\n${FormattedFirst}`, 
                      push_notification_token : UserPushToken.push_notification_token, notification_type : 'Alert at Athan time'})
                      if(ScheduleError){
                        console.log(ScheduleError)
                      }
              })
            )
            //First Taraweeh alert 30 mins before
            await Promise.all(
              Users30MinsBeforeFirst.map( async ( UserSettings ) => {
                const { data : UserPushToken, error } = await supabase.from('profiles').select('push_notification_token').eq('id', UserSettings.user_id).single()
                 
                    const { error : ScheduleError } = await supabase.from('prayer_notification_schedule').insert({ user_id : UserSettings.user_id, 
                      notification_time : FirstTaraweehTime30MinBefore, prayer : 'tarawih one', 
                      message : `First Tarawih Starting in 30 Mins!\n${FormattedFirst30}`, 
                      push_notification_token : UserPushToken.push_notification_token, notification_type : 'Alert 30 Mins Before'})
                      if(ScheduleError){
                        console.log(ScheduleError)
                      }
              })
            )
            
            //Second Taraweeh Alert at Athan
            await Promise.all(
              UsersWithAlertOnSecond.map( async (UserSettings) => {
    
                const { data : UserPushToken, error } = await supabase.from('profiles').select('push_notification_token').eq('id', UserSettings.user_id).single()
                    const { error : ScheduleError } = await supabase.from('prayer_notification_schedule').insert({ user_id : UserSettings.user_id, 
                      notification_time : SecondTaraweehTime, prayer : 'tarawih two', 
                      message : `Second Taraweeh Starting Now!\n${FormattedSecond}`, 
                      push_notification_token : UserPushToken.push_notification_token, notification_type : 'Alert at Athan time'})
                      if(ScheduleError){
                        console.log(ScheduleError)
                      }
    
              })
            )
            
            //Second Taraweeh alert 30 mins before
            await Promise.all(
              Users30MinsBeforeSecond.map( async ( UserSettings ) => {
                const { data : UserPushToken, error } = await supabase.from('profiles').select('push_notification_token').eq('id', UserSettings.user_id).single()
                    const { error : ScheduleError } = await supabase.from('prayer_notification_schedule').insert({ user_id : UserSettings.user_id, 
                      notification_time : SecondTaraweehTime30MinBefore, prayer : 'tarawih two', 
                      message : `Second Taraweeh Starting in 30 Mins!\n${FormattedSecond30}`, 
                      push_notification_token : UserPushToken.push_notification_token, notification_type : 'Alert 30 Mins Before'})
                      if(ScheduleError){
                        console.log(ScheduleError)
                      }
              })
            )
    
          }
    
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
