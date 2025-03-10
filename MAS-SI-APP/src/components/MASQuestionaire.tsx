import { View, Text, Image, useWindowDimensions, Pressable } from 'react-native'
import React, { useState } from 'react'
import Animated, { Easing, FadeIn, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useForm, SubmitHandler, Controller } from "react-hook-form"
import { zodResolver } from '@hookform/resolvers/zod';
import { HelperText, TextInput } from 'react-native-paper';
import { NameQuestionsSchema } from './forms/MASQuestionaireForm';
import Lock from './Icons/Lock';
import Svg, { Path } from 'react-native-svg';


const MASQuestionaire = () => {
  const CurrentSection = useSharedValue(1)
  const [CurrSec, setCurrSec] = useState(1) 
  const LAYOUTWIDTH = useWindowDimensions().width
  const [ UserGender, setUserGender ] = useState('') 
  const [ UserAgeRange, setUserAgeRange ] = useState('')
  const PROGRESSBARWIDTH = LAYOUTWIDTH * .8
  const ProgressBarAnimation = useAnimatedStyle(() => {
    return {
        width : withTiming(interpolate(CurrentSection.value, [0, 6], [0, PROGRESSBARWIDTH]), {duration : 2000})
    }
  })
  const { register, handleSubmit, formState } = useForm();
  const { isValid } = formState;
  const Section1Questions : {schemaId : "first_name" | "last_name", label : string}[] = [{schemaId : "first_name", label : 'First Name'}, { schemaId : "last_name", label : 'Last Name'}]
  const Section2Questions = ['Male', 'Female']
  const Section3Questions = ['4 - 13 years old', '14 - 18 years old', '19 - 23 years old', '24 - 30 years old', '31+ years old'] 
  const NameMethods = useForm<NameQuestionsSchema>({
    resolver: zodResolver(NameQuestionsSchema),
    mode: 'onBlur',
  });
  
  const SECTIONS = 6

  return (
    <View className='h-screen w-full bg-white flex flex-col'>
      { 
      CurrSec != 1 ? 
        <Pressable className='bg-[#0E4F9F] rounded-full w-8 h-8 items-center justify-center ml-3  mt-3'
            onPress={() => {setCurrSec(CurrSec - 1); CurrentSection.value -= 1}}
        >
            <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <Path d="M3.33331 10L2.97976 10.3536L2.62621 10L2.97976 9.64645L3.33331 10ZM15.8333 9.5C16.1095 9.5 16.3333 9.72386 16.3333 10C16.3333 10.2761 16.1095 10.5 15.8333 10.5L15.8333 9.5ZM7.97976 15.3536L2.97976 10.3536L3.68687 9.64645L8.68687 14.6464L7.97976 15.3536ZM2.97976 9.64645L7.97976 4.64645L8.68687 5.35355L3.68687 10.3536L2.97976 9.64645ZM3.33331 9.5L15.8333 9.5L15.8333 10.5L3.33331 10.5V9.5Z" fill="white"/>
            </Svg>
        </Pressable>
        : <></>
      }
      <Image source={require('@/assets/images/massiLogo.webp')}  className='flex-start h-[10%] w-[50%] self-center' style={{ objectFit : 'contain'}}/>
      <View className={`self-center bg-[#E2E2E2] rounded-[30px] h-[6px]`}
      style={{
        width : PROGRESSBARWIDTH
      }}
      >
        <Animated.View style={[ProgressBarAnimation, { height : 6}]} className='bg-[#58BA47] absolute bottom-7.5 rounded-l-xl z-[1]'/>
      </View>

      {
        CurrSec == 1 &&
            <Animated.View className='h-[80%]  space-y-2 flex flex-col w-[90%] self-center'
            entering={FadeIn.duration(2000).easing(Easing.inOut(Easing.quad))}
            >
                <Text className='font-bold text-3xl text-center py-6'>What's Your name?</Text>
               { Section1Questions.map((item, index) => (
                    <View className='w-full self-center flex-2' key={index}>
                        <Controller
                                control={NameMethods.control}
                                name={item.schemaId}
                                render={({
                                    field: { onChange , onBlur, value },
                                    fieldState: { error },
                                }) => {
                                    return (
                                    <>
                                        <TextInput 
                                        mode='outlined'
                                        label={item.label}
                                        onBlur={onBlur}
                                        value={value}
                                        onChangeText={onChange}
                                        style={{ backgroundColor : '#EEEBE5', borderBottomWidth : 0, borderWidth : 0, paddingLeft : 10, fontSize : 12 }}
                                        outlineColor='#EEEBE5'
                                        activeOutlineColor='black'
                                        textColor='black'
                                        contentStyle={{ paddingLeft  : 3 }}
                                        selectionColor='black'
                                        theme={{
                                            roundness : 8
                                        }}
                                        />
                                        <HelperText type="error" visible={error ? true : false} className='text-red-500 font-bold'>
                                            {error?.message}
                                        </HelperText>
                                    </>
                                    );
                                }}
                            />
                    </View>
                )) }
                <View className='flex flex-row space-x-4 w-full self-center'>
                    <Lock /> 
                    <Text className=' text-[#A4A4A4] text-[10px]'>This information is only shared with MAS employees </Text>
                </View>

                <Pressable className=' bg-[#0E4F9F] rounded-[10px] h-[75px] w-[75px] items-center justify-center self-end'
                onPress={() => {CurrentSection.value += 1; setCurrSec(CurrSec + 1)}}
                >
                    <Svg width="40" height="34" viewBox="0 0 40 34" fill="none">
                        <Path d="M33.3333 17L33.6572 16.619L34.1054 17L33.6572 17.381L33.3333 17ZM8.33334 17.5C8.0572 17.5 7.83334 17.2761 7.83334 17C7.83334 16.7239 8.0572 16.5 8.33334 16.5V17.5ZM23.6572 8.11903L33.6572 16.619L33.0095 17.381L23.0095 8.88097L23.6572 8.11903ZM33.6572 17.381L23.6572 25.881L23.0095 25.119L33.0095 16.619L33.6572 17.381ZM33.3333 17.5H8.33334V16.5H33.3333V17.5Z" fill="white"/>
                    </Svg>
                </Pressable>
            </Animated.View>
        } 
       { CurrSec== 2 &&
            <Animated.View className='h-[75%]  space-y-2 flex flex-col w-[90%] self-center'
            entering={FadeIn.duration(2000).easing(Easing.inOut(Easing.quad))}
            >
            <Text className='font-bold text-3xl text-center py-6'>What's Your Gender?</Text>
            { Section2Questions.map((item, index) => (
                    <Pressable className='w-full self-center flex-2 bg-[#EEEBE5] rounded-[8px] h-[40px] items-start justify-center pl-3' key={index} onPress={() => setUserGender(item)}>
                        <Text className='text-black font-[500px]'>{item}</Text>
                    </Pressable>
                )) }
                <View className='flex flex-row space-x-4 w-full self-center'>
                    <Lock /> 
                    <Text className=' text-[#A4A4A4] text-[10px]'>This information is only shared with MAS employees </Text>
                </View>

                <Pressable className=' bg-[#0E4F9F] rounded-[10px] h-[75px] w-[75px] items-center justify-center self-end'
                onPress={() => {CurrentSection.value += 1; setCurrSec(CurrSec + 1)}}
                >
                    <Svg width="40" height="34" viewBox="0 0 40 34" fill="none">
                        <Path d="M33.3333 17L33.6572 16.619L34.1054 17L33.6572 17.381L33.3333 17ZM8.33334 17.5C8.0572 17.5 7.83334 17.2761 7.83334 17C7.83334 16.7239 8.0572 16.5 8.33334 16.5V17.5ZM23.6572 8.11903L33.6572 16.619L33.0095 17.381L23.0095 8.88097L23.6572 8.11903ZM33.6572 17.381L23.6572 25.881L23.0095 25.119L33.0095 16.619L33.6572 17.381ZM33.3333 17.5H8.33334V16.5H33.3333V17.5Z" fill="white"/>
                    </Svg>
                </Pressable>
            </Animated.View> 
        }
        {CurrSec == 3 &&
            <Animated.View className='h-[75%]  space-y-2 flex flex-col w-[90%] self-center'
            entering={FadeIn.duration(2000).easing(Easing.inOut(Easing.quad))}
            >
                <Text className='font-bold text-3xl text-center py-6'>What age range do you fall in? </Text>
                { Section3Questions.map((item, index) => (
                        <Pressable className='w-full self-center flex-2 bg-[#EEEBE5] rounded-[8px] h-[40px] items-start justify-center pl-3' key={index} onPress={() => setUserAgeRange(item)}>
                            <Text className='text-black font-[500px]'>{item}</Text>
                        </Pressable>
                    )) }
                    <View className='flex flex-row space-x-4 w-full self-center'>
                        <Lock /> 
                        <Text className=' text-[#A4A4A4] text-[10px]'>This information is only shared with MAS employees </Text>
                    </View>

                    <Pressable className=' bg-[#0E4F9F] rounded-[10px] h-[75px] w-[75px] items-center justify-center self-end'
                    onPress={() => {CurrentSection.value += 1; setCurrSec(CurrSec + 1)}}
                    >
                        <Svg width="40" height="34" viewBox="0 0 40 34" fill="none">
                            <Path d="M33.3333 17L33.6572 16.619L34.1054 17L33.6572 17.381L33.3333 17ZM8.33334 17.5C8.0572 17.5 7.83334 17.2761 7.83334 17C7.83334 16.7239 8.0572 16.5 8.33334 16.5V17.5ZM23.6572 8.11903L33.6572 16.619L33.0095 17.381L23.0095 8.88097L23.6572 8.11903ZM33.6572 17.381L23.6572 25.881L23.0095 25.119L33.0095 16.619L33.6572 17.381ZM33.3333 17.5H8.33334V16.5H33.3333V17.5Z" fill="white"/>
                        </Svg>
                    </Pressable>
            </Animated.View> 
       }
       { CurrSec == 4 &&
            <Animated.View className='h-[75%] space-y-2 flex flex-col w-[90%] self-center'
            entering={FadeIn.duration(2000).easing(Easing.inOut(Easing.quad))}
            >
            <Text className='font-bold text-3xl text-center py-6'>Add a profile picture !</Text>

                <Pressable className='border-2 border-[#0E4F9F] rounded-full p-4 self-center w-[160px] h-[160px] aspect-1 items-center justify-center'>
                    <View className='bg-gray-200 rounded-full items-center justify-center w-[150px] h-[150px]'>
                        <Svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                            <Path d="M13 6.5L13 19.5" stroke="#222222" stroke-linecap="square" stroke-linejoin="round"/>
                            <Path d="M19.5 13L6.5 13" stroke="#222222" stroke-linecap="square" stroke-linejoin="round"/>
                        </Svg>
                    </View>
                </Pressable>

                <Text className='text-left font-[400] text-black '>Default images</Text>

                <View className='flex flex-row space-x-6 self-center'>
                    {
                        [1,2,3,4,5].map((item) => (
                            <Pressable key={item} className='rounded-full h-[50px] w-[50px] bg-gray-300' />
                        ))
                    }
                </View>

                <View className='flex flex-row space-x-4 w-full self-center'>
                    <Lock /> 
                    <Text className=' text-[#A4A4A4] text-[10px]'>This information is only shared with MAS employees </Text>
                </View>

                <Pressable className=' bg-[#0E4F9F] rounded-[10px] h-[75px] w-[75px] items-center justify-center self-end'
                onPress={() => {CurrentSection.value += 1; setCurrSec(CurrSec + 1)}}
                >
                    <Svg width="40" height="34" viewBox="0 0 40 34" fill="none">
                        <Path d="M33.3333 17L33.6572 16.619L34.1054 17L33.6572 17.381L33.3333 17ZM8.33334 17.5C8.0572 17.5 7.83334 17.2761 7.83334 17C7.83334 16.7239 8.0572 16.5 8.33334 16.5V17.5ZM23.6572 8.11903L33.6572 16.619L33.0095 17.381L23.0095 8.88097L23.6572 8.11903ZM33.6572 17.381L23.6572 25.881L23.0095 25.119L33.0095 16.619L33.6572 17.381ZM33.3333 17.5H8.33334V16.5H33.3333V17.5Z" fill="white"/>
                    </Svg>
                </Pressable>
            </Animated.View>       
       }
        <View className='border'>
            <Text className='text-[#A4A4A4] text-center'>experiencing issues? Email our team:</Text>
            <Text className='text-black underline text-center'>developer@massic.org</Text>
        </View>
    </View>
  )
}

export default MASQuestionaire


const NameSection = () => {
    return{

    }
}