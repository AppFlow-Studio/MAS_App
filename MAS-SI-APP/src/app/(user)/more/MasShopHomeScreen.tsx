import { View, Text, ImageBackground, Dimensions, SafeAreaView, Pressable } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Link, Stack } from 'expo-router'
import { Program } from '@/src/types'
import { supabase } from '@/src/lib/supabase'
import PopularProgramsFlier from '@/src/components/ShopComponets/PopularProgramsFlier'

const MasShopHomeScreen = () => {
  const [ popularPrograms, setPopularPrograms ] = useState<Program[]>([])
  const { width, height } = Dimensions.get('window')
  const getPopularPrograms =  async () => {
    const { data : PopularPrograms, error : PopularProgramsError } =  await supabase.from('programs').select('*').eq('program_is_paid', true).range(0,1).order('program_start_date', { ascending : false })
    if( PopularProgramsError ){
        console.log('PopularProgramsError: ', PopularProgramsError)
    }
    if( PopularPrograms ){
        setPopularPrograms(PopularPrograms)
    }
  }

  useEffect(() => {
    getPopularPrograms()
  }, [])
  return (
    <View className='flex-1'>
        <Stack.Screen options={{ headerTransparent : true, headerBackTitleVisible : false, headerTitle : '' }}/>
        <ImageBackground 
            style={{ flex : 1, justifyContent : 'space-between'}}
            imageStyle={{ height : height / 1.5, width : width,}}
            source={require('@/assets/images/MASshophome.jpeg')}
        >
            <SafeAreaView className='self-center w-[60%] items-center justify-center flex-col gap-y-9' style={{ height : height / 2}}>
                <Text className='text-white text-center shadow-xl font-bold' style={{textShadowColor: "#D3D3D3", textShadowOffset: { width: 0.5, height: 1.5 }, textShadowRadius: 1, fontSize : 40 }}>
                    Programs that inspire
                </Text>
                <Link href={'/more/MasShop'} asChild>
                    <Pressable className='bg-white p-4 rounded-2xl px-9'>
                        <Text className='font-semibold'>Go to Shop</Text>
                    </Pressable>
                </Link>
            </SafeAreaView>
            <View style={{ backgroundColor : 'white', height : height / 2.5, width : width, borderTopRightRadius : 20, borderTopLeftRadius : 20, paddingHorizontal : 10, paddingVertical : 15 }}>
                <View className='flex-row items-center justify-between'>
                    <Text className='font-bold text-2xl'>Popular programs</Text>
                    <Link href={'/more/MasShop'}>
                     <Text className='text-gray-500 ' style={{ textDecorationLine: 'underline'}}>view all</Text>
                    </Link>
                </View>
                <View className='flex-row justify-between px-2 mt-2'>
                    { popularPrograms.map((item, index) => (
                        <PopularProgramsFlier program={popularPrograms[index]} width={width} height={height / 2.5} key={index}/>
                    )
                    )}
                </View>
            </View>
        </ImageBackground>
    </View>
  )
}

export default MasShopHomeScreen