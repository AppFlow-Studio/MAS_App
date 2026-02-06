import { Image, StyleSheet, View, Text, FlatList, ScrollView, Dimensions, useWindowDimensions, ImageBackground, StatusBar, Pressable, RefreshControl, Linking, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef, useContext, useCallback, useMemo } from 'react';
import { gettingPrayerData, prayerTimesType, Profile } from '@/src/types';
import { format, parse, setHours, setMinutes, subMinutes } from 'date-fns';
import { usePrayerTimes } from '@/src/hooks/usePrayerTimes';
import SalahDisplayWidget from '@/src/components/salahDisplayWidget';
import { JummahTable } from '@/src/components/jummahTable';
import ProgramsCircularCarousel from '@/src/components/programsCircularCarousel';
import BottomSheet, { BottomSheetModal } from "@gorhom/bottom-sheet";
import { JummahBottomSheetProp } from '@/src/types';
import LinkToVolunteersModal from '@/src/components/linkToVolunteersModal';
import Animated, { interpolate, useAnimatedRef, useAnimatedStyle, useSharedValue, useAnimatedScrollHandler, withTiming, runOnJS } from 'react-native-reanimated';
import { Button, TextInput, Portal, Modal, Icon } from 'react-native-paper';
import { Link, useRouter } from 'expo-router';
import LinkToDonationModal from '@/src/components/LinkToDonationModal';
import LottieView from 'lottie-react-native';
import { useAuth } from '@/src/providers/AuthProvider';
import ApprovedAds from '@/src/components/BusinessAdsComponets/ApprovedAds';
import { useProfile } from '@/src/hooks/useProfile';
import { BlurView } from 'expo-blur';
import SocialPlatforms from '@/src/components/SocialPlatforms';
import IconsMarquee from '@/src/components/Marquee';
import MASQuestionaire from '@/src/components/MASQuestionaire';
import DailyProgramsWidget from '@/src/components/DailyProgramsWidget';
import OverlappingWidget from '@/src/components/OverlappingWidget';
import DonationBottomSheet, { DonationBottomSheetRef } from '@/src/components/DonationBottomSheet';
import SuggestionsGrid from '@/src/components/SuggestionsGrid';

// Color Theme based on Figma design
const COLORS = {
  primary: '#214E91',      // Main blue
  accent: '#57BA47',       // Green accent
  white: '#FFFFFF',        // Pure white
  background: '#FFFFFF',   // White background
  black: '#000000',        // Primary text
  gray: '#6B7280',         // Secondary text
  lightGray: '#F3F4F6',    // Light backgrounds
  border: '#E5E7EB',       // Borders
  shadow: 'rgba(0, 0, 0, 0.1)', // Shadows
};

