import { View, Text, Dimensions, StatusBar, Pressable, Platform, KeyboardAvoidingView, ScrollView } from 'react-native'
import React, { useState } from 'react'
import { Icon, TextInput, ActivityIndicator } from 'react-native-paper'
import { Link, Stack, router } from "expo-router"
import { supabase } from '@/src/lib/supabase'
import * as AppleAuthentication from 'expo-apple-authentication'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  withSequence,
  FadeIn,
} from 'react-native-reanimated'
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin'

// Configure Google Sign-In once
GoogleSignin.configure({
  iosClientId: '991344123272-nk55l8nc7dcloc56m6mmnvnkhdtjfcbf.apps.googleusercontent.com',
  webClientId: '991344123272-p3p68bb5kk77j6f36fij21t42ovhcr93.apps.googleusercontent.com',
  scopes: ['profile', 'email'],
  offlineAccess: false,
})

const { width, height } = Dimensions.get('window')

const SignIn = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({ email: '', password: '' })
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  // Animation values
  const buttonScale = useSharedValue(1)

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }))

  const canSignIn = () => {
    return email.trim().length > 0 && password.length > 0
  }

  const validateForm = () => {
    let valid = true
    const newErrors = { email: '', password: '' }

    if (!email.trim()) {
      newErrors.email = 'Email is required'
      valid = false
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email'
      valid = false
    }

    if (!password) {
      newErrors.password = 'Password is required'
      valid = false
    }

    setErrors(newErrors)
    return valid
  }

  const handleGoogleSignIn = async () => {
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
          alert(error?.message || 'Google sign-in failed')
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
        alert(`Sign-in error: ${error.message || 'Unknown error'}`)
      }
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

  async function signInWithEmail() {
    if (!validateForm()) {
      buttonScale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withSpring(1, { damping: 10 })
      )
      return
    }

    setLoading(true)
    buttonScale.value = withTiming(0.98, { duration: 100 })

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      if (error) {
        alert(error.message)
      }
    } catch (error: any) {
      alert(error.message || 'An error occurred during sign in')
    } finally {
      setLoading(false)
      buttonScale.value = withSpring(1)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
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
          {/* Handle */}
          <View style={{
            width: 36,
            height: 4,
            backgroundColor: 'rgba(14, 81, 159, 0.3)',
            borderRadius: 2,
            alignSelf: 'center',
            marginTop: 10,
            marginBottom: 10,
          }} />

          <ScrollView 
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ flex: 1, paddingHorizontal: 20 }}>
              {/* Title Section */}
              <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 24 }}>
                <Text style={{
                  fontSize: 28,
                  color: '#0E519F',
                  fontWeight: '700',
                  textAlign: 'center',
                  marginBottom: 8,
                }}>
                  Welcome Back
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: 'rgba(14, 81, 159, 0.6)',
                  textAlign: 'center',
                }}>
                  Sign in to continue
                </Text>
              </View>

              {/* New Member Link */}
              <Link href='/SignUp' asChild>
                <Pressable style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  alignSelf: 'center',
                  backgroundColor: 'rgba(14, 81, 159, 0.1)',
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 20,
                  marginBottom: 24,
                }}>
                  <Text style={{ 
                    color: '#0E519F', 
                    fontWeight: '500',
                    marginRight: 8,
                  }}>
                    New member?
                  </Text>
                  <Icon source='arrow-right' size={18} color='#0E519F' />
                </Pressable>
              </Link>

              {/* Form Section */}
              <View style={{ flex: 1 }}>
                {/* Email Input */}
                <View style={{ marginBottom: 16 }}>
                  <View style={{
                    backgroundColor: 'rgba(14, 81, 159, 0.08)',
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: errors.email ? '#EF4444' : emailFocused ? '#0E519F' : 'rgba(14, 81, 159, 0.15)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                  }}>
                    <Icon 
                      source="email-outline" 
                      size={22} 
                      color={errors.email ? '#EF4444' : emailFocused ? '#0E519F' : 'rgba(14, 81, 159, 0.5)'} 
                    />
                    <TextInput
                      mode='flat'
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text)
                        if (errors.email) {
                          setErrors(prev => ({ ...prev, email: '' }))
                        }
                      }}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      style={{ 
                        flex: 1,
                        backgroundColor: 'transparent',
                        fontSize: 16,
                      }}
                      placeholder="Email Address"
                      placeholderTextColor='rgba(14, 81, 159, 0.4)'
                      textColor='#0f172a'
                      underlineColor='transparent'
                      activeUnderlineColor='transparent'
                      selectionColor='#0E519F'
                      cursorColor='#0E519F'
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  {errors.email && (
                    <Text style={{ 
                      color: '#EF4444', 
                      fontSize: 12, 
                      marginTop: 4, 
                      marginLeft: 16,
                    }}>
                      {errors.email}
                    </Text>
                  )}
                </View>

                {/* Password Input */}
                <View style={{ marginBottom: 12 }}>
                  <View style={{
                    backgroundColor: 'rgba(14, 81, 159, 0.08)',
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: errors.password ? '#EF4444' : passwordFocused ? '#0E519F' : 'rgba(14, 81, 159, 0.15)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                  }}>
                    <Icon 
                      source="lock-outline" 
                      size={22} 
                      color={errors.password ? '#EF4444' : passwordFocused ? '#0E519F' : 'rgba(14, 81, 159, 0.5)'} 
                    />
                    <TextInput
                      mode='flat'
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text)
                        if (errors.password) {
                          setErrors(prev => ({ ...prev, password: '' }))
                        }
                      }}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      style={{ 
                        flex: 1,
                        backgroundColor: 'transparent',
                        fontSize: 16,
                      }}
                      placeholder="Password"
                      placeholderTextColor='rgba(14, 81, 159, 0.4)'
                      textColor='#0f172a'
                      underlineColor='transparent'
                      activeUnderlineColor='transparent'
                      secureTextEntry={!showPassword}
                      selectionColor='#0E519F'
                      cursorColor='#0E519F'
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <Pressable onPress={() => setShowPassword(!showPassword)}>
                      <Icon 
                        source={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                        size={22} 
                        color='rgba(14, 81, 159, 0.5)' 
                      />
                    </Pressable>
                  </View>
                  {errors.password && (
                    <Text style={{ 
                      color: '#EF4444', 
                      fontSize: 12, 
                      marginTop: 4, 
                      marginLeft: 16,
                    }}>
                      {errors.password}
                    </Text>
                  )}
                </View>

                {/* Forgot Password */}
                <Pressable style={{ alignSelf: 'flex-end', marginBottom: 20 }}>
                  <Text style={{
                    color: '#0E519F',
                    fontWeight: '500',
                    fontSize: 14,
                  }}>
                    Forgot Password?
                  </Text>
                </Pressable>
              </View>

              {/* Bottom Section */}
              <View style={{ paddingBottom: 20 }}>
                {/* Sign In Button */}
                <Animated.View style={[{ marginBottom: 16 }, buttonAnimatedStyle]}>
                  <Pressable
                    onPress={signInWithEmail}
                    disabled={loading}
                    style={{
                      height: 50,
                      backgroundColor: canSignIn() ? '#0E519F' : 'rgba(14, 81, 159, 0.3)',
                      borderRadius: 25,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color='#ffffff' size="small" />
                    ) : (
                      <>
                        <Text style={{
                          color: '#ffffff',
                          fontWeight: '600',
                          fontSize: 16,
                        }}>
                          Sign In
                        </Text>
                        <Icon source='arrow-right' size={20} color='#ffffff' />
                      </>
                    )}
                  </Pressable>
                </Animated.View>

                {/* Divider */}
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

                {/* Social Sign In Buttons */}
                <View style={{ gap: 12 }}>
                  {Platform.OS === 'ios' && (
                    <Pressable
                      onPress={handleAppleSignIn}
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
                    onPress={handleGoogleSignIn}
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
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

export default SignIn
