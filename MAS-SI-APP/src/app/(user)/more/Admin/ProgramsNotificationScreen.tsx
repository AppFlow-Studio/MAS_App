import { Image, StyleSheet, Text, View } from "react-native";
import React, { useState, useEffect } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { Button, Modal, Portal, TextInput } from "react-native-paper";
import { supabase } from "@/src/lib/supabase";

const ProgramsEventNotificationScreen = () => {
  const { program_id } = useLocalSearchParams();
  const [notificationMessage, setNotificationMessage] = useState("");
  const [ users, setUsers ] = useState<any>([])
  const [previewModal, setPreviewModal] = useState(false);
  const characterLimit = 255;
  const totalUsers = 100;
  const getUsers = async () => {
    const { data : users, error } = await supabase.from('added_notifications_programs').select('*').eq('program_id', program_id)
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
        flex: 1,
        paddingHorizontal: "4%",
        backgroundColor : '#ededed'
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
        onPress={() => setPreviewModal(true)}
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
                height: "28%",
                marginTop: "4%",
                borderRadius: 20,
                padding: "3%",
                flexDirection: "row",
                alignItems: "center",
                backgroundColor:"#0D509D"
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
                <Text numberOfLines={2} className="text-base text-yellow-100">{notificationMessage}</Text>
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
    </>
  );
};

export default ProgramsEventNotificationScreen;

const styles = StyleSheet.create({});
