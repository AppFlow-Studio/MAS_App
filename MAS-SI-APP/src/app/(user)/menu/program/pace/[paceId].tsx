import { Dimensions, Image, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'
import RenderPaceLectures from '@/src/components/PaceComponents/RenderPaceLectures';

const PaceFlyerDetails = () => {
    const { width } = Dimensions.get("window");
  return (
    <View>
         <Stack.Screen options={{ headerBackTitleVisible : false, title : "Pace Flyer Detail", headerStyle : {backgroundColor : "white"} }}/>
         <View className='mt-4 item-center'>
         <Image source={{uri:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQg_7JzUkZJrybZdO44EKshHqhwmcWj7dKdFA&s'}}  
              style={{width: width / 1.2, height: 300, borderRadius: 8, alignSelf:'center' } }
              resizeMode='stretch'
            />
          </View>
          <Text className='text-center mt-2 text-xl text-black font-bold'>Pace Name</Text>
          <Text className='text-center mt-2  text-[#0D509D]' >By: DR Zakir Naike</Text>
          <RenderPaceLectures />
    </View>
  )
}

export default PaceFlyerDetails

const styles = StyleSheet.create({})