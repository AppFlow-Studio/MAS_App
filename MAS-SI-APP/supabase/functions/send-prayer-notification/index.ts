// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {Expo} from 'https://esm.sh/expo-server-sdk';
console.log("Hello from Functions!")

serve(async (req) => {
  const prayer_push_token = Deno.env.get('EXPO_PUBLIC_PRAYER_PUSH_TOKEN')
  const {  notifications_batch } = await req.json()
  let expo = new Expo({
    accessToken : prayer_push_token
  })
  const messages = notifications_batch.map(( notification ) => (
    {
      to: notification.push_notification_token,
      sound: 'default',
      body: notification.message,
      data: { withSome: 'data' },
    }
  ))  
  

  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];
  (async () => {
    // Send the chunks to the Expo push notification service. There are
    // different strategies you could use. A simple one is to send one chunk at a
    // time, which nicely spreads the load out over time:
    for (let chunk of chunks) {
      console.log(chunk)
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log(ticketChunk);
        tickets.push(...ticketChunk);
        // NOTE: If a ticket contains an error code in ticket.details.error, you
        // must handle it appropriately. The error codes are listed in the Expo
        // documentation:
        // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
      } catch (error) {
        console.log(error);
      }
    }
{  /*  console.log(tickets)
    let response = "";

    for (const ticket of tickets) {
      if(ticket.details.error ){
        console.log(ticket.details.error)
      }
        if (ticket.status === "error") {
            if (ticket.details && ticket.details.error === "DeviceNotRegistered") {
                response = "DeviceNotRegistered";
            }
        }

        if (ticket.status === "ok") {
            response = ticket.id;
        }
    }

    console.log(response) */}
  })();
  const data = {
    message: `${notifications_batch}`,
  }

  return new Response(
    JSON.stringify(data),
    { headers: { "Content-Type": "application/json" } },
  )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-prayer-notification' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"notifications_batch": "curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-prayer-notification' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"notifications_batch": "[{"id":74,"user_id":"ed0da2c2-fee3-43e4-a0c4-64dd45c6a70b","prayer":"zuhr","message":"Time to pray zuhr","created_at":"2024-10-13T23:46:26.762904+00:00","push_notification_token":"ExponentPushToken[-hrjeHFbAxLBK20lfmpzoG]","is_sent":false,"notification_time":"2024-10-13T16:42:00+00:00"},{"id":75,"user_id":"ed0da2c2-fee3-43e4-a0c4-64dd45c6a70b","prayer":"fajr","message":"Time to pray fajr","created_at":"2024-10-13T23:46:26.76296+00:00","push_notification_token":"ExponentPushToken[-hrjeHFbAxLBK20lfmpzoG]","is_sent":false,"notification_time":"2024-10-13T09:51:00+00:00"},{"id":76,"user_id":"ed0da2c2-fee3-43e4-a0c4-64dd45c6a70b","prayer":"isha","message":"Time to pray isha","created_at":"2024-10-13T23:46:26.826916+00:00","push_notification_token":"ExponentPushToken[-hrjeHFbAxLBK20lfmpzoG]","is_sent":false,"notification_time":"2024-10-14T00:33:00+00:00"},{"id":77,"user_id":"ed0da2c2-fee3-43e4-a0c4-64dd45c6a70b","prayer":"asr","message":"Time to pray asr","created_at":"2024-10-13T23:46:26.830188+00:00","push_notification_token":"ExponentPushToken[-hrjeHFbAxLBK20lfmpzoG]","is_sent":false,"notification_time":"2024-10-13T19:49:00+00:00"},{"id":78,"user_id":"ed0da2c2-fee3-43e4-a0c4-64dd45c6a70b","prayer":"maghrib","message":"Time to pray maghrib","created_at":"2024-10-13T23:46:26.83537+00:00","push_notification_token":"ExponentPushToken[-hrjeHFbAxLBK20lfmpzoG]","is_sent":false,"notification_time":"2024-10-13T22:18:00+00:00"}]"}'

*/
