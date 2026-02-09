import { FlatList, Text, View, Image, Pressable, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { supabase } from '@/src/lib/supabase'
import { Stack } from 'expo-router'
import { Icon, ActivityIndicator } from 'react-native-paper'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { BusinessSubmissionsProp } from '@/src/types'

const ApprovedAdCard = ({
  item,
  index,
}: {
  item: BusinessSubmissionsProp
  index: number
}) => {
  const handleDelete = () => {
    Alert.alert(
      'Remove Approved Ad',
      `Are you sure you want to remove "${item.business_name}"? This ad will no longer be visible to users.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await supabase
              .from('approved_business_ads')
              .delete()
              .eq('submission_id', item.submission_id)
          },
        },
      ]
    )
  }

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 80)}>
      <View
        style={{
          marginHorizontal: 16,
          marginBottom: 12,
          backgroundColor: 'white',
          borderRadius: 16,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: 'row', padding: 12 }}>
          {/* Flyer Thumbnail */}
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 12,
              overflow: 'hidden',
              backgroundColor: '#F3F4F6',
            }}
          >
            <Image
              source={{ uri: item.business_flyer_img }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>

          {/* Info Section */}
          <View
            style={{
              flex: 1,
              marginLeft: 14,
              justifyContent: 'center',
            }}
          >
            {/* Approved Badge */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <View
                style={{
                  backgroundColor: '#DCFCE7',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: '#166534',
                    letterSpacing: 0.5,
                  }}
                >
                  APPROVED
                </Text>
              </View>
            </View>

            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#1F2937',
                marginBottom: 4,
              }}
              numberOfLines={1}
            >
              {item.business_name}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon source="phone-outline" size={14} color="#9CA3AF" />
              <Text
                style={{
                  fontSize: 13,
                  color: '#6B7280',
                  marginLeft: 4,
                }}
                numberOfLines={1}
              >
                {item.business_phone_number}
              </Text>
            </View>

            {item.business_flyer_duration ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 4,
                }}
              >
                <Icon source="timer-outline" size={14} color="#9CA3AF" />
                <Text
                  style={{
                    fontSize: 12,
                    color: '#9CA3AF',
                    marginLeft: 4,
                  }}
                >
                  {item.business_flyer_duration}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Delete Button */}
          <Pressable
            onPress={handleDelete}
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              paddingLeft: 8,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: '#FEF2F2',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Icon source="trash-can-outline" size={20} color="#EF4444" />
            </View>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  )
}

const ApprovedAdsScreen = () => {
  const [ads, setAds] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const getAds = async () => {
    const { data, error } = await supabase.from('approved_business_ads').select('*')
    if (data) {
      const adsInfo = await Promise.all(
        data.map(async (ad) => {
          const { data: AdInfo } = await supabase
            .from('business_ads_submissions')
            .select('*')
            .eq('submission_id', ad.submission_id)
            .single()
          if (AdInfo) return AdInfo
        })
      )
      setAds(adsInfo.filter(Boolean))
    }
    setIsLoading(false)
  }

  useEffect(() => {
    getAds()
    const checkStatus = supabase
      .channel('Check for Business ads Status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'approved_business_ads',
        },
        async () => await getAds()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(checkStatus)
    }
  }, [])

  const renderEmptyState = () => (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingBottom: 80,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: '#F3F4F6',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <Icon source="bullhorn-outline" size={36} color="#9CA3AF" />
      </View>
      <Text
        style={{
          fontSize: 18,
          fontWeight: '600',
          color: '#1F2937',
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        No Approved Ads
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: '#6B7280',
          textAlign: 'center',
          lineHeight: 20,
        }}
      >
        Approved business ads will appear here. You can remove them at any time.
      </Text>
    </Animated.View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <Stack.Screen
        options={{
          title: 'Approved Fliers',
          headerStyle: { backgroundColor: '#F9FAFB' },
          headerTitleStyle: {
            fontSize: 22,
            fontWeight: '600',
            color: '#1F2937',
          },
          headerTintColor: '#4A5568',
          headerShadowVisible: false,
        }}
      />

      {isLoading ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color="#6077F5" />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={ads}
          keyExtractor={(item) => item.submission_id}
          contentContainerStyle={{
            paddingTop: 8,
            paddingBottom: 40,
            ...(ads.length === 0 && { flex: 1 }),
          }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            ads.length > 0 ? (
              <Animated.View
                entering={FadeIn.duration(300)}
                style={{
                  marginHorizontal: 16,
                  marginBottom: 16,
                  backgroundColor: 'white',
                  borderRadius: 16,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                  elevation: 1,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: '#DCFCE7',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 14,
                  }}
                >
                  <Icon source="check-decagram" size={22} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: '700',
                      color: '#1F2937',
                    }}
                  >
                    {ads.length}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#6B7280' }}>
                    Active Ad{ads.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </Animated.View>
            ) : null
          }
          ListEmptyComponent={renderEmptyState}
          renderItem={({ item, index }) => (
            <ApprovedAdCard item={item} index={index} />
          )}
        />
      )}
    </View>
  )
}

export default ApprovedAdsScreen
