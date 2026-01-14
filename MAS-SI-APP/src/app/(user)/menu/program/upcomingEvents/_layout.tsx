import { Stack } from "expo-router";

export default function UpcomingEventsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#214E91' },
        headerTintColor: 'white',
        headerTitleStyle: { color: 'white' },
        headerBackVisible: false,
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Upcoming Events',
        }}
      />
    </Stack>
  );
}
