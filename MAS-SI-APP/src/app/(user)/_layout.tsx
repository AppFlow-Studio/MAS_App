import { Tabs, Redirect, useSegments } from "expo-router";
import * as Animatable from 'react-native-animatable';
import { Pressable, TouchableOpacity, Modal, StyleSheet, Platform, useWindowDimensions } from "react-native";
import { useEffect, useRef, useState } from "react";
import TabArray from '@/src/lib/tabs';

import { useAuth } from "@/src/providers/AuthProvider";
import LottieView from 'lottie-react-native';
import Animated, { 
  Easing, 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  runOnJS, 
  FadeIn
} from 'react-native-reanimated';
import Toast from 'react-native-toast-message'
import { View, Text, Image } from 'react-native'
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics'
import AccountModal from '../../components/AccountModal';
import ClassicTabBar from '../../components/ClassicTabBar';
// import TutorialOverlay from "@/src/components/TutorialOverlay";
import { NativeTabs, Label, Icon } from 'expo-router/unstable-native-tabs';
import { PersonalizedAccount } from '@/src/components/PersonalizedAccount';
import { CreateProfilePopup } from '@/src/components/CreateProfilePopup';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { supabase } from '@/src/lib/supabase';
import { OnboardingProvider, useOnboarding } from '@/src/providers/OnboardingProvider';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

// const toastConfig = {
//   addProgramToNotificationsToast: ({ props }: any) => (
//     <Pressable className='rounded-xl overflow-hidden ' onPress={props.onPress}>
//       <BlurView intensity={40} className='flex-row items-center justify-between px-4 rounded-xl p-1 max-w-[85%] max-h-[60]'
//         experimentalBlurMethod={'dimezisBlurView'}
//       >
//         <View>
//           <Image source={props.props.program_img ? { uri: props.props.program_img } : require("@/assets/images/MASHomeLogo.png")} style={{ width: 50, height: 50, objectFit: 'fill', borderRadius: 10 }} />
//         </View>
//         <View className='flex-col pl-2'>
//           <View>
//             <Text>1 Program Added To Notifications</Text>
//           </View>
//           <View className='flex-row'>
//             <Text className='text-sm'>{props.props.program_name}</Text>
//             <Icon source={'chevron-right'} size={20} />
//           </View>
//         </View>
//       </BlurView>
//     </Pressable>
//   ),
//   LectureAddedToPlaylist: ({ props }: any) => (
//     <Pressable className='rounded-xl overflow-hidden' onPress={props.onPress}>
//       <BlurView intensity={40} className='flex-row items-center justify-between px-3 p-1 max-w-[85%] max-h-[60]'
//         experimentalBlurMethod={'dimezisBlurView'}
//       >
//         <View className=''>
//           <Image source={props.props?.playlist_img ? { uri: props.props.playlist_img } : require("@/assets/images/MASHomeLogo.png")} style={{ width: 50, height: 50, objectFit: 'fill', borderRadius: 10 }} />
//         </View>
//         <View className='flex-col pl-2'>
//           <View>
//             <Text numberOfLines={1} allowFontScaling adjustsFontSizeToFit >1 lecture added</Text>
//           </View>
//           <View className='flex-row'>
//             <Text>{props.props?.playlist_name}</Text>
//             <Icon source={'chevron-right'} size={20} />
//           </View>
//         </View>
//       </BlurView>
//     </Pressable>
//   ),
//   ProgramAddedToPrograms: ({ props }: any) => (
//     <Pressable className='rounded-xl overflow-hidden ' onPress={props.onPress}>
//       <BlurView intensity={40} className='flex-row items-center justify-between px-4 rounded-xl p-1 max-w-[85%] max-h-[60]'
//         experimentalBlurMethod={'dimezisBlurView'}
//       >
//         <View>
//           <Image source={props.props.program_img ? { uri: props.props.program_img } : require("@/assets/images/MASHomeLogo.png")} style={{ width: 50, height: 50, objectFit: 'fill', borderRadius: 10 }} />
//         </View>
//         <View className='flex-col pl-2'>
//           <View>
//             <Text>1 Program Added to Library</Text>
//           </View>
//           <View className='flex-row'>
//             <Text className='text-sm'>{props.props.program_name}</Text>
//             <Icon source={'chevron-right'} size={20} />
//           </View>
//         </View>
//       </BlurView>
//     </Pressable>
//   ),
//   addEventToNotificationsToast: ({ props }: any) => (
//     <Pressable className='rounded-xl overflow-hidden ' onPress={props.onPress}>
//       <BlurView intensity={40} className='flex-row items-center justify-between px-4 rounded-xl p-1 max-w-[85%] max-h-[60]'
//         experimentalBlurMethod={'dimezisBlurView'}
//       >
//         <View>
//           <Image source={props.props.event_img ? { uri: props.props.event_img } : require("@/assets/images/MASHomeLogo.png")} style={{ width: 50, height: 50, objectFit: 'fill', borderRadius: 10 }} />
//         </View>
//         <View className='flex-col pl-2'>
//           <View>
//             <Text>1 Program Added To Notifications</Text>
//           </View>
//           <View className='flex-row'>
//             <Text className='text-sm'>{props.props.event_name}</Text>
//             <Icon source={'chevron-right'} size={20} />
//           </View>
//         </View>
//       </BlurView>
//     </Pressable>
//   ),
//   ConfirmNotificationOption: ({ props }: any) => (
//     <Pressable className='rounded-xl overflow-hidden ' onPress={props.onPress}>
//       <BlurView intensity={40} className='flex-row items-center justify-between px-4 rounded-xl p-2 max-w-[90%] max-h-[60]'
//         experimentalBlurMethod={'dimezisBlurView'}
//       >

