import { View, Text, StatusBar, Pressable, Platform, KeyboardAvoidingView, Alert, ScrollView } from 'react-native'
import React, { useState, useRef } from 'react'
import { Icon, TextInput, ActivityIndicator } from 'react-native-paper'
import { Stack, router } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

type Step = 'email' | 'otp' | 'password'

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [otpFocused, setOtpFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [confirmFocused, setConfirmFocused] = useState(false)
  const [error, setError] = useState('')

  const handleSendCode = async () => {
    const trimmed = email.trim()
    if (!trimmed || !/\S+@\S+\.\S+/.test(trimmed)) {
      setError('Please enter a valid email address')
      return
    }

    setError('')
    setLoading(true)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed)
      if (resetError) {
        setError(resetError.message)
      } else {
        setStep('otp')
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    const code = otpCode.trim()
    if (code.length < 6) {
      setError('Please enter the 6-digit code from your email')
      return
    }

    setError('')
    setLoading(true)
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: 'recovery',
      })
      if (verifyError) {
        setError(verifyError.message)
      } else {
        setStep('password')
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleSetPassword = async () => {
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setError('')
    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) {
        setError(updateError.message)
      } else {
        await supabase.auth.signOut()
        Alert.alert(
          'Password Updated',
          'Your password has been reset successfully. Please sign in with your new password.',
          [{ text: 'OK', onPress: () => router.replace('/SignIn') }]
        )
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const getStepConfig = () => {
    switch (step) {
      case 'email':
        return {
          icon: 'email-outline' as const,
          title: 'Forgot Password?',
          subtitle: 'Enter your email and we\'ll send you a 6-digit code to reset your password.',
        }
      case 'otp':
        return {
          icon: 'shield-key-outline' as const,
          title: 'Enter Code',
          subtitle: `We sent a 6-digit code to ${email.trim()}. Check your inbox and enter it below.`,
        }
      case 'password':
        return {
          icon: 'lock-reset' as const,
          title: 'New Password',
          subtitle: 'Enter your new password below.',
        }
    }
  }

  const config = getStepConfig()

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
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
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: 'center' }}>
              {/* Step indicator */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
                {(['email', 'otp', 'password'] as Step[]).map((s, i) => (
                  <View
                    key={s}
                    style={{
                      width: step === s ? 24 : 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: step === s ? '#0E519F' : 'rgba(14, 81, 159, 0.2)',
                    }}
                  />
                ))}
              </View>

              {/* Icon */}
              <View style={{ alignItems: 'center', marginBottom: 12 }}>
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: 'rgba(14, 81, 159, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Icon source={config.icon} size={40} color="#0E519F" />
                </View>
              </View>

              {/* Title */}
              <View style={{ alignItems: 'center', marginBottom: 32 }}>
                <Text style={{
                  fontSize: 28,
                  color: '#0E519F',
                  fontWeight: '700',
                  textAlign: 'center',
                  marginBottom: 8,
                }}>
                  {config.title}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: 'rgba(14, 81, 159, 0.6)',
                  textAlign: 'center',
                  paddingHorizontal: 10,
                  lineHeight: 20,
                }}>
                  {config.subtitle}
                </Text>
              </View>

              {/* Error message */}
              {error ? (
                <View style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <Icon source="alert-circle-outline" size={18} color="#EF4444" />
                  <Text style={{ color: '#EF4444', fontSize: 13, flex: 1 }}>{error}</Text>
                </View>
              ) : null}

              {/* Step: Email */}
              {step === 'email' && (
                <Animated.View entering={FadeIn.duration(300)}>
                  <View style={{
                    backgroundColor: 'rgba(14, 81, 159, 0.08)',
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: emailFocused ? '#0E519F' : 'rgba(14, 81, 159, 0.15)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    marginBottom: 20,
                  }}>
                    <Icon source="email-outline" size={22} color={emailFocused ? '#0E519F' : 'rgba(14, 81, 159, 0.5)'} />
                    <TextInput
                      mode="flat"
                      value={email}
                      onChangeText={(text) => { setEmail(text); setError('') }}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      style={{ flex: 1, backgroundColor: 'transparent', fontSize: 16 }}
                      placeholder="Email Address"
                      placeholderTextColor="rgba(14, 81, 159, 0.4)"
                      textColor="#0f172a"
                      underlineColor="transparent"
                      activeUnderlineColor="transparent"
                      selectionColor="#0E519F"
                      cursorColor="#0E519F"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoFocus
                    />
                  </View>

                  <Pressable
                    onPress={handleSendCode}
                    disabled={loading}
                    style={{
                      height: 50,
                      backgroundColor: email.trim().length > 0 ? '#0E519F' : 'rgba(14, 81, 159, 0.3)',
                      borderRadius: 25,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <>
                        <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 16 }}>
                          Send Reset Code
                        </Text>
                        <Icon source="arrow-right" size={20} color="#ffffff" />
                      </>
                    )}
                  </Pressable>
                </Animated.View>
              )}

              {/* Step: OTP */}
              {step === 'otp' && (
                <Animated.View entering={FadeIn.duration(300)}>
                  <View style={{
                    backgroundColor: 'rgba(14, 81, 159, 0.08)',
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: otpFocused ? '#0E519F' : 'rgba(14, 81, 159, 0.15)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    marginBottom: 16,
                  }}>
                    <Icon source="numeric" size={22} color={otpFocused ? '#0E519F' : 'rgba(14, 81, 159, 0.5)'} />
                    <TextInput
                      mode="flat"
                      value={otpCode}
                      onChangeText={(text) => { setOtpCode(text.replace(/[^0-9]/g, '').slice(0, 6)); setError('') }}
                      onFocus={() => setOtpFocused(true)}
                      onBlur={() => setOtpFocused(false)}
                      style={{ flex: 1, backgroundColor: 'transparent', fontSize: 24, letterSpacing: 8, textAlign: 'center' }}
                      placeholder="000000"
                      placeholderTextColor="rgba(14, 81, 159, 0.25)"
                      textColor="#0f172a"
                      underlineColor="transparent"
                      activeUnderlineColor="transparent"
                      selectionColor="#0E519F"
                      cursorColor="#0E519F"
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus
                    />
                  </View>

                  {/* Resend code */}
                  <Pressable
                    onPress={handleSendCode}
                    disabled={loading}
                    style={{ alignSelf: 'center', marginBottom: 20 }}
                  >
                    <Text style={{ color: '#0E519F', fontWeight: '500', fontSize: 14, textDecorationLine: 'underline' }}>
                      Didn't get the code? Resend
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleVerifyOtp}
                    disabled={loading}
                    style={{
                      height: 50,
                      backgroundColor: otpCode.length === 6 ? '#0E519F' : 'rgba(14, 81, 159, 0.3)',
                      borderRadius: 25,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <>
                        <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 16 }}>
                          Verify Code
                        </Text>
                        <Icon source="arrow-right" size={20} color="#ffffff" />
                      </>
                    )}
                  </Pressable>
                </Animated.View>
              )}

              {/* Step: New Password */}
              {step === 'password' && (
                <Animated.View entering={FadeIn.duration(300)}>
                  {/* New password */}
                  <View style={{
                    backgroundColor: 'rgba(14, 81, 159, 0.08)',
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: passwordFocused ? '#0E519F' : 'rgba(14, 81, 159, 0.15)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    marginBottom: 16,
                  }}>
                    <Icon source="lock-outline" size={22} color={passwordFocused ? '#0E519F' : 'rgba(14, 81, 159, 0.5)'} />
                    <TextInput
                      mode="flat"
                      value={newPassword}
                      onChangeText={(text) => { setNewPassword(text); setError('') }}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      style={{ flex: 1, backgroundColor: 'transparent', fontSize: 16 }}
                      placeholder="New Password"
                      placeholderTextColor="rgba(14, 81, 159, 0.4)"
                      textColor="#0f172a"
                      underlineColor="transparent"
                      activeUnderlineColor="transparent"
                      secureTextEntry={!showPassword}
                      selectionColor="#0E519F"
                      cursorColor="#0E519F"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoFocus
                    />
                    <Pressable onPress={() => setShowPassword(!showPassword)}>
                      <Icon source={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="rgba(14, 81, 159, 0.5)" />
                    </Pressable>
                  </View>

                  {/* Confirm password */}
                  <View style={{
                    backgroundColor: 'rgba(14, 81, 159, 0.08)',
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: confirmFocused ? '#0E519F' : 'rgba(14, 81, 159, 0.15)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    marginBottom: 24,
                  }}>
                    <Icon source="lock-check-outline" size={22} color={confirmFocused ? '#0E519F' : 'rgba(14, 81, 159, 0.5)'} />
                    <TextInput
                      mode="flat"
                      value={confirmPassword}
                      onChangeText={(text) => { setConfirmPassword(text); setError('') }}
                      onFocus={() => setConfirmFocused(true)}
                      onBlur={() => setConfirmFocused(false)}
                      style={{ flex: 1, backgroundColor: 'transparent', fontSize: 16 }}
                      placeholder="Confirm New Password"
                      placeholderTextColor="rgba(14, 81, 159, 0.4)"
                      textColor="#0f172a"
                      underlineColor="transparent"
                      activeUnderlineColor="transparent"
                      secureTextEntry={!showConfirmPassword}
                      selectionColor="#0E519F"
                      cursorColor="#0E519F"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <Icon source={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="rgba(14, 81, 159, 0.5)" />
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={handleSetPassword}
                    disabled={loading}
                    style={{
                      height: 50,
                      backgroundColor: (newPassword.length > 0 && confirmPassword.length > 0) ? '#0E519F' : 'rgba(14, 81, 159, 0.3)',
                      borderRadius: 25,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <>
                        <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 16 }}>
                          Reset Password
                        </Text>
                        <Icon source="check" size={20} color="#ffffff" />
                      </>
                    )}
                  </Pressable>
                </Animated.View>
              )}

              {/* Back to Sign In */}
              <Pressable
                onPress={() => router.back()}
                style={{ marginTop: 24, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 }}
              >
                <Text style={{
                  color: 'rgba(14, 81, 159, 0.6)',
                  fontSize: 14,
                  fontWeight: '500',
                  textDecorationLine: 'underline',
                }}>
                  Back to Sign In
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}
