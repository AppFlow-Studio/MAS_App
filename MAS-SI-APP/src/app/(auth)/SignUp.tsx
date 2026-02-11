import { View, Text, Dimensions, StatusBar, Pressable, Platform, KeyboardAvoidingView, Image, TextInput as RNTextInput, ScrollView } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { Icon, TextInput, ActivityIndicator } from 'react-native-paper'
import { Link, Stack, router } from "expo-router"
import { supabase } from '@/src/lib/supabase'
import * as AppleAuthentication from 'expo-apple-authentication'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { decode } from 'base64-arraybuffer'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  withDelay,
  withSequence,
  Easing,
  FadeIn,
  FadeInUp,
  FadeOutLeft,
  FadeInRight,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated'
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin'
import { formatPhoneNumber } from '@/src/lib/utils'

// Configure Google Sign-In once
GoogleSignin.configure({
  iosClientId: '991344123272-nk55l8nc7dcloc56m6mmnvnkhdtjfcbf.apps.googleusercontent.com',
  webClientId: '991344123272-p3p68bb5kk77j6f36fij21t42ovhcr93.apps.googleusercontent.com',
  scopes: ['profile', 'email'],
  offlineAccess: false,
})

const { width, height } = Dimensions.get('window')

// Step configuration
// 0: Name, 1: Username, 2: Email, 3: Phone, 4: Verify, 5: Password, 6: Photo
const TOTAL_STEPS = 7

// Password strength indicator - for light theme
const PasswordStrength = ({ password }: { password: string }) => {
  const getStrength = () => {
    if (password.length === 0) return { level: 0, text: '', color: 'transparent' }
    if (password.length < 6) return { level: 1, text: 'Weak', color: '#EF4444' }
    if (password.length < 8) return { level: 2, text: 'Fair', color: '#F59E0B' }
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { level: 4, text: 'Strong', color: '#22c55e' }
    }
    return { level: 3, text: 'Good', color: '#0E519F' }
  }

  const strength = getStrength()

  if (password.length === 0) return null

  return (
    <Animated.View 
      entering={FadeIn.duration(300)}
      style={{ marginTop: 12, paddingHorizontal: 4 }}
    >
      <View style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map((level) => (
          <View
            key={level}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: level <= strength.level ? strength.color : 'rgba(14, 81, 159, 0.15)',
            }}
          />
        ))}
      </View>
      <Text style={{ color: strength.color, fontSize: 13, fontWeight: '500' }}>
        {strength.text}
      </Text>
    </Animated.View>
  )
}

