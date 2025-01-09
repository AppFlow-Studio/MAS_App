import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import React, { useState } from "react";
import { Stack } from "expo-router";
import AdminAccordionOptions from "./_AdminAccordionOptions";

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
      { buttonTitle : 'Delete a Event', link : '/more/Admin/DeleteEventScreen'}
    ]
  },
  {
    title : 'Business Advertisement', screens : [
      { buttonTitle : 'View and Review Submissions', link : '/more/Admin/BusinessAdsApprovalScreen'},
      { buttonTitle : 'Edit Approved Fliers', link : '/more/Admin/ApprovedAdsScreen'},
    ]
  },
  /* 
  {
    title : 'Donations', screens : [
      { buttonTitle : 'Create a new Category', link : '/more/Admin/CreateNewDonationProject'},
      { buttonTitle : 'Edit an existing Category', link : '/more/Admin/EditDonationCategory'}
    ]
  }
  */
  {
    title : 'Jummah', screens : [
      { buttonTitle : 'First Jummah', link : '/more/Admin/JummahDetails/1'},
      { buttonTitle : 'Second Jummah', link : '/more/Admin/JummahDetails/2'},
      { buttonTitle : 'Third Jummah', link : '/more/Admin/JummahDetails/3'},
      { buttonTitle : 'Student Jummah', link : '/more/Admin/JummahDetails/4'},
    ]
  },
  {
    title : 'Speaker & Sheik Info', screens : [
      { buttonTitle : 'Add New Speaker or Sheik Info', link : '/more/Admin/AddNewSpeaker'},
      { buttonTitle : 'Edit Speaker or Sheik Info', link : '/more/Admin/SpeakersScreen'},
      { buttonTitle : 'Delete a Speaker or Sheik', link : '/more/Admin/DeleteSpeakers'},
    ]
  }
]
const AdminScreen = () => {
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
  
      <ScrollView
      contentContainerStyle={{ flexGrow : 1 }}
      >
        {
          AdminOptions.map((options, index) => (
            <View key={options.title}><AdminAccordionOptions options={options} index={index + 1}/></View>
          ))
        }
      </ScrollView>

    </View>
  );
};

export default AdminScreen;
