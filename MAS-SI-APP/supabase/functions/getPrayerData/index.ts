// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
{/*
  
  const masjidalAPIURL = `https://masjidal.com/api/v1/time/range?masjid_id=3OA8V3Kp&from_date=${currDate}&to_date=${weekDate}`
    const getMasjidalApi = () => {
      fetch(masjidalAPIURL)
      .then( (response) => response.json() )
      .then( (json) => setPrayerTimes(json) )
      .catch( (error) =>  console.error(error))
      .finally( () => setLoading(false) )
      console.log("getPrayer Called")
    }
      */}
// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { format } from "https://esm.sh/date-fns@3.6.0";
// Supabase client setup
const supabaseUrl = Deno.env.get('EXPO_PUBLIC_SUPABASE_URL');
const supabaseKey = Deno.env.get('EXPO_PUBLIC_SUPABASE_ANON');
const supabase = createClient(supabaseUrl, supabaseKey);
const getCurrDate = new Date();
getCurrDate.setDate(getCurrDate.getDate())
const getWeekDate = new Date();
const currDate = format(getCurrDate, "yyyy-MM-dd");
getWeekDate.setDate(getCurrDate.getDate() + 6)
const weekDate = format(getWeekDate, "yyyy-MM-dd");
const MASJID_TIMES_API = `https://masjidal.com/api/v1/time/range?masjid_id=3OA8V3Kp&from_date=${currDate}&to_date=${weekDate}`;
serve(async (req) => {
 try {
    // Fetching the data from the external API
    const response = await fetch(MASJID_TIMES_API);
    const data = await response.json();

    // Logging the data to the console
    const times = data.data.salah
    const iqamahTimes = data.data.iqamah

    const {error} = await supabase.from('prayers').update([{ prayerData : times, iqamahData : iqamahTimes }]).eq('id', 1)
    for( const value in times[0] ){
      if( value == 'fajr' || value == 'asr' || value == 'zuhr' || value == 'isha' || value == 'maghrib'){
        await supabase.from('todays_prayers').upsert({ prayer_name : value, athan_time : times[0][value], iqamahTimes : iqamahTimes[0][value] }).eq('id', 1)
      }
    }
    if (error) {
      console.error('Error inserting data:', error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    // Returning the data as the response
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Log the error if the request fails
    console.error('Error fetching data:', error);
    return new Response(JSON.stringify({ error: 'Error fetching data' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request GET 'http://127.0.0.1:54321/functions/v1/getPrayerData' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' 
*/
