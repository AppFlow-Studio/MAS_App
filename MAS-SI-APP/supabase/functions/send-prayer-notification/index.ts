import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

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

  // Retry settings
  MAX_RETRIES: 3,
  RETRY_BASE_DELAY_MS: 1_000,
  RETRY_MAX_DELAY_MS: 10_000,
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
  totalRetries: number
  tokensCleanedUp: number
  ticketsStored: number
}

interface ExpoPushMessage {
  to: string
  title: string
  sound: string
  body: string
  data?: { [key: string]: string }
}

interface ExpoPushTicket {
  status: 'ok' | 'error'
  id?: string
  details?: { error?: string }
}

// ============================================================================
// TOKEN VALIDATION & CHUNKING
// ============================================================================
function isExpoPushToken(token: string): boolean {
  return typeof token === 'string' &&
    (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['))
}

function chunkArray<T>(array: T[], size = 100): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

// ============================================================================
// EXPO API WITH RETRY
// ============================================================================
class ExpoApiError extends Error {
  constructor(public statusCode: number, public retryAfter: number | null, message: string) {
    super(message)
  }
}

async function sendToExpo(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(messages),
  })

  if (!response.ok) {
    const retryAfterHeader = response.headers.get('Retry-After')
    const retryAfter = retryAfterHeader ? Math.min(parseInt(retryAfterHeader, 10) * 1000, CONFIG.RETRY_MAX_DELAY_MS) : null
    const text = await response.text()
    throw new ExpoApiError(response.status, retryAfter, `Expo API ${response.status}: ${text}`)
  }

  const result = await response.json()
  return result.data
}

function isRetryable(error: unknown): boolean {
  if (error instanceof ExpoApiError) {
    return error.statusCode === 429 || error.statusCode >= 500
  }
  // Network errors are retryable
  return error instanceof TypeError
}

function getRetryDelay(attempt: number, error: unknown): number {
  // Respect Retry-After for 429s
  if (error instanceof ExpoApiError && error.retryAfter !== null) {
    return error.retryAfter
  }
  // Exponential backoff with jitter: 1s, 2s, 4s + random 0-500ms
  const exponentialDelay = CONFIG.RETRY_BASE_DELAY_MS * Math.pow(2, attempt)
  const jitter = Math.random() * 500
  return Math.min(exponentialDelay + jitter, CONFIG.RETRY_MAX_DELAY_MS)
}

async function sendToExpoWithRetry(
  messages: ExpoPushMessage[],
  shouldExit: () => boolean
): Promise<{ tickets: ExpoPushTicket[]; retries: number }> {
  let lastError: unknown
  for (let attempt = 0; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    if (attempt > 0 && shouldExit()) {
      break
    }
    try {
      const tickets = await sendToExpo(messages)
      return { tickets, retries: attempt }
    } catch (error) {
      lastError = error
      if (attempt < CONFIG.MAX_RETRIES && isRetryable(error) && !shouldExit()) {
        const delay = getRetryDelay(attempt, error)
        console.log(`Retry ${attempt + 1}/${CONFIG.MAX_RETRIES} after ${Math.round(delay)}ms: ${(error as Error).message}`)
        await new Promise(resolve => setTimeout(resolve, delay))
      } else if (!isRetryable(error)) {
        throw error
      }
    }
  }
  throw lastError
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
  chunks: ExpoPushMessage[][],
  maxParallel: number,
  timeoutMs: number,
  shouldExit: () => boolean
): Promise<{ allTickets: ExpoPushTicket[][]; errors: string[]; totalRetries: number }> {
  const allTickets: ExpoPushTicket[][] = []
  const errors: string[] = []
  let totalRetries = 0

  for (let i = 0; i < chunks.length; i += maxParallel) {
    if (shouldExit()) {
      errors.push(`Skipped chunks ${i}+ due to timeout budget`)
      break
    }

    const batch = chunks.slice(i, i + maxParallel)

    const batchPromises = batch.map(async (chunk, idx) => {
      try {
        const { result, timedOut } = await withTimeout(
          sendToExpoWithRetry(chunk, shouldExit),
          timeoutMs,
          { tickets: [] as ExpoPushTicket[], retries: 0 }
        )

        if (timedOut) {
          errors.push(`Chunk ${i + idx} timed out`)
        }

        totalRetries += result.retries
        return result.tickets
      } catch (error) {
        errors.push(`Chunk ${i + idx}: ${(error as Error).message || 'Unknown error'}`)
        return [] as ExpoPushTicket[]
      }
    })

    const batchResults = await Promise.all(batchPromises)
    allTickets.push(...batchResults)
  }

  return { allTickets, errors, totalRetries }
}

