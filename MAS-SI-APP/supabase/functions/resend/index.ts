import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { generateEmailHtml } from '../_shared/email-template.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { submission, type } = await req.json()

    // Handle rejection email
    if (type === 'rejection') {
      if (!submission.personal_email) {
        return new Response(
          JSON.stringify({ error: 'No email address on submission' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const dateStr = submission.created_at
        ? new Date(submission.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

      const rejectionHtml = generateEmailHtml({
        title: 'Application Update',
        subtitle: 'Regarding your business ad submission',
        greeting: `Assalamu Alaikum, ${submission.personal_full_name || 'Valued Applicant'}!`,
        sections: [
          { type: 'highlight-box', label: 'Application Not Approved', sublabel: 'Your submission was not approved at this time', color: 'amber' },
          { type: 'details-table', title: 'Submission Details', rows: [
            { label: 'Business Name', value: submission.business_name },
            { label: 'Plan Duration', value: submission.business_flyer_duration },
            { label: 'Date Submitted', value: dateStr },
          ]},
          { type: 'text', content: 'After careful review, we were unable to approve your business ad at this time. We encourage you to review our guidelines and resubmit your application. Our team is happy to help with any questions you may have.' },
          { type: 'dua', content: 'May Allah (SWT) bless your endeavors and grant you success in all that is good. Ameen.' },
          { type: 'text', content: 'If you have any questions or would like more information about our advertising guidelines, please do not hesitate to reach out to us.' },
        ],
      })

      console.log('Sending rejection email to:', submission.personal_email)

      const rejectionRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'MAS Staten Island <no-reply@massic.org>',
          to: submission.personal_email,
          subject: 'Business Ad Application Update - MAS Staten Island',
          html: rejectionHtml,
        }),
      })

      const rejectionData = await rejectionRes.json()
      if (!rejectionRes.ok) {
        console.error('Rejection email error:', rejectionData)
        return new Response(
          JSON.stringify({ error: 'Failed to send rejection email', details: rejectionData }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Rejection email sent successfully')
      return new Response(
        JSON.stringify(rejectionData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Send admin notification email
    const adminHtml = generateEmailHtml({
      title: 'New Business Ad Submission',
      greeting: 'A new business flyer has been submitted for review:',
      sections: [
        { type: 'details-table', title: 'Applicant Information', rows: [
          { label: 'Full Name', value: submission.personal_full_name },
          { label: 'Phone', value: submission.personal_phone_number },
          { label: 'Email', value: submission.personal_email },
        ]},
        { type: 'details-table', title: 'Business Information', rows: [
          { label: 'Business Name', value: submission.business_name },
          { label: 'Address', value: submission.business_address },
          { label: 'Phone', value: submission.business_phone_number },
          { label: 'Email', value: submission.business_email },
        ]},
        { type: 'details-table', title: 'Plan Details', rows: [
          { label: 'Duration', value: submission.business_flyer_duration },
        ]},
        ...(submission.business_flyer_img
          ? [{ type: 'image' as const, src: submission.business_flyer_img, alt: 'Business Flyer' }]
          : []),
      ],
    })

    const adminRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'MAS Staten Island <no-reply@massic.org>',
        to: 'temurbeksayfutdinov@gmail.com',
        subject: 'New App Advertisement Submission',
        html: adminHtml,
      }),
    })

    const adminData = await adminRes.json()
    if (!adminRes.ok) {
      console.error('Admin email error:', adminData)
    }

    // 2. Send confirmation email to the user
    if (submission.personal_email) {
      console.log('Sending business ad confirmation to:', submission.personal_email)

      const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })

      const userHtml = generateEmailHtml({
        title: 'Application Received!',
        subtitle: 'Thank you so much for choosing MAS Staten Island',
        greeting: `Assalamu Alaikum wa Rahmatullahi wa Barakatuh, ${submission.personal_full_name}!`,
        sections: [
          { type: 'text', content: 'Thank you so much for submitting your business advertisement with MAS Staten Island. We truly appreciate your trust in our community platform. Your application has been received and is now in the hands of our review team.' },
          { type: 'highlight-box', label: 'Under Review', sublabel: 'Our team is reviewing your application', color: 'amber' },
          { type: 'details-table', title: 'Submission Details', rows: [
            { label: 'Business Name', value: submission.business_name },
            { label: 'Ad Duration', value: submission.business_flyer_duration },
            { label: 'Date Submitted', value: dateStr },
          ]},
          { type: 'steps-list', title: 'What Happens Next?', steps: [
            'Our team will carefully review your ad submission',
            'You will be notified once your ad has been approved',
            'Your payment method will <strong>only be charged after approval</strong>',
            'Once approved, your ad will go live for the MAS SI community to see',
          ]},
          { type: 'dua', content: 'May Allah (SWT) bless your business and reward you for supporting your local community. We pray for your continued success. Ameen.' },
          { type: 'text', content: 'If you have any questions about your submission or need to make any changes, please do not hesitate to reach out to us. We are here to help.' },
        ],
      })

      const userRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'MAS Staten Island <no-reply@massic.org>',
          to: submission.personal_email,
          subject: 'Your Business Ad Application Has Been Received - MAS Staten Island',
          html: userHtml,
        }),
      })

      const userData = await userRes.json()
      if (!userRes.ok) {
        console.error('User confirmation email error:', userData)
      } else {
        console.log('User confirmation email sent successfully')
      }
    }

    return new Response(
      JSON.stringify(adminData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )

  } catch (error) {
    console.error('Error in resend function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
