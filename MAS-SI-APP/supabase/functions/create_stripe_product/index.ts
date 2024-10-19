// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { retrievePaymentIntent, stripe } from "../_utils/stripe.ts";
import { createOrRetrieveProfile } from '../_utils/supabase.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const supabaseUrl = Deno.env.get('EXPO_PUBLIC_SUPABASE_URL');
const supabaseKey = Deno.env.get('EXPO_PUBLIC_SUPABASE_ANON');
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  const { name } = await req.json()
  const data = {
    message: `Hello ${name}!`,
  }

  const { data : paid_programs, error } = await supabase.from('programs').select('*').eq('program_is_paid', true)
  if( paid_programs ){
    await Promise.all(paid_programs.map( async (program) => {
      console.log(Number(program.program_price) * 100)
     const product =  await stripe.products.create({
        name : program.program_name,
        default_price_data : {
          currency : 'usd',
          unit_amount_decimal : Number(program.program_price) * 100,
          recurring : { interval : 'month' }
        },
        description : program.program_desc,
        active : true
      })

    if(product){
      const { error } = await supabase.from('programs').update({ stripe_product_id : product.id, stripe_price_id : product.default_price}).eq('program_id', program.program_id)
      if( error ){ console.log( error ) }
      console.log(product)
    }
    else{
      console.log('Error', product)
    }
    }))
  }
  return new Response(
    JSON.stringify(data),
    { headers: { "Content-Type": "application/json" } },
  )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create_stripe_product' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
