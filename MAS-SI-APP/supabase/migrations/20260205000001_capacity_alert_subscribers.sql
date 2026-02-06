-- Create capacity_alert_subscribers table
-- This table tracks which users want to receive notifications when prayer capacity changes

CREATE TABLE IF NOT EXISTS public.capacity_alert_subscribers (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Add RLS policies
ALTER TABLE public.capacity_alert_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own subscription
CREATE POLICY "Users can view their own capacity alert subscription"
    ON public.capacity_alert_subscribers
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to insert their own subscription
CREATE POLICY "Users can subscribe to capacity alerts"
    ON public.capacity_alert_subscribers
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own subscription
CREATE POLICY "Users can unsubscribe from capacity alerts"
    ON public.capacity_alert_subscribers
    FOR DELETE
    USING (auth.uid() = user_id);

-- Allow service role to read all subscriptions (for sending notifications)
CREATE POLICY "Service role can read all capacity alert subscriptions"
    ON public.capacity_alert_subscribers
    FOR SELECT
    TO service_role
    USING (true);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.capacity_alert_subscribers TO authenticated;
GRANT USAGE ON SEQUENCE public.capacity_alert_subscribers_id_seq TO authenticated;
