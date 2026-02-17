import { View, Text, StatusBar, Alert } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { ActivityIndicator } from 'react-native-paper'
import Animated, { 
    FadeIn, 
    FadeInDown,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { verifySubscriptionSession } from '@/src/lib/StripePaySheet'
import { savePendingBusinessAdSubmission } from '@/src/lib/businessAdsSubmission'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Ionicons } from '@expo/vector-icons'

const PENDING_CHECKOUT_SESSION_KEY = '@BusinessAds/pending_checkout_session_id'

type ProcessingState = 'saving' | 'success' | 'error'

const PaymentProcessing = () => {
    const { sessionId } = useLocalSearchParams<{ sessionId: string }>()
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const [state, setState] = useState<ProcessingState>('saving')
    const [errorMessage, setErrorMessage] = useState<string>('')
    const hasProcessed = useRef(false)
    
    // Animation values
    const checkmarkScale = useSharedValue(0)
    const checkmarkOpacity = useSharedValue(0)
    
    const checkmarkAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: checkmarkScale.value }],
        opacity: checkmarkOpacity.value,
    }))

    const showSuccessAlert = () => {
        Alert.alert(
            'Application Submitted!',
            'Your card has been saved and your application is under review. You will only be charged once your ad is approved.',
            [{
                text: 'View Status',
                onPress: () => {
                    router.replace('/more/BusinessStatus')
                }
            }]
        )
    }

    const animateSuccess = () => {
        // Animate the checkmark
        checkmarkOpacity.value = 1
        checkmarkScale.value = withSequence(
            withSpring(1.2, { damping: 8, stiffness: 200 }),
            withSpring(1, { damping: 12, stiffness: 200 })
        )
        // Show alert after animation completes
        setTimeout(() => {
            showSuccessAlert()
        }, 800)
    }

    useEffect(() => {
        if (hasProcessed.current || !sessionId) return
        hasProcessed.current = true
        
        const processPayment = async () => {
            try {
                // Save the submission first — this is the critical step
                console.log('PaymentProcessing: Saving submission...')
                setState('saving')
                
                const saved = await savePendingBusinessAdSubmission()
                console.log('PaymentProcessing: Save result:', saved)
                
                if (!saved) {
                    setState('error')
                    setErrorMessage('We could not save your submission. Please try again or contact support.')
                    Alert.alert(
                        'Submission Error',
                        'We could not save your submission. Please try again or contact support.',
                        [{ text: 'OK', onPress: () => router.replace('/more/BusinessAds') }]
                    )
                    return
                }
                
                // Clear the pending session
                await AsyncStorage.removeItem(PENDING_CHECKOUT_SESSION_KEY)
                
                // Fire-and-forget: verify session in background to set default payment method
                verifySubscriptionSession(sessionId).then((result) => {
                    console.log('PaymentProcessing: Background verify result:', JSON.stringify(result))
                }).catch((err) => {
                    console.log('PaymentProcessing: Background verify error (non-blocking):', err)
                })
                
                // Success!
                console.log('PaymentProcessing: Success!')
                setState('success')
                animateSuccess()
                
            } catch (error) {
                console.log('PaymentProcessing: Error:', error)
                setState('error')
                setErrorMessage('Something went wrong. Please try again.')
                Alert.alert(
                    'Error',
                    'Something went wrong. Please try again.',
                    [{ text: 'OK', onPress: () => router.replace('/more/BusinessAds') }]
                )
            }
        }
        
        processPayment()
    }, [sessionId])

    const getStatusText = () => {
        switch (state) {
            case 'saving':
                return 'Saving your application...'
            case 'success':
                return 'Application submitted!'
            case 'error':
                return 'Something went wrong'
            default:
                return 'Processing...'
        }
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                    animation: 'fade',
                    gestureEnabled: false,
                }}
            />
            <View style={{ 
                flex: 1, 
                backgroundColor: '#FFFFFF',
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
            }}>
                <StatusBar barStyle="dark-content" />
                
                <View style={{ 
                    flex: 1, 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    paddingHorizontal: 32,
                }}>
                    {/* Icon Container */}
                    <View style={{
                        width: 120,
                        height: 120,
                        borderRadius: 60,
                        backgroundColor: state === 'success' ? '#DCFCE7' : state === 'error' ? '#FEE2E2' : '#F3F4F6',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 32,
                    }}>
                        {state === 'success' ? (
                            <Animated.View style={checkmarkAnimatedStyle}>
                                <Ionicons name="checkmark-circle" size={64} color="#16A34A" />
                            </Animated.View>
                        ) : state === 'error' ? (
                            <Animated.View entering={FadeIn.duration(300)}>
                                <Ionicons name="close-circle" size={64} color="#DC2626" />
                            </Animated.View>
                        ) : (
                            <ActivityIndicator size="large" color="#111827" />
                        )}
                    </View>
                    
                    {/* Status Text */}
                    <Animated.Text 
                        entering={FadeInDown.duration(400)}
                        style={{
                            fontSize: 24,
                            fontWeight: '700',
                            color: '#111827',
                            textAlign: 'center',
                            marginBottom: 12,
                        }}
                    >
                        {getStatusText()}
                    </Animated.Text>
                    
                    {/* Subtitle */}
                    <Text style={{
                        fontSize: 16,
                        color: '#6B7280',
                        textAlign: 'center',
                        lineHeight: 24,
                    }}>
                        {state === 'saving' && 'Please wait while we submit your business ad application.'}
                        {state === 'success' && 'Your application is under review. You will only be charged after approval.'}
                        {state === 'error' && errorMessage}
                    </Text>
                    
                    {/* Processing Steps */}
                    {state === 'saving' && (
                        <View style={{ marginTop: 48, width: '100%' }}>
                            <ProcessingStep 
                                label="Saving application" 
                                isComplete={false} 
                                isActive={true}
                            />
                            <ProcessingStep 
                                label="All done!" 
                                isComplete={false} 
                                isActive={false}
                            />
                        </View>
                    )}
                </View>
            </View>
        </>
    )
}

// Processing step indicator component
const ProcessingStep = ({ 
    label, 
    isComplete, 
    isActive 
}: { 
    label: string
    isComplete: boolean
    isActive: boolean
}) => (
    <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    }}>
        <View style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: isComplete ? '#16A34A' : isActive ? '#111827' : '#E5E7EB',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
        }}>
            {isComplete ? (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            ) : isActive ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#9CA3AF' }} />
            )}
        </View>
        <Text style={{
            fontSize: 16,
            fontWeight: isActive ? '600' : '400',
            color: isComplete ? '#16A34A' : isActive ? '#111827' : '#9CA3AF',
        }}>
            {label}
        </Text>
    </View>
)

export default PaymentProcessing
