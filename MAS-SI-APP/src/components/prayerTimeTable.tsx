import { DataTable, Icon, IconButton } from 'react-native-paper';
import { gettingPrayerData, prayerTimeData } from '@/src/types';
import ProgramWidgetSlider from "@/src/components/programWidgetSlider";
import {View, Text, useWindowDimensions, StyleSheet, Pressable, ImageBackground, Platform } from "react-native";
import AlertBell from '../app/(user)/prayersTable/alertBell';
import { usePrayer } from '../providers/prayerTimesProvider';

type prayerDataProp = {
    prayerData : gettingPrayerData,
    setTableIndex : ( tableIndex : number ) => void
    tableIndex : number
    index : number
    userSettings : { prayer : string, notification_settings : string[] }[] | undefined
  }
const Table = ( { prayerData, setTableIndex, tableIndex, index, userSettings } :  prayerDataProp) => {
  const { currentPrayer } = usePrayer()
  const { width, height } = useWindowDimensions();
  
  const nextPress = () => {
    const nextPressNum = Math.ceil(index + 1)
    setTableIndex(Math.min(6,nextPressNum))
  }
  const backPress = () => {
    setTableIndex(Math.max(0,index - 1))
  }

    return(
      <View style={ { width : width  } } className='items-center' >
        <View className='items-center justify-center  w-[95%] ' >
            <View className='flex-row justify-between items-center  p-2 rounded-3xl bg-white h-[60] w-[80%]' 
            style={[{ shadowColor : 'black', shadowOffset : { width : 0,  height : 3}, shadowOpacity : 1, shadowRadius : 4, elevation : 5 },
              Platform.OS == 'android' ? {
                borderWidth: 1,
                borderColor : '#D3D3D3',
              } : {}
            ]}>
              <Pressable onPress={backPress}>
                <Icon source="chevron-left" size={30} color='black' />
              </Pressable>
              <View className='flex-col items-center justify-center'>
                <Text className="text- font-bold">{prayerData.date}</Text>
                <Text className='text-23 font-bold text-gray-400'>{prayerData.hijri_month} {prayerData.hijri_date}</Text>
              </View>
              <Pressable onPress={nextPress}>
                <Icon source="chevron-right" size={30} color='black'/>
              </Pressable>
            </View>
          <View className='mt-3 w-[100%]'>

          <View style={ 
            [{ backgroundColor: 'white', borderRadius: 8, shadowColor: "black", shadowOffset: {width : 0, height: 0}, shadowOpacity: 1, shadowRadius: 2, width : '100%', elevation : 5},
              Platform.OS == 'android' ? {
                borderWidth: 1,
                borderColor : '#D3D3D3',
              } : {}

            ] } className='flex-col px-4 py-2'>

            <View style={{ }} className=' flex-row items-center w-[100%] h-[35]'>
              <View className='w-[34%]  h-[100%] '><Text style={{fontSize:20, color:"#0D509D", fontWeight: "bold" }} className='text-left'>Salah</Text></View>
              <View className=' w-[33%] h-[100%] '><Text style={{fontSize: 20,  color:"#0D509D", fontWeight: 700}} className='text-center'>Athan</Text></View>
              <View className=' w-[33%] h-[100%] '><Text style={{fontSize:20, fontWeight: 700, color:"black" }} className='text-right'>Iqamah</Text></View>
            </View>

            {
              index == 0 ?
              ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map(( salah ) => {
                const prayerSetting = userSettings?.filter( setting  =>  setting.prayer == salah.toLowerCase() )
                return (
                  <View style={{borderBottomWidth: 0, backgroundColor : currentPrayer == salah && index == 0 ? 'rgba(147, 250, 165, 0.5)' : 'white', paddingHorizontal : currentPrayer == salah && index == 0 ? 8 : 0 , borderRadius : currentPrayer == salah && index == 0 ? 20 : 0,}} className=' items-center w-[100%] flex-row h-[35]'>
                    <View className='w-[34%]  h-[100%] items-start justify-center'>
                      { index == 0 ? <AlertBell salah={salah} 
                      athan={prayerData[`athan_${ salah == 'Dhuhr' ? 'zuhr' : salah.toLowerCase()}`]} 
                      iqamah={prayerData[`iqa_${ salah == 'Dhuhr' ? 'zuhr' : salah.toLowerCase()}`]} 
                      nextPrayerAthan={ salah == 'Fajr' ? prayerData.athan_zuhr : salah == 'Dhuhr' ? prayerData.athan_asr : salah == 'Asr' ? prayerData.athan_maghrib : salah == 'Maghrib' ? prayerData.athan_isha  : prayerData.athan_fajr }
                      salahSettings={prayerSetting ? prayerSetting[0] : undefined}
                      />
                      : < Text className='font-bold text-[#0D509D] text-lg pl-2'>{salah}</Text>
                      }
                    </View>
                    <View className=' w-[33%] h-[100%] justify-center'><Text style={{  color:"#0D509D" , fontWeight: 700 }} className=' text-center' adjustsFontSizeToFit numberOfLines={1}>{prayerData[`athan_${ salah == 'Dhuhr' ? 'zuhr' : salah.toLowerCase()}`]}</Text></View>
                    <View className=' w-[33%] h-[100%] justify-center'><Text style={{  fontWeight: 700, color: 'black' }} className=' text-right' adjustsFontSizeToFit numberOfLines={1}>{prayerData[`iqa_${ salah == 'Dhuhr' ? 'zuhr' : salah.toLowerCase()}`]}</Text></View>
                </View>
                )
              })
              :
              ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map(( salah ) => {
                return (
                  <View style={{borderBottomWidth: 0, backgroundColor : currentPrayer == salah && index == 0 ? 'rgba(147, 250, 165, 0.5)' : 'white', paddingHorizontal : currentPrayer == salah && index == 0 ? 8 : 0 , borderRadius : currentPrayer == salah && index == 0 ? 20 : 0,}} className=' items-center w-[100%] flex-row h-[35]'>
                    <View className='w-[34%]  h-[100%] items-start justify-center'>
                       < Text className='font-bold text-[#0D509D] text-lg pl-2'>{salah}</Text>
                    </View>
                    <View className=' w-[33%] h-[100%] justify-center'><Text style={{  color:"#0D509D" , fontWeight: 700 }} className=' text-center' adjustsFontSizeToFit numberOfLines={1}>{prayerData[`athan_${ salah == 'Dhuhr' ? 'zuhr' : salah.toLowerCase()}`]}</Text></View>
                    <View className=' w-[33%] h-[100%] justify-center'><Text style={{  fontWeight: 700, color: 'black' }} className=' text-right' adjustsFontSizeToFit numberOfLines={1}>{prayerData[`iqa_${ salah == 'Dhuhr' ? 'zuhr' : salah.toLowerCase()}`]}</Text></View>
                </View>
                )
              })
            }
            
        
          </View>
      </View>
      </View>
    </View>
    )
}

