import { View, Text, Image, Pressable } from 'react-native'
import { Divider, Icon, IconButton, TextInput, Button } from 'react-native-paper';
import React, { useEffect, useState } from 'react'
import { supabase } from '@/src/lib/supabase';
import { Stack, Link } from 'expo-router';
import Animated , { useAnimatedStyle, useSharedValue, withTiming, Easing, ReduceMotion } from 'react-native-reanimated';
import { StatusBar } from "react-native"
import { Platform } from 'react-native'
import * as AppleAuthentication from 'expo-apple-authentication'
import { useAuth } from '@/src/providers/AuthProvider';
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';
const SignIn = () => {
    const [loading, setLoading] = useState(false);
    const [ email, setEmail ] = useState("")
    const [ password, setPassword] = useState("")
    const { session } = useAuth()
    const logoAnime = useSharedValue(0)
    const logoBounce = useSharedValue(-200)

    const GoogleButtonSignUp = () => {
      GoogleSignin.configure({
        iosClientId : '991344123272-nk55l8nc7dcloc56m6mmnvnkhdtjfcbf.apps.googleusercontent.com'
      })
    
      return (
        <GoogleSigninButton
          size={GoogleSigninButton.Size.Wide}
          style={[ 
            Platform.OS == 'android' ? {
              height : 64
            } : {height: 48}
          ]}
          color={GoogleSigninButton.Color.Dark}
          onPress={async () => {
            try {
              await GoogleSignin.hasPlayServices()
              const userInfo = await GoogleSignin.signIn()
              if (userInfo.idToken) {
                const { data, error } = await supabase.auth.signInWithIdToken({
                  provider: 'google',
                  token: userInfo.idToken,
                })
                console.log(userInfo)
                if( !error ){
                  const {data : Profile , error : ProfileError } = await supabase.from('profiles').update({ first_name : userInfo?.user.name, profile_email : userInfo?.user.email }).eq('id', data?.user.id)
                  console.log(Profile, ProfileError)
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
          }}
        />
      )
    }
    async function signInWithEmail() {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
    
      if (error) alert(error.message);
      setLoading(false);
    }  
  return (
    <View className='bg-white h-[100%]'>
      <Stack.Screen options={{ headerTransparent : true, headerTitle : '', headerBackTitleVisible : false }} />
      <StatusBar barStyle={"dark-content"}/>
      <View className='h-[25%] bg-gray-300 justify-end px-8' style={{ borderBottomRightRadius : 40, borderBottomLeftRadius : 40}}>
        <View className='pt-8'>
          <Text className=' text-white italic' style={{ fontSize : 45 }}>Account <Text className='font-bold'>Login</Text></Text>
        </View>
        <Link href={'/SignUp'} asChild>
          <Pressable className='pt-4 p-2 rounded-3xl w-[55%] border-white flex-row justify-between items-center mb-4' style={{ borderWidth : 4}}>
            <Text className='text-white'>new member?</Text>
            <Icon source={'arrow-right-thin'} size={20} color='white'/>
          </Pressable>
        </Link>
      </View>
      <View className=' justify-center items-center bg-white pt-[12%] flex-col flex-2'>
        <View className='w-[95%]' style={{ shadowColor : 'black', shadowOffset : { width : 0, height : 2 }, shadowOpacity : 0.5, shadowRadius : 1 }}>
          <TextInput
            mode='outlined' 
            value={email}
            onChangeText={setEmail}
            style={{ backgroundColor : 'white', borderBottomWidth : 0, borderWidth : 0, paddingLeft : 10 }}
            theme={{ roundness : 50 }}
            placeholder={'email'}
            outlineColor='white'
            activeOutlineColor='white'
            textColor='black'
            contentStyle={{ paddingLeft  : 3 }}
            selectionColor='black'
          />
        </View>
        <View className='w-[95%] mt-2' style={{ shadowColor : 'black', shadowOffset : { width : 0, height : 2 }, shadowOpacity : 0.5, shadowRadius : 1 }}>
          <TextInput
            mode='outlined' 
            value={password}
            onChangeText={setPassword}
            style={{ backgroundColor : 'white', borderBottomWidth : 0, borderWidth : 0, paddingLeft : 10 }}
            theme={{ roundness : 50 }}
            placeholder={'password'}
            outlineColor='white'
            activeOutlineColor='white'
            secureTextEntry
            textColor='black'
            contentStyle={{ paddingLeft  : 3 }}
            selectionColor='black'
          />
        </View>
        <View className='w-[90%] mt-2'>
          <Text className='text-[#007AFF] text-left'>Forgot Your Password?</Text>
        </View>
        <View className='w-[40%] flex-2 mt-10' style={{ shadowColor : 'black', shadowOffset : { width : 0, height : 2 }, shadowOpacity : 0.5, shadowRadius : 1 }}>
          <Button onPress={signInWithEmail} mode='contained' buttonColor='#57BA47' textColor='white'>login</Button>
        </View>
      </View>
      <View className='flex-row w-[90%] items-center justify-center self-center mt-10'>
        <Divider className='w-[40%] border-2 border-gray-200 rounded-xl'/>
        <Text className='px-2'>or</Text> 
        <Divider className='w-[40%] border-2 border-gray-200 rounded-xl'/>
      </View>
      <View className='items-center mt-[5%] w-[100%]'>
        { Platform.OS == 'ios' ? (
          <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={5}
          style={{ width: '78%', height: 40 }}
          onPress={async () => {
            try {
              const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                  AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                  AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
              })
              // Sign in via Supabase Auth.
              console.log(credential)
              if (credential.identityToken) {
                const {
                  error,
                  data: { user },
                } = await supabase.auth.signInWithIdToken({
                  provider: 'apple',
                  token: credential.identityToken,
                })
                console.log(JSON.stringify({ error, user }, null, 2))
                if (!error) {
                  // User is signed in.
                  const{
                    error,
                    data
                  } = await supabase.from('profiles').update({ profile_email : credential.email, first_name : credential.fullName?.givenName }).eq('id', user?.id)
                }
              } else {
                throw new Error('No identityToken.')
              }
            } catch (e) {
              if (e.code === 'ERR_REQUEST_CANCELED') {
                // handle that the user canceled the sign-in flow
              } else {
                // handle other errors
              }
            }
          }}
  
        />
        ) : <></>}
        <View className='h-[15]'/>
        <GoogleButtonSignUp />
      </View>
    </View>
  )
}

export default SignIn