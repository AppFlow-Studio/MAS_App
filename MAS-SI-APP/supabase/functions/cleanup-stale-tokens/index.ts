import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const CONFIG = {
  // Look back 7 days for receipt data
  LOOKBACK_DAYS: 7,
  // Minimum sends before a token is eligible for cleanup
  MIN_SENDS: 5,
  // Error rate threshold (>50% errors = stale)
  ERROR_RATE_THRESHOLD: 0.5,
}

Deno.serve(async (_req) => {
  const startTime = Date.now()
  const stats = {
    tokensAnalyzed: 0,
    tokensRemoved: 0,
    errors: [] as string[],
    duration_ms: 0,
  }

  try {
    const lookbackDate = new Date(Date.now() - CONFIG.LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString()

    // Query all fetched tickets from the last 7 days
    // We aggregate in application code since Supabase doesn't support GROUP BY directly
    const { data: tickets, error: fetchError } = await supabase
      .from('push_notification_tickets')
      .select('push_token, user_id, receipt_status')
      .eq('receipt_fetched', true)
      .gte('created_at', lookbackDate)

    if (fetchError) {
      throw new Error(`Failed to fetch tickets: ${fetchError.message}`)
    }

    if (!tickets || tickets.length === 0) {
      stats.duration_ms = Date.now() - startTime
      return new Response(
        JSON.stringify({ message: 'No receipt data to analyze', ...stats }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Aggregate by push_token
    const tokenStats = new Map<string, {
      userId: string | null
      total: number
      errors: number
    }>()

    for (const ticket of tickets) {
      const existing = tokenStats.get(ticket.push_token)
      if (existing) {
        existing.total++
        if (ticket.receipt_status === 'error') {
          existing.errors++
        }
      } else {
        tokenStats.set(ticket.push_token, {
          userId: ticket.user_id,
          total: 1,
          errors: ticket.receipt_status === 'error' ? 1 : 0,
        })
      }
    }

    stats.tokensAnalyzed = tokenStats.size

    // Find stale tokens: >50% error rate AND at least MIN_SENDS sends
    const staleTokens: { token: string; userId: string; errorRate: number; total: number }[] = []

    for (const [token, data] of tokenStats) {
      if (data.total >= CONFIG.MIN_SENDS && data.userId) {
        const errorRate = data.errors / data.total
        if (errorRate > CONFIG.ERROR_RATE_THRESHOLD) {
          staleTokens.push({
            token,
            userId: data.userId,
            errorRate: Math.round(errorRate * 100),
            total: data.total,
          })
        }
      }
    }

    console.log(`Found ${staleTokens.length} stale tokens out of ${stats.tokensAnalyzed} analyzed`)

    // Nullify stale tokens
    for (const { token, userId, errorRate, total } of staleTokens) {
      const { error } = await supabase
        .from('profiles')
        .update({ push_notification_token: null })
        .eq('id', userId)
        .eq('push_notification_token', token)

      if (error) {
        stats.errors.push(`Failed to clean token for ${userId}: ${error.message}`)
      } else {
        stats.tokensRemoved++
        console.log(`Removed stale token for user ${userId}: ${errorRate}% error rate over ${total} sends`)
      }
    }

    stats.duration_ms = Date.now() - startTime

    console.log(
      `Stale token audit complete in ${stats.duration_ms}ms: ` +
      `${stats.tokensAnalyzed} analyzed, ${stats.tokensRemoved} removed`
    )

    return new Response(
      JSON.stringify({ message: 'Stale token audit complete', ...stats }),
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
