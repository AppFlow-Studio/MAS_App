// // supabase/functions/send-prayer-notification-safe/index.ts
// // 
// // TIMEOUT-SAFE QUICK FIX
// // Works with your existing prayer_notification_schedule and program_notification_schedule tables
// // 
// // Key features:
// // 1. Parallel chunk sending (not sequential)
// // 2. Hard timeout protection
// // 3. Graceful degradation
// //

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
async function sendToExpo(
  messages: {
    to: string,
    title: string,
    sound: string,
    body: string,
    data?: {
      [key: string]: string
    }
  }[], 
  accessToken?: string
): Promise<{
  status: 'ok' | 'error',
  id?: string,
  details?: {
    error?: string
  }
}[]> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers,
    body: JSON.stringify(messages),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Expo API ${response.status}: ${text}`)
  }

  const result = await response.json()
  return result.data // Array of tickets
}

// Token validation (replaces Expo.isExpoPushToken):
function isExpoPushToken(token: string): boolean {
  return typeof token === 'string' && 
    (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['))
}

// Chunking (replaces expo.chunkPushNotifications):
function chunkArray<T>(array: T[], size = 100): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

// ============================================================================
// CONFIGURATION
// ============================================================================
const CONFIG = {
  // Hard timeout - return response before Edge Function kills us
  // Edge function has 150s idle timeout, we exit at 100s to be very safe
  HARD_TIMEOUT_MS: 100_000,
  
  // Timeout per Expo API call
  EXPO_CALL_TIMEOUT_MS: 25_000,
  
  // Max parallel Expo requests
  MAX_PARALLEL: 3,
}

// ============================================================================
// TYPES
// ============================================================================
interface Notification {
  id: number
  user_id: string
  push_notification_token: string
  message: string
  title?: string
  prayer?: string
  program_event_name?: string
}

interface SendResult {
  total: number
  sent: number
  failed: number
  skipped: number
  invalidTokens: string[]
  errors: string[]
  timedOut: boolean
  duration_ms: number
}

interface ExpoPushMessage {
  to: string,
  title: string,
  sound: string,
  body: string,
  data?: {
    [key: string]: string
  }
}

interface ExpoPushTicket {
  status: 'ok' | 'error',
  id?: string,
  details?: {
    error?: string
  }
}
// ============================================================================
// TIMEOUT UTILITIES
// ============================================================================
function createTimeoutPromise<T>(ms: number): Promise<T> {
  return new Promise((_, reject) => 
    setTimeout(() => reject(new Error('TIMEOUT')), ms)
  )
}

async function withTimeout<T>(
  promise: Promise<T>, 
  ms: number,
  fallback: T
): Promise<{ result: T; timedOut: boolean }> {
  try {
    const result = await Promise.race([promise, createTimeoutPromise<T>(ms)])
    return { result, timedOut: false }
  } catch (error) {
    if (error.message === 'TIMEOUT') {
      return { result: fallback, timedOut: true }
    }
    throw error
  }
}

// ============================================================================
// PARALLEL PROCESSING
// ============================================================================
async function processChunksParallel(
    chunks:ExpoPushMessage[][],
  // expo: Expo,
  maxParallel: number,
  timeoutMs: number
): Promise<{ allTickets: ExpoPushTicket[][]; errors: string[] }> {
  const allTickets: ExpoPushTicket[][] = []
  const errors: string[] = []
  
  // Process in batches of maxParallel
  for (let i = 0; i < chunks.length; i += maxParallel) {
    const batch = chunks.slice(i, i + maxParallel)
    
    const batchPromises = batch.map(async (chunk, idx) => {
      try {
        const { result, timedOut } = await withTimeout(
          sendToExpo(chunk),
          timeoutMs,
          [] as ExpoPushTicket[]
        )
        
        if (timedOut) {
          errors.push(`Chunk ${i + idx} timed out`)
        }
        
        return result
      } catch (error) {
        errors.push(`Chunk ${i + idx}: ${error?.details?.error || 'Unknown error'}`)
        return [] as ExpoPushTicket[]
      }
    })
    
    const batchResults = await Promise.all(batchPromises)
    allTickets.push(...batchResults)
  }
  
  return { allTickets, errors }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================
Deno.serve(async (req) => {
  const startTime = Date.now()
  
  const result: SendResult = {
    total: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    invalidTokens: [],
    errors: [],
    timedOut: false,
    duration_ms: 0
  }
  
  // Set up hard timeout
  const hardTimeoutAt = startTime + CONFIG.HARD_TIMEOUT_MS
  const shouldExit = () => Date.now() > hardTimeoutAt - 5000 // 5s buffer
  
  try {
    const { notifications_batch } = await req.json()
    
    if (!notifications_batch || !Array.isArray(notifications_batch) || notifications_batch.length === 0) {
      result.duration_ms = Date.now() - startTime
      return new Response(
        JSON.stringify({ message: 'No notifications to send', ...result }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    result.total = notifications_batch.length
    
    // Check timeout
    if (shouldExit()) {
      result.timedOut = true
      result.skipped = result.total
      result.duration_ms = Date.now() - startTime
      return new Response(
        JSON.stringify({ message: 'Timeout before processing', ...result }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // const expo = new Expo({ accessToken: expoPushToken })
    
    // Build messages, tracking which index maps to which notification
    const messages: ExpoPushMessage[] = []
    const indexToNotification: Map<number, Notification> = new Map()
    
    for (const notification of notifications_batch as Notification[]) {
      // Validate token
      if (!notification.push_notification_token) {
        result.failed++
        result.errors.push(`ID ${notification.id}: Missing token`)
        continue
      }
      
      if (!isExpoPushToken(notification.push_notification_token)) {
        result.failed++
        result.invalidTokens.push(notification.push_notification_token)
        result.errors.push(`ID ${notification.id}: Invalid token format`)
        continue
      }
      
      indexToNotification.set(messages.length, notification)
      
      messages.push({
        to: notification.push_notification_token,
        title: notification.title || 'MAS Staten Island',
        body: notification.message,
        sound: 'default',
        // priority: 'high',
        // data: { 
        //   notificationId: notification.id,
        //   prayer: notification.prayer,
        //   program: notification.program_event_name
        // },
      })
    }
    
    if (messages.length === 0) {
      result.duration_ms = Date.now() - startTime
      return new Response(
        JSON.stringify({ message: 'No valid notifications', ...result }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Check timeout
    if (shouldExit()) {
      result.timedOut = true
      result.skipped = messages.length
      result.duration_ms = Date.now() - startTime
      return new Response(
        JSON.stringify({ message: 'Timeout before sending', ...result }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Chunk messages (Expo limit is 100 per request)
    const chunks = chunkArray(messages)
    
    console.log(`Sending ${messages.length} notifications in ${chunks.length} chunks (parallel: ${CONFIG.MAX_PARALLEL})`)
    
    // =========================================================================
    // PARALLEL SENDING - Much faster than sequential!
    // =========================================================================
    const { allTickets, errors: chunkErrors } = await processChunksParallel(
      chunks,
      CONFIG.MAX_PARALLEL,
      CONFIG.EXPO_CALL_TIMEOUT_MS
    )
    
    result.errors.push(...chunkErrors)
    
    // Process tickets
    let globalIndex = 0
    for (let chunkIdx = 0; chunkIdx < allTickets.length; chunkIdx++) {
      const tickets = allTickets[chunkIdx]
      const chunkSize = chunks[chunkIdx].length
      
      if (tickets.length === 0) {
        // Entire chunk failed
        result.failed += chunkSize
        globalIndex += chunkSize
        continue
      }
      
      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i]
        const notification = indexToNotification.get(globalIndex + i)
        
        if (ticket.status === 'ok') {
          result.sent++
        } else {
          result.failed++
          
          if (notification) {
            result.errors.push(`ID ${notification.id}: ${ticket?.details?.error || 'Unknown error'}`)
            
            if (ticket.details?.error === 'DeviceNotRegistered') {
              result.invalidTokens.push(notification.push_notification_token)
            }
          }
        }
      }
      
      globalIndex += chunkSize
    }
    
    result.duration_ms = Date.now() - startTime
    
    console.log(`Completed in ${result.duration_ms}ms: ${result.sent} sent, ${result.failed} failed`)
    
    return new Response(
      JSON.stringify({
        message: `Sent ${result.sent}/${result.total} notifications in ${result.duration_ms}ms`,
        ...result
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Fatal error:', error)
    result.duration_ms = Date.now() - startTime
    
    return new Response(
      JSON.stringify({
        message: 'Fatal error',
        error: error.message,
        ...result
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})


// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs

// import "jsr:@supabase/functions-js/edge-runtime.d.ts"
// import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// // import {Expo} from 'https://esm.sh/expo-server-sdk@3.7.0';
// console.log("Hello from Functions!")


// serve(async (req) => {
//   // const prayer_push_token = Deno.env.get('EXPO_PUBLIC_PRAYER_PUSH_TOKEN')
//   const {  notifications_batch } = await req.json()
//   // let expo = new Expo({
//   //   accessToken : prayer_push_token
//   // })
//   console.log(notifications_batch)
//   const messages = notifications_batch?.map(( notification : { push_notification_token: string, title: string, message: string } ) => (
//     {
//       to: notification.push_notification_token,
//       title : notification.title ? notification.title : 'MAS Staten Island',
//       sound: 'default',
//       body: notification.message,
//     }
//   ))  
  
//   if( !messages || messages?.length === 0 ){
//     return new Response(
//       JSON.stringify({ message: 'No notifications to send' }),
//       { headers: { 'Content-Type': 'application/json' } }
//     )
//   }

//   let chunks = chunkArray(messages);
//   let tickets = [];
//   (async () => {
//     // Send the chunks to the Expo push notification service. There are
//     // different strategies you could use. A simple one is to send one chunk at a
//     // time, which nicely spreads the load out over time:
//     for (let chunk of chunks) {
//       console.log(chunk)
//       try {
//         let ticketChunk = await sendToExpo(chunk);
//         console.log(ticketChunk);
//         tickets.push(...ticketChunk);
//         // NOTE: If a ticket contains an error code in ticket.details.error, you
//         // must handle it appropriately. The error codes are listed in the Expo
//         // documentation:
//         // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
//       } catch (error) {
//         console.log(error);
//       }
//     }
//   })();
//   const data = {
//     message: `${notifications_batch}`,
//   }

//   return new Response(
//     JSON.stringify(data),
//     { headers: { "Content-Type": "application/json" } },
//   )
// })

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
