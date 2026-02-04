import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from '../../hooks/useColorScheme';
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { MenuProvider } from "react-native-popup-menu";
import AuthProvider from '../providers/AuthProvider';
import DeepLinkProvider from '../providers/DeepLinkProvider';
import { StripeProvider } from '@stripe/stripe-react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationProvider } from '../providers/NotificationProvider';
import { Text, StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, { useSharedValue, withTiming, runOnJS, useAnimatedStyle } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { glassyToastConfig } from '../lib/toastConfig';
import { useAuth } from '../providers/AuthProvider';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { userSignedInThisSession } from './(auth)/_layout';
import "@/global.css"

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RootLayoutNav = () => {
  return (
    <Stack key="main-app" >
      <Stack.Screen name="(user)" options={{ headerShown: false, animation: 'none' }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false, animation: 'none' }} />
      <Stack.Screen name="+not-found" options={{ animation: 'none' }} />
    </Stack>
  )
}

// Intro video overlay - shown on top of the whole app during load and for returning signed-in users
function IntroVideoOverlay() {
  const { session, loading: authLoading } = useAuth();
  const [videoDismissed, setVideoDismissed] = useState(false);
  const videoOpacity = useSharedValue(1);

  // Show video: during auth load, or for returning user (session + didn't just sign in) until dismissed
  const showVideo =
    (authLoading || (session && !userSignedInThisSession)) &&
    !videoDismissed;

  const videoStyle = useAnimatedStyle(() => ({ opacity: videoOpacity.value }));

  const handleVideoEnd = () => {
    videoOpacity.value = withTiming(0, { duration: 500 }, () => {
      runOnJS(setVideoDismissed)(true);
    });
  };

  if (!showVideo) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, { zIndex: 9999 }, videoStyle]}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]} />
      <Video
        source={require('@/assets/videos/TestIntro.mp4')}
        style={StyleSheet.absoluteFill}
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
  );
}

SplashScreen.preventAutoHideAsync()
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [showLogo, setShowLogo] = useState(true);
  const [isFirstLaunchChecked, setIsFirstLaunchChecked] = useState(false);
  const logoOpacity = useSharedValue(1);

  interface TextWithDefaultProps extends Text {
    defaultProps?: { allowFontScaling?: boolean };
  }

  ((Text as unknown) as TextWithDefaultProps).defaultProps =
    ((Text as unknown) as TextWithDefaultProps).defaultProps || {};
  ((Text as unknown) as TextWithDefaultProps).defaultProps!.allowFontScaling = false;

  const [loaded] = useFonts({
    SpaceMono: require("../../assets/fonts/SpaceMono-Regular.ttf"),
    Oleo: require("../../assets/fonts/OleoScript-Regular.ttf"),
    Poppins_400Regular: require("../../assets/fonts/Poppins-Regular.ttf"),
    Poppins_500Medium: require("../../assets/fonts/Poppins-Medium.ttf"),
    Poppins_600SemiBold: require("../../assets/fonts/Poppins-SemiBold.ttf"),
    Poppins_700Bold: require("../../assets/fonts/Poppins-Bold.ttf"),
    Poppins_800ExtraBold: require("../../assets/fonts/Poppins-ExtraBold.ttf"),
  });

  // Check if first launch (without clearing storage)
  useEffect(() => {
    setIsFirstLaunchChecked(true);
  }, []);

  // ✅ Logo fade animation
  const logoAnimation = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
  }));

  const hideLogo = () => {
    logoOpacity.value = withTiming(0, { duration: 600 }, () => {
      runOnJS(setShowLogo)(false);
    });
  };

  useEffect(() => {
    async function hideSplash() {
      await SplashScreen.preventAutoHideAsync();
      if (loaded && isFirstLaunchChecked) {
        await SplashScreen.hideAsync();
        setTimeout(() => {
          hideLogo();
        }, 3500); // Duration to show the logo screen before fading
      }
    }
    hideSplash();
  }, [loaded, isFirstLaunchChecked]);

  if (!loaded || !isFirstLaunchChecked) {
    return null; // Wait until fonts and AsyncStorage are ready
  }
  return (
    <GestureHandlerRootView>
      <QueryClientProvider client={queryClient}>
        <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!} urlScheme="MAS-SI-APP">
          <AuthProvider>
            <DeepLinkProvider>
              <NotificationProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <BottomSheetModalProvider>
                  <MenuProvider>
                    <PaperProvider>
                      {/* ✅ Show animated logo once */}
                      {/* {showLogo && (
                        <Animated.View style={[{ position: 'absolute', zIndex: 10, width: '100%', height: '100%' }, logoAnimation]}>
                          <LottieView
                            autoPlay
                            loop={false}
                            source={require("@/assets/lottie/MASLogoAnimation3.json")}
                            style={{ width: '100%', height: '100%', backgroundColor: 'white' }}
                            speed={1.5}
                          />
                        </Animated.View>
                      )} */}
                      <RootLayoutNav />
                      <IntroVideoOverlay />
                      <Toast 
                        config={glassyToastConfig}
                        position="top"
                        topOffset={110}
                        visibilityTime={3000}
                        autoHide={true}
                        swipeable={true}
                      />
                    </PaperProvider>
                  </MenuProvider>
                </BottomSheetModalProvider>
              </ThemeProvider>
              </NotificationProvider> 
            </DeepLinkProvider>
          </AuthProvider>
        </StripeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

