import { View, Text, SafeAreaView, Pressable, Platform } from 'react-native'
import React from 'react'
import { Link, Stack } from 'expo-router'
import { Icon } from 'react-native-paper'
import { useAuth } from '@/src/providers/AuthProvider'

const BusinessSponsersScreen = () => {
  const { session } = useAuth()
  return (
    <View className='flex-1 bg-gray-300'>
      <Stack.Screen options={{ headerTransparent : true, headerBackTitleVisible : false, headerTitle : ''}}/>
      <SafeAreaView>
        <View className='px-3 w-[100%] h-[20%] '
        style={[
          Platform.OS == 'android' ? {
            marginTop : '25%'
          } : {}
        ]}
        >
            <Text className='text-center text-4xl'>Get Your Business</Text>
            <Text className='text-center text-4xl'>Out There!</Text>
        </View>
        <View className='h-[50%] w-[100%] '
        style={[
          Platform.OS == 'android' ? {
            height : '40%'
          } : {}
        ]}
        >

        </View>
        <View className='justify-end flex-col items-center h-[25%]  gap-3'>
            <Link href={'/more/BusinessAds'} asChild>
                <Pressable className='w-[70%] bg-white flex-row items-center rounded-lg justify-between px-3 p-2' style={{ shadowColor : 'black', shadowOffset : { width : 0,  height : 2}, shadowOpacity : 1, shadowRadius : 2 }} >
                    <Icon source={'file-upload'} size={30}/>
                    <Text>Proceed to Application</Text>
                    <Icon source={'arrow-right-thin'} size={30}/>
                </Pressable>
            </Link>
            <View className='h-[1]'/>
            <Link href={`/more/BusinessSubmissions/${session?.user.id}`} asChild>
                <Pressable className='w-[70%] bg-gray-600 flex-row items-center rounded-lg justify-between px-3 p-2' style={{ shadowColor : 'black', shadowOffset : { width : 0,  height : 2}, shadowOpacity : 1, shadowRadius : 2 }} >
                    <Icon source={'account-circle'} size={30} color='white'/>
                    <Text className='text-white'>Application Status</Text>
                    <Icon source={'arrow-right-thin'} size={30} color='white'/>
                </Pressable>
            </Link>
        </View> 
      </SafeAreaView>
    </View>
  )
}

export default BusinessSponsersScreen