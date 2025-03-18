import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import PrayerTimesProvider from '../providers/prayerTimesProvider';
import { useColorScheme } from '../../hooks/useColorScheme';
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { MenuProvider } from "react-native-popup-menu";
import AuthProvider from '../providers/AuthProvider';
import { StripeProvider } from '@stripe/stripe-react-native';
import NotificationProvider from '../providers/NotificationProvider';
import { Text } from 'react-native';
import TutorialOverlay from "../components/TutorialOverlay"; // Import tutorial

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [showTutorial, setShowTutorial] = useState(false);
  const [isLogoAnimationDone, setIsLogoAnimationDone] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(true); // ✅ Always show tutorial for testing

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

  useEffect(() => {
    async function checkFirstLaunch() {
      const hasSeenTutorial = await AsyncStorage.getItem('hasSeenTutorial');
      if (!hasSeenTutorial) {
        setIsFirstLaunch(true);
      } else {
        setIsLogoAnimationDone(true); // ✅ Skip animation if app has been opened before
      }
    }
    checkFirstLaunch();
  }, []);

  useEffect(() => {
    async function hideSplash() {
      await SplashScreen.preventAutoHideAsync(); // Keep splash screen visible
      if (loaded) {
        setTimeout(async () => {
          await SplashScreen.hideAsync(); // Hide splash screen
          setIsLogoAnimationDone(true); // ✅ Mark logo animation as done
        }, 50);
      }
    }
    hideSplash();
  }, [loaded]);

  useEffect(() => {
    if (isLogoAnimationDone && isFirstLaunch) {
      setTimeout(() => {
        setShowTutorial(true); // ✅ Show tutorial after logo animation
      }, 5000);
    }
  }, [isLogoAnimationDone]);

  const handleTutorialFinish = async () => {
    setShowTutorial(false);
    setIsFirstLaunch(false); // ✅ Prevents logo animation from replaying
     // await AsyncStorage.setItem('hasSeenTutorial', 'true'); // Uncomment for final version
  };

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView>
      <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}>
        <AuthProvider>
          <PrayerTimesProvider>
            {/* <NotificationProvider> */}
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <BottomSheetModalProvider>
                <MenuProvider>
                  <PaperProvider>
                    {/* ✅ Show the logo animation only ONCE before tutorial */}
                    {!isLogoAnimationDone && !showTutorial && (
                      <Stack key={Date.now()}>
                        <Stack.Screen name="(user)" options={{ headerShown: false, animation: 'none' }} />
                        <Stack.Screen name="(auth)" options={{ headerShown: false, animation: 'none' }} />
                        <Stack.Screen name="+not-found" options={{ animation: 'none' }} />
                      </Stack>
                    )}
                    
                    {/* ✅ Ensure home screen is ALWAYS in the background */}
                    <Stack key="main-app">
                      <Stack.Screen name="(user)" options={{ headerShown: false, animation: 'none' }} />
                      <Stack.Screen name="(auth)" options={{ headerShown: false, animation: 'none' }} />
                      <Stack.Screen name="+not-found" options={{ animation: 'none' }} />
                    </Stack>

                    {/* ✅ Show tutorial over home screen (instead of bringing back logo) */}
                    {showTutorial && <TutorialOverlay visible={showTutorial} onClose={handleTutorialFinish} />}
                  </PaperProvider>
                </MenuProvider>
              </BottomSheetModalProvider>
            </ThemeProvider>
              {/* </NotificationProvider> */}
          </PrayerTimesProvider>
        </AuthProvider>
      </StripeProvider>
    </GestureHandlerRootView>
  );
}
