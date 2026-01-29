import { View, Text, Image, Dimensions, Pressable } from 'react-native'
import React from 'react'
import { Icon } from 'react-native-paper'
import Animated, { 
    FadeIn
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'

const { width: screenWidth } = Dimensions.get('window')

type BusinessAdPreviewProps = {
    businessName?: string
    address?: string
    city?: string
    state?: string
    phoneNumber?: string
    email?: string
    imageUri?: string
    compact?: boolean
}

const BusinessAdPreview = ({
    businessName,
    address,
    city,
    state,
    phoneNumber,
    email,
    imageUri,
    compact = false
}: BusinessAdPreviewProps) => {
    const hasBusinessInfo = businessName || address
    const fullAddress = [address, city, state].filter(Boolean).join(', ')

    // Action button component (preview only - not functional)
    const ActionButton = ({ icon, label }: { icon: string; label: string }) => (
        <View style={{ alignItems: 'center', opacity: 0.7 }}>
            <View style={{ 
                width: compact ? 36 : 44, 
                height: compact ? 36 : 44, 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: 'white',
                borderRadius: compact ? 18 : 22,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 3
            }}>
                <Icon source={icon} size={compact ? 18 : 20} color='#1f2937' />
            </View>
            <Text style={{ 
                color: '#6B7280', 
                fontSize: compact ? 10 : 11, 
                fontWeight: '500', 
                marginTop: 4 
            }}>
                {label}
            </Text>
        </View>
    )

    return (
        <Animated.View 
            entering={FadeIn.duration(250)}
            style={{ 
                width: compact ? screenWidth * 0.85 : screenWidth - 48,
                borderRadius: 16,
                backgroundColor: 'white',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 5,
                overflow: 'hidden',
                alignSelf: 'center'
            }}
        >
            {/* Image Section */}
            <View style={{ 
                width: '100%', 
                height: compact ? 140 : 180, 
                backgroundColor: '#F3F4F6',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden'
            }}>
                {imageUri ? (
                    <Image 
                        source={{ uri: imageUri }} 
                        style={{ 
                            width: '100%', 
                            height: '100%', 
                            resizeMode: 'cover' 
                        }} 
                    />
                ) : (
                    <View style={{ 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        padding: 20
                    }}>
                        <View style={{
                            width: compact ? 48 : 64,
                            height: compact ? 48 : 64,
                            borderRadius: compact ? 24 : 32,
                            backgroundColor: '#E5E7EB',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 8
                        }}>
                            <Icon source="image-outline" size={compact ? 24 : 32} color="#9CA3AF" />
                        </View>
                        <Text style={{ 
                            fontSize: compact ? 12 : 14, 
                            color: '#9CA3AF', 
                            fontWeight: '500',
                            textAlign: 'center'
                        }}>
                            Your flyer will appear here
                        </Text>
                    </View>
                )}
                
                {/* Business Name Overlay - only show if we have business name and image */}
                {imageUri && businessName && (
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            paddingTop: 40,
                            paddingBottom: 12,
                            paddingHorizontal: 16
                        }}
                    >
                        <Text style={{ 
                            color: 'white', 
                            fontSize: compact ? 16 : 18, 
                            fontWeight: '700' 
                        }} numberOfLines={1}>
                            {businessName}
                        </Text>
                    </LinearGradient>
                )}
                
                {/* Preview Badge */}
                <View style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 4
                }}>
                    <Text style={{ 
                        color: 'white', 
                        fontSize: 10, 
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5
                    }}>
                        Preview
                    </Text>
                </View>
            </View>

            {/* Bottom Section */}
            <View style={{ backgroundColor: '#F9FAFB', paddingBottom: compact ? 12 : 16 }}>
                {/* Action Buttons */}
                <View style={{ 
                    flexDirection: 'row', 
                    justifyContent: 'space-around', 
                    paddingHorizontal: 16, 
                    paddingVertical: compact ? 12 : 16 
                }}>
                    <ActionButton icon="phone" label="Call" />
                    <ActionButton icon="message-text" label="SMS" />
                    <ActionButton icon="email" label="Email" />
                </View>

                {/* Address Card */}
                <View style={{ 
                    marginHorizontal: compact ? 12 : 16, 
                    backgroundColor: 'white', 
                    borderRadius: 12, 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    padding: compact ? 10 : 12 
                }}>
                    <View style={{ 
                        backgroundColor: hasBusinessInfo ? '#1F2937' : '#E5E7EB', 
                        borderRadius: 20, 
                        padding: compact ? 6 : 8, 
                        marginRight: compact ? 10 : 12 
                    }}>
                        <Icon 
                            source="map-marker" 
                            size={compact ? 16 : 18} 
                            color={hasBusinessInfo ? 'white' : '#9CA3AF'} 
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        {fullAddress ? (
                            <>
                                <Text style={{ 
                                    color: '#111827', 
                                    fontWeight: '600', 
                                    fontSize: compact ? 12 : 13 
                                }} numberOfLines={1}>
                                    {fullAddress}
                                </Text>
                                <Text style={{ 
                                    color: '#9CA3AF', 
                                    fontSize: compact ? 10 : 11,
                                    marginTop: 2
                                }}>
                                    OPEN IN MAPS
                                </Text>
                            </>
                        ) : (
                            <Text style={{ 
                                color: '#9CA3AF', 
                                fontSize: compact ? 12 : 13,
                                fontStyle: 'italic'
                            }}>
                                Business address will appear here
                            </Text>
                        )}
                    </View>
                    <Icon source="chevron-right" size={20} color='#D1D5DB' />
                </View>
            </View>
        </Animated.View>
    )
}

export default BusinessAdPreview
