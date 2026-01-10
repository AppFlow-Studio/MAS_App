import { View, Text, Dimensions, StatusBar, Image, Pressable, StyleSheet, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
import { router, useLocalSearchParams, Link } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { UserPlaylistLectureType, UserPlaylistType, Lectures, EventLectureType } from '@/src/types'
import { Stack } from "expo-router"
import { useAuth } from '@/src/providers/AuthProvider'
import * as Haptics from "expo-haptics"
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import { Icon, ActivityIndicator } from 'react-native-paper'
import Animated, { FadeInDown, useAnimatedRef, useScrollViewOffset } from 'react-native-reanimated'
import { MoreVertical, User } from 'lucide-react-native'

const { width, height: windowHeight } = Dimensions.get("window")

const UserPlayListLectures = () => {
  const { session } = useAuth()
  const { playlist_id } = useLocalSearchParams()
  const [userPlayListInfo, setUserPlaylistInfo] = useState<UserPlaylistType>()
  const [userPlaylistLectures, setPlaylistLectures] = useState<UserPlaylistLectureType[]>([])
  const [lectureDetails, setLectureDetails] = useState<Map<string, any>>(new Map())
  const [imageReady, setImageReady] = useState(false)
  const scrollRef = useAnimatedRef<Animated.ScrollView>()

  const getUserPlaylistInfo = async () => {
    const { data, error } = await supabase.from("user_playlist").select("*").eq("playlist_id", playlist_id).single()
    if (error) {
      console.log(error)
    }
    if (data) {
      setUserPlaylistInfo(data)
    }
  }

  const getUserPlaylistLectures = async () => {
    const { data, error } = await supabase.from("user_playlist_lectures").select("*").eq("playlist_id", playlist_id)
    if (error) {
      console.log(error)
    }
    if (data) {
      setPlaylistLectures(data)
      // Fetch details for each lecture
      data.forEach(lecture => {
        if (lecture.program_lecture_id) {
          fetchProgramLectureDetails(lecture.program_lecture_id, lecture.id)
        } else if (lecture.event_lecture_id) {
          fetchEventLectureDetails(lecture.event_lecture_id, lecture.id)
        } else if (lecture.quran_lecture_id) {
          fetchQuranLectureDetails(lecture.quran_lecture_id, lecture.id)
        }
      })
    }
  }

  const fetchProgramLectureDetails = async (lectureId: string, playlistLectureId: number) => {
    const { data: lecture } = await supabase.from("program_lectures").select("*").eq("lecture_id", lectureId).single()
    if (lecture) {
      let speakerName = 'Unknown Speaker'
      let speakerImg = null
      if (lecture.lecture_speaker && lecture.lecture_speaker.length > 0) {
        const { data: speaker } = await supabase.from("speaker_data").select("speaker_name, speaker_img").eq("speaker_id", lecture.lecture_speaker[0]).single()
        if (speaker) {
          speakerName = speaker.speaker_name
          speakerImg = speaker.speaker_img
        }
      }
      // Get program image
      const { data: program } = await supabase.from("programs").select("program_img").eq("program_id", lecture.lecture_program).single()
      
      setLectureDetails(prev => new Map(prev).set(`program_${playlistLectureId}`, {
        title: lecture.lecture_name,
        speakerName,
        speakerImg,
        programImg: program?.program_img,
        lectureId: lecture.lecture_id,
        type: 'program'
      }))
    }
  }

  const fetchEventLectureDetails = async (lectureId: string, playlistLectureId: number) => {
    const { data: lecture } = await supabase.from("events_lectures").select("*").eq("event_lecture_id", lectureId).single()
    if (lecture) {
      let speakerName = 'Unknown Speaker'
      let speakerImg = null
      if (lecture.event_lecture_speaker && lecture.event_lecture_speaker.length > 0) {
        const { data: speaker } = await supabase.from("speaker_data").select("speaker_name, speaker_img").eq("speaker_id", lecture.event_lecture_speaker[0]).single()
        if (speaker) {
          speakerName = speaker.speaker_name
          speakerImg = speaker.speaker_img
        }
      }
      // Get event image
      const { data: event } = await supabase.from("events").select("event_img").eq("event_id", lecture.event_id).single()
      
      setLectureDetails(prev => new Map(prev).set(`event_${playlistLectureId}`, {
        title: lecture.event_lecture_name,
        speakerName,
        speakerImg,
        programImg: event?.event_img,
        lectureId: lecture.event_lecture_id,
        type: 'event'
      }))
    }
  }

  const fetchQuranLectureDetails = async (lectureId: string, playlistLectureId: number) => {
    const { data: lecture } = await supabase.from("quran_playlist").select("*").eq("id", lectureId).single()
    if (lecture) {
      let speakerName = 'Unknown Reciter'
      let speakerImg = null
      if (lecture.reciter) {
        const { data: speaker } = await supabase.from("speaker_data").select("speaker_name, speaker_img").eq("speaker_id", lecture.reciter).single()
        if (speaker) {
          speakerName = speaker.speaker_name
          speakerImg = speaker.speaker_img
        }
      }
      
      setLectureDetails(prev => new Map(prev).set(`quran_${playlistLectureId}`, {
        title: lecture.surah,
        speakerName,
        speakerImg,
        programImg: speakerImg,
        lectureId: lecture.id,
        youtubeId: lecture.youtube_id,
        reciterId: lecture.reciter,
        type: 'quran'
      }))
    }
  }

  const removeFromPlaylist = async (playlistLectureId: number, type: string, lectureId: string) => {
    let query = supabase.from('user_playlist_lectures').delete().eq('playlist_id', playlist_id).eq('id', playlistLectureId)
    
    const { error } = await query
    if (error) {
      console.log(error)
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
  }

  const HeaderRight = () => {
    const removeFromLibrary = async () => {
      const { error } = await supabase.from("user_playlist").delete().eq("playlist_id", playlist_id)
      if (error) {
        alert(error)
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        router.back()
      }
    }
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Pressable
          onPress={() => router.push('/myPrograms/PlaylistIndex')}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Icon source="plus" color="#000" size={28} />
        </Pressable>
        <Menu>
          <MenuTrigger>
            <Icon source={"dots-horizontal"} color='#000' size={25} />
          </MenuTrigger>
          <MenuOptions customStyles={{ optionsContainer: { width: 200, borderRadius: 8, marginTop: 20, padding: 8 } }}>
            <MenuOption onSelect={removeFromLibrary}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: 'red' }}>Delete From Library</Text>
                <Icon source="delete" color='red' size={15} />
              </View>
            </MenuOption>
          </MenuOptions>
        </Menu>
      </View>
    )
  }

  useEffect(() => {
    getUserPlaylistInfo()
    getUserPlaylistLectures()
    const listenForPlaylistChanges = supabase.channel("Listen for user playlist lecture changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: 'public',
          table: "user_playlist_lectures",
          filter: `playlist_id=eq.${playlist_id}`
        },
        (payload) => getUserPlaylistLectures()
      )
      .subscribe()

    return () => { supabase.removeChannel(listenForPlaylistChanges) }
  }, [])

  const getLectureLink = (lecture: UserPlaylistLectureType, details: any) => {
    if (details?.type === 'program') {
      return `/myPrograms/lectures/${details.lectureId}`
    } else if (details?.type === 'event') {
      return `/myPrograms/eventLectures/${details.lectureId}`
    } else if (details?.type === 'quran') {
      return {
        pathname: '/myPrograms/quran/QuranVideo',
        params: {
          youtube_id: details.youtubeId,
          quran_id: details.lectureId,
          surah: details.title,
          speaker_name: details.speakerName,
          speaker_img: details.speakerImg || '',
          speaker_id: details.reciterId
        }
      }
    }
    return '/'
  }

  const getDetailsKey = (lecture: UserPlaylistLectureType) => {
    if (lecture.program_lecture_id) return `program_${lecture.id}`
    if (lecture.event_lecture_id) return `event_${lecture.id}`
    if (lecture.quran_lecture_id) return `quran_${lecture.id}`
    return ''
  }

  const TrackItem = ({ lecture, index }: { lecture: UserPlaylistLectureType, index: number }) => {
    const detailsKey = getDetailsKey(lecture)
    const details = lectureDetails.get(detailsKey)

    if (!details) {
      return (
        <View style={styles.trackItem}>
          <View style={styles.trackNumberContainer}>
            <Text style={styles.trackNumber}>{index + 1}</Text>
          </View>
          <View style={styles.trackInfo}>
            <ActivityIndicator size="small" color="#064AA3" />
          </View>
        </View>
      )
    }

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
        <Link href={getLectureLink(lecture, details) as any} asChild>
          <Pressable style={styles.trackItem}>
            <View style={styles.trackNumberContainer}>
              <Text style={styles.trackNumber}>{index + 1}</Text>
            </View>
            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle} numberOfLines={1}>{details.title}</Text>
              <View style={styles.speakerRow}>
                {details.speakerImg ? (
                  <Image source={{ uri: details.speakerImg }} style={styles.speakerAvatar} />
                ) : (
                  <View style={styles.speakerAvatarPlaceholder}>
                    <User color="#888" size={12} />
                  </View>
                )}
                <Text style={styles.trackArtist} numberOfLines={1}>{details.speakerName}</Text>
              </View>
            </View>
            <View style={styles.trackActions}>
              <Menu>
                <MenuTrigger>
                  <MoreVertical color="#888" size={20} />
                </MenuTrigger>
                <MenuOptions customStyles={{ optionsContainer: { width: 180, borderRadius: 12, marginTop: 20, padding: 8 } }}>
                  <MenuOption onSelect={() => removeFromPlaylist(lecture.id, details.type, details.lectureId)}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
                      <Text style={{ fontSize: 15, color: 'red' }}>Remove from Playlist</Text>
                      <Icon source="trash-can-outline" color="red" size={18} />
                    </View>
                  </MenuOption>
                </MenuOptions>
              </Menu>
            </View>
          </Pressable>
        </Link>
      </Animated.View>
    )
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "",
          headerStyle: { backgroundColor: 'transparent' },
          headerTransparent: true,
          headerTintColor: '#000',
          headerShadowVisible: false,
          headerRight: () => <HeaderRight />,
        }}
      />
      <StatusBar barStyle="dark-content" />

      {/* Fixed Hero Section - Playlist Image */}
      <View style={styles.heroSection}>
        <View style={styles.playlistImageContainer}>
          {userPlayListInfo?.playlist_img ? (
            <Image
              source={{ uri: userPlayListInfo.playlist_img }}
              style={styles.playlistImage}
              resizeMode="cover"
              onLoad={() => setImageReady(true)}
            />
          ) : (
            <View style={[styles.playlistImage, { backgroundColor: userPlayListInfo?.def_background || '#064AA3', alignItems: 'center', justifyContent: 'center' }]}>
              <Image
                source={require('@/assets/images/MasPlaylistDef.png')}
                resizeMode='contain'
                style={{ width: '80%', height: '80%' }}
              />
            </View>
          )}
        </View>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: 'transparent' }}
      >
        {/* Spacer to account for fixed hero */}
        <View style={{ height: 280, backgroundColor: 'transparent' }} />

        {/* Content Section */}
        <View style={styles.contentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.playlistTitle}>{userPlayListInfo?.playlist_name || 'Playlist'}</Text>
            <Text style={styles.sectionCount}>
              {userPlaylistLectures.length} lecture{userPlaylistLectures.length !== 1 ? 's' : ''}
            </Text>
          </View>

          <View style={styles.trackList}>
            {userPlaylistLectures.length > 0 ? (
              userPlaylistLectures.map((lecture, index) => (
                <TrackItem key={lecture.id || index} lecture={lecture} index={index} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Icon source="playlist-plus" color="#9ca3af" size={40} />
                </View>
                <Text style={styles.emptyTitle}>No Lectures Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Tap the + button to browse and add lectures to your playlist
                </Text>
              </View>
            )}
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 100 }} />
        </View>
      </Animated.ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 0,
    width: '100%',
  },
  playlistImageContainer: {
    width: 200,
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playlistImage: {
    width: '100%',
    height: '100%',
  },
  contentSection: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 24,
    paddingHorizontal: 16,
    minHeight: 500,
    position: 'relative',
    zIndex: 1,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  playlistTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  sectionCount: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  trackList: {
    gap: 8,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  trackNumberContainer: {
    width: 40,
    height: 40,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#064AA3',
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 14,
    color: '#888',
  },
  speakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speakerAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  speakerAvatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  trackActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
})

export default UserPlayListLectures
