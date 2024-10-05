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
  ImageSourcePropType,
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
  


  const goToPrayer = (prayerName: string, prayerImage: ImageSourcePropType) => {
    navigation.navigate("myPrograms", {
      screen: "notifications/Prayer/[prayerDetails]",
      params: { prayerName:prayerName, prayerImage:prayerImage  },
    });
  };

  
  return (
    <View style={{ width: width }} className="items-center">
      <View className="items-center  justify-center w-[95%]">
        <View className="w-[100%]">
          <ScrollView
            style={{ width: "100%", height: "95%", paddingLeft:'4%'}}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity 
            onPress={ () => 
              goToPrayer(
                 "Fajr",
             require('@/assets//images/fajr.png')
              )
            }
             className="flex-row mt-4">
              <Image
                source={
                  require('@/assets//images/fajr.png')
                }
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
                require('@/assets/images/dhuhr.png')
              )
            }
             className="flex-row mt-4">
              <Image
                source={                
                  require('@/assets/images/dhuhr.png')
                }
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
                require('@/assets/images/asr.png')
              )
            }
             className="flex-row mt-4">
              <Image
                source={
                  require('@/assets/images/asr.png')
                }
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
                  require('@/assets/images/maghrib.png')
                )
              }
             className="flex-row mt-4">
              <Image
                source={                
                  require('@/assets/images/maghrib.png')
                }
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
                require('@/assets/images/isha.png')
              )
            }
             className="flex-row mt-4">
              <Image
                source={
                  require('@/assets/images/isha.png')
                }
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
