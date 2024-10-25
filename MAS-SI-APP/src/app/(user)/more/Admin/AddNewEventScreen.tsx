import React, { useState } from "react";
import { Text, View, Image, ScrollView, TouchableOpacity } from "react-native";
import { Stack } from "expo-router";
import { TextInput, Checkbox, Chip, Menu, Button } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import moment from "moment";
import Toast from "react-native-toast-message";

const AddNewEventScreen = () => {
  const [eventName, setEventName] = useState<string>("");
  const [eventImage, setEventImage] = useState<string | null>(null);
  const [eventDescription, setEventDescription] = useState<string>("");
  const [eventSpeaker, setEventSpeaker] = useState<string>("");
  const [eventSpeakersList, setEventSpeakersList] = useState<string[]>([]);
  const [eventStartDate, setEventStartDate] = useState<Date | null>(null);
  const [eventEndDate, setEventEndDate] = useState<Date | null>(null);
  const [eventStartTime, setEventStartTime] = useState<Date | null>(null);
  const [eventEndTime, setEventEndTime] = useState<Date | null>(null);
  const [eventDays, setEventDays] = useState<string[]>([]);
  const [showStartDatePicker, setShowStartDatePicker] =
    useState<boolean>(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);
  const [showStartTimePicker, setShowStartTimePicker] =
    useState<boolean>(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState<boolean>(false);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [EventPrice, setEventPrice] = useState<string>("");
  const [isForKids, setIsForKids] = useState<boolean>(false);
  const [isFor14Plus, setIsFor14Plus] = useState<boolean>(false);
  const [isEducational, setIsEducational] = useState<boolean>(false);
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [isPace, setIsPace] = useState<boolean>(false);
  const [musicPace, setMusicPace] = useState<boolean>(false);
  const [dancePace, setDancePace] = useState<boolean>(false);

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
      setEventImage(result.assets[0].uri);
    }
  };

  const toggleDaySelection = (day: string) => {
    if (eventDays.includes(day)) {
      setEventDays(eventDays.filter((d) => d !== day));
    } else {
      setEventDays([...eventDays, day]);
    }
  };

  const formatDate = (date: Date | null) => {
    return date ? moment(date).format("MM/DD/YYYY") : "";
  };

  const formatTime = (time: Date | null) => {
    return time ? moment(time).format("hh:mm A") : "";
  };

  const addSpeaker = () => {
    if (eventSpeaker.trim() !== "") {
      setEventSpeakersList([...eventSpeakersList, eventSpeaker.trim()]);
      setEventSpeaker("");
    }
  };

  const removeSpeaker = (speaker: string) => {
    setEventSpeakersList(eventSpeakersList.filter((s) => s !== speaker));
  };

  const handleSubmit = () => {
    setEventName("");
    setEventImage(null);
    setEventDescription("");
    setEventSpeaker("");
    setEventSpeakersList([]);
    setEventStartDate(null);
    setEventEndDate(null);
    setEventStartTime(null);
    setEventEndTime(null);
    setEventDays([]);
    setIsPaid(false);
    setEventPrice("");
    setIsForKids(false);
    setIsFor14Plus(false);
    setIsEducational(false);
    setIsPace(false);
    setMusicPace(false);
    setDancePace(false)

    Toast.show({
      type: "success",
      text1: "Event Successfully Added",
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
          title: "Add New Event",
        }}
      />
      <View style={{ padding: 16 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: "20%" }}
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-base font-bold mb-1 ml-2">
            Enter Event Name
          </Text>
          <TextInput
            mode="outlined"
            theme={{ roundness: 10 }}
            style={{ width: "100%", height: 45, marginBottom: 10 }}
            activeOutlineColor="#0D509D"
            value={eventName}
            onChangeText={setEventName}
            placeholder="Event Name"
            textColor="black"
          />

          <Text className="text-base font-bold mb-1 mt-2 ml-2">
            Enter Event Description
          </Text>
          <TextInput
            mode="outlined"
            theme={{ roundness: 10 }}
            style={{ width: "100%", height: 100, marginBottom: 10 }}
            multiline
            activeOutlineColor="#0D509D"
            value={eventDescription}
            onChangeText={setEventDescription}
            placeholder="Event Description"
            textColor="black"
          />

          <Text className="text-base font-bold mb-1 mt-2 ml-2">
            Add Event Speakers
          </Text>

          <TextInput
            mode="outlined"
            theme={{ roundness: 10 }}
            style={{ width: "100%", height: 45, marginBottom: 10 }}
            activeOutlineColor="#0D509D"
            value={eventSpeaker}
            onChangeText={setEventSpeaker}
            placeholder="Enter Speaker Name"
            onSubmitEditing={addSpeaker}
            textColor="black"
          />

          <TouchableOpacity
            onPress={addSpeaker}
            disabled={!eventSpeaker}
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
            <Text className="text-base font-bold text-white">Add Speaker</Text>
          </TouchableOpacity>

          <View
            style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10 }}
          >
            {eventSpeakersList.map((speaker, index) => (
              <Chip
                key={index}
                onClose={() => removeSpeaker(speaker)}
                className="mx-4 mb-4"
              >
                {speaker}
              </Chip>
            ))}
          </View>

          <Text className="text-base font-bold mb-1 mt-2 ml-2">
            Upload Event Image
          </Text>

          <TouchableOpacity
            onPress={pickImage}
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
            <Text className="text-base font-bold text-white">Upload</Text>
          </TouchableOpacity>
          {eventImage && (
            <Image
              source={{ uri: eventImage }}
              style={{
                width: "50%",
                height: "10%",
                marginVertical: "2%",
              }}
              resizeMode="contain"
            />
          )}

          <Text className="text-base font-bold mb-1 mt-2 ml-2">
            Select Event Days
          </Text>

          {/* Dropdown for event days using TouchableOpacity */}
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TouchableOpacity
                onPress={() => setMenuVisible(true)}
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
                  {eventDays.length > 0 ? eventDays.join(", ") : "Select Days"}
                </Text>
              </TouchableOpacity>
            }
          >
            {days.map((day) => (
              <Menu.Item
                key={day}
                onPress={() => {
                  toggleDaySelection(day);
                  setMenuVisible(false);
                }}
                title={day}
              />
            ))}
          </Menu>

          <Text className="text-base font-bold mt-2 ml-2">
            Select Event Start Date
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
              {eventStartDate ? formatDate(eventStartDate) : "Select Date"}
            </Text>
          </TouchableOpacity>
          {showStartDatePicker && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowStartDatePicker(false);
                if (date) setEventStartDate(date);
              }}
            />
          )}

          <Text className="text-base font-bold mb-1 mt-2 ml-2">
            Select Event End Date
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
              {eventEndDate ? formatDate(eventEndDate) : "Select Date"}
            </Text>
          </TouchableOpacity>
          {showEndDatePicker && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowEndDatePicker(false);
                if (date) setEventEndDate(date);
              }}
            />
          )}

          <Text className="text-base font-bold mb-1 mt-2 ml-2">
            Select Event Start Time
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
              {eventStartTime ? formatTime(eventStartTime) : "Select Time"}
            </Text>
          </TouchableOpacity>
          {showStartTimePicker && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              display="default"
              onChange={(event, time) => {
                setShowStartTimePicker(false);
                if (time) setEventStartTime(time);
              }}
            />
          )}

          <Text className="text-base font-bold mb-1 mt-2 ml-2">
            Select Event End Time
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
              {eventEndTime ? formatTime(eventEndTime) : "Select Time"}
            </Text>
          </TouchableOpacity>
          {showEndTimePicker && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              display="default"
              onChange={(event, time) => {
                setShowEndTimePicker(false);
                if (time) setEventEndTime(time);
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
            <Text className="text-base font-bold">Event is Paid</Text>
          </View>
          {isPaid && (
            <View>
              <Text className="text-base font-bold mb-1 ml-2">
                Enter Event Price
              </Text>
              <TextInput
                mode="outlined"
                theme={{ roundness: 10 }}
                style={{ width: "50%", height: 45, marginBottom: 10 }}
                activeOutlineColor="#0D509D"
                value={EventPrice}
                onChangeText={setEventPrice}
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
            <Text className="text-base font-bold">Event is For Kids</Text>
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
            <Text className="text-base font-bold">Event is For 14+</Text>
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
            <Text className="text-base font-bold">Event is For Education</Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: "4%",
            }}
          >
            <Checkbox
              status={isPace ? "checked" : "unchecked"}
              onPress={() => setIsPace(!isPace)}
              color="#57BA47"
            />
            <Text className="text-base font-bold">Event is Pace</Text>
          </View>
          {isPace ? (
            <View className="ml-5">
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: "4%",
                }}
              >
                <Checkbox
                  status={dancePace ? "checked" : "unchecked"}
                  onPress={() => setDancePace(!dancePace)}
                  color="#57BA47"
                />
                <Text className="text-base font-bold">Event is Dance Pace</Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: "4%",
                }}
              >
                <Checkbox
                  status={musicPace ? "checked" : "unchecked"}
                  onPress={() => setMusicPace(!musicPace)}
                  color="#57BA47"
                />
                <Text className="text-base font-bold">Event is Music Pace</Text>
              </View>
            </View>
          ) : (
            <></>
          )}

          <Button
            mode="contained"
            buttonColor="#57BA47"
            textColor="white"
            theme={{ roundness: 1 }}
            onPress={handleSubmit}
          >
            Submit Event
          </Button>
        </ScrollView>
      </View>
    </>
  );
};

export default AddNewEventScreen;
