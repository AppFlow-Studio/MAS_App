import { View, Text, ScrollView, StatusBar, RefreshControl, Alert, Pressable, KeyboardAvoidingView, Platform, Image } from 'react-native'
import React, { useEffect, useState, useCallback } from 'react'
import { Icon, ActivityIndicator } from 'react-native-paper'
import { useAuth } from '@/src/providers/AuthProvider'
import { useRouter } from 'expo-router'
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fetchSavedPaymentMethods, deleteSavedPaymentMethod, getCardBrandDisplayName, SavedPaymentMethod } from '@/src/lib/StripePaySheet'
import { CardForm, useConfirmSetupIntent, CardFormView } from '@stripe/stripe-react-native'
import { supabase } from '@/src/lib/supabase'
import { FontAwesome } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import Toast from 'react-native-toast-message'

const getCardBrandIcon = (brand: string): { name: React.ComponentProps<typeof FontAwesome>['name']; color: string } => {
  switch (brand?.toLowerCase()) {
    case 'visa': return { name: 'cc-visa', color: '#1A1F71' }
    case 'mastercard': return { name: 'cc-mastercard', color: '#EB001B' }
    case 'amex': return { name: 'cc-amex', color: '#006FCF' }
    case 'discover': return { name: 'cc-discover', color: '#FF6000' }
    case 'jcb': return { name: 'cc-jcb', color: '#0B7CBE' }
    case 'diners': return { name: 'cc-diners-club', color: '#0079BE' }
    default: return { name: 'credit-card', color: '#6B7280' }
  }
}

