import React, { useEffect, useState } from "react";
import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { TextInput, Button, Menu } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import { Stack, useLocalSearchParams } from "expo-router";
import moment from "moment";
import { supabase } from "@/src/lib/supabase";

const UpdateProgramLectures = () => {
  const { lecture } = useLocalSearchParams();
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
  const programs = ["Program A", "Program B", "Program C"];



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
    }
   }
  const onUploadLecture = async () => {
    if( lectureName && lectureTime && lectureDate && lectureSpeaker && lectureLink ){
      const { error } = await supabase.from('program_lectures').update({ lecture_time : lectureTime, lecture_name : lectureName, lecture_link : lectureLink ,lecture_date  : lectureDate, lecture_speaker : lectureSpeaker}).eq('lecture_id', lecture)
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
        headerBackTitleVisible: false,
        headerStyle: { backgroundColor: "white" },
        headerTintColor : 'black',
        title: "Update Lecture",
      }}
    />
    <View style={{ padding: 16, backgroundColor : 'white', flex : 1 }}>
      <ScrollView
        contentContainerStyle={{  }}
        showsVerticalScrollIndicator={false}
      >
        

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

        <Text className="text-base font-bold mb-1 ml-2">Update Lecture Link</Text>
        <TextInput
          mode="outlined"
          theme={{ roundness: 10 }}
          style={{ width: "100%", height: 45, marginBottom: 10 , backgroundColor : 'white'}}
          activeOutlineColor="#0D509D"
          value={lectureLink}
          onChangeText={setLectureLink}
          placeholder="Enter YouTube Video ID"
          textColor="black"
        />

        <Text className="text-base font-bold mb-1 ml-2">Update Lecture AI Notes</Text>
        <TextInput
          mode="outlined"
          theme={{ roundness: 10 }}
          style={{ width: "100%", height: 100, marginBottom: 10 }}
          activeOutlineColor="#0D509D"
          multiline
          value={lectureAI}
          onChangeText={setLectureAI}
          placeholder="Enter AI Notes or Comments"
          textColor="black"
        />

        {/* Lecture Date */}
        <Text className="text-base font-bold mb-1 ml-2">Update Lecture Date</Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={{
            backgroundColor: "#57BA47",
            padding: 10,
            borderRadius: 5,
            marginBottom: 10,
            width: "100%",
          }}
        >
          <Text style={{ color: "white", textAlign: "center" }}>
            { lectureDate }
          </Text>
        </TouchableOpacity>
       

        {/* Lecture Time */}
        <Text className="text-base font-bold mb-1 ml-2">Update Lecture Time</Text>
        <TouchableOpacity
          onPress={() => setShowTimePicker(true)}
          style={{
            backgroundColor: "#57BA47",
            padding: 10,
            borderRadius: 5,
            marginBottom: 10,
            width: "100%",
          }}
        >
          <Text style={{ color: "white", textAlign: "center" }}>
            { lectureTime }
          </Text>
        </TouchableOpacity>

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
    </View>
  </>
);
}

export default UpdateProgramLectures