//         <View className='flex-col pl-2'>
//           <View>
//             <Text className="text-white">{props.message} : {props.time}</Text>
//           </View>
//           <View className='flex-row'>
//             <Text className='text-md font-bold text-white'>{props.prayer}</Text>
//           </View>
//         </View>
//         <View className="pl-5" />
//         <View className="bg-white p-1 rounded-full">
//           <Icon source={'check'} size={20} color="green" />
//         </View>
//       </BlurView>
//     </Pressable>
//   )
// }
// type TabButtonProps = {
//   props: BottomTabBarButtonProps,
//   items: TabArrayType
// }


// const TabButton = ({ props, items }: TabButtonProps) => {
//   const { onPress, accessibilityState, ...restProps } = props;
//   const focused = accessibilityState?.selected;
//   const textRef = useRef<any>(null);

//   useEffect(() => {
//     if (focused) {
//       textRef.current?.transitionTo({ scale: 1.2 });
//       Haptics.notificationAsync(
//         Haptics.NotificationFeedbackType.Success
//       )
//     } else {
//       textRef.current?.transitionTo({ scale: 0.8 });
//     }
//   }, [focused]);

//   return (
//     <TouchableOpacity
//       {...restProps}
//       onPress={onPress}
//       accessibilityState={accessibilityState}
//       style={{ alignItems: "center", flex: 1, marginTop: 7, height: '200%' }}
//     // style={{ alignItems: "center", flex: 1, marginTop: 8, height: '100%', paddingVertical: 6 }}
//     >
//       <Animatable.View
//         className='justify-center items-center'
//         style={{ width: 30, height: 20, justifyContent: "center", alignItems: "center" }}
//         animation="zoomIn"
//         duration={1000}
//       >
//         <Icon source={items?.icon} size={28} color={focused ? "#57BA47" : "#0D509D"} />
//       </Animatable.View>
//       <Animatable.Text
//         ref={textRef}
//         style={{ fontSize: 10, color: focused ? "#57BA47" : '#0D509D', textAlign: "center", fontWeight: focused ? "bold" : 'regular', opacity: focused ? 1 : 0.5 }}
//         numberOfLines={1}
//       >
//         {items?.title ? items?.title : ""}
//       </Animatable.Text>
//     </TouchableOpacity>
//   );
// }

