import { View, Text, Pressable, ActivityIndicator, Modal, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import { BlurView } from 'expo-blur'
import { Icon } from 'react-native-paper'
import { verifySubscriptionSession } from '@/src/lib/StripePaySheet'
import { savePendingBusinessAdSubmission } from '@/src/lib/businessAdsSubmission'

type Status = 'loading' | 'success' | 'error'

type PaymentSuccessPopupProps = {
    sessionId: string | null
    onClose: () => void
    onGoToStatus: () => void
}

export default function PaymentSuccessPopup({ sessionId, onClose, onGoToStatus }: PaymentSuccessPopupProps) {
    const [status, setStatus] = useState<Status>('loading')
    const [errorMessage, setErrorMessage] = useState<string>('')

    useEffect(() => {
        const processPayment = async () => {
            console.log('PaymentSuccessPopup: Starting processPayment with sessionId:', sessionId)
            if (!sessionId) {
                console.log('PaymentSuccessPopup: No session ID')
                setStatus('error')
                setErrorMessage('No session ID found. Please try again.')
                return
            }

            try {
                const verificationResult = await verifySubscriptionSession(sessionId)
                console.log('PaymentSuccessPopup: Verification result:', JSON.stringify(verificationResult))
                if (!verificationResult.success) {
                    setStatus('error')
                    setErrorMessage(verificationResult.error || 'Payment verification failed.')
                    return
                }

                console.log('PaymentSuccessPopup: Saving pending submission...')
                const saved = await savePendingBusinessAdSubmission()
                console.log('PaymentSuccessPopup: Save result:', saved)
                if (!saved) {
                    setStatus('error')
                    setErrorMessage('Payment was successful but we could not save your submission. Please contact support.')
                    return
                }

                console.log('PaymentSuccessPopup: Setting status to success')
                setStatus('success')
            } catch (error) {
                console.log('PaymentSuccessPopup: Error:', error)
                setStatus('error')
                setErrorMessage('Something went wrong. Please try again.')
            }
        }

        processPayment()
    }, [sessionId])

    return (
        <Modal
            visible
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                {/* Liquid Glass Alert Container */}
                <View style={styles.alertWrapper}>
                    <BlurView intensity={80} tint="light" style={styles.blurContainer}>
                        {/* Content */}
                        <View style={styles.contentContainer}>
                            {status === 'loading' && (
                                <>
                                    <ActivityIndicator size="small" color="#007AFF" style={{ marginBottom: 16 }} />
                                    <Text style={styles.title}>Processing Payment</Text>
                                    <Text style={styles.message}>Please wait while we verify your payment.</Text>
                                </>
                            )}

                            {status === 'success' && (
                                <>
                                    <View style={styles.successIcon}>
                                        <Icon source="check" size={28} color="#34C759" />
                                    </View>
                                    <Text style={styles.title}>Application Complete!</Text>
                                    <Text style={styles.message}>Your business ad has been submitted for review.</Text>
                                </>
                            )}

                            {status === 'error' && (
                                <>
                                    <View style={styles.errorIcon}>
                                        <Icon source="close" size={28} color="#FF3B30" />
                                    </View>
                                    <Text style={styles.title}>Something Went Wrong</Text>
                                    <Text style={styles.message}>{errorMessage}</Text>
                                </>
                            )}
                        </View>

                        {/* Liquid Glass Buttons */}
                        {status !== 'loading' && (
                            <View style={styles.buttonContainer}>
                                {status === 'success' && (
                                    <>
                                        <Pressable
                                            onPress={onGoToStatus}
                                            style={({ pressed }) => [
                                                styles.liquidButton,
                                                styles.primaryButton,
                                                pressed && styles.buttonPressed
                                            ]}
                                        >
                                            <BlurView intensity={40} tint="light" style={styles.buttonBlur}>
                                                <Text style={styles.primaryButtonText}>View Application Status</Text>
                                            </BlurView>
                                        </Pressable>
                                        <Pressable
                                            onPress={onClose}
                                            style={({ pressed }) => [
                                                styles.liquidButton,
                                                styles.secondaryButton,
                                                pressed && styles.buttonPressed
                                            ]}
                                        >
                                            <Text style={styles.secondaryButtonText}>Close</Text>
                                        </Pressable>
                                    </>
                                )}

                                {status === 'error' && (
                                    <Pressable
                                        onPress={onClose}
                                        style={({ pressed }) => [
                                            styles.liquidButton,
                                            styles.primaryButton,
                                            pressed && styles.buttonPressed
                                        ]}
                                    >
                                        <BlurView intensity={40} tint="light" style={styles.buttonBlur}>
                                            <Text style={styles.primaryButtonText}>OK</Text>
                                        </BlurView>
                                    </Pressable>
                                )}
                            </View>
                        )}
                    </BlurView>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertWrapper: {
        width: 280,
        borderRadius: 20,
        overflow: 'hidden',
        // Liquid glass shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
    },
    blurContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 20,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.6)',
    },
    contentContainer: {
        paddingTop: 24,
        paddingHorizontal: 20,
        paddingBottom: 20,
        alignItems: 'center',
    },
    successIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(52, 199, 89, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(52, 199, 89, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    errorIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(255, 59, 48, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255, 59, 48, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1C1C1E',
        textAlign: 'center',
        marginBottom: 6,
        letterSpacing: -0.3,
    },
    message: {
        fontSize: 13,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 18,
        letterSpacing: -0.1,
    },
    buttonContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 10,
    },
    liquidButton: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    primaryButton: {
        backgroundColor: 'rgba(0, 122, 255, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(0, 122, 255, 0.2)',
    },
    secondaryButton: {
        backgroundColor: 'rgba(142, 142, 147, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(142, 142, 147, 0.2)',
        paddingVertical: 12,
        alignItems: 'center',
    },
    buttonBlur: {
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
        letterSpacing: -0.2,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#8E8E93',
        letterSpacing: -0.2,
    },
})
