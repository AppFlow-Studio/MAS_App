// Edge function to charge a saved payment method (off-session payment)
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
    const { paymentMethodId, amount } = await req.json();

    if (!paymentMethodId) {
      throw new Error("Payment method ID is required");
    }

    if (!amount || amount <= 0) {
      throw new Error("Invalid amount provided");
    }

    // Get the Stripe customer ID for the authenticated user
    const customerId = await createOrRetrieveProfile(req);

    // Verify the payment method belongs to this customer
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (paymentMethod.customer !== customerId) {
      throw new Error("Payment method does not belong to this customer");
    }

    // Create and confirm a PaymentIntent with the saved payment method
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      description: 'Donation to MAS Staten Island',
      metadata: { product_type: 'donation' },
    });

    return new Response(JSON.stringify({ 
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error charging saved card:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      // Card was declined
      return new Response(JSON.stringify({ 
        error: error.message,
        code: error.code,
        requiresAction: false,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 402,
      });
    }

    if (error.code === 'authentication_required') {
      // Card requires authentication - return client secret for 3D Secure
      return new Response(JSON.stringify({ 
        error: 'Card requires authentication',
        requiresAction: true,
        clientSecret: error.payment_intent?.client_secret,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 402,
      });
    }

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/charge-saved-card' \
    --header 'Authorization: Bearer YOUR_AUTH_TOKEN' \
    --header 'Content-Type: application/json' \
    --data '{"paymentMethodId": "pm_xxxxx", "amount": 5000}'

*/
