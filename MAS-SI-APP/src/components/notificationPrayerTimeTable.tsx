import { DataTable, Icon, IconButton } from "react-native-paper";
import { gettingPrayerData, prayerTimeData } from "@/src/types";
import ProgramWidgetSlider from "@/src/components/programWidgetSlider";
import {
  View,
  Text,
  useWindowDimensions,
  StyleSheet,
  Pressable,
  ImageBackground,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
} from "react-native";
import AlertBell from "../app/(user)/menu/alertBell";
import { usePrayer } from "../providers/prayerTimesProvider";
import { useNavigation } from "expo-router";
import { useState } from "react";

type prayerDataProp = {
  prayerData: gettingPrayerData;
  setTableIndex: (tableIndex: number) => void;
  tableIndex: number;
  index: number;
};
const NotificationPrayerTable = ({
  prayerData,
  setTableIndex,
  tableIndex,
  index,
}: prayerDataProp) => {
  const { currentPrayer } = usePrayer();
  const { width, height } = Dimensions.get("window");
  const navigation = useNavigation<any>();
  const nextPress = () => {
    const nextPressNum = Math.ceil(index + 1);
    setTableIndex(Math.min(6, nextPressNum));
  };
  const backPress = () => {
    setTableIndex(Math.max(0, index - 1));
  };
  


  const goToPrayer = (prayerName: string, prayerImage: string) => {
    navigation.navigate("myPrograms", {
      screen: "notifications/Prayer/[prayerDetails]",
      params: { prayerName:prayerName, prayerImage:prayerImage  },
    });
  };

  
  return (
    <View style={{ width: width }} className="items-center">
      <View className="items-center  justify-center w-[95%]">
        <View
          className="flex-row justify-between items-center  p-2 rounded-3xl bg-white h-[60] w-[80%]"
          style={{
            shadowColor: "black",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 1,
            shadowRadius: 4,
          }}
        >
          <Pressable onPress={backPress}>
            <Icon source="chevron-left" size={30} color="black" />
          </Pressable>
          <View className="flex-col items-center justify-center">
            <Text className="text- font-bold">{prayerData.date}</Text>
            <Text className="text-23 font-bold text-gray-400">
              {prayerData.hijri_month} {prayerData.hijri_date}
            </Text>
          </View>
          <Pressable onPress={nextPress}>
            <Icon source="chevron-right" size={30} color="black" />
          </Pressable>
        </View>
        <View className="mt-3 w-[100%]">
          <ScrollView
            style={{ width: "100%", height: "85%", paddingLeft:'4%'}}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity 
            onPress={ () => 
              goToPrayer(
                 "Fajr",
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHPLhsm_3J3PcjukQghAbtiCDrmuQFdlznkA&s"
              )
            }
             className="flex-row mt-4">
              <Image
                source={{
                  uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHPLhsm_3J3PcjukQghAbtiCDrmuQFdlznkA&s",
                }}
                style={{
                  width: width * 0.35,
                  height: height * 0.15,
                  borderRadius: 8,
                  resizeMode: "stretch",
                }}
              />
              <View className="ml-5">
                <Text className="font-bold text-xl  text-gray-800 ">Fajr</Text>
                <View className="flex-row mt-2">
                  <Text className="text-left  text-gray-600 font-bold ">
                    Athan :{" "}
                  </Text>
                  <Text
                    className="text-left  text-gray-600 font-bold "
                    adjustsFontSizeToFit
                    numberOfLines={1}
                  >
                    {prayerData.athan_fajr}
                  </Text>
                </View>
                <View className="flex-row">
                  <Text className="text-left  text-gray-600 font-bold ">
                    Iqamah :{" "}
                  </Text>
                  <Text
                    className="text-left  text-gray-600 font-bold "
                    adjustsFontSizeToFit
                    numberOfLines={1}
                  >
                    {prayerData.iqa_fajr}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
             onPress={ () => 
              goToPrayer(
                "Dhuhr",
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSCUc3iNcwPaVn2fhKUz84MQc93RIoiJHk8xA&s"
              )
            }
             className="flex-row mt-4">
              <Image
                source={{
                  uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSCUc3iNcwPaVn2fhKUz84MQc93RIoiJHk8xA&s",
                }}
                style={{
                  width: width * 0.35,
                  height: height * 0.15,
                  borderRadius: 8,
                  resizeMode: "stretch",
                }}
              />
              <View className="ml-5">
                <Text className="font-bold text-xl  text-gray-800 ">Dhuhr</Text>
                <View className="flex-row mt-2">
                  <Text className="text-left  text-gray-600 font-bold ">
                    Athan :{" "}
                  </Text>
                  <Text
                    className="text-left  text-gray-600 font-bold "
                    adjustsFontSizeToFit
                    numberOfLines={1}
                  >
                    {prayerData.athan_zuhr}
                  </Text>
                </View>
                <View className="flex-row">
                  <Text className="text-left  text-gray-600 font-bold ">
                    Iqamah :{" "}
                  </Text>
                  <Text
                    className="text-left  text-gray-600 font-bold "
                    adjustsFontSizeToFit
                    numberOfLines={1}
                  >
                    {prayerData.iqa_zuhr}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
            onPress={ () => 
              goToPrayer(
                "Asr",
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQZ6VwwcAoWmwpHzOOOc9DY1N9YbrhYD9NBVQ&s"
              )
            }
             className="flex-row mt-4">
              <Image
                source={{
                  uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQZ6VwwcAoWmwpHzOOOc9DY1N9YbrhYD9NBVQ&s",
                }}
                style={{
                  width: width * 0.35,
                  height: height * 0.15,
                  borderRadius: 8,
                  resizeMode: "stretch",
                }}
              />
              <View className="ml-5">
                <Text className="font-bold text-xl  text-gray-800 ">Asr</Text>
                <View className="flex-row mt-2">
                  <Text className="text-left  text-gray-600 font-bold ">
                    Athan :{" "}
                  </Text>
                  <Text
                    className="text-left  text-gray-600 font-bold "
                    adjustsFontSizeToFit
                    numberOfLines={1}
                  >
                    {prayerData.athan_asr}
                  </Text>
                </View>
                <View className="flex-row">
                  <Text className="text-left  text-gray-600 font-bold ">
                    Iqamah :{" "}
                  </Text>
                  <Text
                    className="text-left  text-gray-600 font-bold "
                    adjustsFontSizeToFit
                    numberOfLines={1}
                  >
                    {prayerData.iqa_asr}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={ () => 
                goToPrayer(
                  "Maghrib",
                  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6c9DdHxdQZrKtJTYS6--EnGRYGyZwY2Jssw&s"
                )
              }
             className="flex-row mt-4">
              <Image
                source={{
                  uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6c9DdHxdQZrKtJTYS6--EnGRYGyZwY2Jssw&s",
                }}
                style={{
                  width: width * 0.35,
                  height: height * 0.15,
                  borderRadius: 8,
                  resizeMode: "stretch",
                }}
              />
              <View className="ml-5">
                <Text className="font-bold text-xl  text-gray-800 ">
                  Maghrib
                </Text>
                <View className="flex-row mt-2">
                  <Text className="text-left  text-gray-600 font-bold ">
                    Athan :{" "}
                  </Text>
                  <Text
                    className="text-left  text-gray-600 font-bold "
                    adjustsFontSizeToFit
                    numberOfLines={1}
                  >
                    {prayerData.athan_maghrib}
                  </Text>
                </View>
                <View className="flex-row">
                  <Text className="text-left  text-gray-600 font-bold ">
                    Iqamah :{" "}
                  </Text>
                  <Text
                    className="text-left  text-gray-600 font-bold "
                    adjustsFontSizeToFit
                    numberOfLines={1}
                  >
                    {prayerData.iqa_maghrib}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
             onPress={ () =>
              goToPrayer(
                "Isha",
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTWLgezuh78d0dRryoe1GtveuxncCGzFdBKiQ&s"
              )
            }
             className="flex-row mt-4">
              <Image
                source={{
                  uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTWLgezuh78d0dRryoe1GtveuxncCGzFdBKiQ&s",
                }}
                style={{
                  width: width * 0.35,
                  height: height * 0.15,
                  borderRadius: 8,
                  resizeMode: "stretch",
                }}
              />
              <View className="ml-5">
                <Text className="font-bold text-xl  text-gray-800 ">Isha</Text>
                <View className="flex-row mt-2">
                  <Text className="text-left  text-gray-600 font-bold ">
                    Athan :{" "}
                  </Text>
                  <Text
                    className="text-left  text-gray-600 font-bold "
                    adjustsFontSizeToFit
                    numberOfLines={1}
                  >
                    {prayerData.athan_isha}
                  </Text>
                </View>
                <View className="flex-row">
                  <Text className="text-left  text-gray-600 font-bold ">
                    Iqamah :{" "}
                  </Text>
                  <Text
                    className="text-left  text-gray-600 font-bold "
                    adjustsFontSizeToFit
                    numberOfLines={1}
                  >
                    {prayerData.iqa_isha}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

export default NotificationPrayerTable;
