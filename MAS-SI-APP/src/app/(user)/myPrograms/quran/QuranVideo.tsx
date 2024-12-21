import { View, Text, StatusBar, useWindowDimensions } from 'react-native'
import React, { useCallback, useState } from 'react'
import { Stack, useLocalSearchParams } from 'expo-router'
import YoutubePlayer from "react-native-youtube-iframe"

const QuranRecitation = () => {
   const { quran_id, youtube_id, surah } = useLocalSearchParams()
   const layoutHeight = useWindowDimensions().height
   const layout  = useWindowDimensions().width
   const [ playing, setPlaying ] = useState(false)
   const onStateChange = useCallback((state : any) => {
    if (state === "ended") {
      setPlaying(false);
    }
  }, []);
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
      </View>
  )
}

export default QuranRecitation