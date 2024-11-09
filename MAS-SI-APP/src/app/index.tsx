import { View, Text, Button } from 'react-native'
import React from 'react'
import { useAuth } from '../providers/AuthProvider'
import { Redirect, Link, Stack } from 'expo-router';
import { ActivityIndicator } from 'react-native-paper';
import Animated, { Easing, FadeOut, FadeOutRight, SlideOutRight } from 'react-native-reanimated';
const index = () => {
   const { session, loading } = useAuth();

   if(loading){
    return ( 
      <Animated.View className='flex-1 bg-white' 
      exiting={SlideOutRight.duration(0)
      .easing(Easing.exp)}
      >
        <Stack.Screen options={{ headerShown : false }}/>
      </Animated.View>
    )
   }
   
   if (!session) {
    return <Redirect href={"/GreetingScreen"} />
   }

  return (
      <Redirect href={"/(user)"}/>
  )
}

export default index