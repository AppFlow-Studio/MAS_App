import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import PrayerTimesProvider from '../providers/prayerTimesProvider';
import { useColorScheme } from '../../hooks/useColorScheme';
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { MenuProvider } from "react-native-popup-menu"
import AuthProvider from '../providers/AuthProvider';// Prevent the splash screen from auto-hiding before asset loading is complete.
import { StripeProvider } from '@stripe/stripe-react-native'
import NotificationProvider from '../providers/NotificationProvider';
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
    'Oleo' : require('../../assets/fonts/OleoScript-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView>
      <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}>
        <AuthProvider>
          <PrayerTimesProvider>
            <>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <BottomSheetModalProvider>
                  <MenuProvider>
                    <PaperProvider>
                      <Stack>
                        <Stack.Screen name="(user)" options={{ headerShown : false }} />
                        <Stack.Screen name="(auth)" options={{ headerShown : false }}/>
                        <Stack.Screen name="+not-found" />
                        </Stack>
                    </PaperProvider>
                  </MenuProvider>
                </BottomSheetModalProvider>
              </ThemeProvider>
            </>
          </PrayerTimesProvider>
        </AuthProvider>
      </StripeProvider>
    </GestureHandlerRootView>
  );
}
