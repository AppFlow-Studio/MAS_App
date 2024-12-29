import { FlatList, StyleSheet, Text, TouchableOpacity, View, Image, Pressable, Alert, useWindowDimensions } from 'react-native'
import React, { useEffect, useState } from 'react'
import { supabase } from '@/src/lib/supabase'
import { Link, router, Stack } from 'expo-router'
import Svg, { Path, Circle } from 'react-native-svg'
import Animated, { useAnimatedStyle, useSharedValue, withTiming }  from 'react-native-reanimated'
import { BusinessSubmissionsProp } from '@/src/types'

const ApprovedAdsScreen = () => {
  const [ ads, setAds ] = useState<any[]>([])
  const width = useWindowDimensions().width

    const getAds = async () => {
      const { data, error } = await supabase.from('approved_business_ads').select('*')
      if ( data ){
        const adsInfo = await Promise.all(
            data.map(async ( ad ) => {
                    const { data : AdInfo , error } = await supabase.from('business_ads_submissions').select('*').eq('submission_id',ad.submission_id).single()
                    if (AdInfo) return AdInfo
            })
        )
        setAds(adsInfo)
      }
    }
  
    useEffect(() => {
      getAds()
      const checkStatus = supabase.channel('Check for Business ads Status').on(
        'postgres_changes', 
        { event : "*",
          schema : 'public', 
          table : 'approved_business_ads' 
        }, 
        async (payload) => await getAds()
      )
      .subscribe()
  
      return () => { supabase.removeChannel( checkStatus ) }
  
    }, [])
  return (
      <View className='flex-1 bg-white'>
          <Stack.Screen 
              options={{
                headerTransparent : true,
                header : () => (
                  <View className="relative">
                    <View className="h-[110px] w-[100%] rounded-br-[65px] bg-[#5E636B] items-start justify-end pb-[5%] z-[1]">
                      <Pressable className="flex flex-row items-center justify-between w-[40%]" onPress={() => router.back()}>
                        <Svg width="29" height="29" viewBox="0 0 29 29" fill="none">
                          <Path d="M18.125 7.25L10.875 14.5L18.125 21.75" stroke="#1B85FF" stroke-width="2"/>
                        </Svg>
                        <Text className=" text-[25px] text-white">Business Ads</Text>
                      </Pressable>
                    </View>
                    <View className="h-[120px] w-[100%] rounded-br-[65px] bg-[#BBBEC6] items-start justify-end pb-[5%] absolute top-[50]">
                    <View className="w-[58%] items-center"> 
                      <Text className=" text-[15px] text-black ">Remove Approved Fliers</Text>
                    </View>
                    </View>
                  </View>
                )
              }}
            />
        <Text className="font-bold text-2xl p-3 pt-[170px] my-4 ">Business Ads</Text>
        <View className='flex-1 grow'>
        <FlatList 
            style={{ flex : 1 }}
            data={ads}
            renderItem={({item}) =>(
            <DeleteSlider item={item} width={width}/>
            )}
        />
        </View>
        
      </View>
  )
}


const DeleteSlider = ({item,  width } : { item : BusinessSubmissionsProp,  width : number }) => {
    const SliderWidth = useSharedValue(0)
    const DeleteOpacity = useSharedValue(0)  
    const Slider = useAnimatedStyle(() => {
        return {
            width : width - SliderWidth.value
        }
    })
    const DeleteSliderWidth = useAnimatedStyle(() => {
        return {
            width : SliderWidth.value,
            opacity : DeleteOpacity.value
        }   
    })
    const onPress = () => {
        if( SliderWidth.value == 60 ){
            SliderWidth.value = withTiming(0, { duration : 500 })
            DeleteOpacity.value = withTiming(0, { duration : 500 })
        }else{
            SliderWidth.value = withTiming(60, { duration : 500 })
            DeleteOpacity.value = withTiming(1, { duration : 500 })
        }
    }
    return (
        <View className='w-[100%] items-center flex flex-row'>
            <Animated.View style={[{marginHorizontal: 2}, Slider]}>
                <TouchableOpacity className='w-[100%]' onPress={onPress}>
                    <View style={{marginHorizontal: 2}}>
                            <View className='mt-1 self-center justify-center bg-gray-500 p-2 flex-row' style={{ borderRadius: 20, width: '95%'}}>
                                
                                <View className='justify-center w-[30%]'>
                                <Image source={{ uri : item.business_flyer_img }} style={{ borderRadius : 8, width : '100%', height : 95}}/>
                                </View>
                                <View className='w-[70%] pl-2 '>
                                <Text className='text-lg text-black font-bold ' numberOfLines={1}>{item.business_name}</Text>
                                <Text className='my-2  text-sm text-black font-bold' numberOfLines={1}>{item.business_phone_number}</Text>
                                </View>
                            </View>
                        </View>
                </TouchableOpacity>
            </Animated.View>
            <Animated.View style={[DeleteSliderWidth]} className='h-[95px] bg-white items-center justify-center' >
                <Pressable className='w-[100%] flex flex-col items-center justify-center gap-1' onPress={() => {
                Alert.alert('Are you sure you want to delete this program?', `Press Delete to remove ${item.business_name}`, [
                    {
                        text: 'Cancel',
                        onPress: () => {},
                    },
                    {
                    text: 'Delete', 
                    onPress: async () => await supabase.from('approved_business_ads').delete().eq('submission_id', item.submission_id),
                    style: 'destructive',
                    },

                    ]
                );
                }} >
                    <Svg  width="34" height="34" viewBox="0 0 34 34" fill="none">
                        <Circle cx="17" cy="17" r="12.15" stroke="#7E869E" stroke-opacity="0.25" stroke-width="1.2"/>
                        <Path d="M22.6673 11.3335L11.334 22.6668" stroke="#FF0000" stroke-width="1.2" stroke-linecap="square" stroke-linejoin="round"/>
                        <Path d="M11.3327 11.3335L22.666 22.6668" stroke="#FF0000" stroke-width="1.2" stroke-linecap="square" stroke-linejoin="round"/>
                    </Svg>
                    <Text className='text-red-500 text-sm' numberOfLines={1}>Delete</Text>
                </Pressable>
            </Animated.View>
        </View>
    )
}
export default ApprovedAdsScreen