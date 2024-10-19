import { Image, StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import { Button, Modal, Portal, TextInput } from "react-native-paper";
import { supabase } from "@/src/lib/supabase";

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
    <View
      style={{
        flex: 1,
        paddingHorizontal: "4%",
      }}
    >
      <Text className="text-xl mt-4">Notification Message</Text>
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

      <Button
        onPress={async () => {setPreviewModal(true); await getUsersInfo()} }
        className="h-13 items-center mt-6"
        mode="contained"
        buttonColor="#57BA47"
        textColor="white"
      >
        Preview
      </Button>

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
          <View>
            <Text className="font-bold text-3xl">Preview Notification </Text>
            <View
              style={{
                width: 340,
                height: "30%",
                marginTop: "4%",
                borderColor: "gray",
                borderWidth: 2,
                borderRadius: 10,
                padding: "3%",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Image
                source={{
                  uri: "https://ugc.production.linktr.ee/e3KxJRUJTu2zELiw7FCf_hH45sO9R0guiKEY2?io=true&size=avatar-v3_0",
                }}
                className="h-14 w-12"
              />
              <View className="px-4">
                <View style={{width:'92%' ,flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
                  <Text className="text-lg font-bold">MAS</Text>
                  <Text className="text-gray-400">Yesterday, 10:20PM</Text>
                </View>
                <View style={{width:'90%'}} >
                <Text numberOfLines={2} className="text-base text-black">{notificationMessage}</Text>
                </View>
              </View>
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
    </View>
  );
};

export default SendToEveryoneScreen;

const styles = StyleSheet.create({});
