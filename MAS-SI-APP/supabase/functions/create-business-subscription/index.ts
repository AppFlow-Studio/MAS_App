import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@16.6.0?target=deno&deno-std=0.132.0&no-check';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function createOrRetrieveCustomer(req: Request): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) throw new Error('No authorization header provided');

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError) throw new Error(`Auth error: ${userError.message}`);
  if (!user) throw new Error('No user found');

  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw new Error(`Profile fetch error: ${error.message}`);
  if (!profile) throw new Error('Profile not found');

  if (profile.stripe_id) {
    try {
      const existing = await stripe.customers.retrieve(profile.stripe_id);
      if (!existing.deleted) return profile.stripe_id;
    } catch (_e) {
      console.log('Customer not found in Stripe, creating new one...');
    }
  }

  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { uid: user.id },
  });

  await supabaseAdmin
    .from('profiles')
    .update({ stripe_id: customer.id })
    .eq('id', user.id);

  return customer.id;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { priceId, onboardingFeeCents = 0, planDuration, successUrl, cancelUrl } = await req.json();

    const customerId = await createOrRetrieveCustomer(req);

    console.log('Creating SETUP checkout for customer:', customerId);
    console.log('Plan:', planDuration, '| PriceId:', priceId, '| Onboarding:', onboardingFeeCents);

    const universalLinkDomain = Deno.env.get('UNIVERSAL_LINK_DOMAIN');
    const successUrlFinal =
      successUrl ||
      (universalLinkDomain
        ? `https://${universalLinkDomain}/subscription-success?session_id={CHECKOUT_SESSION_ID}`
        : 'https://massic.org/');
    const cancelUrlFinal =
      cancelUrl ||
      (universalLinkDomain
        ? `https://${universalLinkDomain}/subscription-cancel`
        : 'https://massic.org/');

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'setup',
      currency: 'usd',
      success_url: successUrlFinal,
      cancel_url: cancelUrlFinal,
      metadata: {
        product_type: 'business_ad',
        price_id: priceId || '',
        plan_duration: planDuration || '',
        onboarding_fee_cents: String(onboardingFeeCents),
      },
    });

    console.log('Setup session created:', session.id);

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
