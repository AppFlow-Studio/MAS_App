import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { stripe } from "../_utils/stripe.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Not authenticated');
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('stripe_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.stripe_id) {
      return new Response(
        JSON.stringify({ payments: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const paymentIntents = await stripe.paymentIntents.list({
      customer: profile.stripe_id,
      limit: 100,
    });

    // Filter out abandoned payment intents that were never used
    const relevantIntents = paymentIntents.data.filter(
      (pi) => pi.status !== 'requires_payment_method'
    );

    const formattedPayments = await Promise.all(
      relevantIntents.map(async (pi) => {
        let paymentMethodDetails = null;
        let isRefunded = false;
        let isPartiallyRefunded = false;
        let amountRefunded = 0;

        if (pi.status === 'succeeded') {
          try {
            // Try to get payment method from the charge (most reliable)
            if (pi.latest_charge) {
              const chargeId = typeof pi.latest_charge === 'string' ? pi.latest_charge : pi.latest_charge.id;
              const charge = await stripe.charges.retrieve(chargeId);

              isRefunded = charge.refunded === true;
              isPartiallyRefunded = !isRefunded && (charge.amount_refunded ?? 0) > 0;
              amountRefunded = charge.amount_refunded ?? 0;
              
              if (charge.payment_method_details?.card) {
                const card = charge.payment_method_details.card;
                const isApplePay = card.wallet?.type === 'apple_pay';
                paymentMethodDetails = {
                  type: isApplePay ? 'apple_pay' : 'card',
                  brand: card.brand,
                  last4: card.last4,
                };
              } else if (charge.payment_method_details?.type) {
                paymentMethodDetails = {
                  type: charge.payment_method_details.type,
                  brand: null,
                  last4: null,
                };
              }
            }
            
            // Fallback: try the payment_method directly
            if (!paymentMethodDetails && pi.payment_method) {
              const pmId = typeof pi.payment_method === 'string' ? pi.payment_method : pi.payment_method.id;
              const pm = await stripe.paymentMethods.retrieve(pmId);
              if (pm.card) {
                const isApplePay = pm.card.wallet?.type === 'apple_pay';
                paymentMethodDetails = {
                  type: isApplePay ? 'apple_pay' : 'card',
                  brand: pm.card.brand,
                  last4: pm.card.last4,
                };
              }
            }
          } catch (e) {
            console.log('Could not fetch payment method details:', e);
          }
        }

        // Derive a human-readable label from metadata or description
        let label = 'Donation';
        const productType = pi.metadata?.product_type;
        if (productType === 'business_ad') {
          label = 'Business Ad';
        } else if (productType === 'donation') {
          label = 'Donation';
        } else if (pi.description) {
          if (pi.description.toLowerCase().includes('business ad')) {
            label = 'Business Ad';
          } else if (pi.description.toLowerCase().includes('onboarding')) {
            label = 'Business Ad Onboarding';
          }
        }

        // For subscription payments, check the subscription's metadata
        if (label === 'Donation' && pi.invoice) {
          try {
            const invoiceId = typeof pi.invoice === 'string' ? pi.invoice : pi.invoice.id;
            const invoice = await stripe.invoices.retrieve(invoiceId);
            if (invoice.subscription) {
              const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id;
              const subscription = await stripe.subscriptions.retrieve(subId);
              if (subscription.metadata?.product_type === 'business_ad') {
                label = 'Business Ad';
              }
            }
          } catch (e) {
            console.log('Could not determine subscription type:', e);
          }
        }

        return {
          id: pi.id,
          amount: pi.amount,
          currency: pi.currency,
          status: isRefunded ? 'refunded' : isPartiallyRefunded ? 'partially_refunded' : pi.status,
          created: pi.created,
          description: pi.description,
          label,
          paymentMethod: paymentMethodDetails,
          amount_refunded: amountRefunded,
        };
      })
    );

    return new Response(
      JSON.stringify({ payments: formattedPayments }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return new Response(
      JSON.stringify({ error: error.message, payments: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
