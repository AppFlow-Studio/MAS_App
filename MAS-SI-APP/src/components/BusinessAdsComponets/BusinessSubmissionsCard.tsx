import { View, Text, Pressable } from 'react-native'
import React, { useState } from 'react'
import { BusinessSubmissionsProp } from '@/src/types'
import { format } from 'date-fns'
import { Divider, Icon } from 'react-native-paper'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { Line, Svg } from 'react-native-svg'
import { duration } from 'moment'
type BusinessSubmissionsCardProp = {
    submission : BusinessSubmissionsProp
    index : number
}
const BusinessSubmissionsCard = ({ submission, index } : BusinessSubmissionsCardProp) => {
    const [ opened, setOpened ] = useState(false)
    const onItemPress = () => {
        setOpened(!opened)
    }
    const textAnimatedStyle = useAnimatedStyle(() => {
        const opacity = opened ? withTiming(1, { duration : 1000}) : withTiming(0, { duration : 100})
        return{
            opacity : opacity
        }
    })
    const animatedStyle = useAnimatedStyle(() => {
        const animatedHeight = opened ? withTiming(300) : withTiming(0);
        return{
            height: animatedHeight
        }
    })

    const dottedLineAnimation = useAnimatedStyle(() => {
        const heigth = opened ? withTiming(35, { duration : 2000 }) : withTiming(0)
        return{
            height : heigth
        }
    })
    const dottedLineAnimation2 = useAnimatedStyle(() => {
        const heigth =( submission.status != 'SUBMITTED' ) && opened ? withTiming(35, { duration : 2000 }) : withTiming(0)
        return{
            height : heigth
        }
    })
    const dottedLineAnimation3 = useAnimatedStyle(() => {
        const heigth = submission.status == 'APPROVED' && opened ? withTiming(35, { duration : 2000 }) : withTiming(0)
        return{
            height : heigth
        }
    })
  return (
    <View className='flex-col items-center w-[100%] justify-center'>
      <Pressable className='flex-row items-center w-[100%] justify-center' onPress={onItemPress} >
        <View className='w-[30]'>
            <Text className='text-2xl font-bold'>{index + 1}</Text>
        </View>
        <View className='flex-col'>
            <View className='flex-row items-center w-[90%] justify-between'>
                <View>
                    <Text>Application</Text>
                </View>
                <View style={{ transform: [{rotate: opened ? '90deg' : '0deg'}] }}>
                    <Icon source={'chevron-right'} size={25} color='black'/>
                </View>
                { submission.status == 'APPROVED' || submission.status == 'POSTED'  ? 
                    <View style={{ backgroundColor  : 'green', borderRadius  : 45, padding : 2 }}>
                        <Icon source={'check'} size={25} color='white'/> 
                    </View> : <></> 
                }
            </View>
            <View className='flex-col'>
                <Text>{format(submission.created_at, 'PP')}</Text>
                <Divider style={{ height : 2 }}/>
            </View>
        </View>
      </Pressable>
      <Animated.View style={[animatedStyle, { width : '100%'}]} className=' flex-col items-center mt-4'>
        <View className='flex-row h-[13%] justify-between items-center w-[80%] '>
            <View className=' h-[100%] w-[13%] items-center justify-center' style={{ backgroundColor : 'green', borderRadius : 50 }}>
                <Icon source={'check'} size={30} color='white'/>
            </View>
            <View className='flex-col items-center '>
                <Animated.Text style={textAnimatedStyle}>Application Recieved</Animated.Text>
                <View className=''>
                    <Animated.Text style={textAnimatedStyle} className='text-white text-center' numberOfLines={2} adjustsFontSizeToFit>Your Application has been sent to MAS Staten Island!</Animated.Text>
                </View>
            </View>
        </View>

        <Animated.View style={[dottedLineAnimation, { width  : '100%', alignItems : 'center'} ]} className={''}>
            <Svg height="100%" width="70%">
                <Line x1="0" y1="0" x2="0" y2="100" stroke="black" strokeWidth="3" strokeDasharray={'5, 5'}/>
            </Svg>
        </Animated.View>
        
        <View className='flex-row h-[13%] justify-between items-center w-[80%] '>
            <View className=' h-[100%] w-[13%] items-center justify-center' style={{ backgroundColor : submission.status == 'SUBMITTED' ? 'gray' : submission.status == 'REVIEW' || submission.status == 'APPROVED'  ? 'green' : 'white' , borderRadius : 50 }}>
               {submission.status == 'REVIEW' || submission.status == 'APPROVED' || submission.status == 'POSTED' ?  <Icon source={'check'} size={30} color='white'/> :<></>}            
            </View>
            <View className='flex-col items-center '>
                <Animated.Text style={textAnimatedStyle}>Under Review</Animated.Text>
                <View className=''>
                    <Animated.Text style={textAnimatedStyle} className='text-white text-center' numberOfLines={2} adjustsFontSizeToFit>Your Application has been seen by MAS Staten Island and is under review</Animated.Text>
                </View>
            </View>
        </View>
       { submission.status == 'REVIEW' || submission.status == 'APPROVED' || submission.status == 'POSTED'  ? <Animated.View style={[dottedLineAnimation2, { width  : '100%', alignItems : 'center' } ]} className={''}>
            <Svg height="100%" width="70%">
                <Line x1="0" y1="0" x2="0" y2="100" stroke="black" strokeWidth="3" strokeDasharray={'5, 5'}/>
            </Svg>
        </Animated.View> : <View className='h-[40]'/>}
        <View className='flex-row h-[13%] justify-between items-center w-[80%] '>
        <View className=' h-[100%] w-[13%] items-center justify-center' style={{ backgroundColor : submission.status == 'SUBMITTED' ? 'gray' : submission.status == 'REVIEW' || submission.status == 'APPROVED'  ? 'green' : 'white' , borderRadius : 50 }}>
            {submission.status == 'REVIEW' || submission.status == 'APPROVED' || submission.status == 'POSTED' ?  <Icon source={'check'} size={30} color='white'/> :<></>}            
        </View>
            <View className='flex-col items-center '>
                <Animated.Text style={textAnimatedStyle}>Approved</Animated.Text>
                <View className=''>
                    <Animated.Text style={textAnimatedStyle} className='text-white text-center' numberOfLines={2} adjustsFontSizeToFit>Your Application has been approved!!</Animated.Text>
                </View>
            </View>
        </View>
        <View className='h-[35]'/>
        <View className='w-[70%] h-[13%] rounded-xl items-center justify-center' style={{ backgroundColor : submission.status == 'APPROVED' ? 'green' : 'gray'}}>
            <Text className='text-white'>Flyer Now Posted</Text>
        </View>
      </Animated.View>
    </View>
  )
}

export default BusinessSubmissionsCard