// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { format } from "https://esm.sh/date-fns@3.6.0";
// Supabase client setup
const supabaseUrl = Deno.env.get('EXPO_PUBLIC_SUPABASE_URL');
const supabaseKey = Deno.env.get('EXPO_PUBLIC_SUPABASE_ANON');
const supabase = createClient(supabaseUrl, supabaseKey);
console.log("Hello from Functions!")
const RESEND_API_KEY = Deno.env.get('RESEND_KEY')

serve(async (req) => {
  const { cart, amount, profile } = await req.json()
  let purchaseObject : any[] = await Promise.all( cart.map( async (item) => {
    if( item.program_id ){
      const { data : program, error } = await supabase.from('programs').select('*').eq('program_id', item.program_id).single()
      if( error ){
        console.log(error)
      }
     return(
        {
          img : program.program_img,
          name : program.program_name,
          quant : item.product_quantity,
          price : item.product_price 
        }
       )
    }
    else{
  
    }
  }) )

  console.log(purchaseObject)

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev',
      to: 'temurbeksayfutdinov@gmail.com',
      subject: 'Thank you for your purchase',
      html: `
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Your Purchase Receipt - MAS Staten Island</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f7f9;
            color: #333333;
            margin: 0;
            padding: 0;
        }

        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .header {
            background-color: #003366;
            color: white;
            padding: 20px;
            text-align: center;
        }

        .header h1 {
            margin: 0;
            font-size: 24px;
            letter-spacing: 1px;
        }

        .header p {
            font-size: 16px;
        }

        .body {
            padding: 20px;
        }

        .product {
            display: flex;
            align-items: center;
            border-bottom: 1px solid #f1f1f1;
            padding: 10px 0;
        }

        .product img {
            width: 80px;
            height: 80px;
            object-fit: cover;
            border-radius: 8px;
            margin-right: 20px;
        }

        .product-details {
            flex-grow: 1;
            flex-direction : row;
            justify-content : 'space-between';
        }

        .product-name {
            font-size: 18px;
            font-weight: bold;
            margin: 0;
            color: #003366;
        }

        .product-price {
            font-size: 16px;
            font-weight: bold;
            color: #003366;
        }
          .product-quantity {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        } 
        .total {
            text-align: right;
            font-size: 20px;
            font-weight: bold;
            color: #003366;
            padding: 10px 0;
        }

        .footer {
            background-color: #f4f7f9;
            text-align: center;
            padding: 10px;
            font-size: 12px;
            color: #666;
        }

        .footer p {
            margin: 0;
        }

        .footer a {
            color: #003366;
            text-decoration: none;
        }
    </style>
</head>

<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>Thank You for Your Purchase!</h1>
            <p>MAS Staten Island</p>
        </div>

        <!-- Body -->
        <div class="body">
            <!-- Products Loop -->

            ${purchaseObject.map((item, index) => (
                ` 
                <div class="product">
                  <img src="${item.img}" alt="Product ${index + 1}">
                  <div class="product-details">
                      <p class="product-name">${item.name}</p>
                      <p class="product-quantity">Quantity: ${item.quant}</p>
                  </div>
                  <p class="product-price">$${item.price}</p>
                </div>
                `
            ))}
            
            <!-- Total Price -->
            <p class="total">Total: $${amount}</p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>If you have any questions, please contact us at <a href="mailto:support@masstatenisland.com">support@masstatenisland.com</a></p>
            <p>© 2024 MAS Staten Island</p>
        </div>
    </div>
</body>
      `
    }),
  })

  const data = await res.json()
  return new Response(
    JSON.stringify(data),
    { headers: { "Content-Type": "application/json" } },
  )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/purchase-confirmation-email' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
