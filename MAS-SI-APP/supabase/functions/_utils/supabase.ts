import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { stripe } from './stripe.ts';

export const createOrRetrieveProfile = async (req: Request) => {
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }
    
    // User client for reading (respects RLS)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );
    
    // Admin client for writing stripe_id (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Getting user from auth...');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError) {
      console.error('Auth error:', userError);
      throw new Error(`Auth error: ${userError.message}`);
    }

    console.log('User:', user?.id);
    if (!user) throw new Error('No user found - user is null');

    console.log('Fetching profile for user:', user.id);
    const { data: profile, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('Profile fetch error:', error);
      throw new Error(`Profile fetch error: ${error.message}`);
    }
    
    if (!profile) throw new Error('Profile Not Found - profile is null');
    
    // Check if existing stripe_id is valid
    if (profile.stripe_id) {
      console.log('Existing stripe_id found:', profile.stripe_id);
      
      // Verify the customer exists in Stripe
      try {
        const existingCustomer = await stripe.customers.retrieve(profile.stripe_id);
        
        // Check if customer was deleted
        if (existingCustomer.deleted) {
          console.log('Customer was deleted in Stripe, creating new one...');
        } else {
          console.log('Customer verified in Stripe:', existingCustomer.id);
          return profile.stripe_id;
        }
      } catch (stripeError: any) {
        // Customer doesn't exist in Stripe (likely created with different API keys)
        console.log('Customer not found in Stripe:', stripeError.message);
        console.log('Will create a new customer...');
      }
    }
    
    // Create new Stripe customer
    console.log('Creating new Stripe customer for:', user.email);
    const stripe_customer = await stripe.customers.create({
      email: user.email,
      metadata: { uid: user.id }
    });
    console.log('Created Stripe customer:', stripe_customer.id);

    // Save stripe_id using admin client (bypasses RLS)
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ stripe_id: stripe_customer.id })
      .eq('id', user.id);

    if (updateError) {
      console.error('FAILED to save stripe_id:', updateError);
      throw new Error('Failed to save Stripe customer ID');
    }
    
    console.log('SUCCESS: Saved stripe_id to profile:', stripe_customer.id);
    return stripe_customer.id;
};
