import { View, Text, ScrollView, TouchableOpacity, StatusBar, RefreshControl, Image } from 'react-native'
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { Icon, ActivityIndicator } from 'react-native-paper'
import { useAuth } from '@/src/providers/AuthProvider'
import { supabase } from '@/src/lib/supabase'
import { useRouter } from 'expo-router'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import DateTimePicker from '@react-native-community/datetimepicker'

interface PaymentMethod {
    type: string
    brand: string | null
    last4: string | null
}

interface Payment {
    id: string
    amount: number
    currency: string
    status: string
    created: number
    description: string | null
    label: string
    paymentMethod: PaymentMethod | null
    amount_refunded?: number
}

interface GroupedPayments {
    title: string
    data: Payment[]
}

const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatAmount = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
    }).format(amount / 100)
}

const getMonthYear = (timestamp: number): string => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

const getStatusDisplay = (status: string) => {
    switch (status) {
        case 'succeeded':
            return { badge: 'COMPLETED', badgeColor: '#16A34A', badgeBg: '#DCFCE7', icon: 'check-circle' }
        case 'requires_payment_method':
        case 'requires_action':
            return { badge: 'PENDING', badgeColor: '#0E519F', badgeBg: '#DBEAFE', icon: 'clock-outline' }
        case 'refunded':
            return { badge: 'REFUNDED', badgeColor: '#DC2626', badgeBg: '#FEE2E2', icon: 'cash-refund' }
        case 'partially_refunded':
            return { badge: 'PARTIAL REFUND', badgeColor: '#D97706', badgeBg: '#FEF3C7', icon: 'cash-refund' }
        case 'canceled':
            return { badge: 'CANCELED', badgeColor: '#6B7280', badgeBg: '#F3F4F6', icon: 'close-circle' }
        default:
            return { badge: 'FAILED', badgeColor: '#DC2626', badgeBg: '#FEE2E2', icon: 'alert-circle' }
    }
}

const getPaymentMethodDisplay = (pm: PaymentMethod | null): string => {
    if (!pm) return 'Card'
    if (pm.type === 'apple_pay' || (pm.brand && pm.type === 'card' && pm.brand === 'apple_pay')) {
        return 'Apple Pay'
    }
    if (pm.brand && pm.last4) {
        const brandName = pm.brand.charAt(0).toUpperCase() + pm.brand.slice(1)
        return `${brandName} ••••${pm.last4}`
    }
    return 'Card'
}

const getPaymentMethodIcon = (pm: PaymentMethod | null): string => {
    if (!pm) return 'credit-card-outline'
    if (pm.type === 'apple_pay') return 'apple'
    return 'credit-card-outline'
}

const groupPaymentsByMonth = (payments: Payment[]): GroupedPayments[] => {
    const groups: Record<string, Payment[]> = {}
    
    for (const payment of payments) {
        const key = getMonthYear(payment.created)
        if (!groups[key]) groups[key] = []
        groups[key].push(payment)
    }
    
    return Object.entries(groups).map(([title, data]) => ({ title, data }))
}

const EmptyState = () => (
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
                    backgroundColor: '#DBEAFE',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 24,
                }}>
                    <Icon source="receipt" size={48} color="#1d4681" />
                </View>
                
                <Text style={{
                    fontSize: 22,
                    fontWeight: '700',
                    color: '#111827',
                    textAlign: 'center',
                    marginBottom: 8,
                }}>
                    No Payments Yet
                </Text>
                
                <Text style={{
                    fontSize: 15,
                    color: '#6B7280',
                    textAlign: 'center',
                    lineHeight: 22,
                }}>
                    Your donation and payment history will appear here once you make your first transaction.
                </Text>
            </View>
        </Animated.View>
    </ScrollView>
)

