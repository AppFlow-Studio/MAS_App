import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { stripe } from "../_utils/stripe.ts";
import { createOrRetrieveProfile } from '../_utils/supabase.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { paymentMethodId } = await req.json();

    if (!paymentMethodId) {
      return new Response(
        JSON.stringify({ error: 'paymentMethodId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const customerId = await createOrRetrieveProfile(req);

    // Verify the payment method belongs to this customer before detaching
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (paymentMethod.customer !== customerId) {
      return new Response(
        JSON.stringify({ error: 'Payment method does not belong to this user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await stripe.paymentMethods.detach(paymentMethodId);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
