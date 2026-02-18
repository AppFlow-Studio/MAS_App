import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { stripe } from "../_utils/stripe.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateEmailHtml } from '../_shared/email-template.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map business_flyer_duration to Stripe plan details
const PLAN_CONFIG: Record<string, { priceId?: string; amountCents?: number; isSubscription: boolean }> = {
  'Monthly Subscription': { priceId: 'plan_TfNqBwd94S8YT5', isSubscription: true },
  '3 Months': { amountCents: 13500, isSubscription: false },
  '1 Year': { amountCents: 48000, isSubscription: false },
};

const ONBOARDING_FEE_CENTS = 10000; // $100

async function sendAdLiveEmail(submission: any, amountCharged: string) {
  if (!submission.personal_email || !RESEND_API_KEY) return

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const html = generateEmailHtml({
    title: 'Your Ad is Live!',
    subtitle: 'Thank you for advertising with MAS Staten Island',
    greeting: `Assalamu Alaikum, ${submission.personal_full_name || 'Valued Advertiser'}!`,
    sections: [
      { type: 'highlight-box', label: 'YOUR AD IS NOW LIVE', sublabel: 'Visible to the MAS Staten Island community', color: 'green' },
      { type: 'details-table', title: 'Ad Details', rows: [
        { label: 'Business Name', value: submission.business_name },
        { label: 'Plan', value: submission.business_flyer_duration },
        { label: 'Amount Charged', value: amountCharged },
        { label: 'Date', value: dateStr },
      ]},
      { type: 'text', content: 'Your flyer is now visible to the entire MAS Staten Island community. Thank you for supporting your local masjid and community through advertising with us.' },
      { type: 'dua', content: 'May Allah (SWT) bless your business and bring you success in this life and the hereafter. Ameen.' },
      { type: 'text', content: 'If you have any questions about your ad or need to make changes, please do not hesitate to reach out to us.' },
    ],
  })

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'MAS Staten Island <no-reply@massic.org>',
        to: submission.personal_email,
        subject: 'Your Business Ad is Now Live! - MAS Staten Island',
        html,
      }),
    })
    if (!res.ok) {
      const err = await res.json()
      console.error('Failed to send ad-live email:', err)
    } else {
      console.log('Ad-live confirmation email sent to:', submission.personal_email)
    }
  } catch (e) {
    console.error('Error sending ad-live email:', e)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // This can be called by a Supabase Database Webhook when status changes to APPROVED
    // or by the app when it detects an approved submission
    const body = await req.json();

    // Support both webhook format (record) and direct call (submission_id)
    const record = body.record || body;
    const submissionId = record.submission_id || body.submission_id;
    const userId = record.user_id || body.user_id;

    if (!submissionId && !userId) {
      throw new Error('submission_id or user_id is required');
    }

    // Use admin client (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the submission
    let query = supabaseAdmin.from('business_ads_submissions').select('*');
    if (submissionId) {
      query = query.eq('submission_id', submissionId);
    } else {
      query = query.eq('user_id', userId).eq('status', 'APPROVED').order('created_at', { ascending: false }).limit(1);
    }
    
    const { data: submissions, error: subError } = await query;
    if (subError || !submissions || submissions.length === 0) {
      throw new Error('Approved submission not found');
    }
    
    const submission = submissions[0];

    // Only process APPROVED submissions
    if (submission.status !== 'APPROVED') {
      console.log('Submission is not APPROVED, skipping. Status:', submission.status);
      return new Response(
        JSON.stringify({ success: false, error: 'Submission is not in APPROVED status' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log('Activating payment for submission:', submission.submission_id);
    console.log('Plan:', submission.business_flyer_duration);

    // Get the user's Stripe customer ID from their profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_id')
      .eq('id', submission.user_id)
      .single();
    
    if (profileError || !profile?.stripe_id) {
      throw new Error('Stripe customer not found for user');
    }

    const customerId = profile.stripe_id;
    console.log('Stripe customer:', customerId);

    // Look up plan details
    const planConfig = PLAN_CONFIG[submission.business_flyer_duration];
    if (!planConfig) {
      throw new Error(`Unknown plan: ${submission.business_flyer_duration}`);
    }

    // Check if this is the user's first completed ad (for onboarding fee)
    const { data: previousAds } = await supabaseAdmin
      .from('business_ads_submissions')
      .select('id')
      .eq('user_id', submission.user_id)
      .neq('submission_id', submission.submission_id)
      .in('status', ['POSTED'])
      .limit(1);

    const isFirstAd = !previousAds || previousAds.length === 0;
    const onboardingFee = isFirstAd ? ONBOARDING_FEE_CENTS : 0;
    console.log('First ad:', isFirstAd, 'Onboarding fee:', onboardingFee);

    if (planConfig.isSubscription && planConfig.priceId) {
      // --- SUBSCRIPTION PLAN ---
      // Add onboarding fee as a pending invoice item (gets included on the first invoice)
      if (onboardingFee > 0) {
        console.log('Adding onboarding fee as invoice item:', onboardingFee);
        await stripe.invoiceItems.create({
          customer: customerId,
          amount: onboardingFee,
          currency: 'usd',
          description: 'Business Ad Onboarding Fee (one-time)',
        });
      }

      // Create the subscription — charges immediately using the customer's default payment method
      console.log('Creating subscription with price:', planConfig.priceId);
      // const subscription = await stripe.subscriptions.create({
      //   customer: customerId,
      //   items: [{ price: planConfig.priceId }],
      //   metadata: {
      //     product_type: 'business_ad',
      //     submission_id: submission.submission_id || '',
      //   },
      //   payment_settings: {
      //     payment_intent_data: {
      //       metadata: {
      //         product_type: 'business_ad',
      //         submission_id: submission.submission_id || '',
      //       },
      //     },
      //   },
      // });
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: planConfig.priceId }],
        metadata: {
          product_type: 'business_ad',
          submission_id: submission.submission_id || '',
        },
      });

      console.log('Subscription created:', subscription.id, 'status:', subscription.status);

      // Update submission status to POSTED if payment succeeded
      if (subscription.status === 'active') {
        await supabaseAdmin
          .from('business_ads_submissions')
          .update({ status: 'POSTED' })
          .eq('submission_id', submission.submission_id);
        console.log('Submission status updated to POSTED');

        const amountStr = onboardingFee > 0
          ? `Monthly subscription + $${(onboardingFee / 100).toFixed(2)} onboarding fee`
          : 'Monthly subscription';
        await sendAdLiveEmail(submission, amountStr);
      }

      return new Response(
        JSON.stringify({
          success: subscription.status === 'active',
          subscriptionId: subscription.id,
          status: subscription.status,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } else {
      // --- ONE-TIME PLAN ---
      const totalAmount = (planConfig.amountCents || 0) + onboardingFee;
      
      console.log('Creating one-time charge for:', totalAmount);
      const paymentIntent = await stripe.paymentIntents.create({
        customer: customerId,
        amount: totalAmount,
        currency: 'usd',
        confirm: true,
        off_session: true,
        description: `Business Ad - ${submission.business_flyer_duration}${onboardingFee > 0 ? ' + Onboarding Fee' : ''}`,
        metadata: {
          product_type: 'business_ad',
          submission_id: submission.submission_id || '',
        },
      });

      console.log('PaymentIntent:', paymentIntent.id, 'status:', paymentIntent.status);

      if (paymentIntent.status === 'succeeded') {
        await supabaseAdmin
          .from('business_ads_submissions')
          .update({ status: 'POSTED' })
          .eq('submission_id', submission.submission_id);
        console.log('Submission status updated to POSTED');

        const amountStr = `$${(totalAmount / 100).toFixed(2)}`;
        await sendAdLiveEmail(submission, amountStr);
      }

      return new Response(
        JSON.stringify({
          success: paymentIntent.status === 'succeeded',
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
  } catch (error) {
    console.error('Error activating business subscription:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