const PaymentCard = ({ payment, index }: { payment: Payment; index: number }) => {
    const statusDisplay = getStatusDisplay(payment.status)
    
    return (
        <Animated.View entering={FadeInDown.delay(index * 40).duration(250)}>
            <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                marginBottom: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
                borderWidth: 1,
                borderColor: '#F0F0F0',
                overflow: 'hidden',
            }}>
                <View style={{ padding: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <View style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                backgroundColor: statusDisplay.badgeBg,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 12,
                            }}>
                                <Icon source={statusDisplay.icon} size={22} color={statusDisplay.badgeColor} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: payment.status === 'succeeded' ? '#1d4681' : '#111827' }}>
                                    {formatAmount(payment.amount, payment.currency)}
                                </Text>
                                <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginTop: 2 }}>
                                    {payment.label || 'Donation'}
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                                    <Icon source={getPaymentMethodIcon(payment.paymentMethod)} size={14} color="#9CA3AF" />
                                    <Text style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 4 }}>
                                        {getPaymentMethodDisplay(payment.paymentMethod)}
                                    </Text>
                                </View>
                                {(payment.amount_refunded ?? 0) > 0 && (
                                    <Text style={{ fontSize: 12, color: '#DC2626', fontWeight: '500', marginTop: 3 }}>
                                        Refunded {formatAmount(payment.amount_refunded!, payment.currency)}
                                    </Text>
                                )}
                            </View>
                        </View>
                        
                        <View style={{ alignItems: 'flex-end' }}>
                            <View style={{
                                backgroundColor: statusDisplay.badgeBg,
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderRadius: 8,
                                marginBottom: 4,
                            }}>
                                <Text style={{
                                    fontSize: 10,
                                    fontWeight: '700',
                                    color: statusDisplay.badgeColor,
                                    letterSpacing: 0.5,
                                }}>
                                    {statusDisplay.badge}
                                </Text>
                            </View>
                            <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
                                {formatDate(payment.created)}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </Animated.View>
    )
}

