import React, { useEffect, useState } from "react";
import { Text, View, ScrollView, TouchableOpacity, Pressable, Image } from "react-native";
import { TextInput, Button, Menu, IconButton, Modal } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import { router, Stack, useLocalSearchParams } from "expo-router";
import moment from "moment";
import { supabase } from "@/src/lib/supabase";
import Svg, { Path } from "react-native-svg";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
const UpdateProgramLectures = () => {
  const { lecture, program_name, program_img, program_ } = useLocalSearchParams();
  const [lectureProgram, setLectureProgram] = useState<string | null>(null);
  const [lectureName, setLectureName] = useState<string>('');
  const [lectureSpeaker, setLectureSpeaker] = useState<string>("");
  const [lectureLink, setLectureLink] = useState<string>("");
  const [lectureAI, setLectureAI] = useState<string>("");
  const [lectureDate, setLectureDate] = useState<string>('');
  const [lectureTime, setLectureTime] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [ keyNotes, setKeyNotes ] = useState<string[]>([]);
  const [ keyNoteModal, setKeyNoteModal ] = useState<boolean>(false);
  const [ keyNoteInput, setKeyNoteInput ] = useState<string>("");
  const programs = ["Program A", "Program B", "Program C"];

  const tabBar = useBottomTabBarHeight()

  const handleSubmit = () => {
    Toast.show({
      type: "success",
      text1: "Lecture Uploaded Successfully",
      position: "top",
      topOffset: 50,
    });
  };
  const getLecture = async () => {
    const { data, error } = await supabase.from('program_lectures').select('*').eq('lecture_id', lecture).single()
    if( data ){
      setLectureDate(data.lecture_date)
      setLectureName(data.lecture_name)
      setLectureSpeaker(data.lecture_speaker)
      setLectureLink(data.lecture_link)
      setLectureTime(data.lecture_time)
      setKeyNotes(data.lecture_key_notes)
      setLectureAI(data.lecture_ai)
    }
   }
  const onUploadLecture = async () => {
    if( lectureName &&  lectureDate && lectureSpeaker && lectureLink ){
      const { error } = await supabase.from('program_lectures').update({ lecture_time : lectureTime, lecture_name : lectureName, lecture_link : lectureLink ,lecture_date  : lectureDate, lecture_speaker : lectureSpeaker, lecture_ai : lectureAI, lecture_key_notes : keyNotes}).eq('lecture_id', lecture)
      handleSubmit()
    }
  }
  useEffect(() => {
    getLecture()
  }, [])
  return (
    <>
    <Stack.Screen
       options={{
        headerTransparent : true,
        header : () => (
          <View className="relative">
            <View className="h-[110px] w-[100%] rounded-br-[65px] bg-[#5E636B] items-start justify-end pb-[5%] z-[1]">
              <Pressable className="flex flex-row items-center justify-between w-[40%]" onPress={() => router.replace('/more/Admin/AdminScreen')}>
                <Svg width="29" height="29" viewBox="0 0 29 29" fill="none">
                  <Path d="M18.125 7.25L10.875 14.5L18.125 21.75" stroke="#1B85FF" stroke-width="2"/>
                </Svg>
                <Text className=" text-[25px] text-white">Programs</Text>
              </Pressable>
            </View>

            <View className="h-[120px] w-[100%] rounded-br-[65px] bg-[#BBBEC6] items-start justify-end pb-[5%] absolute top-[50]">
              <View className="w-[65%] items-center"> 
                <Text className=" text-[15px] text-black ">Edit Existing Programs</Text>
              </View>
            </View>

            <View className="h-[120px] w-[100%] rounded-br-[65px] bg-[#E3E3E3] items-start justify-end pb-[5%] absolute top-[100] z-[-1]">
              <Pressable className="w-[50%] items-center justify-between flex flex-row px-2" onPress={() => router.back()}> 
                  <Svg  width="16" height="9" viewBox="0 0 16 9" fill="none">
                    <Path d="M4.5 8.22607L1 4.61303M1 4.61303L4.5 0.999987M1 4.61303H15" stroke="#6077F5" stroke-linecap="round"/>
                  </Svg>
                  <Text className=" text-[12px] text-black " numberOfLines={1} adjustsFontSizeToFit>{program_name}</Text>
              </Pressable>
            </View>
          </View>
          )
        }}
    />
    <View style={{ padding: 16, backgroundColor : 'white', flex : 1, paddingTop : 220, paddingBottom : tabBar + 30 }}>
      <ScrollView
        contentContainerStyle={{  }}
        showsVerticalScrollIndicator={false}
      >
        
        <Image 
          src={program_img}
          className="self-center w-[200px] h-[200px] rounded-[15px]"
        />
        <Text className="self-center font-bold text-lg my-2">{program_name}</Text>

        <Text className="text-base font-bold mb-1 ml-2">Add A New YouTube Link: </Text>
        <Text className="ml-2 text-[12px] my-1">Example: https://www.youtube.com/watch?v=<Text className="bg-[#FFD465] font-bold rounded-[2px]">qdbPaFQxSUI</Text></Text>
        <TextInput
          mode="outlined"
          theme={{ roundness: 10 }}
          style={{ width: "100%", height: 45, marginBottom: 10 , backgroundColor : 'white'}}
          activeOutlineColor="#0D509D"
          value={lectureLink}
          onChangeText={setLectureLink}
          placeholder="Enter Link ID ONLY..."
          textColor="black"
        />

        <Text className="text-base font-bold mb-1 ml-2">Update Lecture Title</Text>
        <TextInput
          mode="outlined"
          theme={{ roundness: 10 }}
          style={{ width: "100%", height: 45, marginBottom: 10, backgroundColor : 'white' }}
          activeOutlineColor="#0D509D"
          value={lectureName}
          onChangeText={setLectureName}
          placeholder="Enter Lecture Title"
          textColor="black"
        />

        <Text className="text-base font-bold mb-1 ml-2">Update Lecture Speaker</Text>
        <TextInput
          mode="outlined"
          theme={{ roundness: 10 }}
          style={{ width: "100%", height: 45, marginBottom: 10, backgroundColor : 'white' }}
          activeOutlineColor="#0D509D"
          value={lectureSpeaker}
          onChangeText={setLectureSpeaker}
          placeholder="Enter Speaker Name"
          textColor="black"
        />

        <Text className="text-base font-bold mb-1 ml-2">Update Lecture Summary</Text>
        <TextInput
          mode="outlined"
          theme={{ roundness: 10 }}
          style={{ width: "100%", height: 100, marginBottom: 10, backgroundColor : 'white' }}
          activeOutlineColor="#0D509D"
          multiline
          value={lectureAI}
          onChangeText={setLectureAI}
          placeholder="Enter Summary..."
          textColor="black"
        />


      <Text className="text-base font-bold mb-1 ml-2">Lecture KeyNotes</Text>
          {
            keyNotes?.map((note, index) => {
              return(
                <View className="items-center flex-row flex-wrap" key={index}>
                  <IconButton icon={'window-minimize'} size={10} iconColor="red" onPress={() => {
                  const filtered = keyNotes.filter(notes => notes != note )
                  setKeyNotes(filtered)
                  }}/>
                  <Text key={index} className="items-center ml-4 p-1 justify-center">{note}</Text>
                </View>
              )
            })
          }
          <Button onPress={() => setKeyNoteModal(true)} >
            Add KeyNotes
          </Button>

        {/* Lecture Date */}
        <Text className="text-base font-bold mb-1 ml-2">Update Lecture Date</Text>
        <TextInput 
            mode="outlined"
            theme={{ roundness: 10 }}
            style={{ width: "100%", height: 100, marginBottom: 10, backgroundColor : 'white' }}
            activeOutlineColor="#0D509D"
            multiline
            value={lectureDate}
            onChangeText={setLectureDate}
            placeholder="Enter Date (Mon day, year)..."
            textColor="black"
        />

        {/* Buttons */}
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Button
            mode="contained"
            buttonColor="#57BA47"
            textColor="white"
            theme={{ roundness: 1 }}
            onPress={() => onUploadLecture()}
            style={{ width: "48%" }}
          >
            Update Lecture
          </Button>
        </View>
      </ScrollView>

      <Modal visible={keyNoteModal} onDismiss={() => setKeyNoteModal(false)} contentContainerStyle={{backgroundColor : 'white' , borderRadius : 8, width : '90%', height : '50%', alignSelf : 'center' }}>
            <View className="w-[100%] self-center p-5 flex-1">
              <TextInput
              mode="outlined"
              theme={{ roundness: 10 }}
              style={{ width: "100%", height: 200, marginBottom: 10, backgroundColor : 'white' }}
              activeOutlineColor="#0D509D"
              multiline
              value={keyNoteInput}
              onChangeText={setKeyNoteInput}
              placeholder="Enter Key Note"
              textColor="black"
              />
            </View>
            <View className="flex-1 justify-end pb-8">
              <Button
                    mode="contained"
                    buttonColor="#57BA47"
                    textColor="white"
                    theme={{ roundness: 1 }}
                    onPress={ () => {
                      if( keyNotes.length < 1 && keyNoteInput){
                        setKeyNotes([keyNoteInput])
                      }else if(keyNoteInput ){
                        setKeyNotes([...keyNotes, keyNoteInput])
                      }

                      setKeyNoteInput("")
                      setKeyNoteModal(false)
                    } }
                    style={{ width: "48%", alignSelf : 'center'}}
                >
                  Confirm
                </Button>
            </View>
          </Modal>
          
    </View>
  </>
);
}

export default UpdateProgramLectures
