import { FlatList, Text, View, Image, Pressable } from 'react-native'
import React from 'react'
import { Link, Stack } from 'expo-router'
import { Icon, ActivityIndicator } from 'react-native-paper'
import { format } from 'date-fns'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { useBusinessAdsSubmissions } from '@/src/hooks/useBusinessAdsSubmissions'

const BusinessAdsApprovalScreen = () => {
  const { data: ads = [], isLoading } = useBusinessAdsSubmissions()

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
        <Icon source="clipboard-check-outline" size={36} color="#9CA3AF" />
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
        No Pending Submissions
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: '#6B7280',
          textAlign: 'center',
          lineHeight: 20,
        }}
      >
        New business ad submissions will appear here for your review.
      </Text>
    </Animated.View>
  )

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const submissionDate = item.created_at
      ? format(new Date(item.created_at), 'MMM d, yyyy')
      : ''

    return (
      <Animated.View entering={FadeInDown.duration(300).delay(index * 80)}>
        <Link
          href={{
            pathname: '/(user)/more/Admin/ApproveBusinessScreen',
            params: { submission: item.submission_id },
          }}
          asChild
        >
          <Pressable
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
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  {/* Pending Badge */}
                  <View
                    style={{
                      backgroundColor: '#FEF3C7',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: '#92400E',
                        letterSpacing: 0.5,
                      }}
                    >
                      PENDING
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

                {submissionDate ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginTop: 4,
                    }}
                  >
                    <Icon source="clock-outline" size={14} color="#9CA3AF" />
                    <Text
                      style={{
                        fontSize: 12,
                        color: '#9CA3AF',
                        marginLeft: 4,
                      }}
                    >
                      {submissionDate}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Chevron */}
              <View style={{ justifyContent: 'center', paddingLeft: 8 }}>
                <Icon source="chevron-right" size={22} color="#D1D5DB" />
              </View>
            </View>
          </Pressable>
        </Link>
      </Animated.View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <Stack.Screen
        options={{
          title: 'Review Submissions',
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
                    backgroundColor: '#FEF3C7',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 14,
                  }}
                >
                  <Icon source="file-document-outline" size={22} color="#D97706" />
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
                    Pending Submission{ads.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </Animated.View>
            ) : null
          }
          ListEmptyComponent={renderEmptyState}
          renderItem={renderItem}
        />
      )}
    </View>
  )
}

export default BusinessAdsApprovalScreen
