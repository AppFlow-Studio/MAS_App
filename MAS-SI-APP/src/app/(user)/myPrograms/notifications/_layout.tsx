import React from 'react'
import { Stack } from 'expo-router'

const NotiLayout = () => {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 200,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="NotificationEvents" 
        options={{
          animation: 'slide_from_right',
          animationDuration: 200,
        }}
      />
    </Stack>
  )
}

export default NotiLayout