// ============================================================================
// TOKEN CLEANUP
// ============================================================================
async function cleanupInvalidTokens(
  invalidTokenPairs: { token: string; userId: string }[]
): Promise<number> {
  if (invalidTokenPairs.length === 0) return 0

  // Deduplicate by token
  const seen = new Set<string>()
  const unique = invalidTokenPairs.filter(p => {
    if (seen.has(p.token)) return false
    seen.add(p.token)
    return true
  })

  let cleaned = 0
  // Process in chunks of 100 for Supabase .in() limit
  const tokenChunks = chunkArray(unique, 100)

  for (const chunk of tokenChunks) {
    // Batch update: set push_notification_token = null where id AND token match
    // This prevents race conditions if user re-registered a new token
    for (const { token, userId } of chunk) {
      const { error } = await supabase
        .from('profiles')
        .update({ push_notification_token: null })
        .eq('id', userId)
        .eq('push_notification_token', token)

      if (error) {
        console.error(`Failed to clean token for user ${userId}: ${error.message}`)
      } else {
        cleaned++
      }
    }
  }

  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} invalid push tokens from profiles`)
  }

  return cleaned
}

// ============================================================================
// TICKET STORAGE
// ============================================================================
async function storeTickets(
  ticketRows: { ticket_id: string; push_token: string; user_id: string | null }[]
): Promise<number> {
  if (ticketRows.length === 0) return 0

  let stored = 0
  const insertChunks = chunkArray(ticketRows, 1000)

  for (const chunk of insertChunks) {
    const { error } = await supabase
      .from('push_notification_tickets')
      .insert(chunk)

    if (error) {
      console.error(`Failed to store ${chunk.length} tickets: ${error.message}`)
    } else {
      stored += chunk.length
    }
  }

  return stored
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
    duration_ms: 0,
    totalRetries: 0,
    tokensCleanedUp: 0,
    ticketsStored: 0,
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

    if (shouldExit()) {
      result.timedOut = true
      result.skipped = result.total
      result.duration_ms = Date.now() - startTime
      return new Response(
        JSON.stringify({ message: 'Timeout before processing', ...result }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Build messages, tracking which index maps to which notification
    const messages: ExpoPushMessage[] = []
    const indexToNotification: Map<number, Notification> = new Map()
    const invalidTokenPairs: { token: string; userId: string }[] = []

    for (const notification of notifications_batch as Notification[]) {
      if (!notification.push_notification_token) {
        result.failed++
        result.errors.push(`ID ${notification.id}: Missing token`)
        continue
      }

      if (!isExpoPushToken(notification.push_notification_token)) {
        result.failed++
        result.invalidTokens.push(notification.push_notification_token)
        result.errors.push(`ID ${notification.id}: Invalid token format`)
        // Track for cleanup
        if (notification.user_id) {
          invalidTokenPairs.push({ token: notification.push_notification_token, userId: notification.user_id })
        }
        continue
      }

      indexToNotification.set(messages.length, notification)

      messages.push({
        to: notification.push_notification_token,
        title: notification.title || 'MAS Staten Island',
        body: notification.message,
        sound: 'default',
      })
    }

    if (messages.length === 0) {
      // Still clean up invalid tokens even if no valid messages
      if (invalidTokenPairs.length > 0) {
        result.tokensCleanedUp = await cleanupInvalidTokens(invalidTokenPairs)
      }
      result.duration_ms = Date.now() - startTime
      return new Response(
        JSON.stringify({ message: 'No valid notifications', ...result }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

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
    // PARALLEL SENDING WITH RETRY
    // =========================================================================
    const { allTickets, errors: chunkErrors, totalRetries } = await processChunksParallel(
      chunks,
      CONFIG.MAX_PARALLEL,
      CONFIG.EXPO_CALL_TIMEOUT_MS,
      shouldExit
    )

    result.errors.push(...chunkErrors)
    result.totalRetries = totalRetries

    // Process tickets
    const ticketRows: { ticket_id: string; push_token: string; user_id: string | null }[] = []
    let globalIndex = 0

    for (let chunkIdx = 0; chunkIdx < allTickets.length; chunkIdx++) {
      const tickets = allTickets[chunkIdx]
      const chunkSize = chunks[chunkIdx]?.length ?? 0

      if (tickets.length === 0) {
        result.failed += chunkSize
        globalIndex += chunkSize
        continue
      }

      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i]
        const notification = indexToNotification.get(globalIndex + i)

        if (ticket.status === 'ok') {
          result.sent++
          // Store ticket ID for receipt checking (Phase 3B)
          if (ticket.id && notification) {
            ticketRows.push({
              ticket_id: ticket.id,
              push_token: notification.push_notification_token,
              user_id: notification.user_id || null,
            })
          }
        } else {
          result.failed++

          if (notification) {
            result.errors.push(`ID ${notification.id}: ${ticket?.details?.error || 'Unknown error'}`)

            if (ticket.details?.error === 'DeviceNotRegistered') {
              result.invalidTokens.push(notification.push_notification_token)
              if (notification.user_id) {
                invalidTokenPairs.push({ token: notification.push_notification_token, userId: notification.user_id })
              }
            }
          }
        }
      }

      globalIndex += chunkSize
    }

    // =========================================================================
    // POST-SEND: Token cleanup + ticket storage (best-effort, don't block response)
    // =========================================================================
    if (!shouldExit()) {
      const [cleaned, stored] = await Promise.all([
        cleanupInvalidTokens(invalidTokenPairs),
        storeTickets(ticketRows),
      ])
      result.tokensCleanedUp = cleaned
      result.ticketsStored = stored
    }

    result.duration_ms = Date.now() - startTime

    console.log(
      `Completed in ${result.duration_ms}ms: ${result.sent} sent, ${result.failed} failed, ` +
      `${result.totalRetries} retries, ${result.tokensCleanedUp} tokens cleaned, ${result.ticketsStored} tickets stored`
    )

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
