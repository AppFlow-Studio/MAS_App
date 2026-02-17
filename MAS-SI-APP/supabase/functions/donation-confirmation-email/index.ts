import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
      // Get the authenticated user's email from the auth header
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
          html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f0f2f5; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .wrapper { padding: 40px 20px; }
        .email-container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; }
        .logo-bar { background-color: #ffffff; text-align: center; padding: 32px 20px 16px; }
        .logo-bar img { width: 100px; height: 100px; border-radius: 24px; box-shadow: 0 2px 12px rgba(29,70,129,0.15); }
        .header { background: linear-gradient(135deg, #1d4681 0%, #2a5d9e 100%); color: #ffffff; text-align: center; padding: 32px 24px; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.3px; }
        .header p { margin: 8px 0 0; font-size: 15px; opacity: 0.9; }
        .content { padding: 36px 28px; color: #333333; line-height: 1.7; font-size: 15px; }
        .greeting { font-size: 17px; font-weight: 600; color: #1d4681; margin-bottom: 4px; }
        .amount-box { background: linear-gradient(135deg, #f0f7ff 0%, #e8f0fe 100%); padding: 28px 20px; border-radius: 12px; text-align: center; margin: 28px 0; border: 1px solid #d0e3f7; }
        .amount-box .amount { font-size: 42px; font-weight: 800; color: #1d4681; margin: 0; letter-spacing: -1px; }
        .amount-box .label { font-size: 14px; color: #6B7280; margin-top: 6px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; }
        .details { background-color: #f9fafb; padding: 18px 20px; border-radius: 10px; margin: 24px 0; border: 1px solid #e5e7eb; }
        .details table { width: 100%; border-collapse: collapse; }
        .details td { padding: 8px 0; font-size: 14px; color: #374151; }
        .details td:first-child { font-weight: 600; color: #1d4681; width: 120px; }
        .divider { height: 1px; background-color: #e5e7eb; margin: 28px 0; }
        .dua-box { background-color: #fefce8; border: 1px solid #fde68a; border-radius: 10px; padding: 20px; margin: 24px 0; text-align: center; }
        .dua-box p { margin: 0; font-size: 15px; color: #92400e; font-style: italic; line-height: 1.6; }
        .signature { margin-top: 28px; padding-top: 4px; }
        .signature p { margin: 2px 0; }
        .signature .name { font-weight: 700; color: #1d4681; }
        .footer { background-color: #1d4681; padding: 24px; text-align: center; }
        .footer p { color: rgba(255,255,255,0.8); font-size: 12px; margin: 4px 0; }
        .footer .org { color: #ffffff; font-weight: 600; font-size: 13px; letter-spacing: 0.5px; }
    </style>
</head>
<body>
    <div class="wrapper">
    <div class="email-container">
        <div class="logo-bar">
            <img src="https://ugc.production.linktr.ee/e3KxJRUJTu2zELiw7FCf_hH45sO9R0guiKEY2?io=true&size=avatar-v3_0" alt="MAS Staten Island">
        </div>
        <div class="header">
            <h1>Thank You So Much!</h1>
            <p>Your generosity makes a real difference</p>
        </div>
        <div class="content">
            <p class="greeting">Assalamu Alaikum wa Rahmatullahi wa Barakatuh,</p>
            <p>Thank you so much for your generous donation to MAS Staten Island. We are truly grateful for your support. Every contribution, no matter the size, helps us continue our mission of serving and uplifting our community.</p>

            <div class="amount-box">
                <p class="amount">${formattedAmount}</p>
                <p class="label">Donation Amount</p>
            </div>

            <div class="details">
                <table>
                    <tr><td>Date</td><td>${dateStr}</td></tr>
                    <tr><td>Email</td><td>${user.email}</td></tr>
                    <tr><td>Status</td><td>Payment Successful</td></tr>
                </table>
            </div>

            <div class="dua-box">
                <p>May Allah (SWT) reward you abundantly for your generosity, multiply your blessings, and accept this as Sadaqah Jariyah on your behalf. Ameen.</p>
            </div>

            <p>Your donation directly supports our community programs, educational initiatives, and services at MAS Staten Island. We could not do this work without supporters like you.</p>

            <p>If you have any questions about your donation or would like to learn more about how your contribution is making an impact, please do not hesitate to reach out to us.</p>

            <div class="signature">
                <p>With sincere gratitude,</p>
                <p class="name">MAS Staten Island</p>
                <p style="font-size: 13px; color: #6B7280;">Muslim American Society</p>
            </div>
        </div>
        <div class="footer">
            <p class="org">MAS Staten Island</p>
            <p>Muslim American Society</p>
            <p>&copy; ${new Date().getFullYear()} MAS Staten Island. All Rights Reserved.</p>
        </div>
    </div>
    </div>
</body>
</html>`,
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

    // --- Path 2: Feedback email (existing behavior) ---
    if (message && profile) {
      // Send feedback to admin
      const adminRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'no-reply@massic.org',
          to: 'temurbeksayfutdinov@gmail.com',
          subject: 'MAS App Feedback',
          html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0; }
        .email-container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background-color: #1d4681; color: #ffffff; text-align: center; padding: 20px; }
        .header img { width: 80px; margin-bottom: 10px; border-radius: 20px; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; color: #333333; line-height: 1.6; }
        .donation-details { background-color: #f1f9ff; padding: 15px; border-radius: 5px; font-size: 16px; }
        .donation-details strong { color: #1d4681; }
        .footer { background-color: #f1f1f1; padding: 10px; text-align: center; color: #777777; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <img src="https://ugc.production.linktr.ee/e3KxJRUJTu2zELiw7FCf_hH45sO9R0guiKEY2?io=true&size=avatar-v3_0" alt="MAS Staten Island">
            <h1>New App Feedback</h1>
        </div>
        <div class="content">
            <div class="donation-details">
                <p><strong>Message:</strong> ${message}</p>
            </div>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} MAS Staten Island. All Rights Reserved.</p>
        </div>
    </div>
</body>
</html>`,
        }),
      })

      if (!adminRes.ok) {
        return new Response('Error sending admin email', {
          status: 500,
          headers: corsHeaders,
        })
      }

      // Send confirmation to user
      const userRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'no-reply@massic.org',
          to: profile.profile_email,
          subject: 'MAS App Feedback Confirmation',
          html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0; }
        .email-container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background-color: #1d4681; color: #ffffff; text-align: center; padding: 20px; }
        .header img { width: 80px; margin-bottom: 10px; border-radius: 20px; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; color: #333333; line-height: 1.6; }
        .donation-details { background-color: #f1f9ff; padding: 15px; border-radius: 5px; font-size: 16px; }
        .donation-details strong { color: #1d4681; }
        .footer { background-color: #f1f1f1; padding: 10px; text-align: center; color: #777777; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <img src="https://ugc.production.linktr.ee/e3KxJRUJTu2zELiw7FCf_hH45sO9R0guiKEY2?io=true&size=avatar-v3_0" alt="MAS Staten Island">
            <h1>Thank You for Your Feedback!</h1>
        </div>
        <div class="content">
            <div class="donation-details">
                <p><strong>Dear MAS Staten Island Member,</strong></p>
                <p>Thank you for your feedback! We appreciate your input and will review it shortly.</p>
                <p>Here are the details of your feedback:</p>
                <p><strong>Message:</strong> ${message}</p>
            </div>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} MAS Staten Island. All Rights Reserved.</p>
        </div>
    </div>
</body>
</html>`,
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
