import { View, Text , useWindowDimensions, ScrollView} from 'react-native'
import { TabView, SceneMap } from 'react-native-tab-view';
import React, { useState } from 'react'
import { Divider } from 'react-native-paper';
import RenderBookmarkAyahs from '@/src/components/PrayerTimesComponets/RenderBookmarkAyahs';
import RenderBookmarkSurahs from '@/src/components/PrayerTimesComponets/RenderBookmarkSurahs';
import { useBookmarkedSurahs, useBookmarkedAyahs } from '@/src/hooks/useBookmarkedQuran';
type bookMarkedSurahsProp = {
  surah_number : number
}
type bookmarkedAyahsProp = {
  surah_number : number,
  ayah_number : number
}

const BookmarkSurah = () => {
  const { data: bookmarkedSurahs = [] } = useBookmarkedSurahs()

  if (!bookmarkedSurahs || bookmarkedSurahs.length === 0) {
    return <></>
  }

  return (
    <ScrollView className='bg-white flex-1'>
      {bookmarkedSurahs.map((item, index) => {
        return (
          <View key={index} style={{ justifyContent: "center", alignItems: "center" }}>
            <RenderBookmarkSurahs surah_number={item.surah_number} />
            <Divider />
          </View>
        )
      })}
    </ScrollView>
  )
}

const BookmarkAyah = () => {
  const { data: bookmarkedAyahs = [] } = useBookmarkedAyahs()

  if (!bookmarkedAyahs || bookmarkedAyahs.length === 0) {
    return <></>
  }

  return (
    <ScrollView className='bg-white flex-1'>
      {bookmarkedAyahs.map((item, index) => {
        return (
          <View key={index} style={{ justifyContent: "center", alignItems: "center" }}>
            <RenderBookmarkAyahs surah_number={item.surah_number} ayah_number={item.ayah_number}/>
            <Divider />
          </View>
        )
      })}
    </ScrollView>
  )
}

const renderScene = SceneMap({
  first: BookmarkAyah,
  second: BookmarkSurah,
});
const BookmarkQuran = () => {
  const layout = useWindowDimensions();

  
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'first', title: 'Ayah' },
    { key: 'second', title: 'Surah' },
  ]);

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: layout.width }}
    />
  );
}

export default BookmarkQuran