import { Image, StyleSheet, View, Text, FlatList, ScrollView, Dimensions, useWindowDimensions, ImageBackground, StatusBar, Pressable } from 'react-native';
import React, { useState, useEffect, useRef, useContext, useCallback} from 'react';
import { gettingPrayerData, prayerTimesType, Profile } from '@/src/types';
import { format, parse, setHours, setMinutes, subMinutes } from 'date-fns';
import { ThePrayerData} from '@/src/components/getPrayerData';
import { usePrayer } from '@/src/providers/prayerTimesProvider';
import SalahDisplayWidget from '@/src/components/salahDisplayWidget';
import {JummahTable} from '@/src/components/jummahTable';
import ProgramsCircularCarousel from '@/src/components/programsCircularCarousel';
import BottomSheet, { BottomSheetModal } from "@gorhom/bottom-sheet";
import { JummahBottomSheetProp } from '@/src/types';
import LinkToVolunteersModal from '@/src/components/linkToVolunteersModal';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import Animated,{ interpolate, useAnimatedRef, useAnimatedStyle, useScrollViewOffset, useSharedValue, useAnimatedScrollHandler, withTiming, Easing, FadeIn } from 'react-native-reanimated';
import { Button, TextInput, Portal, Modal, Icon  } from 'react-native-paper';
import { Link } from 'expo-router';
import LinkToDonationModal from '@/src/components/LinkToDonationModal';
import LottieView from 'lottie-react-native';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import ApprovedAds from '@/src/components/BusinessAdsComponets/ApprovedAds';
import { BlurView } from 'expo-blur';
export default function homeScreen() {
  const { onSetPrayerTimesWeek, prayerTimesWeek } = usePrayer()
  const { session } = useAuth()
  const [ ads, setAds ] = useState(false)
  const [ profile, setProfile ] = useState<Profile>()
  const [ profileFirstName , setProfileFirstName ] = useState('')
  const [ profileLastName , setProfileLastName ] = useState('')
  const [ profileEmail, setProfileEmail ] = useState('')
  const [ confirmProfile, setConfirmProfile ] = useState(false)
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = React.useState(false);
  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  const tabBarHeight = useBottomTabBarHeight();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const animation = useRef<LottieView>(null);
  const { width } = Dimensions.get("window")
  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const scrollOffset = useSharedValue(0)
    const scrollHandler = useAnimatedScrollHandler(event => {
      scrollOffset.value = event.contentOffset.y;
    });
    const imageAnimatedStyle = useAnimatedStyle(() => {
      return{
        transform: [
          {
            translateY : interpolate(
            scrollOffset.value,
            [-width / 2, 0, width / 2 ],
            [-width/4, 0, width/ 2 * 0.75]
            )
          },
          {
            scale: interpolate(scrollOffset.value, [-width/ 2, 0, width / 2], [2, 1, 1])
          }
        ]
      }
    })

    const getProfile = async () => {
      if( session?.user.is_anonymous){
        return
      }
      const { data, error } = await supabase.from('profiles').select('*').eq('id', session?.user.id).single()
      if( data ){
        if ( !data?.first_name || !data?.last_name || !data?.profile_email ){
          setVisible(true)
        }
        setProfile(data)
      }
    }
    const onConfirmButton = async () => {
      console.log(profileFirstName, profileLastName, profileEmail)
      const { data, error } = await supabase.from('profiles').update({ first_name : profileFirstName, last_name : profileLastName, profile_email : profileEmail}).eq('id', session?.user.id)
      if( data ){
        console.log(data)
      }
      if( error ){
        console.log(error)
      }
      else{
      setVisible(false)
      }
    }
    const getPrayer = async () => {
      const prayerTimesInfo = await supabase.from('prayers').select('*').eq('id', 1).single()
        const prayerTimes = prayerTimesInfo.data
        const weekInfo  : gettingPrayerData[] = ThePrayerData({prayerTimes})
        onSetPrayerTimesWeek(weekInfo)
        setLoading(false)
    }
    useEffect( () => {
      getProfile();
      getPrayer();
    }, [])
    useEffect(() => {
      if( profileFirstName && profileLastName && profileEmail ){
        setConfirmProfile(true)
      }
      else{
        setConfirmProfile(false)
      }
    }, [profileFirstName, profileLastName, profileEmail])
    if (loading){
      return(
        <View className='justify-center items-center'>
          <Text>Loading...</Text>
        </View>
      )
    }
    const prayer = prayerTimesWeek
    return (
      <Animated.ScrollView ref={scrollRef} className="bg-white h-full flex-1" onScroll={scrollHandler} 
      >
            <StatusBar barStyle={"dark-content"}/>
            <View className='justify-center items-center mt-[12%] '>
              <Animated.Image source={require("@/assets/images/massiLogo2.png")} style={[{width: width / 2, height: 75, justifyContent: "center" }, imageAnimatedStyle]} />
            </View>

            <View style={{height: 250, overflow: "hidden", justifyContent:"center", borderEndStartRadius: 30 ,borderEndEndRadius: 30}} className=''>
              <SalahDisplayWidget prayer={prayer[0]} nextPrayer={prayer[1]}/>
            </View>
          <Link href={'/menu/program'} asChild>
            <Pressable className='pt-7 flex-row justify-between w-[100%] px-3'>
              <Text className='font-bold text-2xl text-[#0D509D]' style={{textShadowColor: "light-gray", textShadowOffset: { width: 0.5, height: 3 }, textShadowRadius: 0.6}} >Weekly Programs</Text>
              <View className='flex-row items-center'>
                <Text className='text-gray-300'>View All</Text>
                <Icon source={'chevron-right'} size={20}/>
              </View>
            </Pressable>
          </Link>
              <View className='pt-3' style={{height: 250}}>
                <ProgramsCircularCarousel />
              </View>
              <ApprovedAds />
              <View className='pl-3 flex-row pt-4'>
                  <Text className='text-[#0D509D] font-bold text-2xl'>Donate</Text>
              </View>
              <View className='pt-2'>
                <LinkToDonationModal />
              </View>
            <View className='flex-row pl-3 pt-5'>
              <Text className='text-[#0D509D] font-bold text-2xl' style={{textShadowColor: "#light-gray", textShadowOffset: { width: 0.5, height: 3 }, textShadowRadius: 1 }}>Volunteers</Text>
            </View>
            <View className='pt-2'>
              <LinkToVolunteersModal />
            </View>
            <View className='flex-row pl-3 pt-6'>
              <Text className='text-[#0D509D] font-bold text-2xl' style={{textShadowColor: "#light-gray", textShadowOffset: { width: 0.5, height: 3 }, textShadowRadius: 1 }}>Jummah Schedule</Text>
            </View>
            <View className='justify-center items-center w-[95%] m-auto pt-2' style={{shadowColor: "black", shadowOffset: { width: 0, height: 0},shadowOpacity: 0.6}}>
              <ImageBackground style={{width:"100%", height: 450, justifyContent: "center"}} source={require("@/assets/images/jummahSheetBackImg.png")} resizeMode='stretch' imageStyle={{ borderRadius: 20 }}>
                <JummahTable ref={bottomSheetRef}/>
              </ImageBackground>
            </View>
            <View style={[{paddingBottom : tabBarHeight}]}></View>

            <Portal>
              <Modal dismissable={false} visible={visible} onDismiss={hideModal} contentContainerStyle={{ height : '70%', width : '95%', borderRadius : 10, backgroundColor : 'white', alignSelf : 'center', alignItems : 'center' }}>
                <View className='flex-col'>
                  <View>
                    <Image source={require('@/assets/images/MASHomeLogo.png')} style={{ width : '80%', height : '20%' }}/>
                  </View>
                  <View>
                    <Text className='text-center font-bold text-3xl'>Welcome</Text>
                  </View>
                  <View className='items-center'>
                    <Text>Enter Your First Name</Text>
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
                    <Text>Enter Your Last Name</Text>
                  <TextInput
                    mode='outlined'
                    theme={{ roundness : 50 }}
                    style={{ width: 300, backgroundColor: "#e8e8e8", height: 45 }}
                    activeOutlineColor='#0D509D'
                    value={profileLastName}
                    onChangeText={setProfileLastName}
                    placeholder="Last Name"
                    textColor='black'
                    />
                  <Text>Enter Your Email</Text>
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
                    <Button  disabled={!confirmProfile} mode='contained' buttonColor='#57BA47' textColor='white' className='w-[150]' onPress={onConfirmButton}>Confirm</Button>
                  </View>
                  </View>
              </Modal>
            </Portal>
            
      </Animated.ScrollView>
    )
    
  }

