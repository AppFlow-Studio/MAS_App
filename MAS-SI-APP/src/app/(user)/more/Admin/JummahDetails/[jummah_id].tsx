import { View, Text, Alert, Pressable, ScrollView } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { Button, Icon, TextInput } from 'react-native-paper'
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
  } from 'react-native-popup-menu';
import Toast from 'react-native-toast-message'
import Svg, { Circle, Path } from 'react-native-svg'
import AddSpeakerModal from '@/src/components/AdminComponents/AddSpeakerModal'
import SelectSpeakerBottomSheet from '@/src/components/AdminComponents/SelectSpeakerBottomSheet'
export default function JummahId() {
  const { jummah_id } = useLocalSearchParams()
  const [ topic, setTopic ] = useState('')
  const [ chosenSpeaker, setSpeaker ] = useState()
  const [ desc, setDesc ] = useState('')
  const [ speakers, setSpeakers] = useState<any[]>([])
  const [ openAddSpeaker, setOpenAddSpeaker ] = useState(false)
  const [ speakerBottomSheetOpen, setSpeakerBottomSheetOpen ] = useState(false)
  const descriptionRef = useRef<any>(null)
  const getSpeakers = async () => {
    const { data, error } = await supabase.from('speaker_data').select('speaker_id, speaker_name, speaker_img, speaker_creds')
    if( data ){
      setSpeakers(data)
    }
  }
  const getJummahId = async () => {
    const { data, error } = await supabase.from('jummah').select('*').eq('id', jummah_id).single()
    if ( data ){
        setTopic(data.topic)
        setSpeaker(data.speaker)
        setDesc(data.desc)
    }
  }

  const SpeakersData = (speakers  : any ) => {
    const selectedSpeakerName = chosenSpeaker && speakers.speakers ? 
      speakers.speakers.find((s: any) => s.speaker_id === chosenSpeaker)?.speaker_name : null;
      
    return(
      <View className="space-y-3">
        <Pressable
          onPress={() => setSpeakerBottomSheetOpen(true)}
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 flex-row items-center justify-between"
        >
          <View className="flex-1">
            <Text className={`text-base ${chosenSpeaker ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
              {chosenSpeaker ? 'Speaker Selected' : 'Select Speaker'}
            </Text>
            {selectedSpeakerName && (
              <Text className="text-sm text-gray-500 mt-1">{selectedSpeakerName}</Text>
            )}
          </View>
          <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <Path d="M7.5 15L12.5 10L7.5 5" stroke="#6077F5" strokeWidth="2"/>
          </Svg>
        </Pressable>
        
        {!chosenSpeaker && (
          <Pressable 
            className="flex-row items-center justify-center px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl"
            onPress={() => setOpenAddSpeaker(true)}
          >
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
              <Circle cx="12" cy="8" r="4" stroke="#6077F5" strokeLinecap="round"/>
              <Path fillRule="evenodd" clipRule="evenodd" d="M15.2749 16C13.8962 15.5613 12.3886 15.4073 10.9057 15.5538C9.26518 15.7157 7.71374 16.2397 6.4495 17.0712C5.18515 17.9028 4.25277 19.0137 3.80077 20.2789C3.70786 20.5389 3.84336 20.825 4.1034 20.9179C4.36345 21.0108 4.64957 20.8754 4.74247 20.6153C5.10951 19.588 5.88417 18.64 6.99902 17.9067C8.11398 17.1734 9.50702 16.6967 11.0039 16.5489C11.5538 16.4946 12.1066 16.4858 12.6526 16.521C13.008 16.1974 13.4805 16 13.999 16L15.2749 16Z" fill="#6077F5"/>
              <Path d="M18 14L18 22" stroke="#6077F5" strokeLinecap="round"/>
              <Path d="M22 18L14 18" stroke="#6077F5" strokeLinecap="round"/>
            </Svg>
            <Text className="text-blue-600 font-semibold">Add New Speaker</Text>
          </Pressable>
        )}
      </View>
    )
  }

  const onSubmit = () =>{

    
    Toast.show({
        type: "success",
        text1: "Jummah Successfully Updated",
        position: "top",
        topOffset: 50,
        visibilityTime: 2000,
      });
  }

  const onUpdate = async () => {
    if( topic && desc && chosenSpeaker ){
    const { data, error } = await supabase.from('jummah').update({ topic : topic, desc : desc, speaker : chosenSpeaker }).eq('id', jummah_id).select()
    onSubmit()
    router.back()
    }
    else{
        Alert.alert('Fill out all forms')
    }
  }


  useEffect(() => {
    getJummahId()
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
    <View className='flex-1 bg-gray-50'>
       <Stack.Screen
        options={{
          title: `${jummah_id == '1' ? 'First' : jummah_id == '2' ? 'Second' : jummah_id == '3' ? 'Third' : 'Student'} Jummah`,
          headerStyle: { backgroundColor: "#F9FAFB" },
          headerTitleStyle: { 
            fontSize: 22,
            fontWeight: '600',
            color: '#1F2937'
          },
          headerTintColor: '#4A5568',
          headerShadowVisible: false,
        }}
      />
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm'>
          <Text className="text-base font-bold mb-3 text-gray-800">
            Select Who Will be the Khateeb
          </Text>
          { speakers ? <SpeakersData speakers={speakers} /> : <Text className="text-gray-500">Fetching Speakers...</Text>}
        </View>

        <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm'>
          <Text className="text-base font-bold mb-3 text-gray-800">
            Jummah Title
          </Text>
          <TextInput
            mode="outlined"
            theme={{ roundness: 12 }}
            style={{ width: "100%", height: 50, backgroundColor: 'white' }}
            activeOutlineColor="#6077F5"
            outlineColor="#E2E8F0"
            value={topic}
            onChangeText={setTopic}
            placeholder="Enter Jummah topic..."
            textColor="black"
          />
        </View>

        <View className='bg-white rounded-2xl p-4 mb-4 shadow-sm'>
          <Text className="text-base font-bold mb-3 text-gray-800">
            Jummah Description
          </Text>
          <TextInput
            mode="outlined"
            theme={{ roundness: 12 }}
            ref={descriptionRef}
            style={{ width: "100%", height: 120, backgroundColor: 'white' }}
            multiline
            activeOutlineColor="#6077F5"
            outlineColor="#E2E8F0"
            value={desc}
            onChangeText={setDesc}
            placeholder="Enter description..."
            textColor="black"
            returnKeyType="done"
            onKeyPress={(e) => {
              if (e.nativeEvent.key == 'Enter' ){ e.preventDefault(); (descriptionRef.current as any)?.blur()  }
            }}
          />
        </View>

        <Button
          mode="contained"
          buttonColor="#6077F5"
          textColor="white"
          theme={{ roundness: 12 }}
          style={{ marginTop: 16, marginBottom: 24, height: 50, justifyContent: 'center' }}
          labelStyle={{ fontSize: 16, fontWeight: '600' }}
          onPress={async () => await onUpdate()}
        >
          Update
        </Button>
      </ScrollView>
         <AddSpeakerModal isOpen={openAddSpeaker} setIsOpen={setOpenAddSpeaker}/>
         <SelectSpeakerBottomSheet
          isOpen={speakerBottomSheetOpen}
          setIsOpen={setSpeakerBottomSheetOpen}
          speakers={speakers}
          selectedSpeakers={chosenSpeaker ? [chosenSpeaker] : []}
          onSelectSpeaker={(id) => setSpeaker(id)}
          multiSelect={false}
          title="Select Khateeb"
        />
    </View>
  )
}