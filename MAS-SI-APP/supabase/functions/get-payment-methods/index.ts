// Edge function to retrieve saved payment methods for a customer
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { stripe } from "../_utils/stripe.ts";
import { createOrRetrieveProfile } from '../_utils/supabase.ts';

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
    // Get the Stripe customer ID for the authenticated user
    const customerId = await createOrRetrieveProfile(req);

    // List all payment methods attached to the customer
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    // Format the response with card details
    const savedCards = paymentMethods.data.map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand,
      last4: pm.card?.last4,
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
      isDefault: false, // Could be determined by customer's default_source
    }));

    return new Response(JSON.stringify({ 
      paymentMethods: savedCards,
      customerId: customerId,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/get-payment-methods' \
    --header 'Authorization: Bearer YOUR_AUTH_TOKEN' \
    --header 'Content-Type: application/json'

*/
