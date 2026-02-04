import React from 'react'
import { Stack } from 'expo-router'

const NotiLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="NotificationEvents" />
    </Stack>
  )
}

export default NotiLayout