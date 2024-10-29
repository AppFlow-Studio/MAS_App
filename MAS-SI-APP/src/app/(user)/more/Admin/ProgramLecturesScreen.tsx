import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React from "react";
import { Link, Stack } from "expo-router";

const ProgramLecturesScreen = () => {
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
          data={[1, 2, 3, 4, 5]}
          renderItem={({ item, index }) => (
            <Link  href={'/(user)/more/Admin/UpdateProgramLectures'} asChild >
            <TouchableOpacity className="mb-3 flex-row product border-gray-300 pb-2" style={{borderBottomWidth:0.5}}>
                 <Text className="text-lg font-bold mt-2 mr-4 text-gray-500">{item}:</Text>
              <View>
                <Text className="text-lg font-bold">
                  Program Lecture {item}{" "}
                </Text>
                <Text className="text-base ">Jun-0{index}, 2024 </Text>
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

const styles = StyleSheet.create({});
