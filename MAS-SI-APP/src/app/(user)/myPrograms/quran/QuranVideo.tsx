import { View, Text, StatusBar, useWindowDimensions, Image, ScrollView } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { Stack, useLocalSearchParams } from 'expo-router'
import YoutubePlayer from "react-native-youtube-iframe"
import { Icon } from 'react-native-paper'
import { supabase } from '@/src/lib/supabase'

const QuranRecitation = () => {
   const { quran_id, youtube_id, surah, speaker_name, speaker_id, speaker_img  } = useLocalSearchParams()
   const layoutHeight = useWindowDimensions().height
   const layout  = useWindowDimensions().width
   const [ playing, setPlaying ] = useState(false)
   const [speakerCreds, setSpeakerCreds ] = useState<string[]>()
   const onStateChange = useCallback((state : any) => {
    if (state === "ended") {
      setPlaying(false);
    }
  }, []);
   const getCreds = async ( ) => {
      const { data , error } = await supabase.from('speaker_data').select('speaker_creds').eq('speaker_id', speaker_id).single()
      if( data?.speaker_creds ){
          setSpeakerCreds(data.speaker_creds)
      }
    }

  useEffect(() => {
    getCreds()
  }, [])
  return (
     <View className='flex-1 bg-[#ededed]'>
        <Stack.Screen options={{ title : surah as string , headerTintColor : 'black', headerStyle : {backgroundColor : 'white',}}} />
        <StatusBar barStyle={'dark-content'}/>
        <YoutubePlayer 
          height={layoutHeight / 4}
          width={layout * 0.98}
          webViewStyle={{ borderRadius : 20, marginLeft : '2%', marginTop : 8, backgroundColor : "#ededed" }}
          play={playing}
          videoId={youtube_id as string}
          onChangeState={onStateChange}
        />  
         <View className='border-2 border-gray-400 border-solid rounded-[15px] p-2 my-1 mt-3 w-[95%] self-center' style={{ height : layoutHeight / 1.9 }}>
            <View className=' flex-row'>
                <Image source={{uri : speaker_img}} style={{width: 110, height: 110, borderRadius: 50}} resizeMode='cover'/>
                <View className='flex-col px-1'>
                  <Text className='text-xl font-bold'>Name: </Text>
                  <Text className='pt-2 font-semibold' numberOfLines={1}> {speaker_name} </Text>
                </View>
            </View>
    
          <ScrollView className='flex-col py-3'>
            { speaker_name == "MAS" ? <Text className='font-bold'>Impact </Text> :  <Text className='font-bold mb-4'>Credentials: </Text> } 
            { 
            speakerCreds?.map( (cred, i) => {
              return <Text key={i}> <Icon source="cards-diamond-outline"  size={15} color='black'/> {cred} {'\n'}</Text>
            })}
          </ScrollView>
          </View>
      </View>
  )
}

export default QuranRecitation