const SignUp = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  
  // Verification code states
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', ''])
  const [generatedCode, setGeneratedCode] = useState('')
  const [codeError, setCodeError] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const codeInputRefs = useRef<(RNTextInput | null)[]>([])
  
  // Focus states - tracks which input field is currently focused
  const [focusedField, setFocusedField] = useState<string | null>(null)

  // Animation values
  const buttonScale = useSharedValue(1)
  
  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCountdown])

  // Generate and "send" verification code
  const sendVerificationCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedCode(code)
    setResendCountdown(30)
    setCodeError(false)
    setVerificationCode(['', '', '', '', '', ''])
    console.log('Verification code:', code)
    alert(`Your verification code is: ${code}`) // For demo - remove in production
  }

  // Handle code input
  const handleCodeInput = (text: string, index: number) => {
    setCodeError(false)
    const newCode = [...verificationCode]
    
    // Handle paste of full code
    if (text.length > 1) {
      const pastedCode = text.replace(/\D/g, '').slice(0, 6).split('')
      pastedCode.forEach((digit, i) => {
        if (i < 6) newCode[i] = digit
      })
      setVerificationCode(newCode)
      if (pastedCode.length === 6) {
        codeInputRefs.current[5]?.blur()
      }
      return
    }
    
    newCode[index] = text.replace(/\D/g, '')
    setVerificationCode(newCode)
    
    // Auto-focus next input
    if (text && index < 5) {
      codeInputRefs.current[index + 1]?.focus()
    }
  }

  // Handle backspace
  const handleCodeKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus()
    }
  }


  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }))

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

  const validateCurrentStep = () => {
    setError('')
    
    switch (currentStep) {
      case 0: // Name
        if (!firstName.trim()) {
          setError('Please enter your first name')
          return false
        }
        if (!lastName.trim()) {
          setError('Please enter your last name')
          return false
        }
        return true
      case 1: // Username
        if (!username.trim()) {
          setError('Please choose a username')
          return false
        }
        if (username.length < 3) {
          setError('Username must be at least 3 characters')
          return false
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          setError('Username can only contain letters, numbers, and underscores')
          return false
        }
        return true
      case 2: // Email
        if (!email.trim()) {
          setError('Please enter your email')
          return false
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
          setError('Please enter a valid email address')
          return false
        }
        return true
      case 3: // Phone
        if (phoneNumber.replace(/\D/g, '').length !== 10) {
          setError('Please enter a valid 10-digit phone number')
          return false
        }
        return true
      case 4: // Verification
        if (!verificationCode.every(digit => digit !== '')) {
          setError('Please enter the complete verification code')
          return false
        }
        // Verify the code
        const enteredCode = verificationCode.join('')
        if (enteredCode !== generatedCode) {
          setCodeError(true)
          setError('Incorrect verification code')
          return false
        }
        return true
      case 5: // Password
        if (!password) {
          setError('Please create a password')
          return false
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters')
          return false
        }
        return true
      case 6: // Photo (optional)
        return true
      default:
        return true
    }
  }

  // Check if code is correct for visual feedback
  const isCodeCorrect = () => {
    if (currentStep !== 4) return false
    const enteredCode = verificationCode.join('')
    return enteredCode.length === 6 && enteredCode === generatedCode
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return firstName.trim().length > 0 && lastName.trim().length > 0
      case 1:
        return username.trim().length >= 3
      case 2:
        return /\S+@\S+\.\S+/.test(email)
      case 3:
        return phoneNumber.replace(/\D/g, '').length === 10
      case 4:
        return verificationCode.every(digit => digit !== '')
      case 5:
        return password.length >= 6
      case 6:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (!validateCurrentStep()) {
      buttonScale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withSpring(1, { damping: 10 })
      )
      return
    }

    // If on phone step, send verification code before moving forward
    if (currentStep === 3) {
      sendVerificationCode()
    }

    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1)
      setError('')
    } else {
      signUpWithEmail()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setError('')
    } else {
      router.back()
    }
  }

  const handleGoogleSignUp = async () => {
    try {
      await GoogleSignin.hasPlayServices()
      const response = await GoogleSignin.signIn()

      const idToken = (response as any).data?.idToken || (response as any).idToken
      const user = (response as any).data?.user || (response as any).user

      if (idToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        })

        if (!error && data?.user) {
          const { error: ProfileError } = await supabase
            .from('profiles')
            .update({
              first_name: user?.name || user?.givenName,
              profile_email: user?.email
            })
            .eq('id', data.user.id)

          if (ProfileError) {
            console.error('Profile update error:', ProfileError)
          }
        } else {
          console.error('Supabase sign-in error:', error)
          alert(error?.message || 'Google sign-up failed')
        }
      } else {
        throw new Error('No ID token present!')
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the login flow')
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in is in progress already')
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Play services not available or outdated')
      } else {
        alert(`Sign-up error: ${error.message || 'Unknown error'}`)
      }
    }
  }

  const handleAppleSignUp = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })

      if (credential.identityToken) {
        const { error, data: { user } } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        })

        if (!error && user) {
          await supabase.from('profiles').update({ 
            profile_email: credential.email, 
            first_name: credential.fullName?.givenName 
          }).eq('id', user.id)
        }
      } else {
        throw new Error('No identityToken.')
      }
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        console.error('Apple sign-in error:', e)
      }
    }
  }

  async function signUpWithEmail() {
    setLoading(true)
    buttonScale.value = withTiming(0.98, { duration: 100 })

    try {
      const { data: { session, user }, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            username: username.trim().toLowerCase(),
            profile_email: email.trim(),
            phone_number: phoneNumber.trim(),
          },
        },
      })

      if (error) {
        alert(error.message)
        return
      }

      // Upload profile image if selected
      if (user && profileImage) {
        try {
          // Read file as base64 - the correct approach for React Native
          const base64 = await FileSystem.readAsStringAsync(profileImage, { encoding: 'base64' })
          const filePath = `${user.id}/profile_${new Date().getTime()}.png`
          
          const { data: image, error: uploadError } = await supabase.storage
            .from('user_playlist_img')
            .upload(filePath, decode(base64), {
              contentType: 'image/png',
              upsert: true,
            })

          if (!uploadError && image) {
            const { data: urlData } = supabase.storage
              .from('user_playlist_img')
              .getPublicUrl(image.path)
            
            if (urlData?.publicUrl) {
              await supabase.from('profiles').update({
                profile_pic: urlData.publicUrl
              }).eq('id', user.id)
            }
          }
        } catch (uploadErr) {
          console.error('Error uploading profile image:', uploadErr)
        }
      }

      if (user) {
        await supabase.from('profiles').update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          username: username.trim().toLowerCase(),
          phone_number: phoneNumber.trim(),
          onboarding_completed: false,
        }).eq('id', user.id)
      }

    } catch (error: any) {
      alert(error.message || 'An error occurred during sign up')
    } finally {
      setLoading(false)
      buttonScale.value = withSpring(1)
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 0: return "What's your name?"
      case 1: return "Choose a username"
      case 2: return "What's your email?"
      case 3: return "Your phone number"
      case 4: return "Verify your number"
      case 5: return "Create a password"
      case 6: return "Add a profile photo"
      default: return ""
    }
  }

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 0: return "Let's get to know you"
      case 1: return "This is how others will find you"
      case 2: return "We'll use this to keep you updated"
      case 3: return "We'll use this to keep your account secure"
      case 4: return `Enter the 6-digit code sent to +1 ${phoneNumber}`
      case 5: return "Make it strong and memorable"
      case 6: return "Help others recognize you (optional)"
      default: return ""
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Animated.View 
            key="step-0"
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(300)}
          >
            {/* First Name */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ 
                fontWeight: '500', 
                fontSize: 14, 
                color: '#0E519F',
                marginBottom: 8,
                marginLeft: 4,
              }}>
                First Name
              </Text>
              <View style={{
                backgroundColor: 'rgba(14, 81, 159, 0.08)',
                borderRadius: 16,
                borderWidth: 2,
                borderColor: focusedField === 'firstName' ? '#0E519F' : 'rgba(14, 81, 159, 0.15)',
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
              }}>
                <Icon source="account-outline" size={22} color="rgba(14, 81, 159, 0.5)" />
                <TextInput
                  mode='flat'
                  value={firstName}
                  onChangeText={setFirstName}
                  onFocus={() => setFocusedField('firstName')}
                  onBlur={() => setFocusedField(null)}
                  style={{ 
                    flex: 1,
                    backgroundColor: 'transparent',
                    fontSize: 16,
                  }}
                  placeholder="Enter your first name"
                  placeholderTextColor='rgba(14, 81, 159, 0.4)'
                  textColor='#0f172a'
                  underlineColor='transparent'
                  activeUnderlineColor='transparent'
                  autoCapitalize="words"
                  autoCorrect={false}
                  cursorColor='#0E519F'
                />
              </View>
            </View>

            {/* Last Name */}
            <View>
              <Text style={{ 
                fontWeight: '500', 
                fontSize: 14, 
                color: '#0E519F',
                marginBottom: 8,
                marginLeft: 4,
              }}>
                Last Name
              </Text>
              <View style={{
                backgroundColor: 'rgba(14, 81, 159, 0.08)',
                borderRadius: 16,
                borderWidth: 2,
                borderColor: focusedField === 'lastName' ? '#0E519F' : 'rgba(14, 81, 159, 0.15)',
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
              }}>
                <Icon source="account-outline" size={22} color="rgba(14, 81, 159, 0.5)" />
                <TextInput
                  mode='flat'
                  value={lastName}
                  onChangeText={setLastName}
                  onFocus={() => setFocusedField('lastName')}
                  onBlur={() => setFocusedField(null)}
                  style={{ 
                    flex: 1,
                    backgroundColor: 'transparent',
                    fontSize: 16,
                  }}
                  placeholder="Enter your last name"
                  placeholderTextColor='rgba(14, 81, 159, 0.4)'
                  textColor='#0f172a'
                  underlineColor='transparent'
                  activeUnderlineColor='transparent'
                  autoCapitalize="words"
                  autoCorrect={false}
                  cursorColor='#0E519F'
                />
              </View>
            </View>
          </Animated.View>
        )

      case 1:
        return (
          <Animated.View 
            key="step-1"
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(300)}
          >
            <View style={{
              backgroundColor: 'rgba(14, 81, 159, 0.08)',
              borderRadius: 16,
              borderWidth: 2,
              borderColor: focusedField === 'username' ? '#0E519F' : 'rgba(14, 81, 159, 0.15)',
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
            }}>
              <Icon source="at" size={22} color="rgba(14, 81, 159, 0.5)" />
              <TextInput
                mode='flat'
                value={username}
                onChangeText={(text) => setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
                style={{ 
                  flex: 1,
                  backgroundColor: 'transparent',
                  fontSize: 16,
                }}
                placeholder="Choose a username"
                placeholderTextColor='rgba(14, 81, 159, 0.4)'
                textColor='#0f172a'
                underlineColor='transparent'
                activeUnderlineColor='transparent'
                autoCapitalize="none"
                autoCorrect={false}
                cursorColor='#0E519F'
              />
            </View>
            {username.length > 0 && (
              <Text style={{ 
                color: 'rgba(14, 81, 159, 0.7)', 
                fontSize: 14, 
                marginTop: 12, 
                marginLeft: 4, 
                fontWeight: '500' 
              }}>
                @{username}
              </Text>
            )}
          </Animated.View>
        )

      case 2:
        return (
          <Animated.View 
            key="step-2"
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(300)}
          >
            <View style={{
              backgroundColor: 'rgba(14, 81, 159, 0.08)',
              borderRadius: 16,
              borderWidth: 2,
              borderColor: focusedField === 'email' ? '#0E519F' : 'rgba(14, 81, 159, 0.15)',
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
            }}>
              <Icon source="email-outline" size={22} color="rgba(14, 81, 159, 0.5)" />
              <TextInput
                mode='flat'
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                style={{ 
                  flex: 1,
                  backgroundColor: 'transparent',
                  fontSize: 16,
                }}
                placeholder="Enter your email"
                placeholderTextColor='rgba(14, 81, 159, 0.4)'
                textColor='#0f172a'
                underlineColor='transparent'
                activeUnderlineColor='transparent'
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                cursorColor='#0E519F'
              />
            </View>
          </Animated.View>
        )

      case 3:
        return (
          <Animated.View 
            key="step-3"
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(300)}
          >
            {/* Phone Input Container */}
            <View style={{
              backgroundColor: 'rgba(14, 81, 159, 0.08)',
              borderRadius: 16,
              borderWidth: 2,
              borderColor: focusedField === 'phone' ? '#0E519F' : 'rgba(14, 81, 159, 0.15)',
              overflow: 'hidden',
            }}>
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
                  backgroundColor: 'rgba(14, 81, 159, 0.05)',
                }}>
                  <Text style={{ fontSize: 20 }}>🇺🇸</Text>
                  <Text style={{ 
                    fontSize: 16, 
                    color: '#0E519F', 
                    fontWeight: '600',
                    marginLeft: 6,
                  }}>
                    +1
                  </Text>
                </View>

                {/* Phone Number Input */}
                <TextInput
                  mode='flat'
                  value={phoneNumber}
                  onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
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
                  cursorColor='#0E519F'
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

            {/* Helper text */}
            <Text style={{
              fontSize: 12,
              color: 'rgba(14, 81, 159, 0.5)',
              textAlign: 'center',
              marginTop: 12,
            }}>
              Standard messaging rates may apply
            </Text>
          </Animated.View>
        )

      case 4:
        return (
          <Animated.View 
            key="step-4"
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(300)}
          >
            {/* Verification Code Input Boxes */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 16,
            }}>
              {verificationCode.map((digit, index) => (
                <RNTextInput
                  key={index}
                  ref={(ref) => { codeInputRefs.current[index] = ref }}
                  value={digit}
                  onChangeText={(text) => handleCodeInput(text, index)}
                  onKeyPress={({ nativeEvent }) => handleCodeKeyPress(nativeEvent.key, index)}
                  onFocus={() => setFocusedField(`code-${index}`)}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  style={{
                    width: 48,
                    height: 56,
                    backgroundColor: codeError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(14, 81, 159, 0.08)',
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: codeError 
                      ? '#ef4444' 
                      : focusedField === `code-${index}`
                        ? '#0E519F'
                        : digit 
                          ? '#22c55e' 
                          : 'rgba(14, 81, 159, 0.2)',
                    fontSize: 24,
                    fontWeight: '700',
                    textAlign: 'center',
                    color: codeError ? '#ef4444' : '#0f172a',
                  }}
                />
              ))}
            </View>

            {/* Error Message */}
            {codeError && (
              <Text style={{
                fontSize: 13,
                color: '#ef4444',
                textAlign: 'center',
                marginBottom: 12,
              }}>
                Incorrect code. Please try again.
              </Text>
            )}

            {/* Resend Code */}
            <View style={{ alignItems: 'center' }}>
              {resendCountdown > 0 ? (
                <Text style={{
                  fontSize: 13,
                  color: 'rgba(14, 81, 159, 0.5)',
                  textAlign: 'center',
                }}>
                  Resend code in {resendCountdown}s
                </Text>
              ) : (
                <Pressable onPress={sendVerificationCode}>
                  <Text style={{
                    fontSize: 14,
                    color: '#0E519F',
                    fontWeight: '600',
                    textAlign: 'center',
                  }}>
                    Resend Code
                  </Text>
                </Pressable>
              )}
            </View>
          </Animated.View>
        )

      case 5:
        return (
          <Animated.View 
            key="step-5"
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(300)}
          >
            <View style={{
              backgroundColor: 'rgba(14, 81, 159, 0.08)',
              borderRadius: 16,
              borderWidth: 2,
              borderColor: focusedField === 'password' ? '#0E519F' : 'rgba(14, 81, 159, 0.15)',
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
            }}>
              <Icon source="lock-outline" size={22} color="rgba(14, 81, 159, 0.5)" />
              <TextInput
                mode='flat'
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                style={{ 
                  flex: 1,
                  backgroundColor: 'transparent',
                  fontSize: 16,
                }}
                placeholder="Create a password"
                placeholderTextColor='rgba(14, 81, 159, 0.4)'
                textColor='#0f172a'
                underlineColor='transparent'
                activeUnderlineColor='transparent'
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                cursorColor='#0E519F'
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Icon
                  source={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color="rgba(14, 81, 159, 0.5)"
                />
              </Pressable>
            </View>
            <PasswordStrength password={password} />
          </Animated.View>
        )

      case 6:
        return (
          <Animated.View 
            key="step-6"
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(300)}
            style={{ alignItems: 'center' }}
          >
            {/* Profile Photo */}
            <Pressable
              onPress={pickImage}
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: 'rgba(14, 81, 159, 0.08)',
                borderWidth: 4,
                borderColor: profileImage ? '#0E519F' : 'rgba(14, 81, 159, 0.3)',
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
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: 16,
                }}
              >
                <Text style={{ fontSize: 13, color: '#ef4444', fontWeight: '500' }}>
                  Remove Photo
                </Text>
              </Pressable>
            )}
          </Animated.View>
        )

      default:
        return null
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Floating Card Container */}
        <View style={{ 
          flex: 1,
          marginHorizontal: 10,
          marginTop: Platform.OS === 'ios' ? 60 : 40,
          marginBottom: Platform.OS === 'ios' ? 12 : 10,
          backgroundColor: '#ffffff',
          borderRadius: 40,
          overflow: 'hidden',
          shadowColor: '#0E519F',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 20,
        }}>
          {/* Header */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 11, color: 'rgba(14, 81, 159, 0.7)', fontWeight: '600', letterSpacing: 1 }}>
                STEP {currentStep + 1} OF {TOTAL_STEPS}
              </Text>
              {currentStep === 6 && (
                <Pressable 
                  onPress={handleNext} 
                  style={{ 
                    paddingVertical: 5, 
                    paddingHorizontal: 12,
                    backgroundColor: 'rgba(14, 81, 159, 0.1)',
                    borderRadius: 14,
                  }}
                >
                  <Text style={{ fontSize: 12, color: '#0E519F', fontWeight: '500' }}>
                    Skip
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Progress Bars */}
            <View style={{ flexDirection: 'row', gap: 5 }}>
              {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
                <View
                  key={index}
                  style={{
                    flex: 1,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: index <= currentStep ? '#0E519F' : 'rgba(14, 81, 159, 0.2)',
                  }}
                />
              ))}
            </View>
          </View>

          <ScrollView 
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ flex: 1, paddingHorizontal: 20 }}>
              {/* Title Section */}
              <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 24 }}>
                <Text style={{
                  fontSize: 24,
                  color: '#0E519F',
                  fontWeight: '700',
                  textAlign: 'center',
                  marginBottom: 8,
                }}>
                  {getStepTitle()}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: 'rgba(14, 81, 159, 0.6)',
                  textAlign: 'center',
                }}>
                  {getStepSubtitle()}
                </Text>
              </View>

              {/* Content */}
              <View style={{ flex: 1 }}>
                {renderStepContent()}

                {/* Error message */}
                {error ? (
                  <Animated.View entering={FadeIn.duration(200)} style={{ marginTop: 16 }}>
                    <Text style={{ 
                      color: '#EF4444', 
                      fontSize: 14, 
                      fontWeight: '500',
                      textAlign: 'center',
                    }}>
                      {error}
                    </Text>
                  </Animated.View>
                ) : null}
              </View>

              {/* Bottom Section */}
              <View style={{ paddingBottom: 20, paddingTop: 20 }}>
                {/* Navigation Buttons */}
                <View style={{
                  flexDirection: 'row',
                  gap: 10,
                }}>
                  {currentStep > 0 && (
                    <Pressable
                      onPress={handleBack}
                      style={{
                        width: 50,
                        height: 50,
                        backgroundColor: 'rgba(14, 81, 159, 0.1)',
                        borderRadius: 25,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon source="arrow-left" size={22} color="#0E519F" />
                    </Pressable>
                  )}
                  <Animated.View style={[{ flex: 1 }, buttonAnimatedStyle]}>
                    <Pressable
                      onPress={handleNext}
                      disabled={loading}
                      style={{
                        height: 50,
                        backgroundColor: isCodeCorrect() 
                          ? '#22C55E' 
                          : canProceed() 
                            ? '#0E519F' 
                            : 'rgba(14, 81, 159, 0.3)',
                        borderRadius: 25,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <Text style={{
                            fontSize: 16,
                            color: '#ffffff',
                            fontWeight: '600',
                          }}>
                            {currentStep === TOTAL_STEPS - 1 
                              ? 'Create Account' 
                              : currentStep === 4 
                                ? (isCodeCorrect() ? 'Verified!' : 'Verify')
                                : 'Continue'}
                          </Text>
                          {currentStep < TOTAL_STEPS - 1 && currentStep !== 4 && (
                            <Icon source="arrow-right" size={20} color="#ffffff" />
                          )}
                          {currentStep === 4 && (
                            <Icon source={isCodeCorrect() ? "check-circle" : "shield-check"} size={20} color="#ffffff" />
                          )}
                        </>
                      )}
                    </Pressable>
                  </Animated.View>
                </View>

                {/* Social sign up - only show on first step */}
                {currentStep === 0 && (
                  <>
                    <View style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      marginVertical: 20,
                    }}>
                      <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(14, 81, 159, 0.15)' }} />
                      <Text style={{ 
                        color: 'rgba(14, 81, 159, 0.5)', 
                        marginHorizontal: 16,
                        fontSize: 13,
                      }}>
                        or continue with
                      </Text>
                      <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(14, 81, 159, 0.15)' }} />
                    </View>

                    <View style={{ gap: 12 }}>
                      {Platform.OS === 'ios' && (
                        <Pressable
                          onPress={handleAppleSignUp}
                          style={{
                            backgroundColor: '#0f172a',
                            paddingVertical: 14,
                            borderRadius: 25,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon source='apple' size={22} color='#fff' />
                          <Text style={{
                            color: '#fff',
                            fontWeight: '600',
                            fontSize: 15,
                            marginLeft: 10,
                          }}>
                            Continue with Apple
                          </Text>
                        </Pressable>
                      )}

                      <Pressable
                        onPress={handleGoogleSignUp}
                        style={{
                          backgroundColor: 'rgba(14, 81, 159, 0.08)',
                          paddingVertical: 14,
                          borderRadius: 25,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1,
                          borderColor: 'rgba(14, 81, 159, 0.15)',
                        }}
                      >
                        <Icon source='google' size={22} color='#0f172a' />
                        <Text style={{
                          color: '#0f172a',
                          fontWeight: '600',
                          fontSize: 15,
                          marginLeft: 10,
                        }}>
                          Continue with Google
                        </Text>
                      </Pressable>
                    </View>

                    {/* Already have account link */}
                    <Link href='/SignIn' asChild>
                      <Pressable style={{
                        marginTop: 20,
                        alignItems: 'center',
                      }}>
                        <Text style={{ 
                          color: 'rgba(14, 81, 159, 0.6)', 
                          fontSize: 14,
                        }}>
                          Already have an account?{' '}
                          <Text style={{ color: '#0E519F', fontWeight: '600' }}>
                            Sign In
                          </Text>
                        </Text>
                      </Pressable>
                    </Link>

                    {/* Continue as Guest Button */}
                    <Pressable
                      onPress={async () => {
                        const { error } = await supabase.auth.signInAnonymously()
                        if (error) console.log(error)
                      }}
                      style={{
                        marginTop: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 12,
                      }}
                    >
                      <Text style={{ 
                        color: 'rgba(14, 81, 159, 0.6)', 
                        fontSize: 14,
                        fontWeight: '500',
                        textDecorationLine: 'underline',
                      }}>
                        Continue as Guest
                      </Text>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

export default SignUp
