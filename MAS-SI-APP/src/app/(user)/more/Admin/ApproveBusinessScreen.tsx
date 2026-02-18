import { View, Text, ScrollView, Image, Pressable, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { Icon, ActivityIndicator } from 'react-native-paper'
import Toast from 'react-native-toast-message'
import { format } from 'date-fns'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'

type InfoRowProps = {
  icon: string
  label: string
  value?: string
  numberOfLines?: number
}

const InfoRow = ({ icon, label, value, numberOfLines = 1 }: InfoRowProps) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 10,
    }}
  >
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 1,
      }}
    >
      <Icon source={icon} size={16} color="#6B7280" />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '500', marginBottom: 2 }}>
        {label}
      </Text>
      <Text
        style={{ fontSize: 15, color: '#1F2937', fontWeight: '500' }}
        numberOfLines={numberOfLines}
      >
        {value || '—'}
      </Text>
    </View>
  </View>
)

const SectionCard = ({
  icon,
  title,
  children,
  index = 0,
}: {
  icon: string
  title: string
  children: React.ReactNode
  index?: number
}) => (
  <Animated.View entering={FadeInDown.duration(300).delay(100 + index * 80)}>
    <View
      style={{
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: '#EEF0FE',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
          }}
        >
          <Icon source={icon} size={18} color="#6077F5" />
        </View>
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#1F2937' }}>{title}</Text>
      </View>
      {children}
    </View>
  </Animated.View>
)

