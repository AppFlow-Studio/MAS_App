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
      console.error('Auth error:', userError);
      throw new Error('Not authenticated');
    }

    console.log('User authenticated:', user.id);

    // Get the user's stripe_id from profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('stripe_id')
      .eq('id', user.id)
      .single();

    console.log('Profile:', profile, 'Error:', profileError);

    if (profileError || !profile?.stripe_id) {
      // No Stripe customer yet - return empty subscriptions
      console.log('No stripe_id found, returning empty');
      return new Response(
        JSON.stringify({ subscriptions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log('Fetching subscriptions for customer:', profile.stripe_id);

    // Fetch subscriptions from Stripe (without expand to avoid issues)
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_id,
      status: 'all',
    });

    console.log('Found subscriptions:', subscriptions.data.length);

    // Format the subscriptions for the frontend
    const formattedSubscriptions = await Promise.all(subscriptions.data.map(async (sub) => {
      const item = sub.items.data[0];
      const priceId = item?.price?.id;
      
      // Fetch price details separately if needed
      let productName = 'Business Ad Subscription';
      let priceAmount = item?.price?.unit_amount || 0;
      let priceCurrency = item?.price?.currency || 'usd';
      let priceInterval = item?.price?.recurring?.interval || 'month';
      let priceIntervalCount = item?.price?.recurring?.interval_count || 1;

      // Try to get product name
      if (item?.price?.product) {
        try {
          const productId = typeof item.price.product === 'string' 
            ? item.price.product 
            : item.price.product.id;
          const product = await stripe.products.retrieve(productId);
          productName = product.name || productName;
        } catch (e) {
          console.log('Could not fetch product:', e);
        }
      }
      
      return {
        id: sub.id,
        status: sub.status,
        currentPeriodStart: sub.current_period_start,
        currentPeriodEnd: sub.current_period_end,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        canceledAt: sub.canceled_at,
        endedAt: sub.ended_at,
        created: sub.created,
        productName,
        productDescription: null,
        priceAmount,
        priceCurrency,
        priceInterval,
        priceIntervalCount,
      };
    }));

    console.log('Returning formatted subscriptions:', formattedSubscriptions.length);

    return new Response(
      JSON.stringify({ subscriptions: formattedSubscriptions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return new Response(
      JSON.stringify({ error: error.message, subscriptions: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
