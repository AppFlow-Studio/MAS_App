import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import { Button, Modal, Portal, TextInput } from "react-native-paper";
import { BlurView } from "expo-blur";
import { supabase } from "@/src/lib/supabase";
import { Link, router, Stack } from "expo-router";
import Svg, { Path } from "react-native-svg";

const SendToEveryoneScreen = () => {
  const [notificationMessage, setNotificationMessage] = useState("");
  const [ notificationTitle, setNotificationTitle ] = useState("");
  const [previewModal, setPreviewModal] = useState(false);
  const [ userInfo, setUserInfo ] = useState([])
  const getUsersInfo = async () => {
    const { data : profile, error } = await supabase.from('profiles').select('push_notification_token').not('push_notification_token', 'is', null)
    if( profile ){
      profile.map((item) => {
        item['message'] = notificationMessage
        item['title'] = notificationTitle
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
  const characterLimit = 150;
  const titleLimit = 30;
  const hideModal = () => setPreviewModal(false);
  const sendNotification = async () =>{
    setPreviewModal(!previewModal),
    await onSend()
    setNotificationMessage('')
    setNotificationTitle('')
  }
  return (
    <View className='flex-1 bg-gray-50'>
      <Stack.Screen 
         options={{
          title: "Notification For Everyone",
          headerStyle: { backgroundColor: "#F9FAFB" },
          headerTitleStyle: { 
            fontSize: 22,
            fontWeight: '600',
            color: '#1F2937'
          },
          headerTintColor: '#4A5568',
          headerShadowVisible: false,
        }}
      />
      
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm'>
          <Text className="text-base text-gray-700 mb-1">This Notification Will Be Sent Out To Everyone</Text>
        </View>

        <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm'>
          <Text className="text-base font-bold mb-3 text-gray-800">Title of Notification</Text>
          <TextInput
            mode="outlined"
            value={notificationTitle}
            onChangeText={(text) => {
              if (text.length <= titleLimit) setNotificationTitle(text);
            }}
            theme={{ roundness: 12 }}
            style={{
              height: 60,
              width: "100%",
              backgroundColor: "white",
            }}
            activeOutlineColor="#6077F5"
            outlineColor="#E2E8F0"
            placeholder="MAS Staten Island"
            textColor="black"
            multiline
          />
          <Text className="text-right text-gray-500 text-xs mt-2">{`${notificationTitle.length}/${titleLimit} characters`}</Text>
        </View>

        <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm'>
          <Text className="text-base font-bold mb-3 text-gray-800">Notification Message</Text>
          <TextInput
            mode="outlined"
            value={notificationMessage}
            onChangeText={(text) => {
              if (text.length <= characterLimit) setNotificationMessage(text);
            }}
            theme={{ roundness: 12 }}
            style={{
              height: 150,
              width: "100%",
              backgroundColor: "white",
            }}
            activeOutlineColor="#6077F5"
            outlineColor="#E2E8F0"
            placeholder="Enter the notification message"
            textColor="black"
            multiline
          />
          <Text className="text-right text-gray-500 text-xs mt-2">{`${notificationMessage.length}/${characterLimit} characters`}</Text>
        </View>

        <Button
          mode="contained"
          buttonColor="#6077F5"
          textColor="white"
          theme={{ roundness: 12 }}
          style={{ marginTop: 8, marginBottom: 24, height: 50, justifyContent: 'center' }}
          labelStyle={{ fontSize: 16, fontWeight: '600' }}
          onPress={async () => {setPreviewModal(true); await getUsersInfo()}}
        >
          Preview
        </Button>
      </ScrollView>


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
                marginTop: "4%",
                borderRadius: 20,
                
              }}
            >
              <BlurView
                style={{
                  width: 340,
                  borderRadius: 20,
                  padding : '2%',
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor:"#959595",
                  overflow : 'hidden'
                }}
                intensity={50}
              >

                <Image
                  source={
                    require('@/assets/images/MASsplash.png')
                  }
                  className="h-11 w-11 rounded-xl "
                />
                <View className="px-2">
                  <View style={{width:'92%' ,flexDirection:'row', alignItems:'center', justifyContent:'space-between' }} className="mb-2 pt-1">
                    <Text className="text-md font-bold text-white">{notificationTitle ? notificationTitle : 'MAS Staten Island'}</Text>
                    <Text className="text-gray-400">Now</Text>
                  </View>
                  <View style={{width:'90%'}} className="pb-1">
                  <Text numberOfLines={4} className="text-base text-white">{notificationMessage}</Text>
                  </View>
                </View>
              </BlurView>
            </View>

            <View className="bg-blue-50 px-4 py-3 rounded-xl mt-4">
              <Text className="text-center text-blue-800 font-bold">
                Total Users: {userInfo.length}
              </Text>
            </View>
            <View className="self-center w-full px-4">
              <Button
                mode="contained"
                buttonColor="#6077F5"
                textColor="white"
                theme={{ roundness: 12 }}
                style={{ marginTop: 24, height: 50, justifyContent: 'center' }}
                labelStyle={{ fontSize: 16, fontWeight: '600' }}
                onPress={sendNotification}
              >
                Send Notification
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

export default SendToEveryoneScreen;

const styles = StyleSheet.create({});
