import React, { useEffect, useState } from "react";
import { Text, View, Image, ScrollView, TouchableOpacity, Pressable, Alert } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
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
import { useRouter } from "expo-router";
function setTimeToCurrentDate(timeString : string ) {

  // Split the time string into hours, minutes, and seconds
  const [hours, minutes, seconds] = timeString.split(':').map(Number);

  // Create a new Date object with the current date
  const timestampWithTimeZone = new Date();

  // Set the time with setHours (adjust based on local timezone or UTC as needed)
  timestampWithTimeZone.setHours(hours + 4, minutes, seconds, 0); // No milliseconds

  // Convert to ISO format with timezone (to ensure it's interpreted as a TIMESTAMPTZ)
  const timestampISO = timestampWithTimeZone // This gives a full timestamp with timezone in UTC

  return timestampISO
}
const UpdateEventScreen = () => {
  const { event_id } = useLocalSearchParams()
  const router = useRouter()
  const [ originalName, setOriginalName ] = useState('')
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
  const [ imgURL, setImgURL ] = useState('')
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
    setImgURL('')
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
    Toast.show({
      type: "success",
      text1: "Event Successfully Updated",
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
  const currentSettings = async () => {
    const { data , error } = await supabase.from('events').select('*').eq('event_id', event_id).single()
    if( data ){
      setOriginalName(data.event_name.split(" ").join(""))
      setEventName(data.event_name);
      setImgURL(data.event_img);
     setEventDescription(data.event_desc);
     setEventStartDate(new Date(data.event_start_date));
     setEventEndDate(new Date(data.event_end_date));
     setEventStartTime(setTimeToCurrentDate(data.event_start_time));
     setEventDays(data.event_days);
      setIsPaid(data.event_is_paid);
     setEventPrice(data.event_price);
      setIsForKids(data.is_kids);
      setIsFor14Plus(data.is_fourteen_plus);
      setIsEducational(data.is_education);
      setSpeakerSelected(data.event_speaker)
      sethasLectures(data.has_lecture)
    }
  }
  const onUpdate = async  () => {
    if ( eventName && eventDescription && eventDays.length > 0 && eventEndDate  &&  eventStartDate &&  speakerSelected.length>0 && (eventImage || imgURL)) {
      if ( eventImage ){
        const base64 = await FileSystem.readAsStringAsync(eventImage.uri, { encoding: 'base64' });
        if ( eventName == originalName ){
          const filePath = `${eventName.trim().split(" ").join("")}.${eventImage.type === 'image' ? 'png' : 'mp4'}`;
          const { data : image, error :image_upload_error } = await supabase.storage.from('event_flyers').update(filePath, decode(base64));
          const time =  format(eventStartTime!, 'p').trim()
          const { error } = await supabase.from('events').update({ event_name : eventName, event_desc : eventDescription, event_speaker : speakerSelected, has_lecture : hasLectures, event_start_date : eventStartDate, event_end_date : eventEndDate, is_paid : isPaid, event_price : Number(EventPrice), is_kids : isForKids, is_fourteen_plus : isFor14Plus, is_education: isEducational, event_start_time :time, event_days : eventDays }).eq('event_id', event_id)
          handleSubmit()
          router.back()
        }else {
          const filePath = `${eventName.trim().split(" ").join("")}.${eventImage.type === 'image' ? 'png' : 'mp4'}`;
          const { error } = await supabase.storage.from('event_flyers').remove([`${originalName.trim().split(" ").join("")}.png`]);
          const contentType = eventImage.type === 'image' ? 'image/png' : 'video/mp4';
          const { data : image, error :image_upload_error } = await supabase.storage.from('event_flyers').upload(filePath, decode(base64));
          if( image ){
            const { data : event_img_url} = await supabase.storage.from('event_flyers').getPublicUrl(image?.path)
            const time =  format(eventStartTime!, 'p').trim()
            const { error } = await supabase.from('events').update({ event_name : eventName, event_img : event_img_url.publicUrl, event_desc : eventDescription, event_speaker : speakerSelected, has_lecture : hasLectures, event_start_date : eventStartDate, event_end_date : eventEndDate, is_paid : isPaid, event_price : Number(EventPrice), is_kids : isForKids, is_fourteen_plus : isFor14Plus, is_education: isEducational, event_start_time :time, event_days : eventDays }).eq('event_id', event_id)
            if( error ){
              console.log(error)
            }
            handleSubmit()
            router.back()
          }
        }
      }else{
        const time =  format(eventStartTime!, 'p').trim()
        const { error } = await supabase.from('events').update({ event_name : eventName, event_img : imgURL, event_desc : eventDescription, event_speaker : speakerSelected, has_lecture : hasLectures, event_start_date : eventStartDate, event_end_date : eventEndDate, is_paid : isPaid, event_price : Number(EventPrice), is_kids : isForKids, is_fourteen_plus : isFor14Plus, is_education: isEducational, event_start_time :time, event_days : eventDays }).eq('event_id', event_id)
        handleSubmit()
        router.back()
      }
    }else{
      Alert.alert('Fill in all required fields')
    }
  }
  useEffect(() =>{
    currentSettings()
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

         
          {
          imgURL ? (
            (
              <Pressable onPress={pickImage}>
              <Image
                source={{ uri: imgURL }}
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
            )
          ) : 
          eventImage ? (
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
            onPress={ async () =>  await onUpdate() }
          >
            Update Event
          </Button>
        </ScrollView>
      </View>
    </>
  );
};

export default UpdateEventScreen;