const ApproveBusinessScreen = () => {
  const { submission } = useLocalSearchParams()
  const [submissionInfo, setSubmissionInfo] = useState<any>()
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  const getSubmission = async () => {
    const { data, error } = await supabase
      .from('business_ads_submissions')
      .select('*')
      .eq('submission_id', submission)
      .single()
    if (data) {
      setSubmissionInfo(data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    getSubmission()
  }, [])

  const onApprove = async () => {
    setIsProcessing(true)
    const { error } = await supabase
      .from('business_ads_submissions')
      .update({ status: 'APPROVED' })
      .eq('submission_id', submission)

    if (error) {
      setIsProcessing(false)
      Alert.alert('Error', 'Failed to approve this ad. Please try again.')
      return
    }

    // Trigger payment charge using saved card
    const { data, error: chargeError } = await supabase.functions.invoke('activate-business-subscription', {
      body: { submission_id: submission }
    })

    setIsProcessing(false)

    if (chargeError || !data?.success) {
      Alert.alert(
        'Approved but Payment Failed',
        'The ad was approved but the payment could not be processed. Check Stripe dashboard.',
      )
      router.back()
      return
    }

    Toast.show({
      type: 'success',
      text1: 'Ad Approved & Payment Processed',
      text2: 'The ad is now live and the user has been charged',
      position: 'top',
      topOffset: 50,
    })
    router.back()
  }

  const onReject = async () => {
    setIsProcessing(true)
    const { error } = await supabase
      .from('business_ads_submissions')
      .update({ status: 'REJECT' })
      .eq('submission_id', submission)
    setIsProcessing(false)

    if (error) {
      Alert.alert('Error', 'Failed to reject this ad. Please try again.')
      return
    }

    // Send rejection email (non-blocking)
    supabase.functions.invoke('resend', {
      body: {
        type: 'rejection',
        submission: {
          personal_full_name: submissionInfo.personal_full_name,
          personal_email: submissionInfo.personal_email,
          business_name: submissionInfo.business_name,
          business_flyer_duration: submissionInfo.business_flyer_duration,
          created_at: submissionInfo.created_at,
        }
      }
    }).catch(err => console.error('Failed to send rejection email:', err))

    Toast.show({
      type: 'success',
      text1: 'Ad Rejected',
      position: 'top',
      topOffset: 50,
    })
    router.back()
  }

  const confirmApprove = () => {
    Alert.alert(
      'Approve Ad',
      `Are you sure you want to approve "${submissionInfo?.business_name}"? It will become visible to all users.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Approve', onPress: onApprove },
      ]
    )
  }

  const confirmReject = () => {
    Alert.alert(
      'Reject Ad',
      `Are you sure you want to reject "${submissionInfo?.business_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reject', style: 'destructive', onPress: onReject },
      ]
    )
  }

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerBackTitleVisible: false,
            headerStyle: { backgroundColor: '#F9FAFB' },
            headerTintColor: '#4A5568',
            title: 'Review Submission',
            headerTitleStyle: { fontWeight: '600', color: '#1F2937' },
            headerShadowVisible: false,
          }}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
          <ActivityIndicator size="large" color="#6077F5" />
        </View>
      </>
    )
  }

  const submissionDate = submissionInfo?.created_at
    ? format(new Date(submissionInfo.created_at), 'PPPP')
    : ''

  return (
    <>
      <Stack.Screen
        options={{
          headerBackTitleVisible: false,
          headerStyle: { backgroundColor: '#F9FAFB' },
          headerTintColor: '#4A5568',
          title: 'Review Submission',
          headerTitleStyle: { fontWeight: '600', color: '#1F2937' },
          headerShadowVisible: false,
        }}
      />
      <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Status Banner */}
          <Animated.View entering={FadeIn.duration(300)}>
            <View
              style={{
                backgroundColor: '#FEF3C7',
                borderRadius: 12,
                padding: 14,
                marginBottom: 14,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#FDE68A',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}
              >
                <Icon source="clock-outline" size={18} color="#92400E" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#92400E' }}>
                  Pending Review
                </Text>
                <Text style={{ fontSize: 12, color: '#B45309', marginTop: 2 }}>
                  This submission is awaiting your approval
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Flyer Preview */}
          <SectionCard icon="image-outline" title="Flyer Preview" index={0}>
            <View
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                backgroundColor: '#F3F4F6',
              }}
            >
              <Image
                source={{ uri: submissionInfo?.business_flyer_img }}
                style={{
                  width: '100%',
                  height: 320,
                  borderRadius: 12,
                }}
                resizeMode="contain"
              />
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 12,
                backgroundColor: '#F9FAFB',
                borderRadius: 8,
                padding: 10,
              }}
            >
              <Icon source="timer-outline" size={16} color="#6B7280" />
              <Text style={{ fontSize: 13, color: '#6B7280', marginLeft: 6, fontWeight: '500' }}>
                Duration: {submissionInfo?.business_flyer_duration || '—'}
              </Text>
            </View>
          </SectionCard>

          {/* Personal Information */}
          <SectionCard icon="account-outline" title="Personal Information" index={1}>
            <InfoRow
              icon="account"
              label="Full Name"
              value={submissionInfo?.personal_full_name}
            />
            <View style={{ height: 1, backgroundColor: '#F3F4F6', marginLeft: 44 }} />
            <InfoRow
              icon="phone"
              label="Phone Number"
              value={submissionInfo?.personal_phone_number}
            />
            <View style={{ height: 1, backgroundColor: '#F3F4F6', marginLeft: 44 }} />
            <InfoRow
              icon="email-outline"
              label="Email"
              value={submissionInfo?.personal_email}
              numberOfLines={2}
            />
          </SectionCard>

          {/* Business Information */}
          <SectionCard icon="domain" title="Business Information" index={2}>
            <InfoRow
              icon="store"
              label="Business Name"
              value={submissionInfo?.business_name}
            />
            <View style={{ height: 1, backgroundColor: '#F3F4F6', marginLeft: 44 }} />
            <InfoRow
              icon="map-marker-outline"
              label="Address"
              value={submissionInfo?.business_address}
              numberOfLines={2}
            />
            <View style={{ height: 1, backgroundColor: '#F3F4F6', marginLeft: 44 }} />
            <InfoRow
              icon="phone-outline"
              label="Business Phone"
              value={submissionInfo?.business_phone_number}
            />
            <View style={{ height: 1, backgroundColor: '#F3F4F6', marginLeft: 44 }} />
            <InfoRow
              icon="email-outline"
              label="Business Email"
              value={submissionInfo?.business_email}
              numberOfLines={2}
            />
          </SectionCard>

          {/* Submission Details */}
          <SectionCard icon="calendar-clock" title="Submission Details" index={3}>
            <InfoRow
              icon="calendar"
              label="Submitted On"
              value={submissionDate}
            />
            <View style={{ height: 1, backgroundColor: '#F3F4F6', marginLeft: 44 }} />
            <InfoRow
              icon="identifier"
              label="Submission ID"
              value={submissionInfo?.submission_id}
            />
          </SectionCard>

          {/* Action Buttons */}
          <Animated.View entering={FadeInDown.duration(300).delay(420)}>
            <View
              style={{
                backgroundColor: 'white',
                borderRadius: 16,
                padding: 20,
                marginBottom: 14,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: '#6B7280',
                  textAlign: 'center',
                  marginBottom: 16,
                }}
              >
                Take Action
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable
                  onPress={confirmApprove}
                  disabled={isProcessing}
                  style={{
                    flex: 1,
                    height: 52,
                    borderRadius: 14,
                    backgroundColor: isProcessing ? '#9CA3AF' : '#6077F5',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#6077F5',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Icon source="check-circle-outline" size={20} color="white" />
                      <Text
                        style={{
                          color: 'white',
                          fontSize: 16,
                          fontWeight: '600',
                          marginLeft: 8,
                        }}
                      >
                        Approve
                      </Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  onPress={confirmReject}
                  disabled={isProcessing}
                  style={{
                    flex: 1,
                    height: 52,
                    borderRadius: 14,
                    backgroundColor: isProcessing ? '#9CA3AF' : '#EF4444',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#EF4444',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Icon source="close-circle-outline" size={20} color="white" />
                      <Text
                        style={{
                          color: 'white',
                          fontSize: 16,
                          fontWeight: '600',
                          marginLeft: 8,
                        }}
                      >
                        Reject
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </>
  )
}

export default ApproveBusinessScreen
