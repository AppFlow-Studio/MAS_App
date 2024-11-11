import { Stack } from "expo-router";

export default function MyProgramsStack(){
    return(
        <Stack>
            <Stack.Screen name="userPrograms" options={{headerShown: false}}/>
            <Stack.Screen name="notifications/NotificationEvents" />
        </Stack>
    )
}