const PaymentMethods = () => {
  const { session } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { confirmSetupIntent } = useConfirmSetupIntent()

  const [cards, setCards] = useState<SavedPaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showAddCard, setShowAddCard] = useState(false)
  const [cardComplete, setCardComplete] = useState(false)
  const [addingCard, setAddingCard] = useState(false)

  const loadCards = async () => {
    if (!session?.user?.id) {
      setIsLoading(false)
      return
    }

    try {
      const methods = await fetchSavedPaymentMethods()
      setCards(methods || [])
    } catch (err) {
      console.log('Error loading payment methods:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCards()
  }, [session?.user?.id])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) setIsLoading(false)
    }, 8000)
    return () => clearTimeout(timeout)
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadCards().finally(() => setRefreshing(false))
  }, [])

  const handleDelete = (card: SavedPaymentMethod) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    Alert.alert(
      'Remove Card',
      `Remove ${getCardBrandDisplayName(card.brand)} ending in ${card.last4}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(card.id)
            const result = await deleteSavedPaymentMethod(card.id)
            if (result.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
              setCards(prev => prev.filter(c => c.id !== card.id))
            } else {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
              Alert.alert('Error', result.error || 'Failed to remove card')
            }
            setDeletingId(null)
          },
        },
      ]
    )
  }

  const handleAddCard = async () => {
    if (!cardComplete || addingCard) return
    setAddingCard(true)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-setup-intent')

      if (fnError || data?.error) {
        throw new Error(data?.error || fnError?.message || 'Failed to create setup intent')
      }

      const { setupIntent: clientSecret } = data

      const { error, setupIntent } = await confirmSetupIntent(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: { billingDetails: {} },
      })

      if (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        Alert.alert('Error', error.message || 'Failed to save card')
        return
      }

      if (setupIntent) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        Toast.show({ type: 'success', text1: 'Card Added', text2: 'Your card has been saved successfully.' })
        setShowAddCard(false)
        setCardComplete(false)
        await loadCards()
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('Error', err?.message || 'Something went wrong')
    } finally {
      setAddingCard(false)
    }
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1d4681" />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
        <StatusBar barStyle="dark-content" />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1d4681"
            />
          }
        >
          {/* Secure Info */}
          <Animated.View entering={FadeIn.duration(300)}>
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Icon source="shield-check" size={18} color="#10B981" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#10B981', marginLeft: 6, letterSpacing: 0.3 }}>
                  SECURED BY
                </Text>
                <Image
                  source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Stripe_Logo%2C_revised_2016.svg/512px-Stripe_Logo%2C_revised_2016.svg.png' }}
                  style={{ width: 48, height: 20, marginLeft: 5, resizeMode: 'contain' }}
                />
              </View>
              <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 20 }}>
                Your payment methods are securely stored by Stripe. Card details are never stored on our servers.
              </Text>
            </View>
          </Animated.View>

          {/* Add Card Button */}
          {!showAddCard && (
            <Animated.View entering={FadeIn.duration(300)}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  setShowAddCard(true)
                }}
                style={{
                  backgroundColor: '#1d4681',
                  borderRadius: 14,
                  paddingVertical: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                  shadowColor: '#1d4681',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Icon source="plus" size={20} color="#FFFFFF" />
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginLeft: 8 }}>
                  Add New Card
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Add Card Form */}
          {showAddCard && (
            <Animated.View entering={FadeInUp.duration(300)}>
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 20,
                marginBottom: 24,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 3,
              }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 14 }}>
                  Enter Card Details
                </Text>

                <CardForm
                  autofocus={false}
                  placeholders={{ number: '4242 4242 4242 4242' }}
                  cardStyle={{
                    backgroundColor: '#F9FAFB',
                    textColor: '#1F2937',
                    placeholderColor: '#9CA3AF',
                    borderColor: '#E5E7EB',
                    borderWidth: 1,
                    borderRadius: 10,
                    fontSize: 15,
                  }}
                  style={{ width: '100%', height: 200 }}
                  onFormComplete={(details: CardFormView.Details) => {
                    setCardComplete(details.complete)
                  }}
                />

                <View style={{ flexDirection: 'row', marginTop: 12, gap: 10 }}>
                  <Pressable
                    onPress={() => {
                      setShowAddCard(false)
                      setCardComplete(false)
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: '#F3F4F6',
                      borderRadius: 12,
                      paddingVertical: 14,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#6B7280' }}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleAddCard}
                    disabled={!cardComplete || addingCard}
                    style={{
                      flex: 1,
                      backgroundColor: cardComplete ? '#1d4681' : '#D1D5DB',
                      borderRadius: 12,
                      paddingVertical: 14,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                    }}
                  >
                    {addingCard ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>Save Card</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Card List / Empty State */}
          {cards.length === 0 && !showAddCard ? (
            <Animated.View entering={FadeInDown.duration(400).delay(100)} style={{ alignItems: 'center', paddingTop: 40 }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: '#F3F4F6',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
              }}>
                <Icon source="credit-card-off-outline" size={36} color="#9CA3AF" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 6 }}>
                No Saved Cards
              </Text>
              <Text style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 }}>
                Tap "Add New Card" to save a payment method for quick future donations.
              </Text>
            </Animated.View>
          ) : cards.length > 0 ? (
            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#9CA3AF', letterSpacing: 1, marginBottom: 12, marginLeft: 4 }}>
                {cards.length} SAVED {cards.length === 1 ? 'CARD' : 'CARDS'}
              </Text>

              {cards.map((card, index) => (
                <Animated.View
                  key={card.id}
                  entering={FadeInDown.duration(300).delay(index * 80)}
                >
                  <View style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}>
                    <View style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: '#F0F4FF',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 14,
                    }}>
                      <FontAwesome
                        name={getCardBrandIcon(card.brand).name}
                        size={28}
                        color={getCardBrandIcon(card.brand).color}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
                        {getCardBrandDisplayName(card.brand)}
                      </Text>
                      <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>
                        •••• {card.last4}  ·  {String(card.expMonth).padStart(2, '0')}/{String(card.expYear).slice(-2)}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => handleDelete(card)}
                      disabled={deletingId === card.id}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: deletingId === card.id ? '#F3F4F6' : '#EF4444',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      {deletingId === card.id ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                      ) : (
                        <Icon source="trash-can-outline" size={20} color="#FFFFFF" />
                      )}
                    </Pressable>
                  </View>
                </Animated.View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  )
}

export default PaymentMethods
