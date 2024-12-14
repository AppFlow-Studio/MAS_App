import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import { Button, Modal, Portal, TextInput } from "react-native-paper";
import { BlurView } from "expo-blur";
import { supabase } from "@/src/lib/supabase";
import { Link, router, Stack } from "expo-router";
import Svg, { Path } from "react-native-svg";

const SendToEveryoneScreen = () => {
  const [notificationMessage, setNotificationMessage] = useState("");
  const [previewModal, setPreviewModal] = useState(false);
  const [ total_users, setTotalUsers ] = useState(0)
  const [ userInfo, setUserInfo ] = useState([])
  const getUsersInfo = async () => {
    const { data : profile, error } = await supabase.from('profiles').select('push_notification_token').not('push_notification_token', 'is', null)
    if( profile ){
      profile.map((item) => {
        item['message'] = notificationMessage
      })
      setUserInfo(profile)
    }else{
      console.log( error )
    }
  }

  const onSend = async () => {
    if( userInfo.length > 0 ){
      await supabase.functions.invoke('send-prayer-notification', {body :{ notifications_batch : userInfo }})
    }
  }
  const characterLimit = 255;
  const totalUsers = 1000;
  const hideModal = () => setPreviewModal(false);
  const sendNotification = async () =>{
    setPreviewModal(!previewModal),
    await onSend()
    setNotificationMessage('')
  }

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor : 'white'
      }}
      contentContainerStyle={{ paddingHorizontal : 10 }}
    >
      <Stack.Screen 
         options={{
          headerTransparent : true,
          header : () => (
            <View className="relative">
              <View className="h-[110px] w-[100%] rounded-br-[65px] bg-[#6077F5] items-start justify-end pb-[5%] z-[1]">
                <Pressable className="flex flex-row items-center justify-between w-[55%]" onPress={() => router.back()}>
                  <Svg width="29" height="29" viewBox="0 0 29 29" fill="none">
                    <Path d="M18.125 7.25L10.875 14.5L18.125 21.75" stroke="#BBBEC6" stroke-width="2" />
                  </Svg>
                  <Text className=" text-[20px] text-white">Push Notifications</Text>
                </Pressable>
              </View>
              <View className="h-[120px] w-[100%] rounded-br-[65px] bg-[#BBBEC6] items-start justify-end pb-[5%] absolute top-[50]">
               <View className="w-[65%] items-center"> 
                <Text className=" text-[15px] text-black ">Notification For Everyone</Text>
              </View>
              </View>
            </View>
          )
        }}
      />
      <Text className="text-lg mt-4 border pt-[170px] text-center">This Notification Will Be Sent Out To Everyone </Text>
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
          backgroundColor: "#e8e8e8",
          marginTop: "2%",
        }}
        activeOutlineColor="#0D509D"
        placeholder="Enter the notification message"
        textColor="black"
        multiline
      />
      <Text className="text-right text-gray-500 mt-1">{`${notificationMessage.length}/${characterLimit} characters`}</Text>

      <Pressable
        onPress={async () => {setPreviewModal(true); await getUsersInfo()} }
        className="h-13 items-center mt-6 w-[40%] bg-[#57BA47] rounded-[15px] h-[45px] justify-center"
      >
        <Text className="text-white">Preview</Text>
      </Pressable>


      <Portal>
        <Modal
          visible={previewModal}
          onDismiss={hideModal}
          contentContainerStyle={{
            height: "55%",
            width: '95%',
            borderRadius: 10,
            backgroundColor: "white",
            alignSelf: "center",
            alignItems: "center",
            justifyContent: "flex-start",
            paddingTop: "5%",
            paddingHorizontal: "2%",
          }}
        >
          <View >
            <Text className="font-bold text-3xl">Preview Notification </Text>
            <View
              style={{
                width: 340,
                height: "28%",
                marginTop: "4%",
                borderRadius: 20,
                
              }}
            >
              <BlurView
                style={{
                  width: 340,
                  height: "100%",
                  borderRadius: 20,
                  padding : '2%',
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor:"#959595",
                  overflow : 'hidden'
                }}
              >
                <Image
                  source={{
                    uri: "https://ugc.production.linktr.ee/e3KxJRUJTu2zELiw7FCf_hH45sO9R0guiKEY2?io=true&size=avatar-v3_0",
                  }}
                  className="h-11 w-11 rounded-xl "
                />
                <View className="px-2">
                  <View style={{width:'92%' ,flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
                    <Text className="text-lg font-bold text-white">MAS</Text>
                    <Text className="text-gray-400">Yesterday, 10:20PM</Text>
                  </View>
                  <View style={{width:'90%'}} >
                  <Text numberOfLines={2} className="text-base text-white">{notificationMessage}</Text>
                  </View>
                </View>
              </BlurView>
            </View>
            <Text className="self-end mt-1 font-bold">
              Total Users: {totalUsers}
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
  );
};

export default SendToEveryoneScreen;

const styles = StyleSheet.create({});
