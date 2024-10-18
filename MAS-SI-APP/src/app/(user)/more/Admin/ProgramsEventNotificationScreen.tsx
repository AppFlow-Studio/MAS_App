import { StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { Button, Modal, Portal, TextInput } from "react-native-paper";

const ProgramsEventNotificationScreen = () => {
  const { name } = useLocalSearchParams();
  const [notificationMessage, setNotificationMessage] = useState("");
  const [previewModal, setPreviewModal] = useState(false);
  const characterLimit = 255;
  const totalUsers = 100;

  console.log("name", name);

  const hideModal = () => setPreviewModal(false);
  const sendNotification = () => {
    setPreviewModal(!previewModal), setNotificationMessage("");
  };
  return (
    <>
      <Stack.Screen
        options={{
          title: name,
          headerBackTitleVisible: false,
          headerTintColor: "black",
          headerStyle: { backgroundColor: "white" },
        }}
      />
   
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
            <View
              style={{
                height: 250,
                marginTop: "4%",
                borderColor: "gray",
                borderWidth: 2,
                borderRadius: 4,
                padding: "3%",
              }}
            >
              <Text className="text-base font-bold w-80">
                {notificationMessage}
              </Text>
            </View>
            <Text className="self-end mt-1 font-bold">Event Users: {totalUsers}</Text>
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
