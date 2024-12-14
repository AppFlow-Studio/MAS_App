import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import React, { useState } from "react";
import { Stack } from "expo-router";
import { SceneMap, TabBar, TabView } from "react-native-tab-view";
import SendToEveryoneScreen from "./SendToEveryoneScreen";
import ProgramsScreen from "./ProgramsScreen";
import EventsScreen from "./EventsScreen";
import BusinessAdsApprovalScreen from "./BusinessAdsApprovalScreen";
import AdminAccordionOptions from "./_AdminAccordionOptions";
const SendToEveryone = () => (
 <SendToEveryoneScreen />
);

const Programsscreen = () => (
 <ProgramsScreen/>
);

const Eventsscreen = () => (
  <EventsScreen/>
);

const BusinessScreen = () => (
  <BusinessAdsApprovalScreen/>
);

const AdminOptions : { title : string, screens : { buttonTitle : string, link : string }[] }[] = [
  {
  title : 'Push Notifications', screens : [
    { buttonTitle : 'Create A Notification For All Users ', link : '/more/Admin/SendToEveryoneScreen'},
    { buttonTitle : 'Create A Program Notification', link : '/more/Admin/NotiPrograms'},
    { buttonTitle : 'Create A Event Notification', link : '/more/Admin/NotiEvents'}
   ]
  },{
    title : 'Programs', screens : [
      { buttonTitle : 'Create a new Program', link : '/more/Admin/AddNewProgramScreen' },
      { buttonTitle : 'Edit existing Programs', link : '/more/Admin/ProgramsScreen'},
      { buttonTitle : 'Delete a Program', link : '/more/Admin/DeleteProgramScreen'}
    ]
  },
  {
    title : 'Events', screens : [
      { buttonTitle : 'Create a new Event', link : '/more/Admin/AddNewEventScreen' },
      { buttonTitle : 'Edit existing Events', link : '/more/Admin/EventsScreen'},
      { buttonTitle : 'Delete a Event', link : ''}
    ]
  },
  {
    title : 'Business Advertisement', screens : [
      { buttonTitle : 'View and Review Submissions', link : '/more/Admin/BusinessAdsApprovalScreen'}
    ]
  },
  {
    title : 'Donations', screens : []
  },
  {
    title : 'Jummah', screens : []
  }
]
const AdminScreen = () => {
  const layout = useWindowDimensions().width;
  const [index, setIndex] = useState(0);

  const renderScene = SceneMap({
    first: SendToEveryone,
    second: Programsscreen,
    third : Eventsscreen,
    fourth: BusinessScreen,
  });
  
  const routes = [
    { key: 'first', title: 'Send to Everyone' },
    { key: 'second', title: 'Programs' },
    { key : 'third', title : 'Events' },
    { key : 'fourth', title : 'Business Ad' }
  ];
  
  const renderTabBar = (props : any) => (
    <TabBar
    {...props}
    indicatorStyle={{ backgroundColor : "#57BA47", position: "absolute", zIndex : -1, bottom : "5%", height: "90%", width : "25%", left : "1%", borderRadius : 20  }}
    style={{ backgroundColor: '#0D509D', width : "100%", height:'8%', justifyContent:'center', alignSelf : "center"}}
    labelStyle={{ color : "white", fontWeight : "bold" }}
    tabStyle={{ width : layout / 3.5 }}
    scrollEnabled={true}
    />
  );
  return (
    <View className='flex-1 bg-white w-[100%] h-[100%]'>
      <Stack.Screen
        options={{
          title: "",
          headerBackTitleVisible: false,
          headerTintColor: "#1B85FF",
          headerStyle: { backgroundColor: "white" },
        }}
      />
      {/* Admin Portal Landing */}
      <View className="w-[90%] h-[20%] bg-[#EFF1F4] rounded-[15px] self-center mt-[5%] items-center justify-center py-2 mb-8">
        <View className="w-[90%] h-[90%] bg-white rounded-[15px] items-center justify-center">
          <Text className="text-black font-bold text-xl">Admin Portal</Text>
        </View> 
      </View> 

      { /* Admin Options in Accordion */ }
      
      {
        AdminOptions.map((options, index) => (
          <View key={options.title}><AdminAccordionOptions options={options} index={index + 1}/></View>
        ))
      }

    </View>
  );
};

export default AdminScreen;

/*
  <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: layout }}
          renderTabBar={renderTabBar}
          style={{  backgroundColor : "#ededed" }}
  />
*/