import { View, Text, ScrollView, TouchableOpacity, StatusBar, RefreshControl, Alert } from 'react-native'
import React, { useEffect, useState, useCallback } from 'react'
import { Icon, ActivityIndicator } from 'react-native-paper'
import { useAuth } from '@/src/providers/AuthProvider'
import { supabase } from '@/src/lib/supabase'
import { useRouter } from 'expo-router'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { format, fromUnixTime } from 'date-fns'

// Subscription type from our edge function
interface Subscription {
    id: string
    status: string
    currentPeriodStart: number
    currentPeriodEnd: number
    cancelAtPeriodEnd: boolean
    canceledAt: number | null
    endedAt: number | null
    created: number
    productName: string
    productDescription: string | null
    priceAmount: number
    priceCurrency: string
    priceInterval: string
    priceIntervalCount: number
}

// Get status display info
const getStatusDisplay = (subscription: Subscription) => {
    if (subscription.cancelAtPeriodEnd && subscription.status === 'active') {
        return {
            badge: 'CANCELING',
            badgeColor: '#D97706',
            badgeBg: '#FEF3C7',
            title: 'Cancels at period end',
            subtitle: `Access until ${format(fromUnixTime(subscription.currentPeriodEnd), 'MMM d, yyyy')}`
        }
    }
    
    switch (subscription.status) {
        case 'active':
            return {
                badge: 'ACTIVE',
                badgeColor: '#16A34A',
                badgeBg: '#DCFCE7',
                title: 'Subscription active',
                subtitle: `Renews ${format(fromUnixTime(subscription.currentPeriodEnd), 'MMM d, yyyy')}`
            }
        case 'canceled':
            return {
                badge: 'CANCELED',
                badgeColor: '#6B7280',
                badgeBg: '#F3F4F6',
                title: 'Subscription canceled',
                subtitle: subscription.endedAt 
                    ? `Ended ${format(fromUnixTime(subscription.endedAt), 'MMM d, yyyy')}`
                    : 'No longer active'
            }
        case 'past_due':
            return {
                badge: 'PAST DUE',
                badgeColor: '#DC2626',
                badgeBg: '#FEE2E2',
                title: 'Payment failed',
                subtitle: 'Please update your payment method'
            }
        case 'unpaid':
            return {
                badge: 'UNPAID',
                badgeColor: '#DC2626',
                badgeBg: '#FEE2E2',
                title: 'Payment required',
                subtitle: 'Subscription suspended'
            }
        case 'trialing':
            return {
                badge: 'TRIAL',
                badgeColor: '#2563EB',
                badgeBg: '#DBEAFE',
                title: 'Free trial',
                subtitle: `Trial ends ${format(fromUnixTime(subscription.currentPeriodEnd), 'MMM d, yyyy')}`
            }
        default:
            return {
                badge: subscription.status.toUpperCase(),
                badgeColor: '#6B7280',
                badgeBg: '#F3F4F6',
                title: 'Subscription',
                subtitle: ''
            }
    }
}

// Format price for display
const formatPrice = (amount: number, currency: string, interval: string, intervalCount: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
    }).format(amount / 100)
    
    const intervalText = intervalCount === 1 
        ? interval 
        : `${intervalCount} ${interval}s`
    
    return `${formatted}/${intervalText}`
}

// Empty state component
const EmptyState = ({ onStartApplication }: { onStartApplication: () => void }) => (
    <ScrollView
        contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'flex-start',
            alignItems: 'center',
            paddingHorizontal: 24,
            paddingTop: 60,
            paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
    >
        <Animated.View entering={FadeIn.duration(400)} style={{ width: '100%' }}>
            <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 24,
                padding: 32,
                alignItems: 'center',
                width: '100%',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 4,
            }}>
                <View style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: '#E0F2FE',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 24,
                }}>
                    <Icon source="credit-card-outline" size={48} color="#0EA5E9" />
                </View>
                
                <Text style={{
                    fontSize: 22,
                    fontWeight: '700',
                    color: '#111827',
                    textAlign: 'center',
                    marginBottom: 8,
                }}>
                    No Subscriptions
                </Text>
                
                <Text style={{
                    fontSize: 15,
                    color: '#6B7280',
                    textAlign: 'center',
                    lineHeight: 22,
                    marginBottom: 28,
                }}>
                    You don't have any active subscriptions. Start a business ad application to subscribe.
                </Text>
                
                <TouchableOpacity
                    onPress={onStartApplication}
                    activeOpacity={0.8}
                    style={{
                        backgroundColor: '#111827',
                        borderRadius: 50,
                        paddingVertical: 16,
                        paddingHorizontal: 28,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        marginTop: 4,
                    }}
                >
                    <Icon source="plus" size={20} color="#FFFFFF" />
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginLeft: 8 }}>
                        Start Application
                    </Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    </ScrollView>
)

