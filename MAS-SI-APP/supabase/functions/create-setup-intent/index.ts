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
    const customer = await createOrRetrieveProfile(req);

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer },
      { apiVersion: '2024-06-20' }
    );

    const setupIntent = await stripe.setupIntents.create({
      customer,
      automatic_payment_methods: { enabled: true },
    });

    return new Response(
      JSON.stringify({
        setupIntent: setupIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating setup intent:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
