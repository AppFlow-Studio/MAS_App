import { View, Text, StatusBar, useWindowDimensions, Image, Dimensions } from 'react-native'
import React, { useState } from 'react'
import { Stack, useLocalSearchParams } from 'expo-router'
import JummahCards from './_JummahCards'

const JummahDetails = () => {
  const { jummahName, index } = useLocalSearchParams() 
  const [ selectedNotification, setSelectedNotification ] = useState<number[]>([])
  const layout = useWindowDimensions().width
  const layoutHeight = useWindowDimensions().height
  const NOTICARDHEIGHT  = layoutHeight / 12
  const NOTICARDWIDTH  = layout * 0.8
  const { width } = Dimensions.get("window");
  const SupabaseJummahName = index == '1' ? 'first' : index == '2' ? 'second' : index == '3' ? 'third': index == '4' ? 'fourth' : ''
  return (
    <View className='flex-1 bg-white items-center'>
      <Stack.Screen options={{ headerTitle : 'Jummah Settings', headerBackTitle : '', headerBackTitleVisible : false , headerStyle : {backgroundColor : "white"}, headerTintColor : '#1B85FF'}}/>
      <StatusBar barStyle={'dark-content'}/>
      <Text className='text-[20px] font-bold '>Prayer {index == '1' ? 'One' : index == '2' ? 'Two' : index == '3' ? 'Three': index == '4' ? 'Four' : ''}</Text>
      <View className='mt-4'>
            <Image
                source={Number(index) == 1 || Number(index) == 2 ? require('@/assets/images/Jummah12.png') : require('@/assets/images/Jummah34.png')}
                style={{width: width / 2, height: 200, borderRadius: 8 } }
                resizeMode='stretch'
            />
            </View>
            <View className='flex-col bg-white w-[100%]'>
                <Text className='font-bold text-2xl text-center m-4'>{jummahName}</Text>
                <View className='ml-2'>
                <Text>Notification Options</Text>
            </View>
            </View>
      <View className='bg-white w-[100%] items-center'>

        {
            [1,2,3].map((item, index) => (
                <JummahCards jummah={jummahName} height={NOTICARDHEIGHT} width={NOTICARDWIDTH} item={item} index={index} setSelectedNotification={setSelectedNotification} selectedNotification={selectedNotification} SupabaseJummahName={SupabaseJummahName}/>
            ))
        }
               
     </View>
    </View>
  )
}

export default JummahDetails