// Subscription card component
const SubscriptionCard = ({
    subscription,
    index,
    onCancel,
    canceling,
}: {
    subscription: Subscription
    index: number
    onCancel: (sub: Subscription) => void
    canceling: boolean
}) => {
    const statusDisplay = getStatusDisplay(subscription)
    const canCancel = subscription.status === 'active' && !subscription.cancelAtPeriodEnd
    
    return (
        <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
            <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                marginBottom: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 3,
                borderWidth: 1,
                borderColor: '#F0F0F0',
                overflow: 'hidden',
            }}>
                {/* Header with status */}
                <View style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: '#F3F4F6',
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 }}>
                                {subscription.productName}
                            </Text>
                            <Text style={{ fontSize: 15, color: '#6B7280' }}>
                                {formatPrice(
                                    subscription.priceAmount,
                                    subscription.priceCurrency,
                                    subscription.priceInterval,
                                    subscription.priceIntervalCount
                                )}
                            </Text>
                        </View>
                        <View style={{
                            backgroundColor: statusDisplay.badgeBg,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 16,
                        }}>
                            <Text style={{
                                fontSize: 12,
                                fontWeight: '700',
                                color: statusDisplay.badgeColor,
                                letterSpacing: 0.5,
                            }}>
                                {statusDisplay.badge}
                            </Text>
                        </View>
                    </View>
                </View>
                
                {/* Details */}
                <View style={{ padding: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Icon source="calendar" size={18} color="#6B7280" />
                        <Text style={{ fontSize: 14, color: '#6B7280', marginLeft: 8 }}>
                            Started {format(fromUnixTime(subscription.created), 'MMM d, yyyy')}
                        </Text>
                    </View>
                    
                    {subscription.status === 'active' && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <Icon source="refresh" size={18} color="#6B7280" />
                            <Text style={{ fontSize: 14, color: '#6B7280', marginLeft: 8 }}>
                                {subscription.cancelAtPeriodEnd 
                                    ? `Ends ${format(fromUnixTime(subscription.currentPeriodEnd), 'MMM d, yyyy')}`
                                    : `Next billing ${format(fromUnixTime(subscription.currentPeriodEnd), 'MMM d, yyyy')}`
                                }
                            </Text>
                        </View>
                    )}
                    
                    {subscription.canceledAt && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <Icon source="close-circle" size={18} color="#DC2626" />
                            <Text style={{ fontSize: 14, color: '#DC2626', marginLeft: 8 }}>
                                Canceled {format(fromUnixTime(subscription.canceledAt), 'MMM d, yyyy')}
                            </Text>
                        </View>
                    )}
                    
                    {/* Cancel button */}
                    {canCancel && (
                        <TouchableOpacity
                            onPress={() => onCancel(subscription)}
                            disabled={canceling}
                            activeOpacity={0.7}
                            style={{
                                marginTop: 8,
                                paddingVertical: 12,
                                paddingHorizontal: 16,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: '#E5E7EB',
                                backgroundColor: '#FFFFFF',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Text style={{ fontSize: 15, fontWeight: '600', color: '#6B7280' }}>
                                {canceling ? 'Canceling...' : 'Cancel Subscription'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Animated.View>
    )
}

const BusinessSubscriptions = () => {
    const { session } = useAuth()
    const router = useRouter()
    const insets = useSafeAreaInsets()
    
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [cancelingId, setCancelingId] = useState<string | null>(null)
    
    const fetchSubscriptions = async () => {
        if (!session?.user?.id) {
            setIsLoading(false)
            return
        }
        
        try {
            const { data, error } = await supabase.functions.invoke('get-user-subscriptions')
            
            if (error) {
                console.log('Error fetching subscriptions:', error)
                return
            }
            
            if (data?.subscriptions) {
                setSubscriptions(data.subscriptions)
            }
        } catch (err) {
            console.log('Error:', err)
        } finally {
            setIsLoading(false)
        }
    }
    
    useEffect(() => {
        fetchSubscriptions()
    }, [session?.user?.id])
    
    // Safety timeout
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (isLoading) setIsLoading(false)
        }, 5000)
        return () => clearTimeout(timeout)
    }, [])
    
    const onRefresh = useCallback(() => {
        setRefreshing(true)
        fetchSubscriptions().finally(() => setRefreshing(false))
    }, [])
    
    const handleCancelSubscription = async (subscription: Subscription) => {
        Alert.alert(
            'Cancel Subscription',
            'Are you sure you want to cancel? You will still have access until the end of your current billing period.',
            [
                { text: 'Keep Subscription', style: 'cancel' },
                {
                    text: 'Cancel Subscription',
                    style: 'destructive',
                    onPress: async () => {
                        setCancelingId(subscription.id)
                        try {
                            const { data, error } = await supabase.functions.invoke('cancel-subscription', {
                                body: { subscriptionId: subscription.id, cancelImmediately: false }
                            })
                            
                            if (error) {
                                Alert.alert('Error', 'Failed to cancel subscription. Please try again.')
                                return
                            }
                            
                            if (data?.success) {
                                Alert.alert('Subscription Canceled', 'Your subscription will end at the end of your current billing period.')
                                fetchSubscriptions()
                            }
                        } catch (err) {
                            Alert.alert('Error', 'Something went wrong. Please try again.')
                        } finally {
                            setCancelingId(null)
                        }
                    }
                }
            ]
        )
    }
    
    const handleStartApplication = () => {
        router.replace('/more/BusinessAds')
    }
    
    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#111827" />
            </View>
        )
    }
    
    return (
        <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
            <StatusBar barStyle="dark-content" />
            
            {subscriptions.length === 0 ? (
                <EmptyState onStartApplication={handleStartApplication} />
            ) : (
                <ScrollView
                    style={{ flex: 1, backgroundColor: '#F8F9FA' }}
                    contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#111827"
                        />
                    }
                >
                    {/* Header */}
                    <View style={{ marginBottom: 20 }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280' }}>
                            {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}
                        </Text>
                    </View>
                    
                    {/* Subscriptions list */}
                    {subscriptions.map((subscription, index) => (
                        <SubscriptionCard
                            key={subscription.id}
                            subscription={subscription}
                            index={index}
                            onCancel={handleCancelSubscription}
                            canceling={cancelingId === subscription.id}
                        />
                    ))}
                </ScrollView>
            )}
        </View>
    )
}

export default BusinessSubscriptions
