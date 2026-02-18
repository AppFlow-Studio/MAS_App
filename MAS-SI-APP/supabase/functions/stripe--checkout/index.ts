// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { stripe } from "../_utils/stripe.ts";
import { createOrRetrieveProfile } from '../_utils/supabase.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json()
    const { TotalAmount, saveCard = false } = body
    
    console.log('stripe--checkout received:', JSON.stringify(body))
    console.log('saveCard flag:', saveCard)
    console.log('Environment check - STRIPE_SECRET_KEY exists:', !!Deno.env.get('STRIPE_SECRET_KEY'))
    console.log('Environment check - SUPABASE_URL exists:', !!Deno.env.get('SUPABASE_URL'))
    console.log('Environment check - SUPABASE_ANON_KEY exists:', !!Deno.env.get('SUPABASE_ANON_KEY'))
    console.log('Environment check - SUPABASE_SERVICE_ROLE_KEY exists:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))
    
    if (!TotalAmount || TotalAmount <= 0) {
      throw new Error("Invalid amount provided");
    }

    // Get or create Stripe customer for the authenticated user
    console.log('Calling createOrRetrieveProfile...');
    const customer = await createOrRetrieveProfile(req);
    console.log('Customer ID:', customer);
    
    // Create ephemeral key for secure customer session
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer },
      { apiVersion: "2024-06-20" }
    );
    
    // Create a PaymentIntent with customer tracking
    // Only save card for future use if user opted in
    const paymentIntentParams: any = {
      amount: TotalAmount,
      currency: 'usd',
      customer: customer,
      description: 'Donation to MAS Staten Island',
      metadata: { product_type: 'donation' },
      automatic_payment_methods: {
        enabled: true,
      },
    };
    
    if (saveCard) {
      paymentIntentParams.setup_future_usage = 'off_session';
      console.log('Setting up card to be saved for future use');
    }
    
    console.log('Creating PaymentIntent with params:', JSON.stringify(paymentIntentParams));
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
    console.log('PaymentIntent created:', paymentIntent.id, 'setup_future_usage:', paymentIntent.setup_future_usage);
    
    const response = {
      paymentIntent: paymentIntent.client_secret,
      publishableKey: Deno.env.get("EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY") || Deno.env.get("STRIPE_PUBLISHABLE_KEY"),
      ephemeralKey: ephemeralKey.secret,
      customer: customer,
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/stripe--checkout' \
    --header 'Authorization: Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6ImI4MTI2OWYxLTIxZDgtNGYyZS1iNzE5LWMyMjQwYTg0MGQ5MCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjIwODQ2MzY2MjF9.O-8YxSImtMlRGTiXBbC0ZrOQ3i_fPDdqkyvskIDBac9KaB4q1KbQEVde_Sz4Wd5TB2Iqdvlg63N9hEGQlyW7FQ' \
    --header 'Content-Type: application/json' \
    --data '{"TotalAmount":200}'

*/
