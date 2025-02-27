import { View, Text, Pressable } from 'react-native'
import React, { useEffect } from 'react'
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated'
import * as Haptics from "expo-haptics"
import { useAuth } from '@/src/providers/AuthProvider'
import { Icon } from 'react-native-paper'
import { supabase } from '@/src/lib/supabase'
import { format, isAfter, isBefore } from 'date-fns'
import { err } from 'react-native-svg'
const NotificationArray = [
    "Alert at Athan time",
    "Alert 30 Mins Before",
    "Mute"
]
function setTimeToCurrentDate(timeString : string) {
 
    // Split the time string into hours, minutes, and seconds
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
  
    // Create a new Date object with the current date
    const timestampWithTimeZone = new Date();
  
    // Set the time with setHours (adjust based on local timezone or UTC as needed)
    timestampWithTimeZone.setHours(hours, minutes, seconds, 0); // No milliseconds
  
    // Convert to ISO format with timezone (to ensure it's interpreted as a TIMESTAMPTZ)
    const timestampISO = timestampWithTimeZone // This gives a full timestamp with timezone in UTC
  
    return timestampISO
}

const TarawihCards = ({ height , width, index, setSelectedNotification, selectedNotification, tarawihName, tarawihTime }  : any) => {
  const { session } = useAuth()
  const scale = useSharedValue(1)
  const cardStyle = useAnimatedStyle(() => {
        return{
            transform: [{ scale : scale.value }]
        }
    })
  const lowercasedTarawihName = tarawihName.toLowerCase()
   const onPress = async () => {
    const { data : CurrentSettings , error } = await supabase.from('prayer_notification_settings').select('notification_settings').eq('prayer', lowercasedTarawihName).eq('user_id', session?.user.id, ).single()
    
    if( CurrentSettings ){
        const settings = CurrentSettings.notification_settings
        // If Setting Exists i.e : Deselect it
        if( settings.includes(NotificationArray[index]) ){
            if( index == 2 ){ 
              const TodayDate = new Date()
              const {data, error} = await supabase.from('prayer_notification_settings').update({notification_settings : ['Alert at Athan time']}).eq('prayer', lowercasedTarawihName).eq('user_id', session?.user.id )
                if( isBefore(TodayDate, new Date(2025, 3, 30)) && isAfter(TodayDate, new Date(2025, 2, 28)) ){
                    if( isBefore(TodayDate, tarawihTime) ){
                        const { data : UserPushToken, error } = await supabase.from('profiles').select('push_notification_token').eq('id', session?.user.id).single()
                        const { data : CheckIfNotificationExists , error : CheckIfNotificationExistsError }  = await supabase.from('prayer_notification_scheduler').select('id').eq('prayer', lowercasedTarawihName).eq('user_id', session?.user.id).eq('notification_type', 'Alert at Athan time').single()
                        if( UserPushToken && UserPushToken.push_notification_token && !CheckIfNotificationExists ){
                        const { error } = await supabase.from('prayer_notification_schedule').insert({ 
                        user_id : session?.user.id, 
                        notification_time : tarawihTime, 
                        prayer : lowercasedTarawihName, 
                        message : `First Tarawih Starting Now!\n${format(tarawihTime, 'p')}`, 
                        push_notification_token : UserPushToken.push_notification_token, 
                        notification_type : 'Alert at Athan time'})
                        }
                    }
                }

              return
            }

          const filter = settings.filter((e : any) => e != NotificationArray[index])
          const {data, error} = await supabase.from('prayer_notification_settings').update({notification_settings : filter}).eq('prayer', lowercasedTarawihName).eq('user_id', session?.user.id )
          const { error : DeleteNoti } = await supabase.from('prayer_notification_schedule').delete().eq('user_id', session?.user.id).eq('prayer', lowercasedTarawihName).eq('notification_type', NotificationArray[index])
          if ( filter.length == 0 ){
            const {data, error} = await supabase.from('prayer_notification_settings').update({notification_settings : ['Mute']}).eq('prayer',lowercasedTarawihName).eq('user_id', session?.user.id)
          }
        }

        //Else Condition if not already set
        else{
            //If Mute
            if( index == 2 ){
                const {data, error} = await supabase.from('prayer_notification_settings').update({notification_settings : ['Mute']}).eq('prayer',lowercasedTarawihName).eq('user_id', session?.user.id)
                const { error : DeleteNoti } = await supabase.from('prayer_notification_schedule').delete().eq('user_id', session?.user.id).eq('prayer', lowercasedTarawihName)
                return
            }
            //Else 
            let filtersettings = settings.filter(e => e != 'Mute') // If Set to Mute, Clear then set assigned setting
            filtersettings.push(NotificationArray[index])
            //Set the Setting
            const {data, error} = await supabase.from('prayer_notification_settings').update({notification_settings : filtersettings}).eq('prayer',lowercasedTarawihName).eq('user_id', session?.user.id)
            const TodayDate = new Date()

            if (index == 0){
                if( isBefore(TodayDate, new Date(2025, 3, 30)) && isAfter(TodayDate, new Date(2025, 2, 28)) ){
                    if( isBefore(TodayDate, tarawihTime) ){
                        const { data : UserPushToken, error } = await supabase.from('profiles').select('push_notification_token').eq('id', session?.user.id).single()
                        const { data : CheckIfNotificationExists , error : CheckIfNotificationExistsError }  = await supabase.from('prayer_notification_scheduler').select('id').eq('prayer', lowercasedTarawihName).eq('user_id', session?.user.id).eq('notification_type', 'Alert at Athan time').single()
                        if( UserPushToken && UserPushToken.push_notification_token && !CheckIfNotificationExists){
                        const { error } = await supabase.from('prayer_notification_schedule').insert({ 
                        user_id : session?.user.id, 
                        notification_time : tarawihTime, 
                        prayer : lowercasedTarawihName, 
                        message : tarawihName == 'Tarawih One' ? `First Tarawih Starting Now!\n${format(tarawihTime, 'p')}` : `Second Tarawih Starting Now!\n${format(tarawihTime, 'p')}`, 
                        push_notification_token : UserPushToken.push_notification_token, 
                        notification_type : 'Alert at Athan time'})
                        }
                        if( error ){
                            console.log('Scheduling Error', error)
                        }
                    }
                }
            }
            
            if( index == 1 ){
                if( isBefore(TodayDate, new Date(2025, 3, 30)) && isAfter(TodayDate, new Date(2025, 2, 28)) ){
                    tarawihTime.setMinutes(tarawihTime.getMinutes() - 30)
                    if( isBefore(TodayDate, tarawihTime) ){
                        const { data : UserPushToken, error } = await supabase.from('profiles').select('push_notification_token').eq('id', session?.user.id).single()
                        const { data : CheckIfNotificationExists , error : CheckIfNotificationExistsError }  = await supabase.from('prayer_notification_scheduler').select('id').eq('prayer', lowercasedTarawihName).eq('user_id', session?.user.id).eq('notification_type', 'Alert 30 Mins Before').single()
                        if( UserPushToken && UserPushToken.push_notification_token && !CheckIfNotificationExists){
                        const { error } = await supabase.from('prayer_notification_schedule').insert({ 
                        user_id : session?.user.id, 
                        notification_time : tarawihTime, 
                        prayer : lowercasedTarawihName, 
                        message : tarawihName == 'Tarawih One' ? `First Tarawih Starting in 30 mins!\n${format(tarawihTime, 'p')}` : `Second Tarawih is Starting in 30 mins!\n${format(tarawihTime, 'p')}`, 
                        push_notification_token : UserPushToken.push_notification_token, 
                        notification_type : 'Alert 30 Mins Before'})
                        }
                    }
                }
            }

        }
     
   }
   }
   

   const getSettings = async () => {
    const { data , error } = await supabase.from('prayer_notification_settings').select('notification_settings').eq('prayer', lowercasedTarawihName).eq('user_id', session?.user.id, ).single()
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
        }
    }
   }
    const handlePress = () => {
        scale.value = withSequence(withSpring(0.9), withSpring(1))
        
        Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          )
    
          if( selectedNotification.includes(index)  ){
            if( index == 2 ){
              setSelectedNotification([0])
            }
            else if ( selectedNotification.length == 1 && index != 2 ){
              setSelectedNotification([2])
            }
            else{
              const setPlaylist = selectedNotification?.filter(id => id !== index )
              setSelectedNotification(setPlaylist)
            }
          }
          else if( selectedNotification ){
              if ( index == 2 ){
                setSelectedNotification([index])
              }else{
                const setPlaylist = selectedNotification?.filter(id => id !== 2)
                setSelectedNotification([...setPlaylist, index])
              }
          }
          else{
              setSelectedNotification([index])
          }
          onPress()
      }
  const CardInfo = [
        { header : 'Notify at Prayer Time:' , subText : "Get notified exactly when it's time to pray"},
        { header : '30-Minute Reminder Before Tarawih:' , subText : "Get reminded 30 minutes before this jummah starts"},
        { header : 'Mute' , subText : ""}
  ]

  useEffect(() => {
    getSettings()
  }, [])
  return (
    <Animated.View style={[{ height : height, width : width, borderRadius : 20 }, cardStyle, {marginTop : index === 0 ? 10: 0}, {marginBottom : index === 5 ? 10 : 0}]}>
        <Pressable onPress={handlePress} style={[{ height : height, width : width, flexDirection : "row", alignItems : "center", justifyContent : "center", backgroundColor : 'white'  }]}>
            {selectedNotification.includes(index) ?    <Icon source={"checkbox-blank-circle"}  size={25} color='#6077F5'/>  : <Icon source={"checkbox-blank-circle-outline"}  size={25} color='#6077F5'/>}
            <View className='w-[5]'/>
            <View style={{ height : height, width : width, borderRadius : 20,  paddingVertical : 10, paddingHorizontal : '4%', justifyContent:'center'}}>
            <Text className='font-bold text black text-lg' numberOfLines={1} adjustsFontSizeToFit>{CardInfo[index] ? CardInfo[index].header : ''}</Text>
            <Text className='text-gray-400'>{CardInfo[index ] ? CardInfo[index ].subText : ''}</Text>
            </View>
        </Pressable>
    </Animated.View>
  )

}
export default TarawihCards

