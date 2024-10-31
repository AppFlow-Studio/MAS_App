import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { supabase } from "@/src/lib/supabase";
import { object } from "zod";

const ProgramLecturesScreen = () => {
  const { program_id } = useLocalSearchParams()
  const [ lecture, setLecture ] = useState<any[]>([])

  const getLectures = async () => {
    const { data, error } = await supabase.from('program_lectures').select('*').eq('lecture_program', program_id)
    if ( data ) {
      setLecture(data)
    }
  }

  useEffect(() => {
    getLectures()
  }, [])
  return (
    <>
      <Stack.Screen
        options={{
          headerBackTitleVisible: false,
          headerStyle: { backgroundColor: "white" },
          headerTintColor: "black",
          title: "Program Lectures",
        }}
      />
      <View
        style={{
          flex: 1,
          paddingHorizontal: "4%",
          backgroundColor: "white",
        }}
      >
        <Text className="text-xl my-4">Program Lectures</Text>
        <FlatList
          data={lecture}
          renderItem={({ item, index }) => (
            <Link  href={{
              pathname : '/(user)/more/Admin/UpdateProgramLectures',
              params : {lecture : item.lecture_id }
              }} asChild >
            <TouchableOpacity className="mb-3 flex-row product border-gray-300 pb-2" style={{borderBottomWidth:0.5}}>
                 <Text className="text-lg font-bold mt-2 mr-4 text-gray-500"></Text>
              <View>
                <Text className="text-lg font-bold">
                 {index + 1}. {item.lecture_name}
                </Text>
                <Text className="text-base ">{item.lecture_date}</Text>
              </View>
              
            </TouchableOpacity>
            </Link>
          )}
        />
      </View>
    </>
  );
};

export default ProgramLecturesScreen;

