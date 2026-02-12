import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
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
import { Text } from 'react-native';
import Toast from 'react-native-toast-message';
import { glassyToastConfig } from '../lib/toastConfig';
import Constants from 'expo-constants';
import "@/global.css"

import IntroVideoOverlay from '@/src/components/IntroVideoOverlay';

// Version tracking key for What's New screen
export const WHATS_NEW_VERSION_KEY = 'whats_new_seen_version';

// Persist that we've already asked the user to enable notifications (so we don't ask every app open)
export const NOTIFICATION_PROMPT_ASKED_KEY = 'notification_prompt_asked';

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
      <Stack.Screen name="WhatsNew" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="+not-found" options={{ animation: 'none' }} />
    </Stack>
  )
}

SplashScreen.preventAutoHideAsync()
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isFirstLaunchChecked, setIsFirstLaunchChecked] = useState(false);

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

  useEffect(() => {
    async function hideSplash() {
      await SplashScreen.preventAutoHideAsync();
      if (loaded && isFirstLaunchChecked) {
        await SplashScreen.hideAsync();
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