export default Table



{
  /*
  <View style={{borderBottomWidth: 0, backgroundColor : currentPrayer == 'Fajr' && index == 0 ? 'rgba(147, 250, 165, 0.5)' : 'white', paddingHorizontal : currentPrayer == 'Fajr' && index == 0 ? 8 : 0 , borderRadius : currentPrayer == 'Fajr' && index == 0 ? 20 : 0,}} className=' items-center w-[100%] flex-row h-[35]'>
              <View className='w-[34%]  h-[100%] items-start justify-center'>
                { index == 0 ? <AlertBell salah={"Fajr"} athan={prayerData.athan_fajr} iqamah={prayerData.iqa_fajr} nextPrayerAthan={prayerData.athan_zuhr} />
                : < Text className='font-bold text-[#0D509D] text-lg pl-2'>Fajr</Text>
                }
              </View>
              <View className=' w-[33%] h-[100%] justify-center'><Text style={{  color:"#0D509D" , fontWeight: 700 }} className=' text-center' adjustsFontSizeToFit numberOfLines={1}>{prayerData.athan_fajr}</Text></View>
              <View className=' w-[33%] h-[100%] justify-center'><Text style={{  fontWeight: 700, color: 'black' }} className=' text-right' adjustsFontSizeToFit numberOfLines={1}>{prayerData.iqa_fajr}</Text></View>
            </View>

            <View style={{borderBottomWidth: 0, backgroundColor : currentPrayer == 'Dhuhr' && index == 0 ? 'rgba(147, 250, 165, 0.5)' : 'white', paddingHorizontal : currentPrayer == 'Dhuhr' && index == 0 ? 8 : 0 , borderRadius : currentPrayer == 'Dhuhr' && index == 0 ? 20 : 0,}} className=' items-center w-[100%] flex-row h-[35]'>
              <View className='w-[34%]  h-[100%] items-start justify-center'>
               { index == 0 ?  <AlertBell salah={"Dhuhr"}  athan={prayerData.athan_zuhr} iqamah={prayerData.iqa_zuhr} nextPrayerAthan={prayerData.athan_asr}/> 
               : <Text className='font-bold text-[#0D509D] text-lg pl-2'>Dhuhr</Text> }
              </View>
              <View className=' w-[33%] h-[100%] justify-center'><Text style={{  color:"#0D509D" , fontWeight: 700 }} className=' text-center' adjustsFontSizeToFit numberOfLines={1}>{prayerData.athan_zuhr}</Text></View>
              <View className=' w-[33%] h-[100%] justify-center'><Text style={{  fontWeight: 700, color: 'black' }} className=' text-right' adjustsFontSizeToFit numberOfLines={1}>{prayerData.iqa_zuhr}</Text></View>
            </View>

            <View style={{borderBottomWidth: 0, backgroundColor : currentPrayer == 'Asr' && index == 0 ? 'rgba(147, 250, 165, 0.5)' : 'white', paddingHorizontal : currentPrayer == 'Asr'  && index == 0 ? 8 : 0 , borderRadius : currentPrayer == 'Asr' && index == 0? 20 : 0, }} className=' items-center w-[100%] flex-row h-[35]'>
              <View className='w-[34%]  h-[100%] items-start justify-center'>
                { index == 0 ? <AlertBell salah={"Asr"}  athan={prayerData.athan_asr} iqamah={prayerData.iqa_asr} nextPrayerAthan={prayerData.athan_maghrib}/> 
                : <Text className='font-bold text-[#0D509D] text-lg pl-2'>Asr</Text>}
              </View>
              <View className=' w-[33%] h-[100%] items-center justify-center'><Text style={{  color:"#0D509D" , fontWeight: 700 }} className=' text-center' adjustsFontSizeToFit numberOfLines={1}>{prayerData.athan_asr}</Text></View>
              <View className=' w-[33%] h-[100%] justify-center'><Text style={{  fontWeight: 700, color: 'black' }} className=' text-right' adjustsFontSizeToFit numberOfLines={1}>{prayerData.iqa_asr}</Text></View>
            </View>

            <View style={{borderBottomWidth: 0, backgroundColor : currentPrayer == 'Maghrib' && index == 0 ? 'rgba(147, 250, 165, 0.5)' : 'white', paddingHorizontal : currentPrayer == 'Maghrib' && index == 0 ? 8 : 0 , borderRadius : currentPrayer == 'Maghrib' && index == 0  ? 20 : 0,}} className=' items-center w-[100%] flex-row h-[35] justify-center'>
              <View className='w-[34%]  h-[100%] items-start justify-center'>
                { index == 0 ? <AlertBell salah={"Maghrib"}  athan={prayerData.athan_maghrib} iqamah={prayerData.iqa_maghrib} nextPrayerAthan={prayerData.athan_isha}/> 
                : <Text className='font-bold text-[#0D509D] text-lg pl-2'>Maghrib</Text>}
              </View>
              <View className=' w-[33%] h-[100%] justify-center'><Text style={{  color:"#0D509D" , fontWeight: 700 }} className=' text-center' adjustsFontSizeToFit numberOfLines={1}>{prayerData.athan_maghrib}</Text></View>
              <View className=' w-[33%] h-[100%] justify-center'><Text style={{  fontWeight: 700, color: 'black' }} className=' text-right' adjustsFontSizeToFit numberOfLines={1}>{prayerData.iqa_maghrib}</Text></View>
            </View>

            <View style={{borderBottomWidth: 0, backgroundColor : currentPrayer == 'Isha' && index == 0 ? 'rgba(147, 250, 165, 0.5)' : 'white', paddingHorizontal : currentPrayer == 'Isha' && index == 0 ? 8 : 0 , borderRadius : currentPrayer == 'Isha' && index == 0 ? 20 : 0,}} className=' items-center w-[100%] flex-row h-[35]'>
              <View className='w-[34%]  h-[100%] items-start justify-center'>
                {index == 0 ? <AlertBell salah={"Isha"}  athan={prayerData.athan_isha} iqamah={prayerData.iqa_isha} nextPrayerAthan={prayerData.athan_fajr}/> 
                : <Text className='font-bold text-[#0D509D] text-lg pl-2'>Isha</Text>  
              }
              </View>
              <View className=' w-[33%] h-[100%] justify-center'><Text style={{  color:"#0D509D" , fontWeight: 700 }} className=' text-center' adjustsFontSizeToFit numberOfLines={1}>{prayerData.athan_isha}</Text></View>
              <View className=' w-[33%] h-[100%] justify-center'><Text style={{  fontWeight: 700, color: 'black' }} className=' text-right' adjustsFontSizeToFit numberOfLines={1}>{prayerData.iqa_isha}</Text></View>
            </View>
  */
} 