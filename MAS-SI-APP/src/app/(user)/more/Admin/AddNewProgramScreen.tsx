import React, { useEffect, useState } from "react";
import { Text, View, Image, ScrollView, TouchableOpacity, Pressable, Alert, FlatList } from "react-native";
import { router, Stack } from "expo-router";
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
import Svg, { Circle, Path } from "react-native-svg";
import AddSpeakerModal from "@/src/components/AdminComponents/AddSpeakerModal";


const AddNewProgramScreen = () => {
  const [programName, setProgramName] = useState<string>("");
  const [programImage, setProgramImage] = useState<ImagePicker.ImagePickerAsset>();
  const [programDescription, setProgramDescription] = useState<string>("");
  const [programStartDate, setProgramStartDate] = useState<Date | null>(null);
  const [programEndDate, setProgramEndDate] = useState<Date | null>(null);
  const [programStartTime, setProgramStartTime] = useState<Date | null>(null);
  const [programDays, setProgramDays] = useState<string[]>([]);
  const [ speakers, setSpeakers ] = useState<any[]>([])
  const [showStartDatePicker, setShowStartDatePicker] =
    useState<boolean>(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);
  const [showStartTimePicker, setShowStartTimePicker] =
    useState<boolean>(false);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [isForKids, setIsForKids] = useState<boolean>(false);
  const [ speakerSelected, setSpeakerSelected ] = useState<any[]>([])
  const [ hasLectures, sethasLectures ] = useState(false)
  const [ addSpeaker, setOpenAddSpeaker ] = useState(false) 
  const [ programPaidLink, setProgramPaidLink ] = useState<string>('')
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

  const handleSubmit = () => {
    // Reset all the fields
    setProgramName("");
    setProgramImage(undefined);
    setProgramDescription("");
    setProgramStartDate(null);
    setProgramEndDate(null);
    setProgramStartTime(null);
    setProgramDays([]);
    setIsPaid(false);
    setIsForKids(false);
    setSpeakerSelected([])
    sethasLectures(false)
    setProgramPaidLink('')
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
        <MenuTrigger style={{ marginHorizontal  : 10 }}>

         <View className="flex flex-row w-[100%} justify-between">
            <View className="items-center justify-between flex flex-row w-[35%]">
              <Text className="text-blue-600 underline">
                Select Speakers 
              </Text>
              <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <Path d="M7.5 15L12.5 10L7.5 5" stroke="#6077F5" stroke-width="2"/>
              </Svg>
            </View> 
            { speakerSelected.length == 0 ? 
            <Pressable className="items-center justify-between flex flex-row w-[35%]" onPress={() => setOpenAddSpeaker(true)}>
              <Text>Add a speaker</Text>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="8" r="4" stroke="#222222" stroke-linecap="round"/>
                <Path fill-rule="evenodd" clip-rule="evenodd" d="M15.2749 16C13.8962 15.5613 12.3886 15.4073 10.9057 15.5538C9.26518 15.7157 7.71374 16.2397 6.4495 17.0712C5.18515 17.9028 4.25277 19.0137 3.80077 20.2789C3.70786 20.5389 3.84336 20.825 4.1034 20.9179C4.36345 21.0108 4.64957 20.8754 4.74247 20.6153C5.10951 19.588 5.88417 18.64 6.99902 17.9067C8.11398 17.1734 9.50702 16.6967 11.0039 16.5489C11.5538 16.4946 12.1066 16.4858 12.6526 16.521C13.008 16.1974 13.4805 16 13.999 16L15.2749 16Z" fill="#222222"/>
                <Path d="M18 14L18 22" stroke="#222222" stroke-linecap="round"/>
                <Path d="M22 18L14 18" stroke="#222222" stroke-linecap="round"/>
              </Svg>
            </Pressable>
            : <Text>{speakerSelected.length} Speaker(s) Chosen</Text>}
          </View>

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

  const onSubmit = async () => {
    if ( programName && programDescription && programDays.length > 0 && programEndDate  &&  programStartDate &&  speakerSelected.length>0 && programImage) {
      const base64 = await FileSystem.readAsStringAsync(programImage.uri, { encoding: 'base64' });
      const filePath = `${programName.trim().split(" ").join("")}.${programImage.type === 'image' ? 'png' : 'mp4'}`;
      const contentType = programImage.type === 'image' ? 'image/png' : 'video/mp4';
      const { data : image, error :image_upload_error } = await supabase.storage.from('fliers').upload(filePath, decode(base64));
      if( image ){
        const { data : program_img_url} = await supabase.storage.from('fliers').getPublicUrl(image?.path)
        const time =  format(programStartTime!, 'p').trim()
        const { error } = await supabase.from('programs').insert({ program_name : programName, program_img : program_img_url.publicUrl, program_desc : programDescription, program_speaker : speakerSelected, has_lectures : hasLectures, program_start_date : programStartDate, program_end_date : programEndDate, program_is_paid : isPaid, is_kids : isForKids, program_start_time :time, program_days : programDays, paid_link : programPaidLink })
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
          headerTransparent : true,
          header : () => (
            <View className="relative">
              <View className="h-[110px] w-[100%] rounded-br-[65px] bg-[#5E636B] items-start justify-end pb-[5%] z-[1]">
                <Pressable className="flex flex-row items-center justify-between w-[40%]" onPress={() => router.back()}>
                  <Svg width="29" height="29" viewBox="0 0 29 29" fill="none">
                    <Path d="M18.125 7.25L10.875 14.5L18.125 21.75" stroke="#1B85FF" stroke-width="2"/>
                  </Svg>
                  <Text className=" text-[25px] text-white">Programs</Text>
                </Pressable>
              </View>
              <View className="h-[120px] w-[100%] rounded-br-[65px] bg-[#BBBEC6] items-start justify-end pb-[5%] absolute top-[50]">
               <View className="w-[65%] items-center"> 
                <Text className=" text-[15px] text-black ">Create A New Program</Text>
              </View>
              </View>
            </View>
          )
        }}
      />
      <View style={{ paddingHorizontal : 10, backgroundColor : 'white', paddingTop : 170}}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: tabHeight + 10 }}
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-base font-bold mb-1 mt-2 ml-2">Program Details</Text>
          <Text className="font-bold text-[13px] text-black my-3 ml-2">Time: </Text>
          <Pressable className="flex flex-col bg-[#EDEDED] w-[40%] rounded-[10px] items-center py-3 px-3" onPress={() => setShowStartTimePicker(true)}>
          <Text className=" text-black text-[11px]">
             Start Time: { programStartTime ? format(programStartTime,'p') : '__'}
            </Text>
            {showStartTimePicker && (
            <DateTimePicker
              value={new Date(programStartTime!)}
              mode="time"
              display="default"
              onChange={(event, time) => {
                if (time) setProgramStartTime(time);
              }}
            />
          )}
          </Pressable>
          <Text className="font-bold text-[13px] text-black my-3 ml-2">Date:</Text>
          <View className="flex flex-row gap-x-2">
          <Pressable className="flex flex-col bg-[#EDEDED] w-[40%] rounded-[10px] items-center py-3 px-3" onPress={() => setShowStartDatePicker(true)}>
            <Text className="text-black text-[11px]">
             Start Date: { programStartDate ? programStartDate.toLocaleDateString() : '__'}
            </Text>
            {showStartDatePicker && (
              <DateTimePicker
                value={ programStartDate ? programStartDate :new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowStartDatePicker(false);
                  if (date) setProgramStartDate(date);
                }}
              />
            )}
          </Pressable>

          <Pressable className="flex flex-col bg-[#EDEDED] w-[40%] rounded-[10px] items-center py-3 px-3" onPress={() => setShowEndDatePicker(true)}>
          <Text className="text-black text-[11px]">
             End Date: { programEndDate ? programEndDate.toLocaleDateString() : '__'}
            </Text>
            {showEndDatePicker && (
              <DateTimePicker
                value={ programEndDate ? programEndDate :new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowEndDatePicker(false);
                  if (date) setProgramEndDate(date);
                }}
              />
            )}
          </Pressable>
          </View>
          
          <Text className="text-base font-bold mb-4 mt-4 ml-2">
          Select the day(s) this program is held:          
          </Text>
         <View className="flex flex-row  gap-5 flex-wrap">
            {days.map((day, index) => (
               <Pressable
               key={index}
               style={{ flexDirection: "row", alignItems: "center" }}
               onPress={() => toggleDaySelection(day)}
               className="w-[25%]"
             >
               <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center">
                 {programDays.includes(day) ? <Icon  source={'check'} size={15} color="green"/> : <></>}
               </View>
               <Text className="ml-5">{day}</Text>
             </Pressable>
            ))}
         </View>


          <Text className="text-base font-bold mb-1 ml-2 mt-4">
            Title
          </Text>
          <TextInput
            mode="outlined"
            theme={{ roundness: 10 }}
            style={{ width: "100%", height: 45, marginBottom: 10, backgroundColor  : 'white' }}
            activeOutlineColor="#0D509D"
            value={programName}
            onChangeText={setProgramName}
            placeholder="Enter The Program... "
            textColor="black"
          />

          <Text className="text-base font-bold mb-1 mt-2 ml-2">
            Description
          </Text>
          <TextInput
            mode="outlined"
            theme={{ roundness: 10 }}
            style={{ width: "100%", height: 100, marginBottom: 10, backgroundColor  : 'white' }}
            multiline
            activeOutlineColor="#0D509D"
            value={programDescription}
            onChangeText={setProgramDescription}
            placeholder="Enter The Description... "
            textColor="black"
          />
          <Text className="text-base font-bold mb-1 mt-2 ml-2 my-4">
          Who is the Speaker of the Program 
          </Text>
         { speakers ? <SpeakersData speakers={speakers} /> : <Text>Fetching Speakers</Text>}

          <Text className="text-base font-bold mb-1 mt-2 ml-2 my-4">
            Upload Program Flyer
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
            className="w-[100%]"
            >
              Upload
            </Button>)
        }


        <Text className="text-black font-bold ml-4 mt-4">Does the Program have recorded Youtube Videos? </Text>
        <View className="flex flex-row justify-evenly">
        <Pressable
               style={{ flexDirection: "row", alignItems: "center" }}
               className="w-[25%]"
               onPress={() => sethasLectures(false)}
             >
               <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center rounded-full">
                 {!hasLectures ? <Icon  source={'check'} size={15} color="green"/> : <></>}
               </View>
               <Text className="ml-5">No</Text>
             </Pressable>

             <Pressable
               style={{ flexDirection: "row", alignItems: "center" }}
               className="w-[25%]"
               onPress={() => sethasLectures(true)}

             >
               <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center rounded-full my-4">
                 {hasLectures? <Icon  source={'check'} size={15} color="green"/> : <></>}
               </View>
               <Text className="ml-5">Yes</Text>
             </Pressable>
        </View>


        <Text className="text-black font-bold ml-4 mt-4">Program Type: (If unchecked will default to false)</Text>


         <View className="flex flex-row flex-wrap gap-3 my-4">

            
            <Pressable
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: "4%",
              }}
              onPress={() => setIsForKids(!isForKids)}
              className="w-[35%] justify-between px-6"
            >
              <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center ">
                 {isForKids ? <Icon  source={'check'} size={15} color="green"/> : <></>}
              </View>
              <Text className="text-base font-bold">Kids</Text>
            </Pressable>

            <Pressable
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: "4%",
              }}
              onPress={() => setIsForKids(!isForKids)}
              className="w-[35%] justify-between px-6"
            >
              <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center ">
                 {isForKids ? <Icon  source={'check'} size={15} color="green"/> : <></>}
              </View>
              <Text className="text-base font-bold">Program</Text>

              
            </Pressable>


          { /* 
          <Pressable
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginVertical: "4%",
              }}
              onPress={() => setIsPaid(!isPaid)}
              className="w-[35%] justify-between px-6"
            >
              <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center ">
                 {isPaid ? <Icon  source={'check'} size={15} color="green"/> : <></>}
              </View>
              <Text className="text-base font-bold">Paid</Text>
            </Pressable>
            {isPaid && (
              <View>
                <Text className="text-base font-bold mb-1 ml-2">
                  Enter Program Website Link
                </Text>
                <TextInput
                  mode="outlined"
                  theme={{ roundness: 10 }}
                  style={{ width: "50%", height: 45, marginBottom: 10, backgroundColor : 'white' }}
                  activeOutlineColor="#0D509D"
                  value={programPaidLink}
                  onChangeText={setProgramPaidLink}
                  placeholder="Enter MAS Shop Link..."
                  textColor="black"
                />
              </View>
            )}
              
            */}
  
         </View>
          <Button
            mode="contained"
            buttonColor="#57BA47"
            textColor="white"
            theme={{ roundness: 1 }}
            onPress={async() =>  await onSubmit()}
          >
            Submit Program
          </Button>

        </ScrollView>
        <AddSpeakerModal setIsOpen={setOpenAddSpeaker} isOpen={addSpeaker}/>
      </View>
    </>
  );
};

export default AddNewProgramScreen;


/*
 headerBackTitleVisible: false,
          headerStyle: { backgroundColor: "white" },
          headerTintColor : 'black',
          title: "Add New Program",
*/