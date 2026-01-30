import { CollectionMode, initPaymentSheet, presentPaymentSheet } from "@stripe/stripe-react-native";
import { Alert } from "react-native";
import { supabase } from "./supabase";

// Prevent multiple simultaneous payment sheet operations
let isPaymentInProgress = false;

// Type for saved payment method
export interface SavedPaymentMethod {
    id: string;
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    isDefault: boolean;
}

// Type for charge result
export interface ChargeResult {
    success: boolean;
    paymentIntent?: {
        id: string;
        status: string;
        amount: number;
    };
    error?: string;
    requiresAction?: boolean;
    clientSecret?: string;
}

const fetchStripekeys = async (totalAmount: number, saveCard: boolean = false) => {
    console.log('Fetching Stripe keys for amount:', totalAmount, 'saveCard:', saveCard)
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
        console.log('No active session found')
        Alert.alert('Login Required', 'Please log in to make a donation.')
        return null
    }
    
    // Try the payment-sheet function first (has customer tracking)
    let data, error
    
    const result = await supabase.functions.invoke('payment-sheet', { body: { 
        amount: totalAmount,
        saveCard: saveCard
    }})
    
    data = result.data
    error = result.error
    
    // If payment-sheet fails, fall back to stripe--checkout (simpler, no customer tracking)
    if (error || data?.error) {
        console.log('payment-sheet failed, trying stripe--checkout fallback')
        
        const fallbackResult = await supabase.functions.invoke('stripe--checkout', { body: { 
            TotalAmount: totalAmount,
            saveCard: saveCard
        }})
        
        if (fallbackResult.error) {
            console.log('stripe--checkout error:', JSON.stringify(fallbackResult.error))
            Alert.alert('Payment Error', 'Failed to initialize payment. Please try again.')
            return null
        }
        
        if (fallbackResult.data?.error) {
            console.log('stripe--checkout server error:', JSON.stringify(fallbackResult.data))
            Alert.alert('Payment Error', fallbackResult.data.error)
            return null
        }
        
        console.log('Stripe keys fetched via fallback')
        return fallbackResult.data
    }
    
    console.log('Stripe keys fetched successfully')
    return data
}

export const setupStripePaymentSheet = async (totalAmount: number, saveCard: boolean = false) => {
    // Prevent concurrent payment operations
    if (isPaymentInProgress) {
        console.log('Payment already in progress, ignoring duplicate call')
        return null
    }
    
    isPaymentInProgress = true
    console.log('setupStripePaymentSheet called with amount:', totalAmount, 'saveCard:', saveCard)
    
    try {
        // Fetch the payment sheet parameters from the server
        const data = await fetchStripekeys(totalAmount, saveCard)
        
        console.log('Stripe keys response:', JSON.stringify(data))
        
        if (!data) {
            console.log('No data returned from fetchStripekeys')
            isPaymentInProgress = false
            return null
        }
        
        const { paymentIntent, publishableKey, customer, ephemeralKey } = data
        
        if (!paymentIntent || !publishableKey) {
            console.log('Missing paymentIntent or publishableKey:', { paymentIntent: !!paymentIntent, publishableKey: !!publishableKey })
            isPaymentInProgress = false
            return null
        }
        
        console.log('Initializing payment sheet...')
        const { error } = await initPaymentSheet({
            merchantDisplayName: 'MAS Staten Island',
            paymentIntentClientSecret: paymentIntent,
            customerId: customer,
            customerEphemeralKeySecret: ephemeralKey,
            billingDetailsCollectionConfiguration: {
                name: 'always' as CollectionMode,
                phone: 'always' as CollectionMode,
            },
            // returnURL: '',
            appearance: {
                colors: {
                    primary: '#214E91',
                    background: '#FFFFFF',
                    componentBackground: '#F9FAFB',
                    componentBorder: '#E5E7EB',
                    componentDivider: '#E5E7EB',
                    primaryText: '#111827',
                    secondaryText: '#6B7280',
                    componentText: '#111827',
                    placeholderText: '#9CA3AF',
                    icon: '#214E91',
                },
                shapes: {
                    borderRadius: 16,
                    borderWidth: 1,
                },
                primaryButton: {
                    colors: {
                        background: '#214E91',
                        text: '#FFFFFF',
                        border: '#214E91',
                    },
                    shapes: {
                        borderRadius: 16,
                    }
                }
            }
        })
        
        if (error) {
            console.log('Init payment sheet error:', error)
            isPaymentInProgress = false
            return null
        }
        
        console.log('Payment sheet initialized successfully')
        return paymentIntent
    } catch (error) {
        console.log('setupStripePaymentSheet error:', error)
        isPaymentInProgress = false
        return null
    }
}

