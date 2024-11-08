import { View, Text, ScrollView, useWindowDimensions, Image, Pressable, StatusBar,  } from 'react-native'
import React, { useEffect, useState } from 'react'
import LottieView from 'lottie-react-native'
import { defaultProgramImage } from '@/src/components/ProgramsListProgram'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { Button, Icon, Portal, TextInput, Modal } from 'react-native-paper'
import { Link } from 'expo-router'
import { Profile } from '@/src/types'
import { useAuth } from '@/src/providers/AuthProvider'
import { supabase } from '@/src/lib/supabase'
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import SignInAnonModal from '@/src/components/SignInAnonModal'
import Toast from 'react-native-toast-message'

const Index = () => {
  const [ profile, setProfile ] = useState<Profile>()
  const { session } = useAuth()
  const width = useWindowDimensions().width
  const height = useWindowDimensions().height
  const [ visible, setVisible ] = useState(false)
  const [ anonStatus, setAnonStatus ] = useState(true)
  const tabBarHeight = useBottomTabBarHeight() + 10
  const spin = useSharedValue(0)
    const [ profileFirstName , setProfileFirstName ] = useState('')
  const [ profileLastName , setProfileLastName ] = useState('')
  const [ profileEmail, setProfileEmail ] = useState('')
    const [loading, setLoading] = useState(true)
    const [editProfileVisible, setEditProfileVisible] = React.useState(false);
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
      return true
    }else{
      return false
    }
  }

  useEffect(() => {
    getProfile()
  }, [])
  useEffect(() => {
    checkIfAnon()
  }, [session])
  const hideModal = () => setEditProfileVisible(false);
  const onConfirmButton = async () => {
    Toast.show({
      type: 'success',
      text1: "Profile is Sucessfully Edited",
      position: 'top',
      topOffset : 50,
      visibilityTime: 2000,
    });
    const { error } = await supabase.from('profiles').update({ first_name : profileFirstName, last_name : profileLastName, profile_email : profileEmail }).eq('id', session?.user.id)
    setEditProfileVisible(false);
    setProfileFirstName('');
    setProfileLastName('');
    setProfileEmail('');
  }
  return (
    <ScrollView className='bg-white pt-[18%] h-[100%]'>
      <StatusBar barStyle={'dark-content'}/>
      <View className='w-[100%] items-center justify-center' style={{ height : height / 3 }}>
        <Pressable className='w-[100%] px-10' onPress={async () =>  await supabase.auth.signOut()}>
          <Text className='text-right text-gray-400'>Logout</Text>
        </Pressable>
        <Pressable style={{  shadowColor : "black", shadowOffset : {width : 0, height : 0}, shadowOpacity : 1, shadowRadius : 5  }} onPress={() => (spin.value = spin.value ? 0 : 1)} className='mt-3'>
          <Animated.Image 
            source={require('@/assets/images/MASHomeLogo.png')}
            style={[{ width : 100, height : 100, borderRadius : 50, borderColor : "yellow", borderWidth : 2 }, flip]}
          />
        </Pressable>

     { !anonStatus &&  
     <View className='flex-col mt-4 items-center'>
            <View className='bg-white p-2 rounded-xl border-2'>
              <Text numberOfLines={1}>{profile?.first_name} {profile?.last_name}</Text>
            </View>
            <View className='bg-white p-2 rounded-xl border-2 mt-3'>
              <Text numberOfLines={1}>{profile?.profile_email}</Text>
            </View>
            <View className='pt-2'>
              <Button mode='contained' buttonColor='#007AFF' textColor='white' className='w-[150]' onPress={()=> !SignInModalCheck() ?  setEditProfileVisible(true) : ''} disabled={anonStatus}>Edit Profile </Button>
            </View>
        </View>
      }
      </View>
      <View className='items-center flex-1' style={{ paddingBottom : tabBarHeight }}>
          <View className='flex-1 flex-col items-center pb-10 w-[95%]' style={{ borderRadius : 20, shadowColor : 'black', shadowOffset : { width : 0, height : 0.5}, shadowOpacity : 1, shadowRadius : 1  }}>
         {/* <Pressable onPress={SignInModalCheck} className=' w-[100%] mt-5'>
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
            </Pressable> */}

           {profile?.role == 'ADMIN' &&  
           <Link href={"/more/Admin/AdminScreen"} asChild>
              <Pressable className='w-[100%] bg-gray-50  mt-5 items-center flex-col px-3 py-2' style={{ borderRadius  : 10 }}>
                <View className='flex-row items-center justify-between px-1 w-[100%]'>
                  <Text className=' text-gray-400'>Admin Button</Text>
                </View>
                <View className='flex-row w-[100%] items-center justify-between pt-1'>
                  <View  className='flex-row items-center'>
                    <View style={{ borderWidth : 3, borderColor : '#E0E0E0', borderRadius : 50 ,backgroundColor : '#E0E0E0' }}>
                      <Icon source={"bell-outline"} size={25} color='#BDBDBD'/>
                    </View>
                    <Text className='text-2xl font-semibold ml-1'>Admin</Text>
                  </View>
                </View>
                <View className='w-[100%] flex-col'>
                  <Pressable className='p-1 flex-row items-center justify-between pt-1'>
                    <Text className=' text-gray-400'>Send to Everyone</Text>
                    <Icon source={'chevron-right'} size={20} color='#BDBDBD' />
                  </Pressable>

                  <Pressable className='p-1 flex-row items-center justify-between'>
                    <Text className=' text-gray-400'>Programs and Events</Text>
                    <Icon source={'chevron-right'} size={20} color='#BDBDBD' />
                  </Pressable>
                </View>
                </Pressable>
              </Link>
              }

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

            <Link href={'/more/Upcoming'} asChild>
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
              </Link>
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
      <View style={[{paddingBottom : tabBarHeight}]}></View>
      <Portal>
      <Modal  visible={editProfileVisible} onDismiss={hideModal} contentContainerStyle={{
          height : '60%',
          width : '95%',
          borderRadius : 10,
          backgroundColor : 'white',
          alignSelf : 'center',
          alignItems : 'center'
               }}>
                <View className='flex-col'>
                  <View>
                    <Text className='text-center font-bold text-3xl'>Edit Profile </Text>
                  </View>
                  <View>
                    <Text className='mt-2 mb-1 ml-3'>Enter Your First Name</Text>
                    <TextInput
                    mode='outlined'
                    theme={{ roundness : 50 }}
                    style={{ width: 300, backgroundColor: "#e8e8e8", height: 45 }}
                    activeOutlineColor='#0D509D'
                    value={profileFirstName}
                    onChangeText={setProfileFirstName}
                    placeholder="First Name"
                    textColor='black'
                    />
                    <Text className='mt-2 mb-1 ml-3'>Enter Your Last Name</Text>
                  <TextInput
                    mode='outlined'
                    theme={{ roundness : 50 }}
                    style={{ width: 300, backgroundColor: "#e8e8e8", height: 45, }}
                    activeOutlineColor='#0D509D'
                    value={profileLastName}
                    onChangeText={setProfileLastName}
                    placeholder="Last Name"
                    textColor='black'
                    />
                  <Text className='mt-2 mb-1 ml-3'>Enter Your Email</Text>
                  <TextInput
                    mode='outlined'
                    theme={{ roundness : 50 }}
                    style={{ width: 300, backgroundColor: "#e8e8e8", height: 45 }}
                    activeOutlineColor='#0D509D'
                    value={profileEmail}
                    onChangeText={setProfileEmail}
                    placeholder="Email"
                    textColor='black'
                    />
                  </View>
                  <View className='self-center'>
                    <Button  mode='contained' buttonColor='#57BA47' textColor='white' className='w-[300] h-15 mt-8' onPress={onConfirmButton}>Submit</Button>
                  </View>
                  </View>
              </Modal>
              </Portal>
    </ScrollView>
  )
}

export default Index