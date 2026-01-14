import { View, Text, Pressable, Dimensions, Platform, Modal, ScrollView, Keyboard } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { Button, Divider, TextInput, Icon } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import * as AppleAuthentication from 'expo-apple-authentication'
import { useAuth } from '../providers/AuthProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { User, LogIn, UserPlus, ArrowLeft } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';

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
}

type ScreenState = 'landing' | 'signIn' | 'signUp'

const SignInAnonModal = ({ visible, setVisible, dismissable = true, showLanding = false, onSignUpPress, onContinueAsGuest, bottomOffset = 0 }: SignInAnonModalProps) => {
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

  const handleDismiss = () => {
    if (!dismissable) return
    
    slideY.value = withTiming(SCREEN_HEIGHT * 0.6, { duration: 300 })
    backdropOpacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(closeSheet)()
    })
  }

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
    GoogleSignin.configure({
      iosClientId: '991344123272-nk55l8nc7dcloc56m6mmnvnkhdtjfcbf.apps.googleusercontent.com'
    })

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
        if (!error) {
          // Update profile in background, close immediately
          supabase.from('profiles').update({ first_name: user?.name, profile_email: user?.email }).eq('id', data?.user.id)
          closeSheet()
        }
      } else {
        throw new Error('no ID token present!')
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // play services not available or outdated
      } else {
        // some other error happened
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
          backgroundColor: '#0E519F',
          borderRadius: 12,
          height: 50,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
        }}
      >
        <Text style={{ fontSize: 17, fontWeight: '600', color: '#ffffff' }}>
          Sign In
        </Text>
      </Pressable>

      {/* Create Account Button */}
      <Pressable
        onPress={handleSignUpPress}
        disabled={isTransitioning}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          height: 50,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: '#0E519F',
        }}
      >
        <Text style={{ fontSize: 17, fontWeight: '600', color: '#0E519F' }}>
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
          <Text style={{ fontSize: 15, fontWeight: '500', color: '#6b7280' }}>
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
            label="Email"
            style={{ backgroundColor: "#f8f9fa" }}
            outlineColor='#e0e0e0'
            activeOutlineColor='#0E519F'
            value={email}
            onChangeText={setEmail}
            left={<TextInput.Icon icon="email-outline" color="#6b7280" />}
            textColor='#1f2937'
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            mode='outlined'
            label="Password"
            style={{ backgroundColor: "#f8f9fa" }}
            outlineColor='#e0e0e0'
            activeOutlineColor='#0E519F'
            value={password}
            onChangeText={setPassword}
            left={<TextInput.Icon icon="lock-outline" color="#6b7280" />}
            secureTextEntry
            textColor='#1f2937'
          />

          <Pressable
            onPress={signInWithEmail}
            disabled={loading}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#0a4080' : '#0E519F',
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              opacity: loading ? 0.7 : 1,
              marginTop: 16,
            })}
          >
            <Text style={{ fontSize: 17, fontWeight: '600', color: '#ffffff' }}>
              {loading ? 'Signing In...' : 'Continue'}
            </Text>
          </Pressable>
        </View>
      ) : (
        // Sign Up Form
        <View style={{ gap: 16 }}>
          <TextInput
            mode='outlined'
            label="Name"
            style={{ backgroundColor: "#f8f9fa" }}
            outlineColor='#e0e0e0'
            activeOutlineColor='#0E519F'
            value={name}
            onChangeText={setName}
            left={<TextInput.Icon icon="account-outline" color="#6b7280" />}
            textColor='#1f2937'
          />

          <TextInput
            mode='outlined'
            label="Email"
            style={{ backgroundColor: "#f8f9fa" }}
            outlineColor='#e0e0e0'
            activeOutlineColor='#0E519F'
            value={email}
            onChangeText={setEmail}
            left={<TextInput.Icon icon="email-outline" color="#6b7280" />}
            textColor='#1f2937'
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            mode='outlined'
            label="Password"
            style={{ backgroundColor: "#f8f9fa" }}
            outlineColor='#e0e0e0'
            activeOutlineColor='#0E519F'
            value={password}
            onChangeText={setPassword}
            left={<TextInput.Icon icon="lock-outline" color="#6b7280" />}
            secureTextEntry
            textColor='#1f2937'
          />

          <Pressable
            onPress={signUpWithEmail}
            disabled={loading}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#0a4080' : '#0E519F',
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              opacity: loading ? 0.7 : 1,
              marginTop: 8,
            })}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#ffffff' }}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Divider */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 24 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
        <Text style={{ paddingHorizontal: 16, color: '#9ca3af', fontSize: 14 }}>OR</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
      </View>

      {/* Social Sign In */}
      <View style={{ gap: 12 }}>
        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={12}
            style={{ width: '100%', height: 50 }}
            onPress={handleAppleSignIn}
          />
        )}
        <View style={{ borderRadius: 20, overflow: 'hidden' }}>
          <GoogleSigninButton
            size={GoogleSigninButton.Size.Wide}
            color={GoogleSigninButton.Color.Dark}
            style={{ width: '100%', height: 65 }}
            onPress={handleGoogleSignIn}
          />
        </View>
      </View>

      {/* Switch Form */}
      <Pressable
        onPress={() => setSignIn(!signIn)}
        style={{ paddingVertical: 20, alignItems: 'center' }}
      >
        <Text style={{ fontSize: 14, color: '#6b7280' }}>
          {signIn ? "Don't have an account? " : "Already have an account? "}
          <Text style={{ color: '#0E519F', fontWeight: '600' }}>
            {signIn ? 'Sign Up' : 'Sign In'}
          </Text>
        </Text>
      </Pressable>
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
            onPress={handleDismiss}
          />
        )}

        <Animated.View
          style={[
            {
              backgroundColor: '#ffffff',
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
            {/* Handle */}
            <View style={{ alignItems: 'center', paddingTop: 16, paddingBottom: 10 }}>
              <View style={{
                width: 36,
                height: 4,
                backgroundColor: '#d1d5db',
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
                    backgroundColor: '#0E519F',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <ArrowLeft color="#ffffff" size={22} strokeWidth={2.5} />
                </Pressable>
              )}

              {/* Header */}
              <LinearGradient
                colors={['#0E519F', '#1a6bc7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flex: 1,
                  borderRadius: 14,
                  paddingVertical: 14,
                  paddingHorizontal: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                {!(currentScreen === 'signIn' && showLanding) && (
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
                    color: 'rgba(255, 255, 255, 0.8)',
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
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Icon source="close" size={18} color="#ffffff" />
                  </Pressable>
                )}
              </LinearGradient>
            </View>

            {/* Content based on current screen */}
            {currentScreen === 'landing' ? renderLandingScreen() : renderSignInScreen()}
          </Animated.View>
      </Animated.View>
    </Modal>
  )
}

export default SignInAnonModal
