import { Stack } from "expo-router";

export default function MyProgramsStack(){
    return(
        <Stack
        >
            <Stack.Screen name="index" options={{headerShown: false}}/>
            <Stack.Screen name="notifications" options={{ headerShown : false}}/>
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
       </Stack>
    )
}