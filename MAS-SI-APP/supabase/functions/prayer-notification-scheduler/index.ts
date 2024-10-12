// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {Expo} from 'https://esm.sh/expo-server-sdk';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
console.log("Hello from Functions!")

const supabaseUrl = Deno.env.get('EXPO_PUBLIC_SUPABASE_URL');
const supabaseKey = Deno.env.get('EXPO_PUBLIC_SUPABASE_ANON');
const supabase = createClient(supabaseUrl, supabaseKey);

const NotificationSender = async ( ) => {

}

function setTimeToCurrentDate(timeString) {
  // Get the current date
  const currentDate = new Date();

  // Parse the timeString to extract hours, minutes, and AM/PM
  const timeParts = timeString.match(/(\d+):(\d+)([APM]+)/);

  let hours = parseInt(timeParts[1]);
  const minutes = parseInt(timeParts[2]);
  const period = timeParts[3];

  // Convert 12-hour format to 24-hour format
  if (period === 'PM' && hours !== 12) {
      hours += 12;
  } else if (period === 'AM' && hours === 12) {
      hours = 0;
  }

  // Set the time to the current date
  currentDate.setHours(hours);
  currentDate.setMinutes(minutes);
  currentDate.setSeconds(0);
  currentDate.setMilliseconds(0);

  return currentDate;
}
serve(async (req) => {
  const { name } = await req.json()
  const data = {
    message: `Hello ${name}!`,
  }

  const { data : UserSettings, error : settingError } = await supabase.from('prayer_notification_settings').select('*')
  const { data : TodaysPrayers, error : todayError} = await supabase.from('todays_prayers').select('*')



  await Promise.all(
    TodaysPrayers.map( async ( prayer ) => {
      const prayerSettings = await supabase.from('prayer_notification_settings').select('*').eq('prayer', prayer == 'zuhr' ? 'dhuhr' : prayer)
      prayerSettings.map( async ( user ) => {
        const pushToken = ''
        if( pushToken ){
          user.notification_settings.map( async ( setting ) => {
            if( setting == 'Alert at Athan time' ){
              const prayerAthanTime = prayer.athan_time

            }
          })
          
        }else{

        }
      })
    })
  )

  return new Response(
    JSON.stringify(data),
    { headers: { "Content-Type": "application/json" } },
  )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/prayer-notification-scheduler' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
