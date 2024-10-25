import React, { useState } from "react";
import { Text, View, Image, ScrollView, TouchableOpacity } from "react-native";
import { Stack } from "expo-router";
import { TextInput, Checkbox, Button } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import moment from "moment";
import Toast from "react-native-toast-message";

const AddNewProgramScreen = () => {
  const [programName, setProgramName] = useState<string>("");
  const [programImage, setProgramImage] = useState<string | null>(null);
  const [programDescription, setProgramDescription] = useState<string>("");
  const [programSpeaker, setProgramSpeaker] = useState<string>("");
  const [programStartDate, setProgramStartDate] = useState<Date | null>(null);
  const [programEndDate, setProgramEndDate] = useState<Date | null>(null);
  const [programStartTime, setProgramStartTime] = useState<Date | null>(null);
  const [programEndTime, setProgramEndTime] = useState<Date | null>(null);
  const [programDays, setProgramDays] = useState<string[]>([]);
  const [showStartDatePicker, setShowStartDatePicker] =
    useState<boolean>(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);
  const [showStartTimePicker, setShowStartTimePicker] =
    useState<boolean>(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState<boolean>(false);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [programPrice, setProgramPrice] = useState<string>("");
  const [isForKids, setIsForKids] = useState<boolean>(false);
  const [isFor14Plus, setIsFor14Plus] = useState<boolean>(false);
  const [isEducational, setIsEducational] = useState<boolean>(false);

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("Permission to access camera roll is required!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets) {
      setProgramImage(result.assets[0].uri);
    }
  };

  const toggleDaySelection = (day: string) => {
    if (programDays.includes(day)) {
      setProgramDays(programDays.filter((d) => d !== day));
    } else {
      setProgramDays([...programDays, day]);
    }
  };

  const formatDate = (date: Date | null) => {
    return date ? moment(date).format("MM/DD/YYYY") : "";
  };

  const formatTime = (time: Date | null) => {
    return time ? moment(time).format("hh:mm A") : "";
  };

  const handleSubmit = () => {
    // Reset all the fields
    setProgramName("");
    setProgramImage(null);
    setProgramDescription("");
    setProgramSpeaker("");
    setProgramStartDate(null);
    setProgramEndDate(null);
    setProgramStartTime(null);
    setProgramEndTime(null);
    setProgramDays([]);
    setIsPaid(false);
    setProgramPrice("");
    setIsForKids(false);
    setIsFor14Plus(false);
    setIsEducational(false);

    Toast.show({
      type: "success",
      text1: "Program Successfully Added",
      position: "top",
      topOffset: 50,
      visibilityTime: 2000,
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerBackTitleVisible: false,
          headerStyle: { backgroundColor: "white" },
          title: "Add New Program",
        }}
      />
      <View style={{ padding: 16 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: "20%" }}
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-base font-bold mb-1 ml-2">
            Enter Program Name
          </Text>
          <TextInput
            mode="outlined"
            theme={{ roundness: 10 }}
            style={{ width: "100%", height: 45, marginBottom: 10 }}
            activeOutlineColor="#0D509D"
            value={programName}
            onChangeText={setProgramName}
            placeholder="Program Name"
            textColor="black"
          />

          <Text className="text-base font-bold mb-1 mt-2 ml-2">
            Enter Program Description
          </Text>
          <TextInput
            mode="outlined"
            theme={{ roundness: 10 }}
            style={{ width: "100%", height: 100, marginBottom: 10 }}
            multiline
            activeOutlineColor="#0D509D"
            value={programDescription}
            onChangeText={setProgramDescription}
            placeholder="Program Description"
            textColor="black"
          />

          <Text className="text-base font-bold mb-1 mt-2 ml-2">
            Enter Program Speaker
          </Text>
          <TextInput
            mode="outlined"
            theme={{ roundness: 10 }}
            style={{ width: "100%", height: 45, marginBottom: 10 }}
            activeOutlineColor="#0D509D"
            value={programSpeaker}
            onChangeText={setProgramSpeaker}
            placeholder="Program Speaker"
            textColor="black"
          />

          <Text className="text-base font-bold mb-1 mt-2 ml-2">
            Upload Program Image
          </Text>
          <Button
            mode="contained"
            buttonColor="#57BA47"
            textColor="white"
            theme={{ roundness: 1 }}
            onPress={pickImage}
          >
            Upload
          </Button>
          {programImage && (
            <Image
              source={{ uri: programImage }}
              style={{
                width: "50%",
                height: "10%",
                marginVertical: "2%",
              }}
              resizeMode="contain"
            />
          )}

          <Text className="text-base font-bold mb-1 mt-2 ml-2">
            Select Program Days
          </Text>
          {days.map((day, index) => (
            <View
              key={index}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <Checkbox
                status={programDays.includes(day) ? "checked" : "unchecked"}
                onPress={() => toggleDaySelection(day)}
                color="#57BA47"
              />
              <Text>{day}</Text>
            </View>
          ))}

          <Text className="text-base font-bold mt-2 ml-2">
            Select Program Start Date
          </Text>
          <TouchableOpacity
            onPress={() => setShowStartDatePicker(true)}
            style={{
              backgroundColor: "#57BA47",
              width: "30%",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 2,
              marginLeft: "2%",
              paddingVertical: "1%",
            }}
          >
            <Text className="text-base font-bold text-white">
              {programStartDate ? formatDate(programStartDate) : "Select Date"}
            </Text>
          </TouchableOpacity>
          {showStartDatePicker && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowStartDatePicker(false);
                if (date) setProgramStartDate(date);
              }}
            />
          )}

          <Text className="text-base font-bold mb-1 mt-2 ml-2">
            Select Program End Date
          </Text>
          <TouchableOpacity
            onPress={() => setShowEndDatePicker(true)}
            style={{
              backgroundColor: "#57BA47",
              width: "30%",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 2,
              marginLeft: "2%",
              paddingVertical: "1%",
            }}
          >
            <Text className="text-base font-bold text-white">
              {programEndDate ? formatDate(programEndDate) : "Select Date"}
            </Text>
          </TouchableOpacity>
          {showEndDatePicker && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowEndDatePicker(false);
                if (date) setProgramEndDate(date);
              }}
            />
          )}

          <Text className="text-base font-bold mb-1 mt-2 ml-2">
            Select Program Start Time
          </Text>
          <TouchableOpacity
            onPress={() => setShowStartTimePicker(true)}
            style={{
              backgroundColor: "#57BA47",
              width: "30%",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 2,
              marginLeft: "2%",
              paddingVertical: "1%",
            }}
          >
            <Text className="text-base font-bold text-white">
              {programStartTime ? formatTime(programStartTime) : "Select Time"}
            </Text>
          </TouchableOpacity>
          {showStartTimePicker && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              display="default"
              onChange={(event, time) => {
                setShowStartTimePicker(false);
                if (time) setProgramStartTime(time);
              }}
            />
          )}

          <Text className="text-base font-bold mb-1 mt-2 ml-2">
            Select Program End Time
          </Text>
          <TouchableOpacity
            onPress={() => setShowEndTimePicker(true)}
            style={{
              backgroundColor: "#57BA47",
              width: "30%",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 2,
              marginLeft: "2%",
              paddingVertical: "1%",
            }}
          >
            <Text className="text-base font-bold text-white">
              {programEndTime ? formatTime(programEndTime) : "Select Time"}
            </Text>
          </TouchableOpacity>
          {showEndTimePicker && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              display="default"
              onChange={(event, time) => {
                setShowEndTimePicker(false);
                if (time) setProgramEndTime(time);
              }}
            />
          )}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: "4%",
            }}
          >
            <Checkbox
              status={isPaid ? "checked" : "unchecked"}
              onPress={() => setIsPaid(!isPaid)}
              color="#57BA47"
            />
            <Text className="text-base font-bold">Program is Paid</Text>
          </View>
          {isPaid && (
            <View>
              <Text className="text-base font-bold mb-1 ml-2">
                Enter Program Price
              </Text>
              <TextInput
                mode="outlined"
                theme={{ roundness: 10 }}
                style={{ width: "50%", height: 45, marginBottom: 10 }}
                activeOutlineColor="#0D509D"
                value={programPrice}
                onChangeText={setProgramPrice}
                placeholder="Price"
                textColor="black"
                keyboardType="number-pad"
              />
            </View>
          )}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: "4%",
            }}
          >
            <Checkbox
              status={isForKids ? "checked" : "unchecked"}
              onPress={() => setIsForKids(!isForKids)}
              color="#57BA47"
            />
            <Text className="text-base font-bold">Program is For Kids</Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: "4%",
            }}
          >
            <Checkbox
              status={isFor14Plus ? "checked" : "unchecked"}
              onPress={() => setIsFor14Plus(!isFor14Plus)}
              color="#57BA47"
            />
            <Text className="text-base font-bold">Program is For 14+</Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: "4%",
            }}
          >
            <Checkbox
              status={isEducational ? "checked" : "unchecked"}
              onPress={() => setIsEducational(!isEducational)}
              color="#57BA47"
            />
            <Text className="text-base font-bold">
              Program is For Education
            </Text>
          </View>

          <Button
            mode="contained"
            buttonColor="#57BA47"
            textColor="white"
            theme={{ roundness: 1 }}
            onPress={handleSubmit}
          >
            Submit Program
          </Button>
        </ScrollView>
      </View>
    </>
  );
};

export default AddNewProgramScreen;
