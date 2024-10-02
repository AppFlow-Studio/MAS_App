import { View, Text, Pressable } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated'
import * as Haptics from "expo-haptics"
import { Icon } from 'react-native-paper'
import { supabase } from '@/src/lib/supabase'
import { useAuth } from '@/src/providers/AuthProvider'
type NotificationCardProp = {
    height : number
    width : number
    index : number
    scrollY : number
    setSelectedNotification : ( selectedNotification : number[] ) => void
    selectedNotification : number[]
    item:string
    prayerName : string
} 
 const NotificationArray = [
  "Alert at Athan time",
  "Alert 30 mins before next prayer",
  "Alert at Iqamah time",
  "Mute"
]

const NotificationCard = ({height , width, index, scrollY,item, setSelectedNotification, selectedNotification, prayerName} : NotificationCardProp) => {
  const { session } = useAuth()
  const scale = useSharedValue(1)
  const [ checked , setChecked ] = useState(false)
  const onPress = async () => {
    const { data : currentSettings, error } = await supabase.from('prayer_notification_settings').select('*').eq('user_id', session?.user.id).eq('prayer', prayerName.toLowerCase() ).single()
    if(currentSettings == null) {
      const {data, error} = await supabase.from('prayer_notification_settings').insert({prayer : prayerName.toLowerCase(), user_id : session?.user.id, notification_settings : [NotificationArray[index]]})
      if( error ){
        console.log(error)
      }
    }
    else if(currentSettings.length == 0){
     const {data, error} = await supabase.from('prayer_notification_settings').insert({prayer : prayerName.toLowerCase(), user_id : session?.user.id, notification_settings : [NotificationArray[index]]})
     if( error ){
      console.log(error)
     }
    }
    if(currentSettings){
      const settings = currentSettings.notification_settings
      if( settings.includes(NotificationArray[index]) ){
        const filter = settings.filter((e : any) => e !== NotificationArray[index])
        const {data, error} = await supabase.from('prayer_notification_settings').update({notification_settings : filter}).eq('prayer', prayerName.toLowerCase()).eq('user_id', session?.user.id, )
      }
      else{
        settings.push(NotificationArray[index])
        const {data, error} = await supabase.from('prayer_notification_settings').update({notification_settings : settings}).eq('prayer', prayerName.toLowerCase()).eq('user_id', session?.user.id, )
      }
    }
  }
  const handlePress = () => {
    scale.value = withSequence(withSpring(0.9), withSpring(1))
    
    Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      )

      if( selectedNotification.includes(index)  ){
        const setPlaylist = selectedNotification?.filter(id => id !== index)
        setSelectedNotification(setPlaylist)
        setChecked( false )
      }
      else if( selectedNotification ){
        setSelectedNotification([...selectedNotification, index])
        setChecked( true )
      }
      else{
          setSelectedNotification([index])
          setChecked(true)
      }
      onPress()
  }
  
  const cardStyle = useAnimatedStyle(() => {
    return{
        transform: [{ scale : scale.value }]
    }
  })

  const getSettings = async () => {
    const { data , error } = await supabase.from('prayer_notification_settings').select('notification_settings').eq('prayer', prayerName.toLowerCase()).eq('user_id', session?.user.id, ).single()
    if( error ) {
      return
    }
    if( data && data.notification_settings.length > 0){
      if( data.notification_settings.includes(NotificationArray[index]) ){
        setSelectedNotification((prevSelected : any) => {
          if (!prevSelected.includes(index)) {
            return [...prevSelected, index];
          }
          return prevSelected; 
        });
        
        setChecked(true); 
        }
    }
  }
  useEffect(() => {
    getSettings()
  },[])
  return (
        <Animated.View style={[{ height : height, width : width, borderRadius : 20, shadowColor : "black", shadowOpacity : 1, shadowRadius : 1, shadowOffset : {width : 0, height : 0} }, cardStyle, {marginTop : index === 0 ? 10: 0}, {marginBottom : index === 5 ? 10 : 0}]}>
            <Pressable onPress={handlePress} style={[{ height : height, width : width, flexDirection : "row", alignItems : "center", justifyContent : "center"  }]}>
              {checked ?    <Icon source={"checkbox-blank-circle"}  size={25}/>  : <Icon source={"checkbox-blank-circle-outline"}  size={25}/>}
                <View className='w-[5]'/>
                <View style={{ backgroundColor : "#e8f4ff", height : height, width : width, borderRadius : 20,  paddingVertical : 10, paddingHorizontal : '4%', justifyContent:'center'}}>
                <Text>{NotificationArray[index]}</Text>
              </View>
            </Pressable>
        </Animated.View>
  )
}

export default NotificationCard