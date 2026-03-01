import { View, Text, ScrollView, Pressable, Dimensions, Modal, KeyboardAvoidingView, Platform, Image, Alert } from 'react-native'
import React, { forwardRef, useState, useImperativeHandle, useEffect } from 'react'
import { Icon, TextInput as PaperTextInput, ActivityIndicator } from 'react-native-paper'
import { supabase } from '@/src/lib/supabase'
import * as ImagePicker from 'expo-image-picker'
import { File } from 'expo-file-system'
import { decode } from 'base64-arraybuffer'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  runOnJS,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

type Ref = {
  present: () => void
  dismiss: () => void
}

interface PersonalizedAccountProps {
  onComplete?: () => void
  onSkip?: () => void
}

// Step info with icons
const stepInfo = [
  { icon: 'phone', title: 'Phone' },
  { icon: 'camera', title: 'Photo' },
]

// Calculate height for each step
const getStepHeight = (step: number, hasImage: boolean = false) => {
  switch (step) {
    case 1: return SCREEN_HEIGHT * 0.42  // Phone - professional input
    case 2: return hasImage ? SCREEN_HEIGHT * 0.46 : SCREEN_HEIGHT * 0.42  // Photo
    default: return SCREEN_HEIGHT * 0.42
  }
}

export const PersonalizedAccount = forwardRef<Ref, PersonalizedAccountProps>(
  ({ onComplete, onSkip }, ref) => {
    const [visible, setVisible] = useState(false)
    
    // Reanimated shared values for smooth animations
    const slideY = useSharedValue(SCREEN_HEIGHT * 0.6)
    const backdropOpacity = useSharedValue(0)
    const sheetHeight = useSharedValue(getStepHeight(1))
    
    const [phoneNumber, setPhoneNumber] = useState('')
    const [profileImage, setProfileImage] = useState<string | null>(null)
    const [currentStep, setCurrentStep] = useState(1)
    const [loading, setLoading] = useState(false)

    // Animate height smoothly when step or profile image changes
    useEffect(() => {
      const targetHeight = getStepHeight(currentStep, !!profileImage)
      sheetHeight.value = withSpring(targetHeight, {
        damping: 20,
        stiffness: 90,
        mass: 0.5,
      })
    }, [currentStep, profileImage])

    const pickImage = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to add a profile picture.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri)
      }
    }


    const totalSteps = 2

    const closeSheet = () => {
      setVisible(false)
    }

    useImperativeHandle(ref, () => ({
      present: () => {
        setVisible(true)
      },
      dismiss: () => {
        slideY.value = withTiming(SCREEN_HEIGHT * 0.6, { duration: 300 })
        backdropOpacity.value = withTiming(0, { duration: 300 }, () => {
          runOnJS(closeSheet)()
        })
      },
    }))

    useEffect(() => {
      if (visible) {
        slideY.value = withSpring(0, {
          damping: 20,
          stiffness: 90,
          mass: 0.5,
        })
        backdropOpacity.value = withTiming(1, { duration: 400 })
      }
    }, [visible])

    // Handle dismiss (tap outside or drag down)
    const handleDismiss = () => {
      slideY.value = withTiming(SCREEN_HEIGHT * 0.6, { duration: 300 })
      backdropOpacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(closeSheet)()
        if (onSkip) {
          runOnJS(onSkip)()
        }
      })
    }

    // Pan gesture for drag-to-dismiss
    const panGesture = Gesture.Pan()
      .onUpdate((event) => {
        // Only allow dragging down (positive translationY)
        if (event.translationY > 0) {
          slideY.value = event.translationY
          // Fade backdrop as user drags
          backdropOpacity.value = Math.max(0, 1 - (event.translationY / 300))
        }
      })
      .onEnd((event) => {
        // If dragged more than 100px down or with velocity, dismiss
        if (event.translationY > 100 || event.velocityY > 500) {
          slideY.value = withTiming(SCREEN_HEIGHT * 0.6, { duration: 300 })
          backdropOpacity.value = withTiming(0, { duration: 300 }, () => {
            runOnJS(closeSheet)()
            if (onSkip) {
              runOnJS(onSkip)()
            }
          })
        } else {
          // Snap back to original position
          slideY.value = withSpring(0, {
            damping: 20,
            stiffness: 90,
            mass: 0.5,
          })
          backdropOpacity.value = withTiming(1, { duration: 200 })
        }
      })
    
    // Animated styles
    const backdropStyle = useAnimatedStyle(() => ({
      opacity: backdropOpacity.value,
    }))

    const sheetStyle = useAnimatedStyle(() => ({
      height: sheetHeight.value,
      transform: [{ translateY: slideY.value }],
    }))

    const canProceed = () => {
      switch (currentStep) {
        case 1:
          // Require full 10-digit phone number
          return phoneNumber.replace(/\D/g, '').length === 10
        case 2:
          return true // Photo is optional
        default:
          return false
      }
    }

    const handleNext = () => {
      if (!canProceed()) return

      if (currentStep < totalSteps) {
        setCurrentStep(prev => prev + 1)
      } else {
        handleSubmit()
      }
    }

    const handleBack = () => {
      if (currentStep > 1) {
        setCurrentStep(prev => prev - 1)
      }
    }

    const handleSubmit = async () => {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          let profileImageUrl = null

          if (profileImage) {
            try {
              // Read file as base64 - the correct approach for React Native
              const base64 = await new File(profileImage).base64()
              const filePath = `${user.id}/profile_${new Date().getTime()}.png`
              
              const { data: image, error: uploadError } = await supabase.storage
                .from('user_playlist_img')
                .upload(filePath, decode(base64), {
                  contentType: 'image/png',
                  upsert: true,
                })

              if (uploadError) {
                console.error('Upload error:', uploadError)
                Alert.alert('Error', 'Failed to upload profile picture. Please try again.')
              } else if (image) {
                const { data: urlData } = supabase.storage
                  .from('user_playlist_img')
                  .getPublicUrl(image.path)
                
                if (urlData?.publicUrl) {
                  profileImageUrl = urlData.publicUrl
                }
              }
            } catch (uploadErr) {
              console.error('Error processing image:', uploadErr)
              Alert.alert('Error', 'Failed to process profile picture. Please try again.')
            }
          }
          
          const updateData: any = {
            phone_number: phoneNumber.trim(),
          }

          if (profileImageUrl) {
            updateData.profile_pic = profileImageUrl
          }

          const { error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', user.id)

          if (error) {
            console.error('Error saving profile data:', error)
            Alert.alert('Error', 'Failed to save profile. Please try again.')
            return
          }
          
          console.log('Profile saved successfully:', updateData)
          onComplete?.()
          slideY.value = withTiming(SCREEN_HEIGHT * 0.6, { duration: 300 })
          backdropOpacity.value = withTiming(0, { duration: 300 }, () => {
            runOnJS(closeSheet)()
          })
        }
      } catch (error) {
        console.error('Error submitting onboarding:', error)
      } finally {
        setLoading(false)
      }
    }

    const handleSkip = () => {
      onSkip?.()
      slideY.value = withTiming(SCREEN_HEIGHT * 0.6, { duration: 300 })
      backdropOpacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(closeSheet)()
      })
    }

    const renderStepContent = () => {
      switch (currentStep) {
        case 1:
          return (
            <>
              <View style={{ alignItems: 'center', marginTop: 20 }}>
                <Text style={{
                  fontSize: 24,
                  color: '#ffffff',
                  fontWeight: '700',
                  textAlign: 'center',
                  marginBottom: 8,
                }}>
                  Add Your Phone
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: 'rgba(255, 255, 255, 0.6)',
                  textAlign: 'center',
                  marginBottom: 24,
                }}>
                  So the mosque can reach you when needed
                </Text>
              </View>

              {/* Phone Input Container */}
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: 16,
                overflow: 'hidden',
              }}>
                {/* Country Code + Input Row */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                  {/* Country Code Section */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingLeft: 12,
                    paddingRight: 12,
                    paddingVertical: 16,
                    borderRightWidth: 1,
                    borderRightColor: 'rgba(14, 81, 159, 0.15)',
                  }}>
                    <Text style={{ fontSize: 20 }}>🇺🇸</Text>
                    <Text style={{ 
                      fontSize: 16, 
                      color: '#0f172a', 
                      fontWeight: '600',
                      marginLeft: 6,
                    }}>
                      +1
                    </Text>
                  </View>

                  {/* Phone Number Input */}
                  <PaperTextInput
                    mode='flat'
                    value={phoneNumber}
                    onChangeText={(text) => {
                      // Get current digits and new digits
                      const currentDigits = phoneNumber.replace(/\D/g, '')
                      const newDigits = text.replace(/\D/g, '').slice(0, 10)
                      
                      // Allow empty/full deletion
                      if (newDigits.length === 0) {
                        setPhoneNumber('')
                        return
                      }
                      
                      // Detect if user is deleting (fewer digits than before)
                      // If text is shorter but digit count is same, user deleted a formatting char
                      // In that case, also remove a digit to make deletion feel natural
                      const isDeleting = text.length < phoneNumber.length
                      const sameDigitCount = newDigits.length === currentDigits.length
                      
                      let digitsToFormat = newDigits
                      if (isDeleting && sameDigitCount && currentDigits.length > 0) {
                        // User deleted a formatting character, remove the last digit too
                        digitsToFormat = newDigits.slice(0, -1)
                      }
                      
                      // Allow empty after adjustment
                      if (digitsToFormat.length === 0) {
                        setPhoneNumber('')
                        return
                      }
                      
                      // Format as (XXX) XXX-XXXX
                      let formatted = '(' + digitsToFormat.slice(0, 3)
                      if (digitsToFormat.length >= 3) {
                        formatted += ') ' + digitsToFormat.slice(3, 6)
                      }
                      if (digitsToFormat.length >= 6) {
                        formatted += '-' + digitsToFormat.slice(6, 10)
                      }
                      setPhoneNumber(formatted)
                    }}
                    placeholder="(555) 123-4567"
                    keyboardType="phone-pad"
                    style={{ 
                      flex: 1,
                      backgroundColor: 'transparent',
                      fontSize: 18,
                      fontWeight: '500',
                      paddingHorizontal: 16,
                    }}
                    placeholderTextColor='rgba(14, 81, 159, 0.35)'
                    textColor='#0f172a'
                    underlineColor='transparent'
                    activeUnderlineColor='transparent'
                    selectionColor='#0E519F'
                  />

                  {/* Checkmark when valid */}
                  {phoneNumber.replace(/\D/g, '').length === 10 && (
                    <View style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: '#22c55e',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 16,
                    }}>
                      <Icon source="check" size={16} color="#ffffff" />
                    </View>
                  )}
                </View>
              </View>

            </>
          )

        case 2:
          return (
            <>
              {/* Profile Picture */}
              <View style={{ alignItems: 'center', marginTop: 20 }}>
                <Text style={{
                  fontSize: 24,
                  color: '#ffffff',
                  fontWeight: '700',
                  textAlign: 'center',
                  marginBottom: 20,
                }}>
                  Add a Profile Photo
                </Text>
                <Pressable
                  onPress={pickImage}
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderWidth: 4,
                    borderColor: profileImage ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
                    borderStyle: profileImage ? 'solid' : 'dashed',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {profileImage ? (
                    <Image
                      source={{ uri: profileImage }}
                      style={{ width: '100%', height: '100%' }}
                    />
                  ) : (
                    <View style={{ alignItems: 'center' }}>
                      <Icon source="camera-plus" size={32} color="#0E519F" />
                      <Text style={{ fontSize: 12, color: '#0E519F', marginTop: 4, fontWeight: '500' }}>
                        Tap to add
                      </Text>
                    </View>
                  )}
                </Pressable>

                {profileImage && (
                  <Pressable
                    onPress={() => setProfileImage(null)}
                    style={{
                      marginTop: 10,
                      paddingVertical: 6,
                      paddingHorizontal: 14,
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      borderRadius: 16,
                    }}
                  >
                    <Text style={{ fontSize: 13, color: '#fca5a5', fontWeight: '500' }}>
                      Remove Photo
                    </Text>
                  </Pressable>
                )}
              </View>

            </>
          )

        default:
          return null
      }
    }

    if (!visible) return null

    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="none"
        statusBarTranslucent
      >
        <Animated.View style={[{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'flex-end' }, backdropStyle]}>
          {/* Tap outside to dismiss */}
          <Pressable 
            style={{ flex: 1 }} 
            onPress={handleDismiss}
          />
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ justifyContent: 'flex-end' }}
          >
            <GestureDetector gesture={panGesture}>
              <Animated.View
                style={[{
                  backgroundColor: '#0E519F',
                  borderRadius: 40,
                  marginHorizontal: 10,
                  marginBottom: Platform.OS === 'ios' ? 12 : 10,
                  overflow: 'hidden',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 20,
                  elevation: 20,
                }, sheetStyle]}
              >
                {/* Handle - visual indicator for dragging */}
                <View style={{
                  width: 36,
                  height: 4,
                  backgroundColor: 'rgba(255, 255, 255, 0.4)',
                  borderRadius: 2,
                  alignSelf: 'center',
                  marginTop: 10,
                  marginBottom: 10,
                }} />

              {/* Compact Header */}
              <View style={{ paddingHorizontal: 20, paddingBottom: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600', letterSpacing: 1 }}>
                    STEP {currentStep} OF {totalSteps}
                  </Text>
                  <Pressable 
                    onPress={handleSkip} 
                    style={{ 
                      paddingVertical: 5, 
                      paddingHorizontal: 12,
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      borderRadius: 14,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: '#ffffff', fontWeight: '500' }}>
                      Skip
                    </Text>
                  </Pressable>
                </View>

                {/* Step Indicators */}
                <View style={{ flexDirection: 'row', gap: 5 }}>
                  {stepInfo.map((step, index) => (
                    <View
                      key={index}
                      style={{
                        flex: 1,
                        height: 3,
                        borderRadius: 2,
                        backgroundColor: index < currentStep ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                      }}
                    />
                  ))}
                </View>
              </View>

              <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12 }}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={{ flex: 1 }}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  keyboardShouldPersistTaps="handled"
                >
                  {renderStepContent()}
                </ScrollView>

                {/* Navigation Buttons */}
                <View style={{
                  flexDirection: 'row',
                  gap: 10,
                  paddingBottom: 16,
                  paddingTop: 10,
                }}>
                  {currentStep > 1 && (
                    <Pressable
                      onPress={handleBack}
                      style={{
                        width: 50,
                        height: 50,
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        borderRadius: 25,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon source="arrow-left" size={22} color="#ffffff" />
                    </Pressable>
                  )}
                  <Pressable
                    onPress={handleNext}
                    disabled={!canProceed() || loading}
                    style={{
                      flex: 1,
                      height: 50,
                      backgroundColor: canProceed() 
                        ? 'rgba(255, 255, 255, 0.95)' 
                        : 'rgba(255, 255, 255, 0.3)',
                      borderRadius: 25,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#0E519F" />
                    ) : (
                      <>
                        <Text style={{
                          fontSize: 16,
                          color: '#0E519F',
                          fontWeight: '600',
                        }}>
                          {currentStep === totalSteps ? 'Complete Setup' : 'Continue'}
                        </Text>
                        {currentStep < totalSteps && (
                          <Icon source="arrow-right" size={20} color="#0E519F" />
                        )}
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
              </Animated.View>
            </GestureDetector>
          </KeyboardAvoidingView>
        </Animated.View>
      </Modal>
    )
  }
)

PersonalizedAccount.displayName = 'PersonalizedAccount'