// Notification Badge Component with count (no animation)
const NotificationBadge = ({ count = 1 }: { count?: number }) => {
  const { width: screenWidth } = useWindowDimensions();

  // Calculate position to be on top of the "More" tab (4th tab out of 4)
  // Tab bar has 4 tabs, "More" is the last one
  const tabWidth = screenWidth / 4;
  const moreTabCenterX = tabWidth * 3.5; // Center of the 4th tab
  const badgeOffsetX = -8; // Offset to position closer to center of icon

  // Determine badge size based on count digits
  const displayCount = count > 99 ? '99+' : count.toString();
  const badgeWidth = displayCount.length > 1 ? (displayCount.length > 2 ? 26 : 20) : 18;

  return (
    <Animated.View
      entering={FadeIn.delay(300).duration(200)}
      style={{
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 62 : 52, // Closer to the icon
        left: moreTabCenterX + badgeOffsetX - (badgeWidth / 2),
        zIndex: 999,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Main badge with count */}
      <View
        style={{
          minWidth: badgeWidth,
          height: 18,
          borderRadius: 9,
          backgroundColor: '#EF4444',
          borderWidth: 2,
          borderColor: '#ffffff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 3,
          elevation: 4,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 4,
        }}
      >
        <Text style={{
          color: '#ffffff',
          fontSize: 10,
          fontWeight: '700',
          textAlign: 'center',
          includeFontPadding: false,
        }}>
          {displayCount}
        </Text>
      </View>
    </Animated.View>
  );
};

const UserLayoutContent = () => {
  const { session, loading: authLoading } = useAuth();
  const { isOnboardingIncomplete, setOnboardingIncomplete, onboardingSheetRef } = useOnboarding();
  const [loading, setLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const segments = useSegments();
  const opacity = useSharedValue(1);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showGuestPopup, setShowGuestPopup] = useState(false);
  const guestPopupRef = useRef<{ present: () => void; dismiss: () => void }>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [preferencesCompleted, setPreferencesCompleted] = useState(true);

  // Video intro state
  const [showVideoIntro, setShowVideoIntro] = useState(true);
  const videoOpacity = useSharedValue(1);

  // Check for incomplete items in More screen (profile + preferences)
  useEffect(() => {
    const checkIncompleteItems = async () => {
      // Anonymous users or not logged in - don't show badge
      if (!session?.user?.id || session.user.is_anonymous) {
        setNotificationCount(0);
        return;
      }

      try {
        // Check if user has completed personalization preferences
        const { data: userInterests } = await supabase
          .from('user_islamic_interests')
          .select('id')
          .eq('user_id', session.user.id)
          .limit(1);
        
        const hasCompletedPreferences = !!(userInterests && userInterests.length > 0);
        setPreferencesCompleted(hasCompletedPreferences);
        
        // Count incomplete items: profile onboarding + preferences
        let count = 0;
        if (isOnboardingIncomplete) count += 1;
        if (!hasCompletedPreferences) count += 1;
        
        setNotificationCount(count);
      } catch (error) {
        // On error, just check onboarding status
        setNotificationCount(isOnboardingIncomplete ? 1 : 0);
      }
    };

    checkIncompleteItems();

    // Subscribe to changes in user interests
    const interestsChannel = supabase
      .channel('user-interests-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_islamic_interests',
        filter: `user_id=eq.${session?.user?.id}`
      }, () => checkIncompleteItems())
      .subscribe();

    return () => {
      supabase.removeChannel(interestsChannel);
    };
  }, [session?.user?.id, isOnboardingIncomplete]);
  
  // Show account button only on home page (menu tab)
  // segments will be ['(user)', 'menu'] when on home page
  const isHomePage = segments.length >= 2 && segments[1] === 'menu' && segments[2] !== 'program';
  interface TextWithDefaultProps extends Text {
    defaultProps?: { allowFontScaling?: boolean };
  }

  // ((Text as unknown) as TextWithDefaultProps).defaultProps =
  //   ((Text as unknown) as TextWithDefaultProps).defaultProps || {};
  // ((Text as unknown) as TextWithDefaultProps).defaultProps!.allowFontScaling = false;
  // const playMASAnimation = useAnimatedStyle(() => {
  //   return {
  //     opacity: opacity.value,
  //   };
  // });

  // const handleAnimationEnd = () => {
  //   setLoading(false);
  //   // setShowTutorial(true); // Show tutorial after logo animation
  // };

  // const fadeOutAnimation = () => {
  //   opacity.value = withTiming(0, { duration: 1000, easing: Easing.out(Easing.quad) }, () => {
  //     runOnJS(handleAnimationEnd)();
  //   });
  // }

  // const handleTutorialFinish = () => {
  //   setShowTutorial(false);
  // };

  // Video intro animated style and handler
  const videoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: videoOpacity.value,
  }));

  const handleVideoEnd = () => {
    videoOpacity.value = withTiming(0, { duration: 500 }, () => {
      runOnJS(setShowVideoIntro)(false);
    });
  };

  // Check onboarding status for non-anonymous users
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!session?.user || authLoading) return;
      
      // Skip for anonymous users - they get the CreateProfilePopup instead
      if (session.user.is_anonymous) return;
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .single();

        // Show PersonalizedAccount if:
        // 1. Profile doesn't exist (error) - shouldn't happen for logged in users
        // 2. Profile exists but onboarding_completed is false or null
        const shouldShowOnboarding = error || !profile || !profile.onboarding_completed;
        
        if (shouldShowOnboarding) {
          setShowOnboarding(true);
          setOnboardingIncomplete(true);
          setTimeout(() => {
            onboardingSheetRef.current?.present();
          }, 800);
        }
      } catch (error) {
        // On error, show onboarding to be safe
        setShowOnboarding(true);
        setOnboardingIncomplete(true);
        setTimeout(() => {
          onboardingSheetRef.current?.present();
        }, 800);
      }
    };

    checkOnboarding();
  }, [session?.user?.id, authLoading]);

  // Show create profile popup for guest/anonymous users
  useEffect(() => {
    const showGuestPrompt = async () => {
      if (!session?.user || authLoading) return;
      
      // Only show for anonymous users
      if (session.user.is_anonymous) {
        // Delay to let the app load first
        setTimeout(() => {
          setShowGuestPopup(true);
          guestPopupRef.current?.present();
        }, 1500);
      }
    };

    showGuestPrompt();
  }, [session?.user?.id, authLoading]);

  const handleGuestPopupDismiss = () => {
    setShowGuestPopup(false);
  };

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    setOnboardingIncomplete(false);
    console.log('Profile personalization completed successfully');
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    setOnboardingIncomplete(true);
  };

  const handleReopenOnboarding = () => {
    setShowOnboarding(true);
    setTimeout(() => {
      onboardingSheetRef.current?.present();
    }, 100);
  };

  // Show nothing while checking authentication
  if (authLoading) {
    return null;
  }

  // Redirect to auth screen if not signed in
  if (!session) {
    return <Redirect href={'/(auth)/GreetingScreen'} />;
  }

  return (
    <BottomSheetModalProvider>
      {/* Old Lottie Animation - kept for reference */}
      {/* {loading && (
        <Animated.View style={[{ zIndex: 1, position: 'absolute', width: '100%', height: '100%' }, playMASAnimation]}>
          <LottieView
            autoPlay
            loop={false}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'white',
            }}
            source={require('@/assets/lottie/MASLogoAnimation3.json')}
            onAnimationFinish={() => {
              fadeOutAnimation();
            }}
            speed={1.5}
          />
        </Animated.View>
      )} */}

      {/* Video Intro - plays once on app startup for signed-in users */}
      {showVideoIntro && (
        <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 100 }, videoAnimatedStyle]}>
          <Video
            source={require('@/assets/videos/TestIntro.mp4')}
            style={{ flex: 1 }}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping={false}
            onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
              if (status.isLoaded && status.didJustFinish) {
                handleVideoEnd();
              }
            }}
          />
        </Animated.View>
      )}

      <NativeTabs>
        {/* {TabArray.map((tab, i) => (
          <NativeTabs.Trigger key={i} name={`${tab.name}`} >
            <Label>{tab.title}</Label>
            <Icon sf={tab.icon as any} drawable="custom_android_drawable" />
          </NativeTabs.Trigger>
        ))} */}
        <NativeTabs.Trigger name="menu">
          <Label>Home</Label>
          <Icon sf="house.fill" drawable="custom_android_drawable" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="myPrograms">
          <Label>My Library</Label>
          <Icon sf="book" drawable="custom_android_drawable" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="prayersTable">
          <Label>Prayer Times</Label>
          <Icon sf="clock" drawable="custom_android_drawable" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="more">
          <Label>More</Label>
          <Icon sf="ellipsis.bubble.fill" drawable="custom_android_drawable" />
        </NativeTabs.Trigger>
      </NativeTabs>

      {(showOnboarding || isOnboardingIncomplete) && (
        <PersonalizedAccount
          ref={onboardingSheetRef}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {/* Create Profile popup for guest users */}
      {showGuestPopup && (
        <CreateProfilePopup
          ref={guestPopupRef}
          onDismiss={handleGuestPopupDismiss}
        />
      )}

      {/* Enhanced Badge indicator with notification count */}
      {notificationCount > 0 && (
        <NotificationBadge count={notificationCount} />
      )}
    </BottomSheetModalProvider>
  )
};

const UserLayout = () => {
  return (
    <OnboardingProvider>
      <UserLayoutContent />
    </OnboardingProvider>
  );
};

export default UserLayout;
