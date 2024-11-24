import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { DataTable } from 'react-native-paper';
import { JummahBottomSheetProp, gettingPrayerData, prayerTimeData } from '../types';
import { JummahBottomSheet } from './jummahBottomSheet';
import React, { useRef, forwardRef, useState, useEffect } from 'react';
import {BottomSheetModal, useBottomSheetModal } from "@gorhom/bottom-sheet"
import { IconButton } from 'react-native-paper';
import { supabase } from '../lib/supabase';
type JummahTimeProp = {
    jummah : gettingPrayerData
}

type jummahTableProp = {
  jummahData : JummahBottomSheetProp
}

type Ref = BottomSheetModal;
export const JummahTable = forwardRef<Ref,{}>(({}, ref) => {
  const [ clickedState, setClickedState ] = useState(0)
  const [ jummah, setJummah ] = useState<any[]>([])
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const { dismiss } = useBottomSheetModal();
  const jummahTimes = ["12:15 PM", "1:00 PM", "1:45PM", "3:40PM"]
  const handlePresentModalPress = () => bottomSheetRef.current?.present();

  const handleClosePress = () => bottomSheetRef.current?.close();
  const handleOpenPress = () => bottomSheetRef.current?.expand();

  const InfoIcon = () => {
    return(
      <IconButton 
        icon="information-outline"
        iconColor='#57BA47'
        size={25}
      />
    )
  }  

  const getJummahData = async () => {
    const { data, error } =  await supabase.from('jummah').select('*').order('id', { ascending : true })
    if( data ){
      setJummah(data)
    }
  }

  

  useEffect(() => {
    getJummahData()
    const channel = supabase.channel("Jummah Data").on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table : "jummah",
      },
      (payload) => getJummahData()
    )
    .subscribe()
  }, [])

  return (
    <>
      <View className="ml-14 mr-14 items-center"style={{height: 350}}>
        <ScrollView className='flex-col pt-3'  contentContainerStyle={{justifyContent: "center",  alignItems : "center", height: "100%" }} >
            <TouchableOpacity style={{height:75, width:250, shadowColor:"black", shadowOffset: { width: 0, height: 0},shadowOpacity: 1, shadowRadius: 8 }} className='justify-center rounded-lg bg-white' onPress={handlePresentModalPress} onPressIn={() => {setClickedState(0)}} >
              <View className='flex-row'>
                <InfoIcon />
                <View className='flex-col items-center justify-center px-9'>
                  <Text>12:15PM</Text>
                  <Text className='font-bold'>Jummah 1</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={{height:75, width:250, shadowColor:"black", shadowOffset: { width: 0, height: 0},shadowOpacity: 0.8, shadowRadius: 5}} className='justify-center rounded-lg  bg-white mt-3' onPress={handlePresentModalPress} onPressIn={() => {setClickedState(1)}}>
            <View className='flex-row'>
                <InfoIcon />
                <View className='flex-col items-center justify-center px-9'>
                  <Text>1:00PM</Text>
                  <Text className='font-bold'>Jummah 2</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={{height:75, width:250, shadowColor:"black", shadowOffset: { width: 0, height: 0},shadowOpacity: 0.8, shadowRadius: 5}} className='justify-center rounded-lg bg-white mt-3' onPress={handlePresentModalPress}  onPressIn={() => {setClickedState(2)}}>
              <View className='flex-row'>
                  <InfoIcon />
                  <View className='flex-col items-center justify-center px-9'>
                    <Text>1:45PM</Text>
                    <Text className='font-bold'>Jummah 3</Text>
                  </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={{height:75, width:250, shadowColor:"black", shadowOffset: { width: 0, height: 0},shadowOpacity: 0.8, shadowRadius: 5}} className='justify-center rounded-lg bg-white mt-3' onPress={handlePresentModalPress} onPressIn={() => {setClickedState(3)}}>
              <View className='flex-row'>
                  <InfoIcon />
                  <View className='flex-col items-center justify-center px-3'>
                    <Text>3:40PM</Text>
                    <Text className='font-bold'>Student Jummah</Text>
                </View>
              </View>
            </TouchableOpacity>
        </ScrollView>
      </View>
    {jummah.length > 0 && <JummahBottomSheet speaker={jummah[clickedState].speaker} topic={jummah[clickedState].topic} desc={jummah[clickedState].desc} jummah_time={jummah[clickedState].prayer_time} ref={bottomSheetRef}/>}
    </>
  )
}
)



/*{<DataTable.Header style={{width: "90%", position:"relative"}}>
<DataTable.Title  textStyle={{fontSize:20, color: "#0D509F"}}>   Salah </DataTable.Title>
<DataTable.Title style={{marginLeft: 50}} textStyle={{fontSize:20, fontWeight: 700, color: "black"}}> Iqamah </DataTable.Title>
</DataTable.Header>
<DataTable.Row style={{ borderBottomWidth:0, alignItems:"center"}}>
<DataTable.Cell textStyle={{color: "#0D509F", fontSize:19, fontWeight: 500}}>Jummah 1 </DataTable.Cell>
<DataTable.Cell style={{marginLeft:"20%"}}   textStyle={{fontWeight: 700, fontSize: 17}}> {jummah.iqamah[0].jummah1} </DataTable.Cell>
</DataTable.Row>}*/



{   /* <DataTable style={ { justifyContent: "center", alignContent:"center", backgroundColor: "white", borderRadius: 20} }>
        <DataTable.Header style={{paddingHorizontal: 20}}>
            <DataTable.Title  textStyle={{fontSize:17, fontWeight: 700, color: "black"}}>12:15PM</DataTable.Title>
            <DataTable.Title textStyle={{fontSize:17, fontWeight: 700, color: "black", marginLeft:10}}>1:00PM</DataTable.Title>
            <DataTable.Title textStyle={{fontSize:17, fontWeight: 700, color: "black", marginLeft:10}}>1:45PM</DataTable.Title>
            <DataTable.Title textStyle={{fontSize:17, fontWeight: 700, color: "black", marginLeft:10,}}>3:40PM</DataTable.Title>
        </DataTable.Header>
        <DataTable.Row style={{borderBottomWidth: 0, paddingHorizontal: 20}}>
            <DataTable.Cell textStyle={{color: "#0D509D", fontWeight:700, fontSize: 15}}>Jummah 1</DataTable.Cell>
            <DataTable.Cell style={{marginLeft:10}} textStyle={{color: "#0D509D", fontWeight:700, fontSize: 15}}>Jummah 2</DataTable.Cell>
            <DataTable.Cell style={{marginLeft:13}} textStyle={{color: "#0D509D", fontWeight:700, fontSize: 15}}>Jummah 3</DataTable.Cell>
            <DataTable.Cell style={{marginLeft:17}} textStyle={{color: "#0D509D", fontWeight:700, fontSize: 15}}>Student</DataTable.Cell>
        </DataTable.Row>
  </DataTable> */}