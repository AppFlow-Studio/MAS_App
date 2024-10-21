import { View, Text, ScrollView, Image, Dimensions, Animated } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '@/src/lib/supabase'
import { Extrapolation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
type adPagination = { 
    data : any,
    scrollX : any
}
const AdPagination = ( { data, scrollX } : adPagination) => {
    const { width } = Dimensions.get('screen')

    return(
        <View className='border'>
            {
                data.map((_, index) => {
                    const inputRange = [( index - 1 ) * width, index * width, ( index + 1) * width]
                    const dotWidth = scrollX.interpolate({
                        inputRange,
                        outputRange : [ 12, 30, 12 ],
                        extrapolate : 'clamp'
                    })
                    return <Animated.View key={index} style={{width : dotWidth, borderRadius : 50,
                        height: 12,
                        marginHorizontal: 3,
                        backgroundColor: '#ccc', }} />
                })
            }
        </View>
    )
}   

const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;
const ApprovedAds = () => {
  const [ ads, setAds ] = useState<any[]>([])
  const [ index, setIndex ] = useState(0)
  const getAds = async () => {
    const { data , error } = await supabase.from('approved_business_ads').select('*')
    if( error ){
        console.log(error)
    }
    if( data ){
        const adsFlyer : any[] = []
        await Promise.all(
            data.map(async ( ad ) =>{
                const { data, error } = await supabase.from('business_ads_submissions').select('business_flyer_img').eq('submission_id', ad.submission_id).single()
                if( data ){
                    adsFlyer.push(data)
                }
            })
        )
        setAds(adsFlyer)
    }
  }
  
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleOnScroll = event => {
    Animated.event(
      [
        {
          nativeEvent: {
            contentOffset: {
              x: scrollX,
            },
          },
        },
      ],
      {
        useNativeDriver: false,
      },
    )(event);
  };

  const handleOnViewableItemsChanged = useRef(({viewableItems}) => {
    // console.log('viewableItems', viewableItems);
    setIndex(viewableItems[0].index);
  }).current;
  useEffect( () => {
    getAds()
  }, [])
  return (
      <View>
        <ScrollView className='w-[100%] h-[100%]'
            contentContainerStyle={{ width : '100%', height : '100%', borderRadius : 19,overflow : 'hidden' }}
            horizontal
            pagingEnabled
            snapToAlignment="center"
            showsHorizontalScrollIndicator={false}
            onScroll={handleOnScroll}
        >
            {
                ads && ads.length > 0 ? ads.map(( adsInfo ) => {
                    return(
                        <View className='w-[100%] h-[100%]' style={{  borderRadius : 19, overflow : 'hidden' }}>
                            <Image source={{ uri : adsInfo.business_flyer_img}} style={{ width : '100%', height : '100%', objectFit : 'fill' }}/>
                        </View>
                    )
                }) : <></>
            }
        </ScrollView>
      </View>
  )
}

export default ApprovedAds