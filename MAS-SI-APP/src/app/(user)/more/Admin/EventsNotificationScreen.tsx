import { StyleSheet, Text, View, Image, TouchableOpacity, Pressable, ScrollView } from "react-native";
import React, { useEffect, useState } from "react";
import { Link, router, Stack, useLocalSearchParams } from "expo-router";
import { Button, Modal, Portal, TextInput } from "react-native-paper";
import { supabase } from "@/src/lib/supabase";
import Svg, { Path } from "react-native-svg";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";

const EventsNotificationScreen = () => {
  const { event_id, has_lecture, event_name, event_img } = useLocalSearchParams();
  const [notificationMessage, setNotificationMessage] = useState("");
  const [ users, setUsers ] = useState<any>([])
  const[ hasLectures, sethasLectures ] = useState<boolean>(has_lecture == 'true')
  const [previewModal, setPreviewModal] = useState(false);
  const characterLimit = 255;
  const totalUsers = 100;
  const tabBar = useBottomTabBarHeight()
  const getUsers = async () => {
    const { data : users, error } = await supabase.from('added_notifications_events').select('*').eq('event_id', event_id)
    if( users ){
      setUsers(users)
    }
    if( error ){
      console.log('error', error)
    }
  }

  const hideModal = () => setPreviewModal(false);
  const sendNotification = async() => {
    setPreviewModal(!previewModal), setNotificationMessage(""); await onSend();
  };

  const onSend = async () => {
    const notification_batch : any[] = []
    await Promise.all(
      users.map( async ( user ) => {
        const { data : profile, error } = await supabase.from('profiles').select('push_notification_token').eq('id', user.user_id).not('push_notification_token', 'is', null).single()
        if( profile ){
          profile['message'] = notificationMessage
          profile['title'] = event_name
          notification_batch.push(profile)
        }
      })
    )
    if( notification_batch.length > 0){
      const { error } = await supabase.functions.invoke('send-prayer-notification', { body : { notifications_batch : notification_batch}})
      if(error){
        console.log(error)
      }
    } 
  }
  useEffect(() => {
    getUsers()
  },[])
  return (
    <>
      <Stack.Screen
        options={{
          headerBackTitleVisible: false,
          headerStyle: { backgroundColor: "white" },
          title : ''
        }}
      />
   
    <View
       style={{
        paddingTop : 220,
        paddingHorizontal : 10,
        backgroundColor : 'white'
      }}
    >
      <Stack.Screen
        options={{
          headerTransparent : true,
          header : () => (
            <View className="relative">
              <View className="h-[110px] w-[100%] rounded-br-[65px] bg-[#6077F5] items-start justify-end pb-[5%] z-[1]">
                <Pressable className="flex flex-row items-center justify-between w-[50%]" onPress={() => router.back()}>
                  <Svg width="29" height="29" viewBox="0 0 29 29" fill="none">
                    <Path d="M18.125 7.25L10.875 14.5L18.125 21.75" stroke="#FFFFFF" stroke-width="2"/>
                  </Svg>
                  <Text className=" text-[20px] text-white">Push Notifications</Text>
                </Pressable>
              </View>
              <View className="h-[120px] w-[100%] rounded-br-[65px] bg-[#BBBEC6] items-start justify-end pb-[5%] absolute top-[50]">
               <View className="w-[67%] items-center"> 
                <Text className=" text-[15px] text-black ">Create A Event Notification</Text>
              </View>
              </View>
              <View className="h-[120px] w-[100%] rounded-br-[65px] bg-[#E3E3E3] items-start justify-end pb-[5%] absolute top-[100] z-[-1]">
               <View className="w-[100%] self-start pl-[10%]"> 
                <Text className=" text-[15px] text-black ">{event_name}</Text>
              </View>
              </View>
            </View>
          )
        }}
      />
     <ScrollView contentContainerStyle={{ paddingBottom : tabBar + 30 }} className="h-[100%] ">
        <Image 
          src={event_img}
          className="w-[250px] h-[250px] rounded-[15px] self-center my-4"
        />
        <Text className="text-center text-gray-600">Only Users With This Event Added to their Notification Center Will Get The Notification</Text>
        <TextInput
          mode="outlined"
          value={notificationMessage}
          onChangeText={(text) => {
            if (text.length <= characterLimit) setNotificationMessage(text);
          }}
          theme={{ roundness: 5 }}
          style={{
            height: 150,
            width: "100%",
            backgroundColor: "#F0F0F0",
            marginTop: "2%",
          }}
          activeOutlineColor="#0D509D"
          placeholder="Enter Your Message Here"
          textColor="black"
          multiline
        />
        <Text className="text-right text-gray-500 mt-1">{`${notificationMessage.length}/${characterLimit} characters`}</Text>
  
        <Pressable
          onPress={() => setPreviewModal(true)}
          className="h-[37px] items-center mt-6 w-[156px] bg-[#57BA47]  rounded-[15px] justify-center self-start"          
        >
          <Text className=" text-white font-[600]">Preview</Text>
        </Pressable>
        
  
        <Portal>
          <Modal
            visible={previewModal}
            onDismiss={hideModal}
            contentContainerStyle={{
              height: "55%",
              width: "95%",
              borderRadius: 10,
              backgroundColor: "white",
              alignSelf: "center",
              alignItems: "center",
              justifyContent: "flex-start",
              paddingTop: "5%",
              paddingHorizontal: "2%",
            }}
          >
            <View>
              <Text className="font-bold text-3xl">Preview Notification </Text>
              <View className="rounded-[20px] overflow-hidden w-[340px]  h-[28%] mt-4">
                <BlurView
                  style={{
                    width: 340,
                    height: "100%",
                    borderRadius: 20,
                    padding: "3%",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Image
                    source={{
                      uri: "https://ugc.production.linktr.ee/e3KxJRUJTu2zELiw7FCf_hH45sO9R0guiKEY2?io=true&size=avatar-v3_0",
                    }}
                    className="h-11 w-11 rounded-xl "
                  />
                  <View className="px-2">
                    <View style={{width:'92%' ,flexDirection:'row', alignItems:'center', justifyContent:'space-between' }} className="">
                      <Text className="text-md font-bold text-white w-[60%]" numberOfLines={1}>{event_name}</Text>
                      <Text className="text-gray-400 w-[45%]" adjustsFontSizeToFit numberOfLines={1}>Yesterday, 10:20PM</Text>
                    </View>
                    <View style={{width:'90%'}} >
                    <Text numberOfLines={2} className="text-base text-white">{notificationMessage}</Text>
                    </View>
                  </View>
                </BlurView>
              </View>
              <Text className="self-end mt-1 font-bold">
                Total Users: {users.length}
              </Text>
              <View className="self-center">
                <Button
                  mode="contained"
                  buttonColor="#57BA47"
                  textColor="white"
                  className="w-[300] h-15 mt-8"
                  onPress={sendNotification}
                >
                  Send
                </Button>
              </View>
            </View>
          </Modal>
        </Portal>
      </ScrollView>
    </View>
    </>
  );
};

export default EventsNotificationScreen;

/*
{ hasLectures == true&& (
      <>
      <Text className="text-xl mt-4"> Upload Event Lecture</Text>
      <Link  href={{
        pathname : '/(user)/more/Admin/UploadEventLectures',
        params : { event_id }
        }} asChild >
          <TouchableOpacity className="bg-[#57BA47] w-[35%] px-3 py-2  mb-2 rounded-md">
            <Text className="font-bold text-sm text-white">Upload Lecture</Text>
          </TouchableOpacity>
      </Link>

    
      <Text className="text-xl mt-4"> Update Existing Event Lecture</Text>
      <Link  href={
         {pathname : '/(user)/more/Admin/EventLecturesScreen',
          params : { event_id : event_id }
         }
        } asChild >
          <TouchableOpacity className="bg-[#57BA47] w-[35%] px-3 py-2  mb-2 rounded-md">
            <Text className="font-bold text-sm text-white">Update Lecture</Text>
          </TouchableOpacity>
      </Link>
      </>
      )
      }

      <Text className="text-xl mt-4"> Update Event </Text>
      <Link  href={
        { pathname : '/(user)/more/Admin/UpdateEventScreen',
          params : { event_id : event_id }
        }
        } asChild >
          <TouchableOpacity className="bg-[#57BA47] w-[35%] items-center py-2  mb-2 rounded-md">
            <Text className="font-bold text-sm text-white">Update</Text>
          </TouchableOpacity>
      </Link>
*/