export const openStripePaymentSheet = async () => {
    console.log('Opening Stripe payment sheet...')
    try {
        const { error } = await presentPaymentSheet();
        if (error) {
            console.log('Present payment sheet error:', error.code, error.message)
            return false
        }
        console.log('Payment completed successfully')
        return true
    } finally {
        // Reset flag after payment sheet is dismissed (success or cancel)
        isPaymentInProgress = false
    }
}

// Reset payment state (call this if payment flow is interrupted)
export const resetPaymentState = () => {
    isPaymentInProgress = false
}

/**
 * Fetch saved payment methods for the authenticated user
 * @returns Array of saved payment methods or null if error
 */
export const fetchSavedPaymentMethods = async (): Promise<SavedPaymentMethod[] | null> => {
    console.log('Fetching saved payment methods...')
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
        console.log('No active session found')
        return null
    }
    
    try {
        const { data, error } = await supabase.functions.invoke('get-payment-methods')
        
        console.log('get-payment-methods full response:', JSON.stringify(data, null, 2))
        
        if (error) {
            console.log('Error fetching payment methods:', error)
            return null
        }
        
        if (data?.error) {
            console.log('Server error fetching payment methods:', data.error)
            return null
        }
        
        console.log('Fetched payment methods:', data?.paymentMethods?.length || 0, 'cards')
        console.log('Customer ID:', data?.customerId)
        return data?.paymentMethods || []
    } catch (error) {
        console.log('Exception fetching payment methods:', error)
        return null
    }
}

/**
 * Charge a saved payment method (off-session payment)
 * @param paymentMethodId The Stripe payment method ID to charge
 * @param amount Amount in cents
 * @returns ChargeResult with success status or error details
 */
export const chargeWithSavedCard = async (paymentMethodId: string, amount: number): Promise<ChargeResult> => {
    console.log('Charging saved card:', paymentMethodId, 'amount:', amount)
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
        console.log('No active session found')
        return { success: false, error: 'Login required' }
    }
    
    try {
        const { data, error } = await supabase.functions.invoke('charge-saved-card', {
            body: { paymentMethodId, amount }
        })
        
        if (error) {
            console.log('Error charging saved card:', error)
            return { success: false, error: error.message || 'Payment failed' }
        }
        
        if (data?.error) {
            console.log('Server error charging saved card:', data.error)
            return { 
                success: false, 
                error: data.error,
                requiresAction: data.requiresAction,
                clientSecret: data.clientSecret
            }
        }
        
        console.log('Charge successful:', data)
        return {
            success: true,
            paymentIntent: data?.paymentIntent
        }
    } catch (error: any) {
        console.log('Exception charging saved card:', error)
        return { success: false, error: error?.message || 'Payment failed' }
    }
}

/**
 * Get display name for card brand
 */
export const getCardBrandDisplayName = (brand: string): string => {
    const brandNames: Record<string, string> = {
        'visa': 'Visa',
        'mastercard': 'Mastercard',
        'amex': 'American Express',
        'discover': 'Discover',
        'diners': 'Diners Club',
        'jcb': 'JCB',
        'unionpay': 'UnionPay',
    }
    return brandNames[brand?.toLowerCase()] || brand || 'Card'
}

// Type for subscription checkout result
export interface SubscriptionCheckoutResult {
    success: boolean;
    sessionId?: string;
    url?: string;
    error?: string;
}

/**
 * Create a Stripe Checkout Session for a subscription
 * @param priceId The Stripe Price ID for the subscription
 * @param successUrl Optional custom success URL
 * @param cancelUrl Optional custom cancel URL
 * @returns SubscriptionCheckoutResult with checkout URL or error
 */
export const createBusinessSubscription = async (
    priceId: string,
    successUrl?: string,
    cancelUrl?: string
): Promise<SubscriptionCheckoutResult> => {
    console.log('Creating business subscription for price:', priceId)
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
        console.log('No active session found')
        return { success: false, error: 'Login required' }
    }
    
    try {
        const { data, error } = await supabase.functions.invoke('create-business-subscription', {
            body: { 
                priceId,
                successUrl,
                cancelUrl
            }
        })
        
        if (error) {
            console.log('Error creating subscription:', error)
            return { success: false, error: error.message || 'Failed to create subscription' }
        }
        
        if (data?.error) {
            console.log('Server error creating subscription:', data.error)
            return { success: false, error: data.error }
        }
        
        console.log('Subscription checkout session created:', data?.sessionId)
        console.log('Checkout URL:', data?.url)
        
        return {
            success: true,
            sessionId: data?.sessionId,
            url: data?.url
        }
    } catch (error: any) {
        console.log('Exception creating subscription:', error)
        return { success: false, error: error?.message || 'Failed to create subscription' }
    }
}