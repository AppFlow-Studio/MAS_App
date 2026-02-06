import { Tabs, Redirect, useSegments, router } from "expo-router";
import * as Animatable from 'react-native-animatable';
import { Pressable, TouchableOpacity, Modal, StyleSheet, Platform, useWindowDimensions, Alert } from "react-native";
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
import { useNotifications } from '@/src/providers/NotificationProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { WHATS_NEW_VERSION_KEY } from '../_layout';
import { userSignedInThisSession } from '../(auth)/_layout';

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
      entering={FadeIn.delay(1000).duration(300)}
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
  const whatsNewCheckedRef = useRef(false);
  const notificationAlertShownRef = useRef(false);
  const { isEnabled: notificationsEnabled, requestPermission } = useNotifications();

  // Check if user needs to see What's New screen (after app update)
  useEffect(() => {
    const checkWhatsNew = async () => {
      // Only check once, and only for authenticated users
      if (whatsNewCheckedRef.current || authLoading || !session) return;
      
      whatsNewCheckedRef.current = true; // Mark as checked immediately to prevent re-runs
      
      try {
        const currentVersion = Constants.expoConfig?.version || '1.0.0';
        const seenVersion = await AsyncStorage.getItem(WHATS_NEW_VERSION_KEY);
        
        // If user hasn't seen this version's What's New, redirect them
        if (seenVersion !== currentVersion) {
          router.replace('/WhatsNew');
          return;
        }
      } catch (error) {
        console.log('Error checking What\'s New version:', error);
      }
    };

    checkWhatsNew();
  }, [authLoading, session]);

  // Check if user has notification token and prompt to enable if not
  // Delayed to show after intro video completes, skipped for users who just signed up
  useEffect(() => {
    const checkNotificationToken = () => {
      // Only check once, for authenticated non-anonymous users who didn't just sign up
      if (notificationAlertShownRef.current || authLoading || !session || session.user.is_anonymous) return;
      
      // Skip if user just signed in/signed up this session - show alert on next app open instead
      if (userSignedInThisSession) return;
      
      // Check if notifications are not enabled
      if (!notificationsEnabled) {
        notificationAlertShownRef.current = true;
        
        // Delay the alert to ensure intro video has finished
        setTimeout(() => {
          Alert.alert(
            'Enable Notifications',
            "Looks like you don't have notifications enabled. Please enable them to receive notifications for prayers, events, and programs.",
            [
              { text: 'Not Now', style: 'cancel' },
              { text: 'Enable', onPress: () => requestPermission() }
            ]
          );
        }, 5000); // 5 second delay to wait for intro video to complete
      }
    };

    checkNotificationToken();
  }, [authLoading, session, notificationsEnabled]);

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
        
        // Count incomplete items for badge
        let count = 0;
        if (isOnboardingIncomplete) count += 1;
        if (!hasCompletedPreferences) count += 1;
        setNotificationCount(count);
      } catch (error) {
        setNotificationCount(0);
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

  // Check onboarding status for non-anonymous users
  // This only tracks the state for the badge - popup is shown from More screen only
  // Onboarding is complete if user has a phone_number
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!session?.user || authLoading) return;
      
      // Skip for anonymous users - they get the CreateProfilePopup instead
      if (session.user.is_anonymous) return;
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('phone_number')
          .eq('id', session.user.id)
          .single();

        // Track onboarding status for badge display
        // Onboarding is incomplete if phone_number is null or empty
        const isIncomplete = error || !profile || !profile.phone_number;
        
        if (isIncomplete) {
          setShowOnboarding(true);
          setOnboardingIncomplete(true);
          // Don't auto-present - user will access from More screen
        } else {
          setShowOnboarding(false);
          setOnboardingIncomplete(false);
        }
      } catch (error) {
        // On error, mark as incomplete for badge
        setShowOnboarding(true);
        setOnboardingIncomplete(true);
      }
    };

    checkOnboarding();
  }, [session?.user?.id, authLoading]);

  // Show create profile popup for guest/anonymous users - DISABLED
  // useEffect(() => {
  //   const showGuestPrompt = async () => {
  //     if (!session?.user || authLoading) return;
  //     
  //     // Only show for anonymous users
  //     if (session.user.is_anonymous) {
  //       // Delay to let the app load first
  //       setTimeout(() => {
  //         setShowGuestPopup(true);
  //         guestPopupRef.current?.present();
  //       }, 17000);
  //     }
  //   };
  //
  //   showGuestPrompt();
  // }, [session?.user?.id, authLoading]);

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

  // Show nothing while checking authentication (intro video is shown at root)
  if (authLoading) {
    return null;
  }

  // Redirect to auth screen if not signed in
  if (!session) {
    return <Redirect href={'/(auth)/GreetingScreen'} />;
  }

  return (
    <BottomSheetModalProvider>
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

      {/* Complete profile bottom sheet - moved to more/index.tsx */}

      {/* Create Profile popup for guest users - DISABLED */}
      {/* {showGuestPopup && (
        <CreateProfilePopup
          ref={guestPopupRef}
          onDismiss={handleGuestPopupDismiss}
        />
      )} */}

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
