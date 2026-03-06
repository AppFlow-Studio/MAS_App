import { Stack } from "expo-router";
import { StatusBar } from "react-native";

export default function MyProgramsStack(){
    return(
        <Stack
            screenOptions={{
                headerBackTitleVisible: false,
                animation: 'slide_from_right',
                animationDuration: 200,
            }}
        >
            <Stack.Screen name="index" options={{headerShown: false}}/>
            <Stack.Screen 
              name="notifications" 
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                animationDuration: 200,
              }}
            />
            <Stack.Screen name="recordedLectures" options={{ headerShown: true }}/>
            <Stack.Screen name="RecommendedForYou" options={{ headerShown: false }}/>
            <Stack.Screen name="events/[event_id]" options={{ headerShown: true }}/>
            <Stack.Screen name="programs/[programId]" options={{ headerShown: true }}/>
            <Stack.Screen 
              name="PreferencesOnboardingModal" 
              options={{ 
                headerShown: false,
                presentation: 'fullScreenModal',
                animation: 'slide_from_bottom',
              }} 
            />
            <Stack.Screen 
              name="PlaylistIndex" 
              options={{ 
                headerShown: true,
                headerBackVisible: false,
                title: '',
                headerTransparent: true,
                headerShadowVisible: false,
              }} 
            />
       </Stack>
    )
}