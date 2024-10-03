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
        const heigth = submission.status == 'SUBMITTED' && opened ? withTiming(35, { duration : 2000 }) : withTiming(0)
        return{
            height : heigth
        }
    })
  return (
    <View className='flex-col items-center w-[100%] justify-center'>
      <Pressable className='flex-row items-center w-[100%]' onPress={onItemPress}>
        <View className='w-[30]'>
            <Text className='text-2xl font-bold'>{index + 1}</Text>
        </View>
        <View className='flex-col'>
            <View className='flex-row items-center w-[90%] justify-between'>
                <View>
                    <Text>Application</Text>
                </View>
                <View>
                    <Icon source={'chevron-down'} size={25}/>
                </View>
            </View>
            <View className='flex-col'>
                <Text>{format(submission.created_at, 'PP')}</Text>
                <Divider style={{ height : 2 }}/>
            </View>
        </View>
      </Pressable>
      <Animated.View style={[animatedStyle, { width : '100%'}]} className=' flex-col items-center mt-4'>
        <View className='flex-row h-[13%] justify-between items-center w-[80%] '>
            <View className=' h-[100%] w-[13%] items-center justify-center' style={{ backgroundColor : submission.status == 'SUBMITTED' ? 'green' : 'gray', borderRadius : 50 }}>
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
            <View className=' h-[100%] w-[13%]' style={{ backgroundColor : submission.status == 'SUBMITTED' ? 'gray' : submission.status == 'REVIEW' ? 'white' : 'green' , borderRadius : 50 }}>

            </View>
            <View className='flex-col items-center '>
                <Animated.Text style={textAnimatedStyle}>Under Review</Animated.Text>
                <View className=''>
                    <Animated.Text style={textAnimatedStyle} className='text-white text-center' numberOfLines={2} adjustsFontSizeToFit>Your Application has been seen by MAS Staten Island and is under review</Animated.Text>
                </View>
            </View>
        </View>
       { submission.status == 'REVIEW' ? <Animated.View style={[dottedLineAnimation, { width  : '100%', alignItems : 'center' } ]} className={''}>
            <Svg height="100%" width="70%">
                <Line x1="0" y1="0" x2="0" y2="100" stroke="black" strokeWidth="3" strokeDasharray={'5, 5'}/>
            </Svg>
        </Animated.View> : <View className='h-[40]'/>}
        <View className='flex-row h-[15%] justify-between items-center w-[80%] '>
        <View className=' h-[100%] w-[13%]' style={{ backgroundColor : submission.status == 'SUBMITTED' || submission.status == 'REVIEW'  ? 'gray' : 'green', borderRadius : 50 }}>
        </View>
            <View className='flex-col items-center '>
                <Animated.Text style={textAnimatedStyle}>Approved</Animated.Text>
                <View className=''>
                    <Animated.Text style={textAnimatedStyle} className='text-white text-center' numberOfLines={2} adjustsFontSizeToFit>Your Application has been approved. MAS Staten Island will reach out to you when they put up your flyer</Animated.Text>
                </View>
            </View>
        </View>
        { submission.status == 'APPROVE' ? <Animated.View style={[dottedLineAnimation, { width  : '100%', alignItems : 'center' } ]} className={''}>
            <Svg height="100%" width="70%">
                <Line x1="0" y1="0" x2="0" y2="100" stroke="black" strokeWidth="3" strokeDasharray={'5, 5'}/>
            </Svg>
        </Animated.View> : <View className='h-[40]'/>}

        <View className='w-[70%] h-[13%] rounded-xl items-center justify-center' style={{ backgroundColor : submission.status == 'POSTED' ? 'green' : 'gray'}}>
            <Text>Flyer Now Posted</Text>
        </View>
      </Animated.View>
    </View>
  )
}

export default BusinessSubmissionsCard