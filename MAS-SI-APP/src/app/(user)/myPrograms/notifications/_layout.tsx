import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

const NotiLayout = () => {
  return (
    <Stack>
        <Stack.Screen name='NotificationEvents' />
    </Stack>
  )
}

export default NotiLayout