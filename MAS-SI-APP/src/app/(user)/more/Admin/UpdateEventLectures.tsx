import React, { useEffect, useState } from "react";
import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { TextInput, Button, Menu, IconButton, Modal } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import { Stack, useLocalSearchParams } from "expo-router";
import moment from "moment";
import { supabase } from "@/src/lib/supabase";


const UpdateEventLectures = () => {
  const { lecture } = useLocalSearchParams();
  const [lectureEvent, setLectureEvent] = useState<string | null>(null);
  const [lectureName, setLectureName] = useState<string>("");
  const [lectureSpeaker, setLectureSpeaker] = useState<string>("");
  const [lectureLink, setLectureLink] = useState<string>("");
  const [lectureAI, setLectureAI] = useState<string>("");
  const [lectureDate, setLectureDate] = useState<Date | null>(null);
  const [lectureTime, setLectureTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [ keyNotes, setKeyNotes ] = useState<string[]>([]);
  const [ keyNoteModal, setKeyNoteModal ] = useState<boolean>(false);
  const [ keyNoteInput, setKeyNoteInput ] = useState<string>("")

  const getLecture = async () => {
    const { data, error } = await supabase.from('events_lectures').select('*').eq('lecture_id', lecture).single()
    if( data ){
      setLectureDate(data.lecture_date)
      setLectureName(data.lecture_name)
      setLectureSpeaker(data.lecture_speaker)
      setLectureLink(data.lecture_link)
      setLectureTime(data.lecture_time)
    }
   }



  const handleSubmit = () => {
    Toast.show({
      type: "success",
      text1: "Lecture Uploaded Successfully",
      position: "top",
      topOffset: 50,
    });
  };

  const onUpdateLecture = async () => {
    if( lectureName && lectureTime && lectureDate && lectureSpeaker && lectureLink ){
      const { error } = await supabase.from('event_lectures').update({ event_lecture_time : lectureTime, event_lecture_name : lectureName, event_lecture_link : lectureLink , event_lecture_date  : lectureDate, event_lecture_speaker : lectureSpeaker, event_lecture_desc : lectureAI, event_lecture_keynotes : keyNotes}).eq('event_lecture_id', lecture)
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
          contentContainerStyle={{ }}
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
            style={{ width: "100%", height: 45, marginBottom: 10,  backgroundColor : 'white' }}
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
            style={{ width: "100%", height: 45, marginBottom: 10,  backgroundColor : 'white' }}
            activeOutlineColor="#0D509D"
            value={lectureLink}
            onChangeText={setLectureLink}
            placeholder="Enter YouTube Video ID"
            textColor="black"
          />

           <Text className="text-base font-bold mb-1 ml-2">Lecture Summary</Text>
          <TextInput
            mode="outlined"
            theme={{ roundness: 10 }}
            style={{ width: "100%", height: 100, marginBottom: 10, backgroundColor : 'white' }}
            activeOutlineColor="#0D509D"
            multiline
            value={lectureAI}
            onChangeText={setLectureAI}
            placeholder="Enter AI Notes or Comments"
            textColor="black"
          />

          <Text className="text-base font-bold mb-1 ml-2">Lecture KeyNotes</Text>
          {
            keyNotes?.map((note, index) => {
              return(
                <View className="items-center flex-row " key={index}>
                  <IconButton icon={'window-minimize'} size={15} iconColor="red" onPress={() => {
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
              {lectureDate ? moment(lectureDate).format("MM/DD/YYYY") : "Update Date"}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) setLectureDate(date);
              }}
            />
          )}

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
              {lectureTime ? moment(lectureTime).format("hh:mm A") : "Update Time"}
            </Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              display="default"
              onChange={(event, time) => {
                setShowTimePicker(false);
                if (time) setLectureTime(time);
              }}
            />
          )}

          {/* Buttons */}
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Button
              mode="contained"
              buttonColor="#57BA47"
              textColor="white"
              theme={{ roundness: 1 }}
              onPress={() =>  onUpdateLecture()}
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
};

export default UpdateEventLectures;


