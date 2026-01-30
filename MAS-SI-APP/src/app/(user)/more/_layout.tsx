import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { Stack, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

const MoreLayout = () => {
  const router = useRouter()
  
  return (
    <Stack>
        <Stack.Screen 
          name='index' 
          options={{ 
            headerShown: false,
            presentation: 'transparentModal',
            animation: 'fade',
          }} 
        />
        <Stack.Screen 
          name='PreferencesOnboarding' 
          options={{ 
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }} 
        />
        <Stack.Screen 
          name='BusinessAds' 
          options={{ 
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }} 
        />
        <Stack.Screen 
          name='BusinessStatus' 
          options={{ 
            title: 'Application Status',
            headerShown: true,
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerTitleStyle: { color: '#111827', fontWeight: '600' },
            headerTintColor: '#007AFF',
            headerShadowVisible: false,
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 0 }}>
                <Ionicons name="chevron-back" size={28} color="#111827" />
              </TouchableOpacity>
            ),
            presentation: 'card',
            animation: 'default',
          }} 
        />
    </Stack>
  )
}

export default MoreLayout