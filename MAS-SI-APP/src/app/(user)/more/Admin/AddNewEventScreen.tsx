import React, { useEffect, useRef, useState } from "react";
import { Text, View, Image, ScrollView, TouchableOpacity, Pressable, Alert, KeyboardAvoidingView } from "react-native";
import { router, Stack } from "expo-router";
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
import Svg, { Circle, Path } from "react-native-svg";
import AddSpeakerModal from "@/src/components/AdminComponents/AddSpeakerModal";

const AddNewEventScreen = () => {
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

  const [ isSocialService, setIsSocialService] = useState<boolean>(false);
  const [ isFundraiser, setIsFundraiser] = useState<boolean>(false);
  const [ isReverts, setIsReverts] = useState<boolean>(false);
  const [ isOutreach, setIsOutreach ] = useState<boolean>(false);
  const [ isBreakfast, setIsBreakfast ] = useState<boolean>(false);
  const [ eventPaidLink, setEventPaidLink ] = useState('');

  const [ speakers, setSpeakers ] = useState<any[]>([])
  const [ speakerSelected, setSpeakerSelected ] = useState<any[]>([])
  const [ hasLectures, sethasLectures ]  = useState(false)
  const [ openAddSpeaker, setOpenAddSpeaker ] = useState(false) 
  const tabHeight = useBottomTabBarHeight() + 20
  const scrollViewRef = useRef<ScrollView>(null)
  const descriptionRef = useRef<View>(null)
  const titleRef = useRef<View>(null)
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

    setIsBreakfast(false);
    setIsOutreach(false);
    setIsReverts(false);
    setIsSocialService(false);
    setIsFundraiser(false);
    setEventPaidLink('');

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
  const onSumbit = async () => {
    if ( eventName && eventDescription && eventDays.length > 0 && eventEndDate  &&  eventStartDate &&  speakerSelected.length>0 && eventImage && eventStartTime ) {
      const base64 = await FileSystem.readAsStringAsync(eventImage.uri, { encoding: 'base64' });
      const filePath = `${eventName.trim().split(" ").join("_")}.${eventImage.type === 'image' ? 'png' : 'mp4'}`;
      const contentType = eventImage.type === 'image' ? 'image/png' : 'video/mp4';
      const { data : image, error :image_upload_error } = await supabase.storage.from('event_flyers').upload(filePath, decode(base64));
      if( image ){
        const { data : event_img_url} = await supabase.storage.from('event_flyers').getPublicUrl(image?.path)
        const time =  format(eventStartTime!, 'p').trim()
        const { error } = await supabase.from('events').insert({ 
          event_name : eventName, 
          event_img : event_img_url.publicUrl, 
          event_desc : eventDescription, 
          event_speaker : speakerSelected, 
          has_lecture : hasLectures, 
          event_start_date : eventStartDate, 
          event_end_date : eventEndDate, 
          is_paid : isPaid, 
          event_price : Number(EventPrice),
          event_start_time :time, 
          event_days : eventDays,
          is_outreach : isOutreach,
          is_social : isSocialService,
          is_reverts : isReverts,
          is_fundraiser : isFundraiser,
          is_breakfast : isBreakfast,
          paid_link : eventPaidLink,
          pace : isPace
        })
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
  useEffect(() =>{
    getSpeakers()
    const listenforspeakers = supabase
    .channel('listen for speakers change')
    .on(
      'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: "speaker_data",
    },
    async (payload) => await getSpeakers()
    )
    .subscribe()

    return () => { supabase.removeChannel( listenforspeakers )}
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
                    <Text className=" text-[25px] text-white">Events</Text>
                  </Pressable>
                </View>
                <View className="h-[120px] w-[100%] rounded-br-[65px] bg-[#BBBEC6] items-start justify-end pb-[5%] absolute top-[50]">
                 <View className="w-[65%] items-center"> 
                  <Text className=" text-[15px] text-black ">Create A New Event</Text>
                </View>
                </View>
              </View>
            )
          }}
      />
      <View style={{ padding: 10, backgroundColor : 'white', paddingTop: 170 }}>
          <ScrollView
            contentContainerStyle={{ paddingBottom: tabHeight + 10 }}
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets
            ref={scrollViewRef}
          >
             <Text className="text-base font-bold mb-1 mt-2 ml-2">Event Details</Text>
            <Text className="font-bold text-[13px] text-black my-3 ml-2">Time: </Text>
            <Pressable className="flex flex-col bg-[#EDEDED] w-[40%] rounded-[10px] items-center py-3 px-3" onPress={() => setShowStartTimePicker(true)}>
            <Text className=" text-black text-[11px]">
               Start Time: { eventStartTime ? format(eventStartTime, 'p') : '__'}
              </Text>
              {showStartTimePicker && (
              <DateTimePicker
                value={new Date(eventStartTime!)}
                mode="time"
                display="default"
                onChange={(event, time) => {
                  if (time) setEventStartTime(time);
                }}
              />
            )}
            </Pressable>
            <Text className="font-bold text-[13px] text-black my-3 ml-2">Date:</Text>
            <View className="flex flex-row gap-x-2">
            <Pressable className="flex flex-col bg-[#EDEDED] w-[40%] rounded-[10px] items-center py-3 px-3" onPress={() => setShowStartDatePicker(true)}>
              <Text className="text-black text-[11px]">
               Start Date: { eventStartDate ? eventStartDate.toLocaleDateString() : '__'}
              </Text>
              {showStartDatePicker && (
                <DateTimePicker
                  value={eventStartDate ? eventStartDate : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowStartDatePicker(false);
                    if (date) setEventStartDate(date);
                  }}
                />
              )}
            </Pressable>
  
            <Pressable className="flex flex-col bg-[#EDEDED] w-[40%] rounded-[10px] items-center py-3 px-3" onPress={() => setShowEndDatePicker(true)}>
            <Text className="text-black text-[11px]">
               End Date: { eventEndDate ? eventEndDate.toLocaleDateString() : '__'}
              </Text>
              {showEndDatePicker && (
                <DateTimePicker
                  value={ eventEndDate ?  eventEndDate : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowEndDatePicker(false);
                    if (date) setEventEndDate(date);
                  }}
                />
              )}
            </Pressable>
            </View>
  
            <Text className="text-base font-bold mb-4 mt-4 ml-2">
            Select the day(s) this event is held:          
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
                   {eventDays.includes(day) ? <Icon  source={'check'} size={15} color="green"/> : <></>}
                 </View>
                 <Text className="ml-5">{day}</Text>
               </Pressable>
              ))}
           </View>
  
  
           <View ref={titleRef}>
             <Text className="text-base font-bold mb-1 ml-2 mt-4">
                Title
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
                onFocus={() => {
                  titleRef.current?.measure(
                    (x, y, width, height, pageX, pageY) => {
                    scrollViewRef.current?.scrollTo(
                      {
                        y: y,
                        animated : true
                      }
                    )
                  })
                }}
              />
           </View>
            <View ref={descriptionRef}>
              <Text className="text-base font-bold mb-1 mt-2 ml-2">
                Description
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
                onFocus={() => {
                    descriptionRef.current?.measure(
                      (x, y, width, height, pageX, pageY) => {
                      scrollViewRef.current?.scrollTo(
                        {
                          y: y,
                          animated : true
                        }
                      )
                    })
                }}
              />
            </View>
             <Text className="text-base font-bold mb-1 mt-2 ml-2 my-4">
            Who is the Speaker of the Program 
            </Text>
           { speakers ? <SpeakersData speakers={speakers} /> : <Text>Fetching Speakers</Text>}
             
           <Text className="text-base font-bold mb-1 mt-2 ml-2">
              Upload Event Image
            </Text>
  
           
            {eventImage ? (
              <Pressable onPress={pickImage}>
              <Image
                source={{ uri: eventImage.uri }}
                style={{
                  width: 170,
                  height:  170,
                  marginVertical: "1%",
                  alignSelf : "center",
                  borderRadius: 15
                }}
                resizeMode="cover"
              /> 
              </Pressable>
            ): (
              <Button
              mode="contained"
              buttonColor="#57BA47"
              textColor="white"
              theme={{ roundness: 1 }}
              onPress={pickImage}
              className="w-[100%]"
              >
                Upload
              </Button>
              )
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
  
          <Text className="text-black font-bold ml-4 mt-4">Event Type: (<Text className="text-black text-[10px] font-[300]"> It will go under the checked box section </Text>)</Text>
   
  
           <View className="flex flex-row flex-wrap gap-3 my-4 w-[100%]  self-center ml-[0.5] items-center">
  
             <Pressable
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: "4%",
                }}
                onPress={() => setIsPace(true)}
                className="w-[40%] justify-between px-6 "
              >
                <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center ">
                  {isPace ? <Icon  source={'check'} size={15} color="green"/> : <></>}
                </View>
                <Text className="text-base font-bold">PACE</Text>
              </Pressable>
    
              <Pressable
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: "4%",
                }}
                onPress={() => setIsPace(false)}
                className="w-[40%] justify-between px-6 "
              >
                <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center ">
                  {!isPace ? <Icon  source={'check'} size={15} color="green"/> : <></>}
                </View>
                <Text className="text-base font-bold">Event</Text>
              </Pressable>
           </View>
  
           <View className="w-[100%] " >
               <Text className="text-black font-bold ml-4 mt-4">Further Classification: </Text>
               <View className="flex flex-row flex-wrap gap-5 my-4 w-[100%]  self-center ml-[0.5] items-center">
              { !isPace ? 
                <>
                  <  Pressable
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: "4%",
                      }}
                      onPress={() => setIsSocialService(!isSocialService)}
                      className="w-[35%] justify-between px-2 "
                    >
                      <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center ">
                        {isSocialService ? <Icon  source={'check'} size={15} color="green"/> : <></>}
                      </View>
                      <Text className="text-[12px] font-[400] text-black">Social Services</Text>
                    </Pressable>
    
                    <Pressable
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: "4%",
                      }}
                      onPress={() => setIsFundraiser(!isFundraiser)}
                      className="w-[35%] justify-between px-2 "
                    >
                      <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center ">
                        {isFundraiser ? <Icon  source={'check'} size={15} color="green"/> : <></>}
                      </View>
                      <Text className="text-[12px] font-[400] text-black">Fundraiser</Text>
                    </Pressable>
    
                    <Pressable
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: "4%",
                      }}
                      onPress={() => setIsReverts(!isReverts)}
                      className="w-[35%] justify-between px-2 "
                    >
                      <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center ">
                        {isReverts ? <Icon  source={'check'} size={15} color="green"/> : <></>}
                      </View>
                      <Text className="text-[12px] font-[400] text-black">Reverts Event</Text>
                    </Pressable>
    
                    <Pressable
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: "4%",
                      }}
                      onPress={() => setIsBreakfast(!isBreakfast)}
                      className="w-[45%] justify-between px-2 "
                    >
                      <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center ">
                        {isBreakfast ? <Icon  source={'check'} size={15} color="green"/> : <></>}
                      </View>
                      <Text className="text-[12px] font-[400] text-black" >Brothers Breakfast</Text>
                    </Pressable>
    
                    <Pressable
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: "4%",
                      }}
                      onPress={() => setIsOutreach(!isOutreach)}
                      className="w-[80%] justify-center  px-2 "
                    >
                      <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center mx-5">
                        {isOutreach ? <Icon  source={'check'} size={15} color="green"/> : <></>}
                      </View>
                      <Text className="text-[12px] font-[400] text-black">Outreach Activities</Text>
                    </Pressable>
                  </>
                  :
                    <Pressable
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: "4%",
                    }}
                    onPress={() => setIsSocialService(!isSocialService)}
                    className="w-[35%] justify-between px-2 "
                  >
                    <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center ">
                      {isSocialService ? <Icon  source={'check'} size={15} color="green"/> : <></>}
                    </View>
                    <Text className="text-[12px] font-[400] text-black">Social Services</Text>
                  </Pressable>
                  }
  
                </View>
                <Text className="text-black font-bold ml-5 mt-2">Is this { isPace ? 'Pace Event' : 'Event'} Paid?</Text>
                  <Pressable
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginVertical: "4%",
                    }}
                    onPress={() => setIsPaid(!isPaid)}
                    className="w-[35%] justify-between px-6 ml-5"
                  >
                    <View className="border border-[#6077F5] h-[20px] w-[20px] items-center justify-center ">
                        {isPaid ? <Icon  source={'check'} size={15} color="green"/> : <></>}
                    </View>
                    <Text className="text-base font-bold">Paid</Text>
                  </Pressable>
                  {isPaid && (
                    <View>
                      <Text className="text-base font-bold mb-1 ml-2">
                        Enter Event Website Link
                      </Text>
                      <TextInput
                        mode="outlined"
                        theme={{ roundness: 10 }}
                        style={{ width: "100%", height: 45, marginBottom: 10, backgroundColor : 'white' }}
                        activeOutlineColor="#0D509D"
                        value={eventPaidLink}
                        onChangeText={setEventPaidLink}
                        placeholder="Enter MAS Shop Link..."
                        textColor="black"
                      />
                    </View>
                  )}
           </View>
            
  
            <Button
              mode="contained"
              buttonColor="#57BA47"
              textColor="white"
              theme={{ roundness: 1 }}
              onPress={async () => await onSumbit()}
            >
              Submit Event
            </Button>
          </ScrollView>
          
        <AddSpeakerModal setIsOpen={setOpenAddSpeaker} isOpen={openAddSpeaker}/>
      </View>
    </>
  );
};

export default AddNewEventScreen;
