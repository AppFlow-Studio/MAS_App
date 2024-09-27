import { View, Text, Pressable } from 'react-native'
import React, { useRef, useState } from 'react'
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated'
import * as Haptics from "expo-haptics"
import { Icon } from 'react-native-paper'
type NotificationCardProp = {
    height : number
    width : number
    index : number
    scrollY : number
    setSelectedNotification : ( selectedNotification : number[] ) => void
    selectedNotification : number[]
    item:string
}
const NotificationCard = ({height , width, index, scrollY,item, setSelectedNotification, selectedNotification} : NotificationCardProp) => {
    console.log(item);
    
  const scale = useSharedValue(1)
  const [ checked , setChecked ] = useState(false)
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
  }
  
  const cardStyle = useAnimatedStyle(() => {
    return{
        transform: [{ scale : scale.value }]
    }
  })
  return (
        <Animated.View style={[{ height : height, width : width, borderRadius : 20, shadowColor : "black", shadowOpacity : 1, shadowRadius : 1, shadowOffset : {width : 0, height : 0} }, cardStyle, {marginTop : index === 0 ? 10: 0}, {marginBottom : index === 5 ? 10 : 0}]}>
            <Pressable onPress={handlePress} style={[{ height : height, width : width, flexDirection : "row", alignItems : "center", justifyContent : "center"  }]}>
              {checked ?    <Icon source={"checkbox-blank-circle"}  size={25}/>  : <Icon source={"checkbox-blank-circle-outline"}  size={25}/>}
                <View className='w-[5]'/>
                <View style={{ backgroundColor : "#e8f4ff", height : height, width : width, borderRadius : 20,  paddingVertical : 10, paddingHorizontal : '4%', justifyContent:'center'}}>
                <Text>{item}</Text>
              </View>
            </Pressable>
        </Animated.View>
  )
}

export default NotificationCard