const PaymentHistory = () => {
    const { session } = useAuth()
    const router = useRouter()
    const insets = useSafeAreaInsets()
    
    const [payments, setPayments] = useState<Payment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [showIncomplete, setShowIncomplete] = useState(false)
    
    const fetchPayments = async () => {
        if (!session?.user?.id) {
            setIsLoading(false)
            return
        }
        
        try {
            const { data, error } = await supabase.functions.invoke('get-payment-history')
            
            if (error) {
                console.log('Error fetching payment history:', error)
                return
            }
            
            if (data?.payments) {
                setPayments(data.payments)
            }
        } catch (err) {
            console.log('Error:', err)
        } finally {
            setIsLoading(false)
        }
    }
    
    useEffect(() => {
        fetchPayments()
    }, [session?.user?.id])
    
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (isLoading) setIsLoading(false)
        }, 8000)
        return () => clearTimeout(timeout)
    }, [])
    
    const onRefresh = useCallback(() => {
        setRefreshing(true)
        setSelectedDate(null)
        fetchPayments().finally(() => setRefreshing(false))
    }, [])
    
    const filteredPayments = useMemo(() => {
        if (!selectedDate) return payments
        return payments.filter(p => {
            const date = new Date(p.created * 1000)
            return date.getFullYear() === selectedDate.getFullYear() &&
                date.getMonth() === selectedDate.getMonth() &&
                date.getDate() === selectedDate.getDate()
        })
    }, [payments, selectedDate])
    
    const completedPayments = useMemo(() => filteredPayments.filter(p => p.status === 'succeeded'), [filteredPayments])
    const incompletePayments = useMemo(() => filteredPayments.filter(p => p.status !== 'succeeded'), [filteredPayments])
    
    const donationPayments = useMemo(() => completedPayments.filter(p => (p.label || 'Donation') === 'Donation'), [completedPayments])
    const businessAdPayments = useMemo(() => completedPayments.filter(p => p.label && p.label !== 'Donation'), [completedPayments])
    
    const groupedDonations = groupPaymentsByMonth(donationPayments)
    const groupedBusinessAds = groupPaymentsByMonth(businessAdPayments)
    
    const totalDonated = donationPayments.reduce((sum, p) => sum + p.amount, 0)
    
    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#1d4681" />
            </View>
        )
    }
    
    return (
        <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
            <StatusBar barStyle="dark-content" />
            
            {payments.length === 0 ? (
                <EmptyState />
            ) : (
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#1d4681"
                        />
                    }
                >
                    {/* Summary Card */}
                    <Animated.View entering={FadeIn.duration(300)}>
                        <LinearGradient
                            colors={['#1d4681', '#3183bf']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                                borderRadius: 20,
                                padding: 24,
                                marginBottom: 24,
                                shadowColor: '#1d4681',
                                shadowOffset: { width: 0, height: 6 },
                                shadowOpacity: 0.3,
                                shadowRadius: 12,
                                elevation: 6,
                                flexDirection: 'row',
                                alignItems: 'center',
                                overflow: 'hidden',
                            }}
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.65)', marginBottom: 4, letterSpacing: 0.5 }}>
                                    TOTAL DONATED
                                </Text>
                                <Text style={{ fontSize: 34, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 }}>
                                    {formatAmount(totalDonated, 'usd')}
                                </Text>
                                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>
                                    {donationPayments.length} donation{donationPayments.length !== 1 ? 's' : ''}
                                    {selectedDate ? ` on ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                                </Text>
                            </View>
                            <Image
                                source={require('@/assets/images/glowingTree.png')}
                                style={{
                                    width: 280,
                                    height: 280,
                                    resizeMode: 'contain',
                                    opacity: 0.85,
                                    position: 'absolute',
                                    right: -50,
                                }}
                            />
                        </LinearGradient>
                    </Animated.View>
                    
                    {/* Date Filter */}
                    <View style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 14,
                        padding: 12,
                        marginBottom: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderWidth: 1,
                        borderColor: '#F0F0F0',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.04,
                        shadowRadius: 4,
                        elevation: 1,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <Icon source="calendar-filter" size={20} color="#1d4681" />
                            <View style={{ marginLeft: 10 }}>
                                <Text style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    {selectedDate ? 'Filtered to' : 'Filter by date'}
                                </Text>
                                <Text style={{ fontSize: 15, fontWeight: '600', color: '#1F2937' }}>
                                    {selectedDate 
                                        ? selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                                        : 'All Payments'
                                    }
                                </Text>
                            </View>
                        </View>
                        
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            {selectedDate && (
                                <TouchableOpacity
                                    onPress={() => setSelectedDate(null)}
                                    activeOpacity={0.7}
                                    style={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: 15,
                                        backgroundColor: '#FEE2E2',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Icon source="close" size={16} color="#DC2626" />
                                </TouchableOpacity>
                            )}
                            <DateTimePicker
                                value={selectedDate || new Date()}
                                mode="date"
                                display="compact"
                                maximumDate={new Date()}
                                accentColor="#1d4681"
                                onChange={(_event, date) => {
                                    if (date) {
                                        setSelectedDate(date)
                                    }
                                }}
                            />
                        </View>
                    </View>
                    
                    {/* Donations */}
                    {donationPayments.length > 0 && (
                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1d4681', marginBottom: 12, marginLeft: 4 }}>
                            Donations
                        </Text>
                    )}
                    {groupedDonations.map((group) => (
                        <View key={`donation-${group.title}`} style={{ marginBottom: 16 }}>
                            <Text style={{
                                fontSize: 13,
                                fontWeight: '600',
                                color: '#6B7280',
                                letterSpacing: 0.5,
                                textTransform: 'uppercase',
                                marginBottom: 10,
                                marginLeft: 4,
                            }}>
                                {group.title}
                            </Text>
                            {group.data.map((payment, index) => (
                                <PaymentCard key={payment.id} payment={payment} index={index} />
                            ))}
                        </View>
                    ))}
                    
                    {/* Business Ads */}
                    {businessAdPayments.length > 0 && (
                        <>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1d4681', marginBottom: 12, marginLeft: 4, marginTop: 8 }}>
                                Business Ads
                            </Text>
                            {groupedBusinessAds.map((group) => (
                                <View key={`business-${group.title}`} style={{ marginBottom: 16 }}>
                                    <Text style={{
                                        fontSize: 13,
                                        fontWeight: '600',
                                        color: '#6B7280',
                                        letterSpacing: 0.5,
                                        textTransform: 'uppercase',
                                        marginBottom: 10,
                                        marginLeft: 4,
                                    }}>
                                        {group.title}
                                    </Text>
                                    {group.data.map((payment, index) => (
                                        <PaymentCard key={payment.id} payment={payment} index={index} />
                                    ))}
                                </View>
                            ))}
                        </>
                    )}
                    
                    {/* Incomplete Payments Section */}
                    {incompletePayments.length > 0 && (
                        <View style={{ marginTop: 8 }}>
                            <TouchableOpacity
                                onPress={() => setShowIncomplete(!showIncomplete)}
                                activeOpacity={0.7}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 14,
                                    padding: 14,
                                    marginBottom: 10,
                                    borderWidth: 1,
                                    borderColor: '#E5E7EB',
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 8,
                                        backgroundColor: '#FEE2E2',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginRight: 10,
                                    }}>
                                        <Icon source="alert-circle-outline" size={18} color="#DC2626" />
                                    </View>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
                                        Incomplete Payments
                                    </Text>
                                    <View style={{
                                        backgroundColor: '#FEE2E2',
                                        borderRadius: 10,
                                        paddingHorizontal: 8,
                                        paddingVertical: 2,
                                        marginLeft: 8,
                                    }}>
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#DC2626' }}>
                                            {incompletePayments.length}
                                        </Text>
                                    </View>
                                </View>
                                <Icon 
                                    source={showIncomplete ? 'chevron-up' : 'chevron-down'} 
                                    size={20} 
                                    color="#9CA3AF" 
                                />
                            </TouchableOpacity>
                            
                            {showIncomplete && incompletePayments.map((payment, index) => (
                                <PaymentCard key={payment.id} payment={payment} index={index} />
                            ))}
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    )
}

export default PaymentHistory
