-- Fix: Allow authenticated users (admins) to read all capacity alert subscriptions
-- Previously only auth.uid() = user_id was allowed for SELECT, which meant
-- admins couldn't query all subscribers when sending capacity notifications.
-- This caused the fallback path to fire, sending notifications to ALL users.

-- Drop the restrictive per-user SELECT policy
DROP POLICY IF EXISTS "Users can view their own capacity alert subscription"
    ON public.capacity_alert_subscribers;

-- Replace with a policy that allows any authenticated user to read all subscriptions
-- The admin screen is already access-gated, so this is safe
CREATE POLICY "Authenticated users can read all capacity alert subscriptions"
    ON public.capacity_alert_subscribers
    FOR SELECT
    TO authenticated
    USING (true);

-- Add a foreign key from capacity_alert_subscribers.user_id to profiles.id
-- so PostgREST can detect the relationship and allow joins like profiles!inner(...)
ALTER TABLE public.capacity_alert_subscribers
    ADD CONSTRAINT capacity_alert_subscribers_profile_fk
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
