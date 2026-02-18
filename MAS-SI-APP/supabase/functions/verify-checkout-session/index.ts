import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { stripe } from "../_utils/stripe.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    console.log('Verifying checkout session:', sessionId);

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['setup_intent', 'subscription'],
    });

    console.log('Session status:', session.status);
    console.log('Session mode:', session.mode);

    if (session.mode === 'setup') {
      // Setup mode: card was saved, no charge yet
      const isComplete = session.status === 'complete';

      // Set the saved payment method as the customer's default for future invoices
      if (isComplete && session.setup_intent) {
        const setupIntent = typeof session.setup_intent === 'object'
          ? session.setup_intent
          : await stripe.setupIntents.retrieve(session.setup_intent);
        
        if (setupIntent.payment_method) {
          console.log('Setting default payment method:', setupIntent.payment_method);
          await stripe.customers.update(session.customer as string, {
            invoice_settings: {
              default_payment_method: setupIntent.payment_method as string,
            },
          });
          console.log('Default payment method set successfully');
        }
      }

      return new Response(
        JSON.stringify({
          success: isComplete,
          customerId: session.customer,
          status: session.status,
          mode: 'setup',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else {
      // Subscription/payment mode (legacy support)
      const isComplete = session.payment_status === 'paid' && session.status === 'complete';

      return new Response(
        JSON.stringify({
          success: isComplete,
          subscriptionId: typeof session.subscription === 'object' ? session.subscription?.id : session.subscription,
          customerId: session.customer,
          status: session.status,
          paymentStatus: session.payment_status,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
  } catch (error) {
    console.error('Error verifying session:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
