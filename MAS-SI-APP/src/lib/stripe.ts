import { Alert } from "react-native"
import { supabase } from "./supabase"
import { initPaymentSheet, presentPaymentSheet } from "@stripe/stripe-react-native"
import { useStripe } from "@stripe/stripe-react-native"
const fetchPaymentSheetParam = async ( amount : number ) => {
    const { data, error } = await supabase.functions.invoke('payment-sheet', { body : { amount :  amount } })
    if( data ){
        console.log(data)
        return data
    }
   if( error ){
    Alert.alert(error.message)
   }
   return {}    
}       

export const initializePaymentSheet = async ( amount : number ) => {
    console.log('Payment Sheet Amount', amount)
    const { paymentIntent, publishableKey, customer, ephemeralKey } = await fetchPaymentSheetParam(amount)
    console.log(paymentIntent, publishableKey )
    if( !paymentIntent || !publishableKey ) return

    const { error } = await initPaymentSheet({
        merchantDisplayName : 'MAS Staten Island',
        paymentIntentClientSecret : paymentIntent,
        customerId : customer,
        customerEphemeralKeySecret : ephemeralKey,
        defaultBillingDetails : {
            name : 'Jane Doe'
        },
    })
    return paymentIntent
}

export const openPaymentSheet = async () => {
    const { error } = await presentPaymentSheet()
    if( error ){
        console.log(error)
        return false
    }
    console.log('Payment Went Through')
    return true
}