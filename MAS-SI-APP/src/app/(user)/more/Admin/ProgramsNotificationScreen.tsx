import { Image, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useState, useEffect } from "react";
import { Link, router, Stack, useLocalSearchParams } from "expo-router";
import { Button, Modal, Portal, TextInput } from "react-native-paper";
import { supabase } from "@/src/lib/supabase";
import Svg, { Path } from "react-native-svg";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

const ProgramsEventNotificationScreen = () => {
  const { program_id, has_lecture, program_name,program_img } = useLocalSearchParams();
  const [notificationMessage, setNotificationMessage] = useState("");
  const [ users, setUsers ] = useState<any>([])
  const [previewModal, setPreviewModal] = useState(false);
  const [ hasLectures, sethasLectures ] = useState(has_lecture == 'true')
  const characterLimit = 255;
  const totalUsers = 100;
  const tabBar = useBottomTabBarHeight()

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
          headerTransparent : true,
          header : () => (
            <View className="relative">
              <View className="h-[110px] w-[100%] rounded-br-[65px] bg-[#5E636B] items-start justify-end pb-[5%] z-[1]">
                <Pressable className="flex flex-row items-center justify-between w-[50%]" onPress={() => router.back()}>
                  <Svg width="29" height="29" viewBox="0 0 29 29" fill="none">
                    <Path d="M18.125 7.25L10.875 14.5L18.125 21.75" stroke="#FFFFFF" stroke-width="2"/>
                  </Svg>
                  <Text className=" text-[20px] text-white">Push Notifications</Text>
                </Pressable>
              </View>
              <View className="h-[120px] w-[100%] rounded-br-[65px] bg-[#BBBEC6] items-start justify-end pb-[5%] absolute top-[50]">
               <View className="w-[60%] items-center"> 
                <Text className=" text-[15px] text-black ">Create A New Program</Text>
              </View>
              </View>
              <View className="h-[120px] w-[100%] rounded-br-[65px] bg-[#E3E3E3] items-start justify-end pb-[5%] absolute top-[100] z-[-1]">
               <View className="w-[100%] self-start  pl-[10%]"> 
                <Text className=" text-[15px] text-black ">{program_name}</Text>
              </View>
              </View>
            </View>
          )
        }}
      />
   
    <View
      style={{
        paddingTop : 220,
        paddingHorizontal : 10,
        backgroundColor : 'white'
      }}
    >

     <ScrollView contentContainerStyle={{ paddingBottom : tabBar + 30 }} className="h-[100%] ">
        <Image 
          src={program_img}
          className="h-[250] w-[250] rounded-[15px] self-center my-4"
        />
  
        <Text className="text-center text-gray-600">Only Users With This Program Added to their Notification Center Will Get The Notification</Text>
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

export default ProgramsEventNotificationScreen;

const styles = StyleSheet.create({});


/* 
    {
    hasLectures &&  
    (<>
    <Text className="text-xl mt-4"> Upload Program Lecture</Text>
      <Link  href={{
        pathname : '/(user)/more/Admin/UploadProgramLectures',
        params : { program_id : program_id, }
        }} asChild >
          <TouchableOpacity className="bg-[#57BA47] w-[35%] px-3 py-2  my-2 rounded-md">
            <Text className="font-bold text-sm text-white">Upload Lecture</Text>
          </TouchableOpacity>
      </Link>
     

      <Text className="text-xl mt-4"> Update Existing Program Lecture</Text>
      <Link  href={{
        pathname : '/(user)/more/Admin/ProgramLecturesScreen',
        params : { program_id : program_id, }
        }} asChild >
          <TouchableOpacity className="bg-[#57BA47] w-[35%] items-center py-2  my-2 rounded-md">
            <Text className="font-bold text-sm text-white">Update</Text>
          </TouchableOpacity>
      </Link>
      </>)
      }

        <Text className="text-xl mt-4"> Update Program</Text>
      <Link  href={{
        pathname : '/(user)/more/Admin/UpdateProgramScreen',
        params : { program_id : program_id, }
        }} asChild >
          <TouchableOpacity className="bg-[#57BA47] w-[35%] items-center py-2  my-2 rounded-md">
            <Text className="font-bold text-sm text-white">Update</Text>
          </TouchableOpacity>
      </Link>

*/