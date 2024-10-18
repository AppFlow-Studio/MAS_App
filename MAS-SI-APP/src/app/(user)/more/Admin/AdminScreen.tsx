import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import React, { useState } from "react";
import { Stack } from "expo-router";
import { SceneMap, TabBar, TabView } from "react-native-tab-view";
import SendToEveryoneScreen from "./SendToEveryoneScreen";
import ProgramsAndEventsScreen from "./ProgramsAndEventsScreen";

const SendToEveryone = () => (
 <SendToEveryoneScreen />
);

const ProgramsAndEvents = () => (
 <ProgramsAndEventsScreen/>
);

const AdminScreen = () => {
  const layout = useWindowDimensions().width;
  const [index, setIndex] = useState(0);

  const renderScene = SceneMap({
    first: SendToEveryone,
    second: ProgramsAndEvents,
  });
  
  const routes = [
    { key: 'first', title: 'Send to Everyone' },
    { key: 'second', title: 'Programs and Events' },
  ];
  
  const renderTabBar = (props : any) => (
    <TabBar
    {...props}
    indicatorStyle={{ backgroundColor : "#57BA47", position: "absolute", zIndex : -1, bottom : "5%", height: "90%", width : "45%", left : "3%", borderRadius : 20  }}
    style={{ backgroundColor: '#0D509D', width : "100%", height:'8%', justifyContent:'center', alignSelf : "center"}}
    labelStyle={{ color : "white", fontWeight : "bold" }}
    />
  );
  return (
    <View className='flex-1 bg-[#ededed]'>
      <Stack.Screen
        options={{
          title: "Admin",
          headerBackTitleVisible: false,
          headerTintColor: "black",
          headerStyle: { backgroundColor: "white" },
        }}
      />
     <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: layout }}
          renderTabBar={renderTabBar}
          style={{  backgroundColor : "#ededed" }}
        />
    </View>
  );
};

export default AdminScreen;

const styles = StyleSheet.create({});
