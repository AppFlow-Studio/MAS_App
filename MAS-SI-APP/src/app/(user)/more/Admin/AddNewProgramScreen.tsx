import React, { useEffect, useState } from "react";
import { Text, View, Image, ScrollView, TouchableOpacity, Pressable, Alert } from "react-native";
import { Stack } from "expo-router";
import { TextInput, Checkbox, Button, Icon } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import moment from "moment";
import Toast from "react-native-toast-message";
import { supabase } from "@/src/lib/supabase";
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import { useBottomTabBarHeight  } from "@react-navigation/bottom-tabs";
import * as FileSystem from 'expo-file-system';
import { decode } from "base64-arraybuffer";
import { format } from "date-fns";


const AddNewProgramScreen = () => {
  const [programName, setProgramName] = useState<string>("");
  const [programImage, setProgramImage] = useState<ImagePicker.ImagePickerAsset>();
  const [programDescription, setProgramDescription] = useState<string>("");
  const [programStartDate, setProgramStartDate] = useState<Date | null>(null);
  const [programEndDate, setProgramEndDate] = useState<Date | null>(null);
  const [programStartTime, setProgramStartTime] = useState<Date | null>(null);
  const [programEndTime, setProgramEndTime] = useState<Date | null>(null);
  const [programDays, setProgramDays] = useState<string[]>([]);
  const [ speakers, setSpeakers ] = useState<any[]>([])
  const [showStartDatePicker, setShowStartDatePicker] =
    useState<boolean>(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);
  const [showStartTimePicker, setShowStartTimePicker] =
    useState<boolean>(false);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [programPrice, setProgramPrice] = useState<string>("");
  const [isForKids, setIsForKids] = useState<boolean>(false);
  const [isFor14Plus, setIsFor14Plus] = useState<boolean>(false);
  const [isEducational, setIsEducational] = useState<boolean>(false);
  const [ speakerSelected, setSpeakerSelected ] = useState<any[]>([])
  const [ hasLectures, sethasLectures ] = useState(false)
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
      const img = result.assets[0]

      setProgramImage(img);
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
    setProgramImage(undefined);
    setProgramDescription("");
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
    setSpeakerSelected([])
    sethasLectures(false)
    Toast.show({
      type: "success",
      text1: "Program Successfully Added",
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
          { speakerSelected.length == 0 ? <Text className="text-blue-600">Select Speakers</Text> : <Text>{speakerSelected.length} Speaker(s) Chosen</Text>}
        </MenuTrigger>
        <MenuOptions optionsContainerStyle={{  borderRadius  : 10, paddingHorizontal : 4, paddingVertical : 4}}>
          {
            speakers.speakers && speakers.speakers.length > 0 ? speakers.speakers.map(( speaker ) =>{
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

  const onSumbit = async () => {
    if ( programName && programDescription && programDays.length > 0 && programEndDate  &&  programStartDate &&  speakerSelected.length>0 && programImage) {
      const base64 = await FileSystem.readAsStringAsync(programImage.uri, { encoding: 'base64' });
      const filePath = `${programName.trim()}.${programImage.type === 'image' ? 'png' : 'mp4'}`;
      const contentType = programImage.type === 'image' ? 'image/png' : 'video/mp4';
      const { data : image, error :image_upload_error } = await supabase.storage.from('fliers').upload(filePath, decode(base64));
      if( image ){
        const { data : program_img_url} = await supabase.storage.from('fliers').getPublicUrl(image?.path)
        const time =  format(programStartTime!, 'p').trim()
        const { error } = await supabase.from('programs').insert({ program_name : programName, program_img : program_img_url.publicUrl, program_desc : programDescription, program_speaker : speakerSelected, has_lectures : hasLectures, program_start_date : programStartDate, program_end_date : programEndDate, is_paid : isPaid, program_price : Number(programPrice), is_kids : isForKids, is_fourteen_plus : isFor14Plus, is_education: isEducational, program_start_time :time, program_days : programDays })
        if( error ){
          console.log(error)
        }
        handleSubmit()
      }else{
        Alert.alert(image_upload_error.message)
        return
      }
    }else{
      Alert.alert('Please Fill All Info Before Proceeding')
    }
  }
  useEffect(() => {
    getSpeakers()
  }, [])
  return (
    <>
      <Stack.Screen
        options={{
          headerBackTitleVisible: false,
          headerStyle: { backgroundColor: "white" },
          headerTintColor : 'black',
          title: "Add New Program",
        }}
      />
      <View style={{ padding: 16, backgroundColor : 'white',}}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: tabHeight }}
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-base font-bold mb-1 ml-2">
            Enter Program Name
          </Text>
          <TextInput
            mode="outlined"
            theme={{ roundness: 10 }}
            style={{ width: "100%", height: 45, marginBottom: 10, backgroundColor  : 'white' }}
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
            style={{ width: "100%", height: 100, marginBottom: 10, backgroundColor  : 'white' }}
            multiline
            activeOutlineColor="#0D509D"
            value={programDescription}
            onChangeText={setProgramDescription}
            placeholder="Program Description"
            textColor="black"
          />

          <Text className="text-black font-bold ml-4 mt-4">Program Type: (If unchecked will default to false)</Text>
          
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
            <Text className="text-base font-bold">Program Has Lectures? </Text>
          </Pressable>

          <Text className="text-base font-bold mb-1 mt-2 ml-2">
            Enter Program Speaker
          </Text>
         { speakers ? <SpeakersData speakers={speakers} /> : <Text>Fetching Speakers</Text>}

          <Text className="text-base font-bold mb-1 mt-2 ml-2">
            Upload Program Image
          </Text>
        
          {programImage ? (
            <Pressable onPress={pickImage}>
            <Image
              source={{ uri: programImage.uri }}
              style={{
                width: "50%",
                height:  110,
                marginVertical: "1%",
                alignSelf : "center",
                borderRadius: 15
              }}
              resizeMode="cover"
            />
            </Pressable>) : (
            <Button
            mode="contained"
            buttonColor="#57BA47"
            textColor="white"
            theme={{ roundness: 1 }}
            onPress={pickImage}
            >
              Upload
            </Button>)
        }

          <Text className="text-base font-bold mb-1 mt-2 ml-2">
            Select Program Days
          </Text>
          {days.map((day, index) => (
            <Pressable
              key={index}
              style={{ flexDirection: "row", alignItems: "center" }}
              onPress={() => toggleDaySelection(day)}
            >
              <Checkbox
                status={programDays.includes(day) ? "checked" : "unchecked"}
                onPress={() => toggleDaySelection(day)}
                color="#57BA47"
              />
              <Text>{day}</Text>
            </Pressable>
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

        <Text className="text-black font-bold ml-4 mt-4">Program Type: (If unchecked will default to false)</Text>


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
            <Text className="text-base font-bold">Program is Paid</Text>
          </Pressable>
          {isPaid && (
            <View>
              <Text className="text-base font-bold mb-1 ml-2">
                Enter Program Price
              </Text>
              <TextInput
                mode="outlined"
                theme={{ roundness: 10 }}
                style={{ width: "50%", height: 45, marginBottom: 10, backgroundColor : 'white' }}
                activeOutlineColor="#0D509D"
                value={programPrice}
                onChangeText={setProgramPrice}
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
            <Text className="text-base font-bold">Program is For Kids</Text>
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
            <Text className="text-base font-bold">Program is For 14+</Text>
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
            <Text className="text-base font-bold">
              Program is For Education
            </Text>
          </Pressable>

          <Button
            mode="contained"
            buttonColor="#57BA47"
            textColor="white"
            theme={{ roundness: 1 }}
            onPress={async() =>  await onSumbit()}
          >
            Submit Program
          </Button>
        </ScrollView>
      </View>
    </>
  );
};

export default AddNewProgramScreen;
