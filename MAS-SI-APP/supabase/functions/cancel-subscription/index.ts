import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { stripe } from "../_utils/stripe.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { subscriptionId, cancelImmediately } = await req.json();

    if (!subscriptionId) {
      throw new Error('Subscription ID is required');
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client with auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    // Get the user's stripe_id from profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('stripe_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.stripe_id) {
      throw new Error('No Stripe customer found');
    }

    // Verify the subscription belongs to this customer
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (subscription.customer !== profile.stripe_id) {
      throw new Error('Subscription does not belong to this user');
    }

    let updatedSubscription;
    
    if (cancelImmediately) {
      // Cancel immediately
      updatedSubscription = await stripe.subscriptions.cancel(subscriptionId);
    } else {
      // Cancel at period end (user keeps access until end of billing period)
      updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        subscription: {
          id: updatedSubscription.id,
          status: updatedSubscription.status,
          cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
          currentPeriodEnd: updatedSubscription.current_period_end,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
