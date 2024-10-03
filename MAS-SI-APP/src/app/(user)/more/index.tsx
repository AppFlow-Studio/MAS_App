import { View, Text, ScrollView, useWindowDimensions, Image, Pressable, StatusBar } from 'react-native'
import React, { useEffect, useState } from 'react'
import LottieView from 'lottie-react-native'
import { defaultProgramImage } from '@/src/components/ProgramsListProgram'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { Button, Icon } from 'react-native-paper'
import { Link } from 'expo-router'
import { Profile } from '@/src/types'
import { useAuth } from '@/src/providers/AuthProvider'
import { supabase } from '@/src/lib/supabase'
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import SignInAnonModal from '@/src/components/SignInAnonModal'

const Index = () => {
  const [ profile, setProfile ] = useState<Profile>()
  const { session } = useAuth()
  const width = useWindowDimensions().width
  const height = useWindowDimensions().height
  const [ visible, setVisible ] = useState(false)
  const [ anonStatus, setAnonStatus ] = useState(true)
  const tabBarHeight = useBottomTabBarHeight() + 60
  const spin = useSharedValue(0)
  const flip = useAnimatedStyle(() => {
    const spinVal = interpolate(spin.value, [0, 1], [0, 360])
    return{
      transform: [
        {
          rotateY: withTiming(`${spinVal}deg`, { duration: 500 }),
        },
      ],
    }
  })
  const getProfile = async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', session?.user.id).single()
    if( data ){
      setProfile(data)
    }
  }
  const checkIfAnon = async () => {
    if( session?.user.is_anonymous ){
      setAnonStatus(true)
    }
    else{
      setAnonStatus(false)
    }
  }
  const SignInModalCheck = () => {
    if( anonStatus ){
      setVisible(true)
    }else{
      return
    }
  }
  useEffect(() => {
    getProfile()
  }, [])
  useEffect(() => {
    checkIfAnon()
  }, [session])
  return (
    <ScrollView className='bg-white pt-[18%] h-[100%]'>
      <StatusBar barStyle={'dark-content'}/>
      <View className='w-[100%] items-center justify-center' style={{ height : height / 3 }}>
        <Pressable className='w-[100%] px-10' onPress={async () =>  await supabase.auth.signOut()}>
          <Text className='text-right text-gray-400'>Logout</Text>
        </Pressable>
        <Pressable style={{  shadowColor : "black", shadowOffset : {width : 0, height : 0}, shadowOpacity : 1, shadowRadius : 5  }} onPress={() => (spin.value = spin.value ? 0 : 1)}>
          <Animated.Image 
            source={{ uri : defaultProgramImage }}
            style={[{ width : 100, height : 100, borderRadius : 50, borderColor : "yellow", borderWidth : 2 }, flip]}
          />
        </Pressable>
        <View className='flex-col mt-1'>
            <View className='bg-white p-1 rounded-xl border-2'>
              <Text>{profile?.first_name}</Text>
            </View>
            <View className='bg-white p-1 rounded-xl border-2 mt-3'>
              <Text>{profile?.profile_email}</Text>
            </View>
            <View className='pt-2'>
              <Button mode='contained' buttonColor='#007AFF' textColor='white' className='w-[150]'>Edit Profile</Button>
            </View>
          </View>
      </View>
      <View className='items-center flex-1' style={{ paddingBottom : tabBarHeight }}>
          <View className='flex-1 flex-col items-center pb-10 w-[95%]' style={{ borderRadius : 20, shadowColor : 'black', shadowOffset : { width : 0, height : 0.5}, shadowOpacity : 1, shadowRadius : 1  }}>
          <Pressable onPress={SignInModalCheck} className=' w-[100%] mt-5'>
            <Link href={"/more/MasShopHomeScreen"} asChild disabled={anonStatus}>
              <Pressable className='w-[100%] bg-gray-50  mt-5 items-center flex-col px-3 py-2' style={{ borderRadius  : 10 }}>
                <View className='flex-row items-center justify-between px-1 w-[100%]'>
                  <Text className='text-gray-400'>Join Programs</Text>
                </View>
                <View className='flex-row w-[100%] justify-between items-center pt-1'>
                    <View className='flex-row items-center'>
                      <View style={{ borderWidth : 3, borderColor : '#E0E0E0', borderRadius : 50 ,backgroundColor : '#E0E0E0'}}>
                        <Icon source={"shopping-outline"} size={25} color='#BDBDBD'/>
                      </View>
                      <Text className='text-2xl ml-1 font-semibold'>MAS Shop</Text>
                    </View>
                    <Icon source={'chevron-right'} size={25} color='#BDBDBD'/>
                </View>
                <View className='w-[100%]'>
                  <Text className=' text-gray-400'>Cart, Payment, Orders</Text>
                </View>
                </Pressable>
              </Link>
            </Pressable>
            <Link href={"/more/Donation"} asChild>
              <Pressable className='w-[100%] bg-gray-50  mt-5 items-center flex-col px-3 py-2' style={{ borderRadius  : 10 }}>
                <View className='flex-row items-center justify-between px-1 w-[100%]'>
                  <Text className=' text-gray-400'>Support Your Community</Text>
                </View>
                <View className='flex-row w-[100%] items-center justify-between pt-1'>
                  <View className='flex-row items-center'>
                    <View style={{ borderWidth : 3, borderColor : '#E0E0E0', borderRadius : 50 ,backgroundColor : '#E0E0E0'}}>
                      <Icon source={"cards-heart-outline"} size={25} color='#BDBDBD'/>
                    </View>
                    <Text className='text-2xl ml-1 font-semibold'>Donate</Text>
                  </View>
                  <Icon source={'chevron-right'} size={25} color='#BDBDBD'/>
                </View>
                <View className='w-[100%]'>
                  <Text className=' text-gray-400'>Payment, Graph, Phase 2</Text>
                </View>
                </Pressable>
            </Link>

            <Pressable className='w-[100%] bg-gray-50  mt-5 items-center flex-col px-3 py-2' style={{ borderRadius  : 10 }}>
                  <View className='flex-row items-center justify-between px-1 w-[100%]'>
                    <Text className=' text-gray-400'>How To Edit Alerts</Text>
                  </View>
                  <View className='flex-row w-[100%] items-center justify-between pt-1'>
                    <View  className='flex-row items-center'>
                      <View style={{ borderWidth : 3, borderColor : '#E0E0E0', borderRadius : 50 ,backgroundColor : '#E0E0E0' }}>
                        <Icon source={"bell-outline"} size={25} color='#BDBDBD'/>
                      </View>
                      <Text className='text-2xl font-semibold ml-1'>Notification</Text>
                   </View>
                  </View>
                  <View className='w-[100%] flex-col'>
                    <Pressable className='p-1 flex-row items-center justify-between pt-1'>
                      <Text className=' text-gray-400'>Athan</Text>
                      <Icon source={'chevron-right'} size={20} color='#BDBDBD' />
                    </Pressable>

                    <Pressable className='p-1 flex-row items-center justify-between'>
                      <Text className=' text-gray-400'>Iqamah</Text>
                      <Icon source={'chevron-right'} size={20} color='#BDBDBD' />
                    </Pressable>

                    <Pressable className='p-1 flex-row items-center justify-between pt-1'>
                      <Text className=' text-gray-400'>Weekly Programs</Text>
                      <Icon source={'chevron-right'} size={20} color='#BDBDBD' />
                    </Pressable>

                    <Pressable className='p-1 flex-row items-center justify-between'>
                      <Text className=' text-gray-400'>Events</Text>
                      <Icon source={'chevron-right'} size={20} color='#BDBDBD' />
                    </Pressable>

                    <Pressable className='p-1 flex-row items-center justify-between'>
                      <Text className=' text-gray-400'>Masjid Alerts</Text>
                      <Icon source={'chevron-right'} size={20} color='#BDBDBD' />
                    </Pressable>
          
                  </View>
              </Pressable>

              <Pressable className='w-[100%] bg-gray-50  mt-5 items-center flex-col px-3 py-2' style={{ borderRadius  : 10 }}>
                  <View className='flex-row items-center justify-between px-1 w-[100%]'>
                    <Text className=' text-gray-400'>Want To Stay Connected</Text>
                  </View>
                  <View className='flex-row w-[100%] items-center justify-between pt-1'>
                    <View  className='flex-row items-center'>
                      <View style={{ borderWidth : 3, borderColor : '#E0E0E0', borderRadius : 50 ,backgroundColor : '#E0E0E0' }}>
                        <Icon source={"star-outline"} size={25} color='#BDBDBD'/>
                      </View>
                      <Text className='text-2xl font-semibold ml-1'>Upcoming</Text>
                   </View>
                  </View>
                  <View className='w-[100%] flex-col'>
                    <Pressable className='p-1 flex-row items-center justify-between'>
                      <Text className=' text-gray-400'>Programs</Text>
                      <Icon source={'chevron-right'} size={20} color='#BDBDBD' />
                    </Pressable>

                    <Pressable className='p-1 flex-row items-center justify-between'>
                      <Text className=' text-gray-400'>Events</Text>
                      <Icon source={'chevron-right'} size={20} color='#BDBDBD' />
                    </Pressable>  

                     <Pressable className='p-1 flex-row items-center justify-between'>
                      <Text className=' text-gray-400'>P.A.C.E</Text>
                      <Icon source={'chevron-right'} size={20} color='#BDBDBD' />
                    </Pressable>    

                     <Pressable className='p-1 flex-row items-center justify-between'>
                      <Text className=' text-gray-400'>Kids Programs</Text>
                      <Icon source={'chevron-right'} size={20} color='#BDBDBD' />
                    </Pressable>                
                  </View>
              </Pressable>

              <Pressable onPress={SignInModalCheck} className=' w-[100%] mt-5 bg-gray-50 rounded-xl'>
                <Link href={'/more/BusinessSponsersScreen'} asChild disabled={anonStatus} className='border'>
                  <Pressable className='w-[100%] bg-gray-50 items-center flex-col px-3 py-2' style={{ borderRadius  : 10 }}>
                      <View className='flex-row  px-1 w-[100%]'>
                          <Text className=' text-gray-400'>Want Marketing</Text>
                      </View>
                        <View className='flex-row w-[100%] items-center justify-between pt-1'>
                          <View  className='flex-row items-center'>
                            <View style={{ borderWidth : 3, borderColor : '#E0E0E0', borderRadius : 50 ,backgroundColor : '#E0E0E0' }}>
                              <Icon source={"thumb-up-outline"} size={25} color='#BDBDBD'/>
                            </View>
                            <Text className='text-2xl font-semibold ml-1'>Business Ad</Text>
                        </View>
                            <Icon source={'chevron-right'} size={25} color='#BDBDBD'/>
                        </View>
                    </Pressable>  
                  </Link>
                    <View>
                      <View className='w-[100%] flex-col px-3'>
                      <Link href={'/more/BusinessAds'} asChild disabled={anonStatus}>
                      <Pressable className='p-1 flex-row items-center justify-between '>
                          <Text className=' text-gray-400'>Application</Text>
                          <Icon source={'chevron-right'} size={20} color='#BDBDBD' />
                        </Pressable>
                      </Link>
                        <Link href={`/more/BusinessSubmissions/${session?.user.id}`} asChild disabled={anonStatus}>
                          <Pressable className='p-1 flex-row items-center justify-between py-2'>
                            <Text className=' text-gray-400'>Status</Text>
                            <Icon source={'chevron-right'} size={20} color='#BDBDBD' />
                          </Pressable>
                        </Link>
                        </View>
                      </View>
                  </Pressable>
            <View className='w-[95%] bg-white mt-8 items-center justify-center p-4' style={{ borderRadius : 10}}>
              <Text adjustsFontSizeToFit allowFontScaling numberOfLines={1}  className='text-gray-400'>Created By: App Flow Creations (appflowcreations@gmail.com)</Text>
            </View>
          </View>
      </View>
      <SignInAnonModal visible={visible} setVisible={setVisible}/>
    </ScrollView>
  )
}

export default Index