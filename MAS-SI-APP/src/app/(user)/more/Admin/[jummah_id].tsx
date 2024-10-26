import { View, Text, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Stack, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { Button, Icon, TextInput } from 'react-native-paper'
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
  } from 'react-native-popup-menu';
import Toast from 'react-native-toast-message'
export default function JummahId() {
  const { jummah_id } = useLocalSearchParams()
  const [ topic, setTopic ] = useState('')
  const [ chosenSpeaker, setSpeaker ] = useState(null)
  const [ desc, setDesc ] = useState('')
  const [ speakers, setSpeakers] = useState<any[]>([])

  const getSpeakers = async () => {
    const { data, error } = await supabase.from('speaker_data').select('speaker_id, speaker_name')
    if( data ){
      setSpeakers(data)
    }
  }
  const getJummahId = async () => {
    const { data, error } = await supabase.from('jummah').select('*').eq('id', jummah_id).single()
    if ( data ){
        setTopic(data.topic)
        setSpeaker(data.speaker)
        setDesc(data.speaker)
    }
  }

  const SpeakersData = (speakers  : any ) => {
    return(
      <Menu>
        <MenuTrigger style={{ marginLeft  : 10 }}>
          { chosenSpeaker ?   <Text className='text-green-600'>Speaker Chosen</Text> : <Text className="text-blue-600">Select Speaker</Text>}
        </MenuTrigger>
        <MenuOptions optionsContainerStyle={{  borderRadius  : 10, paddingHorizontal : 4, paddingVertical : 4}}>
          {
            speakers.speakers && speakers.speakers.length > 0 ? speakers.speakers.map(( speaker ) =>{
              return(
                <MenuOption onSelect={() => setSpeaker(speaker.speaker_id)} key={speaker.speaker_id}>
                  <Text className="text-black ">{speaker.speaker_name} { chosenSpeaker==speaker.speaker_id ? <Icon source={'check'} color="green" size={15}/> : <></>}</Text>
                </MenuOption>
              )
            }) : <></>
          }
        </MenuOptions>
      </Menu>
    )
  }

  const onSubmit = () =>{
    setTopic('')
    setDesc('')
    setSpeaker(null)
    
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
    }
    else{
        Alert.alert('Fill out all forms')
    }
  }


  useEffect(() => {
    getSpeakers()
  }, [])

  return (
    <View className='p-[16] bg-white flex-1'>
        <Stack.Screen options={{ 
            headerStyle : { backgroundColor : 'white'},
            headerTintColor : 'black',
            headerTitle : ''
        }}/>
          <Text className="text-base font-bold mb-1 ml-2">
            Jummah Topic
          </Text>
          <TextInput
            mode="outlined"
            theme={{ roundness: 10 }}
            style={{ width: "100%", height: 45, marginBottom: 10, backgroundColor  : 'white' }}
            activeOutlineColor="#0D509D"
            value={topic}
            onChangeText={setTopic}
            placeholder="Topic Name"
            textColor="black"
          />

          <Text className="text-base font-bold mb-1 mt-2 ml-2">
            Jummah Description
          </Text>
          <TextInput
            mode="outlined"
            theme={{ roundness: 10 }}
            style={{ width: "100%", height: 100, marginBottom: 10, backgroundColor  : 'white' }}
            multiline
            activeOutlineColor="#0D509D"
            value={desc}
            onChangeText={setDesc}
            placeholder="Description"
            textColor="black"
          />

        <Text className="text-base font-bold mb-1 mt-2 ml-2">
            Choose Program Speaker
          </Text>
         { speakers ? <SpeakersData speakers={speakers} /> : <Text>Fetching Speakers</Text>}



         <Button
            mode="contained"
            buttonColor="#57BA47"
            textColor="white"
            theme={{ roundness: 1 }}
            style={{ marginTop : '30%'}}
            onPress={ async () => await onUpdate()}
         >
            Update
         </Button>
    </View>
  )
}