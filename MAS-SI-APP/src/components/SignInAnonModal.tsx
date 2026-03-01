import { View, Text, Pressable, Dimensions, Platform, Modal, ScrollView, Keyboard } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { TextInput, Icon } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import * as AppleAuthentication from 'expo-apple-authentication'
import { useAuth } from '../providers/AuthProvider';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

// Configure Google Sign-In once at module level
GoogleSignin.configure({
  iosClientId: '954205600936-3fvho6btee6op0l226scerlhsirsjprc.apps.googleusercontent.com',
  webClientId: '954205600936-pb00kg6p7dojg8es9ub8bb7l09j5kj36.apps.googleusercontent.com',
  scopes: ['profile', 'email'],
  offlineAccess: false,
});

const { height: SCREEN_HEIGHT, width } = Dimensions.get('window')

// Height for different screens - keeping sheet compact like Flighty app
const getScreenHeight = (screen: 'landing' | 'signIn') => {
  if (screen === 'landing') return SCREEN_HEIGHT * 0.32
  return SCREEN_HEIGHT * 0.55  // Smaller sheet that doesn't cover the whole screen
}

type SignInAnonModalProps = {
  visible: boolean
  setVisible: () => void
  dismissable?: boolean
  showLanding?: boolean
  onSignUpPress?: () => void
  onContinueAsGuest?: () => void  // Callback when user wants to continue as guest
  bottomOffset?: number  // For positioning above tab bar
  onDismiss?: () => void  // Callback when sheet is dismissed (touch outside or drag down)
}

type ScreenState = 'landing' | 'signIn' | 'signUp'

