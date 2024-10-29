import React, { useEffect, useState } from "react";
import { Text, View, Image, ScrollView, TouchableOpacity, Pressable, Alert } from "react-native";
import { Stack } from "expo-router";
import { TextInput, Checkbox, Chip, Button, Icon } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import moment from "moment";
import Toast from "react-native-toast-message";
import { useBottomTabBarHeight  } from "@react-navigation/bottom-tabs";
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import * as FileSystem from 'expo-file-system';
import { decode } from "base64-arraybuffer";
import { format } from "date-fns";
import { supabase } from "@/src/lib/supabase";

const UpdateEventScreen = () => {
  const [eventName, setEventName] = useState<string>("");
  const [eventImage, setEventImage] = useState<ImagePicker.ImagePickerAsset>();
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
  const [EventPrice, setEventPrice] = useState<string>("0");
  const [isForKids, setIsForKids] = useState<boolean>(false);
  const [isFor14Plus, setIsFor14Plus] = useState<boolean>(false);
  const [isEducational, setIsEducational] = useState<boolean>(false);
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [isPace, setIsPace] = useState<boolean>(false);
  const [musicPace, setMusicPace] = useState<boolean>(false);
  const [dancePace, setDancePace] = useState<boolean>(false);
  const [ speakers, setSpeakers ] = useState<any[]>([])
  const [ speakerSelected, setSpeakerSelected ] = useState<any[]>([])
  const [ hasLectures, sethasLectures ]  = useState(false)
  const tabHeight = useBottomTabBarHeight() + 20
  const getSpeakers = async () => {
    const { data, error } = await supabase.from('speaker_data').select('speaker_id, speaker_name')
    if( data ){
      setSpeakers(data)
    }
  }
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
      setEventImage(result.assets[0]);
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
    setEventImage(undefined);
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
    setSpeakerSelected([])
    sethasLectures(false)

    Toast.show({
      type: "success",
      text1: "Event Successfully Added",
      position: "top",
      topOffset: 50,
      visibilityTime: 2000,
    });
  };

  const handleSpeakerPress = (speaker_id : string) => {
    if( speakerSelected.includes(speaker_id)){
      const removeSpeaker = speakerSelected.filter(id => id != speaker_id)
      setSpeakerSelected(removeSpeaker)
    }
    else if( speakerSelected.length == 0 ){
      setSpeakerSelected([speaker_id])
    } else if( speakerSelected.length > 0 ){
      setSpeakerSelected([...speakerSelected, speaker_id])
    }
  }
  const SpeakersData = (speakers  : any ) => {
    return(
      <Menu>
        <MenuTrigger style={{ marginLeft  : 10 }}>
          { speakerSelected.length == 0 ? <Text className="text-blue-600">Update Speakers</Text> : <Text>{speakerSelected.length} Speaker(s) Chosen</Text>}
        </MenuTrigger>
        <MenuOptions optionsContainerStyle={{  borderRadius  : 10, paddingHorizontal : 4, paddingVertical : 4}}>
          {
            speakers.speakers && speakers.speakers.length > 0 ? speakers.speakers.map(( speaker:any ) =>{
              return(
                <MenuOption onSelect={() => handleSpeakerPress(speaker.speaker_id)}>
                  <Text className="text-black ">{speaker.speaker_name} { speakerSelected.includes(speaker.speaker_id) ? <Icon source={'check'} color="green" size={15}/> : <></>}</Text>
                </MenuOption>
              )
            }) : <></>
          }
        </MenuOptions>
      </Menu>
    )
  }
  const onUpdate =  () => {
  }
  useEffect(() =>{
    getSpeakers()
  }, [])
  return (
    <>
      <Stack.Screen
        options={{
          headerBackTitleVisible: false,
          headerStyle: { backgroundColor: "white" },
          headerTintColor : 'black',
          title: "Update Event",
        }}
      />
      <View style={{ padding: 16, backgroundColor : 'white' }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: tabHeight }}
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-base font-bold mb-1 ml-2">
            Update Event Name
          </Text>
          <TextInput
            mode="outlined"
            theme={{ roundness: 10 }}
            style={{ width: "100%", height: 45, marginBottom: 10, backgroundColor : 'white' }}
            activeOutlineColor="#0D509D"
            value={eventName}
            onChangeText={setEventName}
            placeholder="Event Name"
            textColor="black"
          />

          <Text className="text-base font-bold mb-1 mt-2 ml-2">
          Update Event Description
          </Text>
          <TextInput
            mode="outlined"
            theme={{ roundness: 10 }}
            style={{ width: "100%", height: 100, marginBottom: 10, backgroundColor : 'white' }}
            multiline
            activeOutlineColor="#0D509D"
            value={eventDescription}
            onChangeText={setEventDescription}
            placeholder="Event Description"
            textColor="black"
          />
          
          <Text className="text-black font-bold ml-4 mt-4">Event Type: (If unchecked will default to false)</Text>
          <Pressable
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: "4%",
            }}
            onPress={() => sethasLectures(!hasLectures)}
          >
            <Checkbox
              status={hasLectures ? "checked" : "unchecked"}
              onPress={() => sethasLectures(!hasLectures)}
              color="#57BA47"
              
            />
            <Text className="text-base font-bold">Event Has Lectures? </Text>
          </Pressable>

          <Text className="text-base font-bold mb-1 mt-2 ml-2">
          Update Event Speakers
          </Text>
         { speakers ? <SpeakersData speakers={speakers} /> : <Text>Update Speakers</Text>}

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
          Update Event Image
          </Text>

         
          {eventImage ? (
            <Pressable onPress={pickImage}>
            <Image
              source={{ uri: eventImage.uri }}
              style={{
                width: "50%",
                height: 110,
                marginVertical: "1%",
                alignSelf : "center",
                borderRadius: 15
              }}
              resizeMode="contain"
            /> 
            </Pressable>
          ): (
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
              <Text className="text-base font-bold text-white">Update</Text>
            </TouchableOpacity>
            )
          }

          <Text className="text-base font-bold mb-1 mt-2 ml-2">
          Update Event Days
          </Text>

          {days.map((day, index) => (
            <Pressable
              key={index}
              style={{ flexDirection: "row", alignItems: "center" }}
              onPress={() => toggleDaySelection(day)}
            >
              <Checkbox
                status={eventDays.includes(day) ? "checked" : "unchecked"}
                onPress={() => toggleDaySelection(day)}
                color="#57BA47"
              />
              <Text>{day}</Text>
            </Pressable>
          ))}
          <Text className="text-base font-bold mt-2 ml-2">
          Update Event Start Date
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
              {eventStartDate ? formatDate(eventStartDate) : "Update Date"}
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
          Update Event End Date
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
              {eventEndDate ? formatDate(eventEndDate) : "Update Date"}
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
          Update Event Start Time
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
              {eventStartTime ? formatTime(eventStartTime) : "Update Time"}
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

          <Text className="text-black font-bold ml-4 mt-4">Event Type: (If unchecked will default to false)</Text>
 
          <Pressable
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: "4%",
            }}
            onPress={() => setIsPaid(!isPaid)}
          >
            <Checkbox
              status={isPaid ? "checked" : "unchecked"}
              onPress={() => setIsPaid(!isPaid)}
              color="#57BA47"
            />
            <Text className="text-base font-bold">Event is Paid</Text>
          </Pressable>
          {isPaid && (
            <View>
              <Text className="text-base font-bold mb-1 ml-2">
              Update Event Price
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
          <Pressable
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: "4%",
            }}
            onPress={() => setIsForKids(!isForKids)}
          >
            <Checkbox
              status={isForKids ? "checked" : "unchecked"}
              onPress={() => setIsForKids(!isForKids)}
              color="#57BA47"
            />
            <Text className="text-base font-bold">Event is For Kids</Text>
          </Pressable>

          <Pressable
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: "4%",
            }}
            onPress={() => setIsFor14Plus(!isFor14Plus)}
          >
            <Checkbox
              status={isFor14Plus ? "checked" : "unchecked"}
              onPress={() => setIsFor14Plus(!isFor14Plus)}
              color="#57BA47"
            />
            <Text className="text-base font-bold">Event is For 14+</Text>
          </Pressable>
          <Pressable
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: "4%",
            }}
            onPress={() => setIsEducational(!isEducational)}
          >
            <Checkbox
              status={isEducational ? "checked" : "unchecked"}
              onPress={() => setIsEducational(!isEducational)}
              color="#57BA47"
            />
            <Text className="text-base font-bold">Event is For Education</Text>
          </Pressable>

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
            onPress={() =>  onUpdate()}
          >
            Update Event
          </Button>
        </ScrollView>
      </View>
    </>
  );
};

export default UpdateEventScreen;