export default function homeScreen() {
  const { data: prayerTimesWeek, isLoading: prayerTimesLoading, refetch: refetchPrayerTimes } = usePrayerTimes()
  const router = useRouter()
  const { session } = useAuth()
  const { data: profile, refetch: refetchProfile } = useProfile(
    session?.user.is_anonymous ? undefined : session?.user.id
  )
  const [isRendered, setIsRendered] = useState(false)
  const [profileFirstName, setProfileFirstName] = useState('')
  const [profileLastName, setProfileLastName] = useState('')
  const [profileEmail, setProfileEmail] = useState('')
  const [confirmProfile, setConfirmProfile] = useState(true)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [visible, setVisible] = React.useState(false);
  const [showQuestionaire, setShowQuestionaire] = useState(false)
  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const animation = useRef<LottieView>(null);
  const { width } = Dimensions.get("window")
  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const scrollOffset = useSharedValue(0)
  const donationSheetRef = useRef<DonationBottomSheetRef>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const updateBottomState = (isBottom: boolean) => {
    setIsAtBottom(isBottom);
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollOffset.value = interpolate(event.contentOffset.y, [-1, 1], [-1, 1]);

      // Check if we're at the bottom - disable bounce well before reaching bottom to prevent background showing
      const { contentOffset, contentSize, layoutMeasurement } = event;
      const scrollPosition = contentOffset.y + layoutMeasurement.height;
      const totalContentHeight = contentSize.height;
      // Disable bounce when within 200px of bottom to completely prevent blue background from showing
      const isBottom = scrollPosition >= totalContentHeight - 200;
      runOnJS(updateBottomState)(isBottom);
    }
  });

  const handleScrollEndDrag = (event: { nativeEvent: { contentOffset: { y: number }; contentSize: { height: number }; layoutMeasurement: { height: number } } }) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollPosition = contentOffset.y + layoutMeasurement.height;
    const totalContentHeight = contentSize.height;
    const isBottom = scrollPosition >= totalContentHeight - 200;
    setIsAtBottom(isBottom);
  };

  const handleMomentumScrollEnd = (event: { nativeEvent: { contentOffset: { y: number }; contentSize: { height: number }; layoutMeasurement: { height: number } } }) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollPosition = contentOffset.y + layoutMeasurement.height;
    const totalContentHeight = contentSize.height;
    const isBottom = scrollPosition >= totalContentHeight - 200;
    setIsAtBottom(isBottom);
  };
  const HeaderRadius = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(scrollOffset.value, [-width / 2, 0, width / 2], [-width / 4, 0, width / 2])
        }
      ],
    }
  })
  const imageAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: interpolate(scrollOffset.value, [0, 75 - 50], [75, 50], 'clamp'),
      width: interpolate(scrollOffset.value, [0, (width / 2.2) - (width / 3)], [width / 2.2, width / 3], 'clamp'),
    }
  })

  // Show profile completion modal if needed
  useEffect(() => {
    if (profile && (!profile.first_name || !profile.last_name || !profile.profile_email)) {
      setTimeout(() => { setVisible(true) }, 4150)
    }
  }, [profile])

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([refetchPrayerTimes(), refetchProfile()])
    } catch (error) {
      console.error('Error refreshing:', error)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (!prayerTimesLoading && !refreshing) {
      setLoading(false)
    }
  }, [prayerTimesLoading, refreshing])
  useEffect(() => {
    if (profileFirstName && profileLastName && profileEmail) {
      setConfirmProfile(true)
    }
    else {
      setConfirmProfile(false)
    }
  }, [profileFirstName, profileLastName, profileEmail])

  const prayer = prayerTimesWeek || []

  if (loading || !prayerTimesWeek || prayerTimesWeek.length === 0) {
    return (
      <View style={{ backgroundColor: COLORS.background }} className='justify-center items-center h-full'>
        <Text style={{ color: COLORS.primary }} className='text-lg font-semibold'>Loading...</Text>
      </View>
    )
  }
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Blue area for top over-scroll */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 500, backgroundColor: '#214E91', zIndex: 0 }} />
      
      {/* Refresh indicator */}
      {refreshing && (
        <View style={{ 
          position: 'absolute', 
          top: 100, 
          left: 0, 
          right: 0, 
          alignItems: 'center', 
          zIndex: 100 
        }}>
          <ActivityIndicator size="large" color={COLORS.white} />
        </View>
      )}
      
      <Animated.ScrollView
        ref={scrollRef}
        style={{ backgroundColor: 'transparent', zIndex: 1 }}
        contentContainerStyle={{ backgroundColor: COLORS.background, minHeight: '100%', paddingBottom: 80 }}
        className="h-full"
        bounces={true}
        alwaysBounceVertical={true}
        overScrollMode="never"
        onScroll={scrollHandler}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={'transparent'}
            colors={['transparent']}
            progressViewOffset={0}
          />
        }
      >
      <StatusBar barStyle={"light-content"} />

      <View style={{ height: 350, overflow: "hidden", justifyContent: "center" }} className=''>
        {prayer && prayer[0] && prayer[1] && (
          <SalahDisplayWidget
            key={`${prayer[0]?.date}-${prayer[0]?.athan_fajr}`}
            prayer={prayer[0]}
            nextPrayer={prayer[1]}
          />
        )}
      </View>

      {/* Overlapping Widget */}
      <OverlappingWidget />

      <Pressable
        className='pt-7 flex-row justify-between w-[100%] px-3'
        onPress={() => router.push('/menu/program/upcomingEvents')}
      >
        <Text style={{ color: COLORS.primary }} className='font-bold text-2xl'>Weekly Programs</Text>
        <View className='flex-row items-center'>
          <Text style={{ color: COLORS.gray }} className=''>View All</Text>
          <Icon source={'chevron-right'} size={20} color={COLORS.gray} />
        </View>
      </Pressable>
      <View className='pt-3' style={{ height: 250 }}>
        <ProgramsCircularCarousel />
      </View>

      {/* Ads */}
      <ApprovedAds setRenderedFalse={() => setIsRendered(false)} setRenderedTrue={() => setIsRendered(true)} />

      {/* Suggestions Grid - Uber-style icons */}
      <SuggestionsGrid 
        onDonatePress={() => donationSheetRef.current?.open()}
        onAdvertisePress={() => router.push('/more/BusinessAds')}
      />

      {/* Jummah Schedule */}
      <View className='pt-6'>
        <View className='flex-row pl-3 pb-2'>
          <Text style={{ color: COLORS.primary }} className='font-bold text-2xl'>Jummah Schedule</Text>
        </View>
        <JummahTable ref={bottomSheetRef} />
      </View>

      {/* Commented out sections below Explore Features
                  <ApprovedAds setRenderedFalse={() => setIsRendered(false)} setRenderedTrue={() => setIsRendered(true) }/>
                      
                    <View className='pl-3 flex-row pt-4'>
                        <Text className='text-[#0D509D] font-bold text-2xl'>Donate</Text>
                    </View>
                    <View className='pt-2'>
                      <LinkToDonationModal />
                    </View>
                  <View className='flex-row pl-3 pt-5'>
                    <Text className='text-[#0D509D] font-bold text-2xl'>Volunteers</Text>
                  </View>
                  <View className='pt-2'>
                    <LinkToVolunteersModal />
                  </View>
                  <View className='flex-row pl-3 pt-6'>
                    <Text className='text-[#0D509D] font-bold text-2xl' >Jummah Schedule</Text>
                  </View>
                  <View className='justify-center items-center w-[95%] m-auto pt-2' style={{shadowColor: "black", shadowOffset: { width: 0, height: 0},shadowOpacity: 0.6}}>
                    <ImageBackground style={{width:"100%", height: 450, justifyContent: "center"}} source={require("@/assets/images/jummahSheetBackImg.jpeg")} resizeMode='stretch' imageStyle={{ borderRadius: 20 }}>
                      <JummahTable ref={bottomSheetRef}/>
                    </ImageBackground>
                  </View>
      
                  Programs Carousel
                  <View className='pt-3' style={{height: 250}}>
                    <ProgramsCircularCarousel />
                  </View>
      
                  <ApprovedAds setRenderedFalse={() => setIsRendered(false)} setRenderedTrue={() => setIsRendered(true) }/>
                      
                  <View className='pl-3 flex-row pt-4'>
                      <Text style={{color: COLORS.primary}} className='font-bold text-2xl'>Donate</Text>
                  </View>
                  <View className='pt-2'>
                    <LinkToDonationModal />
                  </View>
                <View className='flex-row pl-3 pt-5'>
                  <Text style={{color: COLORS.primary}} className='font-bold text-2xl'>Volunteers</Text>
                </View>
                <View className='pt-2'>
                  <LinkToVolunteersModal />
                </View>
                <View className='flex-row pl-3 pt-6'>
                  <Text style={{color: COLORS.primary}} className='font-bold text-2xl' >Jummah Schedule</Text>
                </View>
                <View className='justify-center items-center w-[95%] m-auto pt-2' style={{shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 8}}>
                  <ImageBackground style={{width:"100%", height: 450, justifyContent: "center"}} source={require("@/assets/images/jummahSheetBackImg.jpeg")} resizeMode='stretch' imageStyle={{ borderRadius: 20 }}>
                    <JummahTable ref={bottomSheetRef}/>
                  </ImageBackground>
                </View>
                  */}

      <View className='flex-row pl-3 pt-6'>
        <Text style={{ color: COLORS.primary }} className='font-bold text-2xl'>Connect With Us</Text>
      </View>
      <IconsMarquee />

      {/* Today's Programs Widget
                <DailyProgramsWidget />
                
                <Portal >
                  <Modal visible style={{
                    backgroundColor : COLORS.background
                  }}>
                    <MASQuestionaire onCloseQuestionaire={() => setShowQuestionaire(false)}/>
                  </Modal>
                </Portal>
                */}

      </Animated.ScrollView>

      {/* Donation Bottom Sheet */}
      <DonationBottomSheet ref={donationSheetRef} />
    </View>
  )

}

