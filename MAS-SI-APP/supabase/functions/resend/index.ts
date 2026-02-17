import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

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
    const { submission } = await req.json()

    // 1. Send admin notification email
    const adminRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'no-reply@massic.org',
        to: 'temurbeksayfutdinov@gmail.com',
        subject: 'New App Advertisement Submission',
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; color: #333333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .email-container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background-color: #1d4681; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: #ffffff; margin: 0; font-size: 22px; }
        .content { padding: 20px; }
        .content h2 { font-size: 18px; color: #1d4681; }
        .content p { line-height: 1.6; margin: 8px 0; }
        .content img { max-width: 100%; border-radius: 5px; margin: 20px 0; }
        .info { background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 16px; }
        .info h3 { margin-top: 0; color: #1d4681; font-size: 16px; }
        .info p { margin: 5px 0; }
        .footer { background-color: #1d4681; color: white; text-align: center; padding: 12px; font-size: 13px; border-radius: 0 0 10px 10px; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>New Business Ad Submission</h1>
        </div>
        <div class="content">
            <h2>A new business flyer has been submitted for review:</h2>

            <div class="info">
                <h3>Applicant Information</h3>
                <p><strong>Full Name:</strong> ${submission.personal_full_name}</p>
                <p><strong>Phone:</strong> ${submission.personal_phone_number}</p>
                <p><strong>Email:</strong> ${submission.personal_email}</p>
            </div>

            <div class="info">
                <h3>Business Information</h3>
                <p><strong>Business Name:</strong> ${submission.business_name}</p>
                <p><strong>Address:</strong> ${submission.business_address}</p>
                <p><strong>Phone:</strong> ${submission.business_phone_number}</p>
                <p><strong>Email:</strong> ${submission.business_email}</p>
            </div>

            <div class="info">
                <h3>Plan Details</h3>
                <p><strong>Duration:</strong> ${submission.business_flyer_duration}</p>
            </div>

            ${submission.business_flyer_img ? `<img src="${submission.business_flyer_img}" alt="Business Flyer" style="max-width:100%; border-radius:8px;">` : ''}
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} MAS Staten Island</p>
        </div>
    </div>
</body>
</html>`,
      }),
    })

    const adminData = await adminRes.json()
    if (!adminRes.ok) {
      console.error('Admin email error:', adminData)
    }

    // 2. Send confirmation email to the user
    if (submission.personal_email) {
      console.log('Sending business ad confirmation to:', submission.personal_email)

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
        .status-box { background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%); padding: 22px; border-radius: 12px; text-align: center; margin: 28px 0; border: 1px solid #fde68a; }
        .status-box .status { font-size: 20px; font-weight: 700; color: #92400e; margin: 0; }
        .status-box .label { font-size: 13px; color: #a16207; margin-top: 6px; font-weight: 500; }
        .details { background-color: #f9fafb; padding: 18px 20px; border-radius: 10px; margin: 24px 0; border: 1px solid #e5e7eb; }
        .details h3 { margin-top: 0; color: #1d4681; font-size: 15px; font-weight: 700; }
        .details table { width: 100%; border-collapse: collapse; }
        .details td { padding: 8px 0; font-size: 14px; color: #374151; }
        .details td:first-child { font-weight: 600; color: #1d4681; width: 140px; }
        .divider { height: 1px; background-color: #e5e7eb; margin: 28px 0; }
        .next-steps { background-color: #f0f7ff; border: 1px solid #d0e3f7; border-radius: 10px; padding: 20px; margin: 24px 0; }
        .next-steps h3 { margin-top: 0; color: #1d4681; font-size: 15px; }
        .next-steps ol { margin: 8px 0 0; padding-left: 20px; }
        .next-steps li { margin-bottom: 8px; font-size: 14px; color: #374151; }
        .dua-box { background-color: #fefce8; border: 1px solid #fde68a; border-radius: 10px; padding: 20px; margin: 24px 0; text-align: center; }
        .dua-box p { margin: 0; font-size: 15px; color: #92400e; font-style: italic; line-height: 1.6; }
        .signature { margin-top: 28px; }
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
            <h1>Application Received!</h1>
            <p>Thank you so much for choosing MAS Staten Island</p>
        </div>
        <div class="content">
            <p class="greeting">Assalamu Alaikum wa Rahmatullahi wa Barakatuh, ${submission.personal_full_name}!</p>
            <p>Thank you so much for submitting your business advertisement with MAS Staten Island. We truly appreciate your trust in our community platform. Your application has been received and is now in the hands of our review team.</p>

            <div class="status-box">
                <p class="status">Under Review</p>
                <p class="label">Our team is reviewing your application</p>
            </div>

            <div class="details">
                <h3>Submission Details</h3>
                <table>
                    <tr><td>Business Name</td><td>${submission.business_name}</td></tr>
                    <tr><td>Ad Duration</td><td>${submission.business_flyer_duration}</td></tr>
                    <tr><td>Date Submitted</td><td>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
                </table>
            </div>

            <div class="next-steps">
                <h3>What Happens Next?</h3>
                <ol>
                    <li>Our team will carefully review your ad submission</li>
                    <li>You will be notified once your ad has been approved</li>
                    <li>Your payment method will <strong>only be charged after approval</strong></li>
                    <li>Once approved, your ad will go live for the MAS SI community to see</li>
                </ol>
            </div>

            <div class="dua-box">
                <p>May Allah (SWT) bless your business and reward you for supporting your local community. We pray for your continued success. Ameen.</p>
            </div>

            <p>If you have any questions about your submission or need to make any changes, please do not hesitate to reach out to us. We are here to help.</p>

            <div class="signature">
                <p>With warm regards,</p>
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
