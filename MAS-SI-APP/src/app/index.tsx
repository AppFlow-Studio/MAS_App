import { View, Text, Button } from 'react-native'
import React from 'react'
import { useAuth } from '../providers/AuthProvider'
import { Redirect, Link, Stack } from 'expo-router';
const index = () => {
   const { session } = useAuth();

   if (!session) {
    return <Redirect href={"/GreetingScreen"} />
   }

  return (
      <>
        <Redirect href={"/(user)"}/>
      </>
  )
}

export default index