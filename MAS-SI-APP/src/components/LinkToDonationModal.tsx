import { View, Text, Pressable, Image, ImageBackground } from 'react-native'
import React from 'react'
import { Button } from 'react-native-paper'
import { Link, useNavigation, useRouter } from 'expo-router'
const LinkToDonationModal = () => { 
  const navigation = useNavigation<any>()
  const router = useRouter()
  return (
            <Pressable  style={{width: "100%", height: 200, justifyContent :"center", alignItems : 'center',shadowColor: "black", shadowOffset: { width: 0, height: 0},shadowOpacity: 0.6, borderRadius : 20 }} onPress={() => router.replace('/(user)/more')}>
                <ImageBackground 
                    source={require('@/assets/images/MASDonation4.png')}
                    style={{ width: '95%', height : '100%', borderRadius : 20, alignSelf : 'center', justifyContent : 'flex-end'}}
                    imageStyle={{ width : '100%', height : '100%', borderRadius : 20, alignSelf : 'center', objectFit : 'cover' }}
                >
                    <View className='w-[50%] h-[40] bg-white self-center mb-10 justify-center items-center' style={{ borderRadius : 20, shadowColor: "black", shadowOffset : {width : 0, height : 0.5}, shadowOpacity : 1, shadowRadius : 2}}>
                        <Text className='text-3xl font-bold text-[#57BA47]' style={{ fontFamily : 'Oleo'}}>Donate Now</Text>
                    </View>
                </ImageBackground>
            </Pressable>
  )
}

export default LinkToDonationModal