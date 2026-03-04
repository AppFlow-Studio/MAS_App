import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const CONFIG = {
  // Expo recommends waiting at least 15 minutes before fetching receipts
  MIN_AGE_MINUTES: 15,
  // Max tickets to process per invocation
  BATCH_LIMIT: 3000,
  // Expo receipt API limit per request
  EXPO_RECEIPT_CHUNK_SIZE: 300,
  // Delete fetched receipts older than this
  CLEANUP_HOURS: 48,
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

interface TicketRow {
  id: number
  ticket_id: string
  push_token: string
  user_id: string | null
}

interface ExpoReceipt {
  status: 'ok' | 'error'
  details?: { error?: string }
  message?: string
}

Deno.serve(async (_req) => {
  const startTime = Date.now()
  const stats = {
    fetched: 0,
    ok: 0,
    errors: 0,
    tokensCleaned: 0,
    oldRowsDeleted: 0,
    duration_ms: 0,
  }

  try {
    // 1. Query unfetched tickets older than 15 minutes
    const cutoff = new Date(Date.now() - CONFIG.MIN_AGE_MINUTES * 60 * 1000).toISOString()

    const { data: tickets, error: fetchError } = await supabase
      .from('push_notification_tickets')
      .select('id, ticket_id, push_token, user_id')
      .eq('receipt_fetched', false)
      .lt('created_at', cutoff)
      .limit(CONFIG.BATCH_LIMIT)

    if (fetchError) {
      throw new Error(`Failed to fetch tickets: ${fetchError.message}`)
    }

    if (!tickets || tickets.length === 0) {
      stats.duration_ms = Date.now() - startTime
      return new Response(
        JSON.stringify({ message: 'No tickets to check', ...stats }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${tickets.length} unfetched tickets`)

    // Build lookup maps
    const ticketIdToRow = new Map<string, TicketRow>()
    for (const ticket of tickets as TicketRow[]) {
      ticketIdToRow.set(ticket.ticket_id, ticket)
    }

    // 2. Fetch receipts from Expo in chunks of 300
    const ticketIds = tickets.map((t: TicketRow) => t.ticket_id)
    const chunks = chunkArray(ticketIds, CONFIG.EXPO_RECEIPT_CHUNK_SIZE)
    const tokensToClean: { token: string; userId: string }[] = []
    const rowUpdates: { id: number; status: string; error: string | null }[] = []

    for (const chunk of chunks) {
      try {
        const response = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ ids: chunk }),
        })

        if (!response.ok) {
          console.error(`Expo receipts API error: ${response.status}`)
          continue
        }

        const result = await response.json()
        const receipts: Record<string, ExpoReceipt> = result.data || {}

        // 3. Process each receipt
        for (const [ticketId, receipt] of Object.entries(receipts)) {
          const row = ticketIdToRow.get(ticketId)
          if (!row) continue

          stats.fetched++

          if (receipt.status === 'ok') {
            stats.ok++
            rowUpdates.push({ id: row.id, status: 'ok', error: null })
          } else {
            stats.errors++
            const errorType = receipt.details?.error || 'UnknownError'
            rowUpdates.push({ id: row.id, status: 'error', error: errorType })

            // Clean up DeviceNotRegistered tokens
            if (errorType === 'DeviceNotRegistered' && row.user_id) {
              tokensToClean.push({ token: row.push_token, userId: row.user_id })
            }
          }
        }

        // Mark tickets that got no receipt yet (Expo may not have them ready)
        // These will be retried on the next cron run
      } catch (error) {
        console.error(`Error fetching receipt chunk: ${(error as Error).message}`)
      }
    }

    // 4. Batch update ticket rows with receipt results
    for (const update of rowUpdates) {
      await supabase
        .from('push_notification_tickets')
        .update({
          receipt_fetched: true,
          receipt_status: update.status,
          receipt_error: update.error,
          receipt_fetched_at: new Date().toISOString(),
        })
        .eq('id', update.id)
    }

    // 5. Clean up invalid tokens from profiles
    const seen = new Set<string>()
    const uniqueTokens = tokensToClean.filter(p => {
      if (seen.has(p.token)) return false
      seen.add(p.token)
      return true
    })

    for (const { token, userId } of uniqueTokens) {
      const { error } = await supabase
        .from('profiles')
        .update({ push_notification_token: null })
        .eq('id', userId)
        .eq('push_notification_token', token)

      if (!error) {
        stats.tokensCleaned++
      } else {
        console.error(`Failed to clean token for user ${userId}: ${error.message}`)
      }
    }

    // 6. Delete old fetched rows to prevent table bloat
    const cleanupCutoff = new Date(Date.now() - CONFIG.CLEANUP_HOURS * 60 * 60 * 1000).toISOString()

    const { count } = await supabase
      .from('push_notification_tickets')
      .delete({ count: 'exact' })
      .eq('receipt_fetched', true)
      .lt('created_at', cleanupCutoff)

    stats.oldRowsDeleted = count || 0
    stats.duration_ms = Date.now() - startTime

    console.log(
      `Receipts processed in ${stats.duration_ms}ms: ${stats.fetched} fetched, ` +
      `${stats.ok} ok, ${stats.errors} errors, ${stats.tokensCleaned} tokens cleaned, ` +
      `${stats.oldRowsDeleted} old rows deleted`
    )

    return new Response(
      JSON.stringify({ message: 'Receipt check complete', ...stats }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Fatal error:', error)
    stats.duration_ms = Date.now() - startTime

    return new Response(
      JSON.stringify({ message: 'Fatal error', error: (error as Error).message, ...stats }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
