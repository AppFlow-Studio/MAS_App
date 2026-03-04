CREATE TABLE public.push_notification_tickets (
    id BIGSERIAL PRIMARY KEY,
    ticket_id TEXT NOT NULL,
    push_token TEXT NOT NULL,
    user_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    receipt_fetched BOOLEAN NOT NULL DEFAULT FALSE,
    receipt_status TEXT,
    receipt_error TEXT,
    receipt_fetched_at TIMESTAMPTZ
);

-- Partial index for unfetched tickets (the main query pattern)
CREATE INDEX idx_tickets_unfetched ON public.push_notification_tickets (created_at)
    WHERE receipt_fetched = FALSE;

-- Index for stale token audit
CREATE INDEX idx_tickets_token_status ON public.push_notification_tickets (push_token, receipt_status)
    WHERE receipt_fetched = TRUE;

-- RLS: service role only
ALTER TABLE public.push_notification_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role access" ON public.push_notification_tickets
    FOR ALL TO service_role USING (true) WITH CHECK (true);