const SignInAnonModal = ({ visible, setVisible, dismissable = true, showLanding = false, onSignUpPress, onContinueAsGuest, bottomOffset = 0, onDismiss }: SignInAnonModalProps) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>(showLanding ? 'landing' : 'signIn')
  const [signIn, setSignIn] = useState(true)
  const { session } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  // Reanimated shared values for smooth animations
  const slideY = useSharedValue(SCREEN_HEIGHT * 0.6)
  const backdropOpacity = useSharedValue(0)
  const sheetHeight = useSharedValue(getScreenHeight(showLanding ? 'landing' : 'signIn'))
  const contentOpacity = useSharedValue(1)
  const keyboardHeight = useRef(0)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

  // Keyboard handling - move sheet up to show email/password fields
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        keyboardHeight.current = e.endCoordinates.height
        setIsKeyboardVisible(true)
        // Move sheet up to show input fields above keyboard
        // Only need to show header + email + password + button (~280px)
        const sheetContentHeight = 300
        const availableSpace = SCREEN_HEIGHT - e.endCoordinates.height
        const moveUpBy = Math.max(0, sheetContentHeight - availableSpace + getScreenHeight('signIn'))
        slideY.value = withTiming(-moveUpBy + 50, { duration: 250 })
      }
    )

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        keyboardHeight.current = 0
        setIsKeyboardVisible(false)
        // Move sheet back to original position
        slideY.value = withTiming(0, { duration: 250 })
      }
    )

    return () => {
      keyboardWillShow.remove()
      keyboardWillHide.remove()
    }
  }, [currentScreen])

  // Animate height smoothly when screen changes
  useEffect(() => {
    if (!isKeyboardVisible) {
      const targetHeight = getScreenHeight(currentScreen === 'landing' ? 'landing' : 'signIn')
      sheetHeight.value = withSpring(targetHeight, {
        damping: 20,
        stiffness: 90,
        mass: 0.5,
      })
    }
  }, [currentScreen, isKeyboardVisible])

  useEffect(() => {
    if (visible) {
      // Reset to landing if showLanding is true
      if (showLanding) {
        setCurrentScreen('landing')
        sheetHeight.value = getScreenHeight('landing')
      }
      slideY.value = withSpring(0, {
        damping: 20,
        stiffness: 90,
        mass: 0.5,
      })
      backdropOpacity.value = withTiming(1, { duration: 400 })
    } else {
      slideY.value = SCREEN_HEIGHT * 0.6
      backdropOpacity.value = 0
    }
  }, [visible])

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }))

  const sheetStyle = useAnimatedStyle(() => ({
    height: sheetHeight.value,
    maxHeight: SCREEN_HEIGHT * 0.85,
    transform: [{ translateY: slideY.value }],
  }))

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }))

  const closeSheet = () => {
    setVisible()
    setCurrentScreen(showLanding ? 'landing' : 'signIn')
    setSignIn(true)
    setEmail('')
    setPassword('')
    setName('')
  }

  // Smooth transition to sign-in screen
  const transitionToSignIn = () => {
    setIsTransitioning(true)
    
    // Fade out current content
    contentOpacity.value = withTiming(0, { duration: 200 }, () => {
      // Change screen on JS thread
      runOnJS(setCurrentScreen)('signIn')
      
      // Fade in new content smoothly
      contentOpacity.value = withTiming(1, { duration: 300 }, () => {
        runOnJS(setIsTransitioning)(false)
      })
    })
  }

  // Smooth transition back to landing
  const transitionToLanding = () => {
    setIsTransitioning(true)
    
    contentOpacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(setCurrentScreen)('landing')
      
      contentOpacity.value = withTiming(1, { duration: 300 }, () => {
        runOnJS(setIsTransitioning)(false)
      })
    })
  }

  // Helper function to handle dismiss completion (runs on JS thread)
  const handleDismissComplete = () => {
    closeSheet()
    if (onDismiss) {
      onDismiss()
    }
  }

  const handleDismiss = () => {
    if (!dismissable) return
    
    slideY.value = withTiming(SCREEN_HEIGHT * 0.6, { duration: 300 })
    backdropOpacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(handleDismissComplete)()
    })
  }

  // Helper function to handle backdrop press completion (runs on JS thread)
  const handleBackdropPressComplete = () => {
    closeSheet()
    if (onContinueAsGuest) {
      setTimeout(() => {
        onContinueAsGuest()
      }, 100)
    }
  }

  // Handle backdrop press - same as continue as guest
  const handleBackdropPress = () => {
    if (!dismissable) return
    
    slideY.value = withTiming(SCREEN_HEIGHT * 0.6, { duration: 300 })
    backdropOpacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(handleBackdropPressComplete)()
    })
  }

  // Pan gesture for drag-to-dismiss
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (!dismissable) return
      // Only allow dragging down (positive translationY)
      if (event.translationY > 0) {
        slideY.value = event.translationY
        // Fade backdrop as user drags
        backdropOpacity.value = Math.max(0, 1 - (event.translationY / 200))
      }
    })
    .onEnd((event) => {
      if (!dismissable) return
      // If dragged more than 100px down or with velocity, dismiss
      if (event.translationY > 100 || event.velocityY > 500) {
        slideY.value = withTiming(SCREEN_HEIGHT * 0.6, { duration: 300 })
        backdropOpacity.value = withTiming(0, { duration: 300 }, () => {
          runOnJS(handleDismissComplete)()
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

  const handleSignUpPress = () => {
    if (onSignUpPress) {
      onSignUpPress()
    }
  }

  const handleContinueAsGuest = () => {
    // Close the sheet first, then navigate
    closeSheet()
    
    // Small delay to ensure modal is closed before navigation
    setTimeout(() => {
      if (onContinueAsGuest) {
        onContinueAsGuest()
      }
    }, 100)
  }

  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices()
      const response = await GoogleSignin.signIn()
      const idToken = (response as any).data?.idToken || (response as any).idToken;
      const user = (response as any).data?.user || (response as any).user;
      if (idToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        })
        if (!error && data?.user) {
          // Update profile in background, close immediately
          supabase.from('profiles').update({ 
            first_name: user?.name || user?.givenName, 
            profile_email: user?.email 
          }).eq('id', data.user.id)
          closeSheet()
        } else {
          console.error('Supabase sign-in error:', error)
          alert(error?.message || 'Google sign-in failed')
        }
      } else {
        throw new Error('No ID token present!')
      }
    } catch (error: any) {
      console.log('Google Sign-In Error:', error)
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the login flow')
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in is in progress already')
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Play services not available or outdated')
      } else {
        alert(`Sign-in error: ${error.message || 'Unknown error'}`)
      }
    }
  }

  async function signInWithEmail() {
    setLoading(true);
    Keyboard.dismiss();
    
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) { 
      alert(error.message); 
      setLoading(false); 
      return;
    }
    
    // Quick dismiss on success - close immediately
    setLoading(false);
    closeSheet();
  }

  async function signUpWithEmail() {
    setLoading(true)
    if (email && password && name) {
      const {
        data: { session },
        error,
      } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            first_name: name,
            profile_email: email,
          },
        },
      })

      if (error) { alert(error.message); setLoading(false); return }
      setLoading(false)
      closeSheet()
    }
    else {
      alert("Enter Name")
      setLoading(false)
    }
  }

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })
      if (credential.identityToken) {
        const {
          error,
          data: { user },
        } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        })
        if (!error) {
          // Update profile in background, close immediately
          supabase.from('profiles').update({ profile_email: credential.email, first_name: credential.fullName?.givenName }).eq('id', user?.id)
          closeSheet()
        }
      } else {
        throw new Error('No identityToken.')
      }
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        // handle that the user canceled the sign-in flow
      } else {
        // handle other errors
      }
    }
  }

  if (!visible) return null

  // Landing Screen Content
  const renderLandingScreen = () => (
    <Animated.View style={[
      { 
        paddingHorizontal: 20, 
        paddingBottom: 16,
      },
      contentStyle
    ]}>
      {/* Sign In Button */}
      <Pressable
        onPress={transitionToSignIn}
        disabled={isTransitioning}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          height: 50,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
        }}
      >
        <Text style={{ fontSize: 17, fontWeight: '600', color: '#0F519F' }}>
          Sign In
        </Text>
      </Pressable>

      {/* Create Account Button */}
      <Pressable
        onPress={handleSignUpPress}
        disabled={isTransitioning}
        style={{
          backgroundColor: 'transparent',
          borderRadius: 12,
          height: 50,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: '#ffffff',
        }}
      >
        <Text style={{ fontSize: 17, fontWeight: '600', color: '#ffffff' }}>
          Create Account
        </Text>
      </Pressable>

      {/* Continue as Guest Button */}
      {onContinueAsGuest && (
        <Pressable
          onPress={handleContinueAsGuest}
          disabled={isTransitioning}
          style={{
            paddingVertical: 14,
            alignItems: 'center',
            marginTop: 8,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '500', color: 'rgba(255, 255, 255, 0.7)' }}>
            Continue as Guest
          </Text>
        </Pressable>
      )}
    </Animated.View>
  )

  // Sign In Screen Content
  const renderSignInScreen = () => (
    <Animated.View style={[{ flex: 1 }, contentStyle]}>
    <ScrollView 
      style={{ paddingHorizontal: 24, flex: 1 }}
      contentContainerStyle={{ paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
    >
      {/* Form */}
      {signIn ? (
        // Sign In Form
        <View style={{ gap: 16 }}>
          <TextInput
            mode='outlined'
            placeholder="Email"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}
            outlineColor='rgba(255, 255, 255, 0.3)'
            activeOutlineColor='rgba(255, 255, 255, 0.5)'
            value={email}
            onChangeText={setEmail}
            left={<TextInput.Icon icon="email-outline" color="#6b7280" />}
            textColor='#1f2937'
            placeholderTextColor='#6b7280'
            cursorColor='#1f2937'
            selectionColor='rgba(14, 81, 159, 0.3)'
            theme={{ roundness: 12, colors: { onSurfaceVariant: '#000000', primary: '#000000', onSurface: '#000000', outline: '#000000', text: '#000000' } }}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            mode='outlined'
            placeholder="Password"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}
            outlineColor='rgba(255, 255, 255, 0.3)'
            activeOutlineColor='rgba(255, 255, 255, 0.5)'
            value={password}
            onChangeText={setPassword}
            left={<TextInput.Icon icon="lock-outline" color="#6b7280" />}
            secureTextEntry
            textColor='#1f2937'
            placeholderTextColor='#6b7280'
            cursorColor='#1f2937'
            selectionColor='rgba(14, 81, 159, 0.3)'
            theme={{ roundness: 12, colors: { onSurfaceVariant: '#000000', primary: '#000000', onSurface: '#000000', outline: '#000000', text: '#000000' } }}
          />

          <Pressable
            onPress={() => {
              closeSheet();
              setTimeout(() => router.push('/ForgotPassword'), 300);
            }}
            style={{ alignSelf: 'flex-end', paddingVertical: 4 }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#ffffff' }}>
              Forgot Password?
            </Text>
          </Pressable>

        </View>
      ) : (
        // Sign Up Form
        <View style={{ gap: 16 }}>
          <TextInput
            mode='outlined'
            placeholder="Name"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}
            outlineColor='rgba(255, 255, 255, 0.3)'
            activeOutlineColor='rgba(255, 255, 255, 0.5)'
            value={name}
            onChangeText={setName}
            left={<TextInput.Icon icon="account-outline" color="#6b7280" />}
            textColor='#1f2937'
            placeholderTextColor='#6b7280'
            cursorColor='#1f2937'
            selectionColor='rgba(14, 81, 159, 0.3)'
            theme={{ roundness: 12, colors: { onSurfaceVariant: '#000000', primary: '#000000', onSurface: '#000000', outline: '#000000', text: '#000000' } }}
          />

          <TextInput
            mode='outlined'
            placeholder="Email"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}
            outlineColor='rgba(255, 255, 255, 0.3)'
            activeOutlineColor='rgba(255, 255, 255, 0.5)'
            value={email}
            onChangeText={setEmail}
            left={<TextInput.Icon icon="email-outline" color="#6b7280" />}
            textColor='#1f2937'
            placeholderTextColor='#6b7280'
            cursorColor='#1f2937'
            selectionColor='rgba(14, 81, 159, 0.3)'
            theme={{ roundness: 12, colors: { onSurfaceVariant: '#000000', primary: '#000000', onSurface: '#000000', outline: '#000000', text: '#000000' } }}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            mode='outlined'
            placeholder="Password"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}
            outlineColor='rgba(255, 255, 255, 0.3)'
            activeOutlineColor='rgba(255, 255, 255, 0.5)'
            value={password}
            onChangeText={setPassword}
            left={<TextInput.Icon icon="lock-outline" color="#6b7280" />}
            secureTextEntry
            textColor='#1f2937'
            placeholderTextColor='#6b7280'
            cursorColor='#1f2937'
            selectionColor='rgba(14, 81, 159, 0.3)'
            theme={{ roundness: 12, colors: { onSurfaceVariant: '#000000', primary: '#000000', onSurface: '#000000', outline: '#000000', text: '#000000' } }}
          />

        </View>
      )}

      {/* Continue Button */}
      <View style={{
        backgroundColor: '#ffffff',
        borderRadius: 12,
        height: 50,
        marginTop: 16,
        overflow: 'hidden',
      }}>
        <Pressable
          onPress={signIn ? signInWithEmail : signUpWithEmail}
          disabled={loading}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: loading ? 0.7 : 1,
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: '600', color: '#0F519F' }}>
            {loading ? (signIn ? 'Signing In...' : 'Creating Account...') : 'Continue'}
          </Text>
        </Pressable>
      </View>

      {/* Divider */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 24 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.3)' }} />
        <Text style={{ paddingHorizontal: 16, color: 'rgba(255, 255, 255, 0.7)', fontSize: 14 }}>OR</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.3)' }} />
      </View>

      {/* Social Sign In */}
      <View style={{ gap: 12 }}>
        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={12}
            style={{ width: '100%', height: 50 }}
            onPress={handleAppleSignIn}
          />
        )}
        <View style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          height: 50,
          width: '100%',
          overflow: 'hidden',
        }}>
          <Pressable
            onPress={handleGoogleSignIn}
            android_ripple={{ color: '#e0e0e0' }}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#4285F4',
              marginRight: 8,
            }}>G</Text>
            <Text style={{
              fontSize: 17,
              fontWeight: '500',
              color: '#000000',
              letterSpacing: 0.3,
            }}>
              Sign in with Google
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Switch Form */}
      <Pressable
        onPress={() => setSignIn(!signIn)}
        style={{ paddingVertical: 20, alignItems: 'center' }}
      >
        <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.8)' }}>
          {signIn ? "Don't have an account? " : "Already have an account? "}
          <Text style={{ color: '#ffffff', fontWeight: '600' }}>
            {signIn ? 'Sign Up' : 'Sign In'}
          </Text>
        </Text>
      </Pressable>

      {/* Continue as Guest Button */}
      {onContinueAsGuest && (
        <Pressable
          onPress={handleContinueAsGuest}
          style={{
            paddingVertical: 14,
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '500', color: 'rgba(255, 255, 255, 0.7)' }}>
            Continue as Guest
          </Text>
        </Pressable>
      )}
    </ScrollView>
    </Animated.View>
  )

  const getHeaderInfo = () => {
    if (currentScreen === 'landing') {
      return { title: 'Get Started', subtitle: 'Join the MAS community', icon: 'account-group' }
    }
    return signIn 
      ? { title: 'Welcome Back', subtitle: 'Sign in to continue', icon: 'login' }
      : { title: 'Create Account', subtitle: 'Join the MAS community', icon: 'account-plus' }
  }

  const headerInfo = getHeaderInfo()

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <Animated.View
        style={[
          {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
          },
          backdropStyle
        ]}
      >
        {dismissable && (
          <Pressable
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={handleBackdropPress}
          />
        )}

        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              {
                backgroundColor: '#0F519F',
                borderRadius: 50,
                marginHorizontal: 8,
                marginBottom: bottomOffset > 0 ? bottomOffset : 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 20,
                overflow: 'hidden',
              },
              sheetStyle
            ]}
          >
            {/* Handle - visual indicator for dragging */}
            <View style={{ alignItems: 'center', paddingTop: 16, paddingBottom: 10 }}>
              <View style={{
                width: 36,
                height: 4,
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
                borderRadius: 2,
              }} />
            </View>

            {/* Header Row - Back button on left, Welcome header on right */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              marginHorizontal: 14, 
              marginBottom: 12,
              gap: 10,
            }}>
              {/* Back Button - only show when on signIn screen and showLanding is true */}
              {currentScreen === 'signIn' && showLanding && (
                <Pressable
                  onPress={transitionToLanding}
                  disabled={isTransitioning}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <ArrowLeft color="#ffffff" size={22} strokeWidth={2.5} />
                </Pressable>
              )}

              {/* Header */}
              <View
                style={{
                  flex: 1,
                  borderRadius: 14,
                  paddingVertical: 14,
                  paddingHorizontal: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }}
              >
                {!(currentScreen === 'signIn' && showLanding) && (
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}>
                    <Icon source={headerInfo.icon} size={22} color="#ffffff" />
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 20,
                    fontWeight: '700',
                    color: '#ffffff',
                  }}>
                    {headerInfo.title}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginTop: 2,
                  }}>
                    {headerInfo.subtitle}
                  </Text>
                </View>

                {/* Close Button - only show if dismissable */}
                {dismissable && (
                  <Pressable
                    onPress={handleDismiss}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Icon source="close" size={18} color="#ffffff" />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Content based on current screen */}
            {currentScreen === 'landing' ? renderLandingScreen() : renderSignInScreen()}
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    </Modal>
  )
}

export default SignInAnonModal
