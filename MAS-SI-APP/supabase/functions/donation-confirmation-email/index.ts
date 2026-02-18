import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateEmailHtml } from '../_shared/email-template.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_KEY')
console.log('RESEND_KEY loaded:', RESEND_API_KEY ? `yes (starts with ${RESEND_API_KEY.substring(0, 6)}...)` : 'NO - KEY IS MISSING')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json()
    const { donation_amount, message, profile } = body

    // --- Path 1: Donation receipt email ---
    if (donation_amount !== undefined) {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'No authorization header' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      )

      const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
      if (userError || !user?.email) {
        console.error('Could not get user email:', userError)
        return new Response(
          JSON.stringify({ error: 'Could not retrieve user email' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const formattedAmount = typeof donation_amount === 'number'
        ? `$${donation_amount.toFixed(2)}`
        : `$${donation_amount}`
      const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })

      console.log('Sending donation receipt to:', user.email, 'amount:', formattedAmount)

      const html = generateEmailHtml({
        title: 'Thank You So Much!',
        subtitle: 'Your generosity makes a real difference',
        greeting: 'Assalamu Alaikum wa Rahmatullahi wa Barakatuh,',
        sections: [
          { type: 'text', content: 'Thank you so much for your generous donation to MAS Staten Island. We are truly grateful for your support. Every contribution, no matter the size, helps us continue our mission of serving and uplifting our community.' },
          { type: 'highlight-box', label: formattedAmount, sublabel: 'Donation Amount', color: 'blue' },
          { type: 'details-table', rows: [
            { label: 'Date', value: dateStr },
            { label: 'Email', value: user.email },
            { label: 'Status', value: 'Payment Successful' },
          ]},
          { type: 'dua', content: 'May Allah (SWT) reward you abundantly for your generosity, multiply your blessings, and accept this as Sadaqah Jariyah on your behalf. Ameen.' },
          { type: 'text', content: 'Your donation directly supports our community programs, educational initiatives, and services at MAS Staten Island. We could not do this work without supporters like you.' },
          { type: 'text', content: 'If you have any questions about your donation or would like to learn more about how your contribution is making an impact, please do not hesitate to reach out to us.' },
        ],
        signature: { line1: 'With sincere gratitude,', line2: 'MAS Staten Island', line3: 'Muslim American Society' },
      })

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'MAS Staten Island <no-reply@massic.org>',
          to: user.email,
          subject: 'Thank You So Much for Your Donation - MAS Staten Island',
          html,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        console.error('Resend API error:', data)
        return new Response(
          JSON.stringify({ error: 'Failed to send email', details: data }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Path 2: Feedback email ---
    if (message && profile) {
      const adminHtml = generateEmailHtml({
        title: 'New App Feedback',
        greeting: 'A new feedback message has been received:',
        sections: [
          { type: 'details-table', rows: [
            { label: 'Message', value: message },
          ]},
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
          subject: 'MAS App Feedback',
          html: adminHtml,
        }),
      })

      if (!adminRes.ok) {
        return new Response('Error sending admin email', {
          status: 500,
          headers: corsHeaders,
        })
      }

      const userHtml = generateEmailHtml({
        title: 'Thank You for Your Feedback!',
        greeting: 'Dear MAS Staten Island Member,',
        sections: [
          { type: 'text', content: 'Thank you for your feedback! We appreciate your input and will review it shortly.' },
          { type: 'text', content: 'Here are the details of your feedback:' },
          { type: 'details-table', rows: [
            { label: 'Message', value: message },
          ]},
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
          to: profile.profile_email,
          subject: 'MAS App Feedback Confirmation',
          html: userHtml,
        }),
      })

      if (!userRes.ok) {
        return new Response('Error sending user confirmation email', {
          status: 500,
          headers: corsHeaders,
        })
      }

      const data = await adminRes.json()
      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Missing required parameters: provide donation_amount or message+profile' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in donation-confirmation-email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
