import { View, Text, Pressable, FlatList, Image, TouchableOpacity, Dimensions, Easing, Alert, StatusBar, Linking, Platform } from 'react-native'
import React, { useEffect, useState, useRef, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, Stack, useRouter, Link, useNavigation } from 'expo-router';
import LecturesListLecture from '@/src/components/LectureListLecture';
import { Divider, Portal, Modal, IconButton, Icon, Button, Badge } from 'react-native-paper';
import { Lectures, SheikDataType, Program } from '@/src/types';
import { ScrollView } from 'react-native-gesture-handler';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import Animated,{ FadeInLeft, interpolate, useAnimatedRef, useAnimatedStyle, useScrollViewOffset, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { UserPlaylistType } from '@/src/types';
import RenderAddToUserPlaylistsListProgram from '@/src/components/RenderAddToUserPlaylistsList';
import { withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import CreatePlaylistBottomSheet from '@/src/components/UserProgramComponets/CreatePlaylistBottomSheet';
import * as Haptics from "expo-haptics"
import LottieView from 'lottie-react-native';
import Toast from 'react-native-toast-message';
import { isBefore, format } from 'date-fns';
import { FlyerSkeleton } from '@/src/components/FlyerSkeleton';
import YoutubePlayer from "react-native-youtube-iframe";
function setTimeToCurrentDate(timeString : string ) {

  // Split the time string into hours, minutes, and seconds
  const [hours, minutes, seconds] = timeString.split(':').map(Number);

  // Create a new Date object with the current date
  const timestampWithTimeZone = new Date();

  // Set the time with setHours (adjust based on local timezone or UTC as needed)
  timestampWithTimeZone.setHours(hours , minutes, seconds, 0); // No milliseconds

  // Convert to ISO format with timezone (to ensure it's interpreted as a TIMESTAMPTZ)
  const timestampISO = timestampWithTimeZone // This gives a full timestamp with timezone in UTC

  return timestampISO
}
const schedule_notification = async ( user_id : string, push_notification_token : string , message : string, notification_type : string, program_event_name : string, notification_time : Date ) => {
  console.log(program_event_name)
  const { error } = await supabase.from('program_notification_schedule').insert({ user_id : user_id, push_notification_token : push_notification_token, message : message, notification_type : notification_type, program_event_name : program_event_name, notification_time : notification_time, title : program_event_name})
  if( error ){
    console.log(error)
  }
}
const ProgramLectures = () => {
  const { session } = useAuth()
  const router = useRouter()
  const { programId } = useLocalSearchParams();
  const [ lectures, setLectures ] = useState<Lectures[] | null>(null)
  const [ program, setProgram ] = useState<Program>()
  const [ visible, setVisible ] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  const [ programInNotfications, setProgramInNotifications ] = useState(false)
  const [ programInPrograms, setProgramInPrograms ] = useState(false)
  const [ addToPlaylistVisible, setAddToPlaylistVisible ] = useState(false)
  const [ lectureToBeAddedToPlaylist, setLectureToBeAddedToPlaylist ] = useState<string>("")
  const [ playlistAddingTo, setPlaylistAddingTo ] = useState<string[]>([])
  const [ speakerData, setSpeakerData ] = useState<SheikDataType[]>()
  const [ usersPlaylists, setUsersPlaylists ] = useState<UserPlaylistType[]>()
  const [ speakerString, setSpeakerString ] = useState('')
  const [ selectedLecture, setSelectedLecture ] = useState<Lectures | null>(null)
  const [ playing, setPlaying ] = useState(false)
  const [ watchedLectures, setWatchedLectures ] = useState<Set<string>>(new Set())
  const [ startedLectures, setStartedLectures ] = useState<Set<string>>(new Set())
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const handlePresentModalPress = () => bottomSheetRef.current?.present();
  const hideAddToPlaylist = () => setAddToPlaylistVisible(false)
  const navigation = useNavigation<any>()
  const Tab = useBottomTabBarHeight()
  const { width, height } = Dimensions.get("window")
  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const scrollOffset = useScrollViewOffset(scrollRef)
  const notifade = useSharedValue(1)

  const imageAnimatedStyle = useAnimatedStyle(() => {
    return{
      // transform: [
      //   {
      //     translateY : interpolate(
      //     scrollOffset.value,
      //     [-250, 0, 250 ],
      //     [-250/2, 0, 250 * 0.75]
      //     )
      //   },
      //   {
      //     scale: interpolate(scrollOffset.value, [-250, 0, 250], [2, 1, 1])
      //   }
      // ]
    }
  })
 async function getProgram(){
  const { data, error } = await supabase.from("programs").select("*").eq("program_id", programId).single()

  if( error ) {
    alert(error)
  }
  if ( data ) {
    const { data : checkIfExists , error } = await supabase.from("added_notifications_programs").select("*").eq("user_id", session?.user.id).eq("program_id", programId).single()
    const { data : programExists , error : programError } = await supabase.from('added_programs').select('*').eq('user_id', session?.user.id).eq('program_id', programId).single()
    const speakers : any[] = []
    let speaker_string : string[] = data.program_speaker.map(() => {return ''})
    await Promise.all(
      data.program_speaker.map( async ( speaker_id : string, index : number) => {
        const {data : speakerInfo, error : speakerInfoError } = await supabase.from('speaker_data').select('*').eq('speaker_id', speaker_id).single()
        if ( speakerInfo ){
          if (index == data.program_speaker.length - 1 ){
            speaker_string[index]=speakerInfo.speaker_name
          }
          else {
            speaker_string[index]= speakerInfo.speaker_name + ' & '
          }
          speakers.push(speakerInfo)
        }
      })
    )
    setSpeakerData(speakers)
    setSpeakerString(speaker_string.join(''))
    if( checkIfExists ){
      setProgramInNotifications(true)
    }
    if( programExists ){
      setProgramInPrograms(true)
    }
    setProgram(data)
  }
 }
 async function getProgramLectures() {
  const { data, error } = await supabase.from("program_lectures").select("*").eq("lecture_program", programId).order('lecture_date', { ascending : false })
  if( error ) {
    alert(error)
  }
  if ( data ) {
    setLectures(data)
    // Check watched status after lectures are loaded
    checkWatchedStatus(data)
    
    // Count lectures with YouTube links
    const lecturesWithLinks = data.filter(lecture => lecture.lecture_link && lecture.lecture_link.trim() !== '' && lecture.lecture_link !== 'N/A')
    console.log(`\n=== Lecture YouTube Links Report ===`)
    console.log(`Total lectures: ${data.length}`)
    console.log(`Lectures with YouTube links: ${lecturesWithLinks.length}`)
    console.log(`Lectures without YouTube links: ${data.length - lecturesWithLinks.length}`)
    console.log(`Percentage with links: ${data.length > 0 ? ((lecturesWithLinks.length / data.length) * 100).toFixed(1) : 0}%`)
  }
}

  const checkWatchedStatus = async (lecturesData: Lectures[]) => {
    try {
      const watchedKeys = lecturesData.map(lecture => `watched_lecture_${lecture.lecture_id}`);
      const startedKeys = lecturesData.map(lecture => `started_lecture_${lecture.lecture_id}`);
      const allKeys = [...watchedKeys, ...startedKeys];
      const allValues = await AsyncStorage.multiGet(allKeys);
      const watched = new Set<string>();
      const started = new Set<string>();
      allValues.forEach(([key, value]) => {
        if (value === 'true') {
          if (key.startsWith('watched_lecture_')) {
            const lectureId = key.replace('watched_lecture_', '');
            watched.add(lectureId);
          } else if (key.startsWith('started_lecture_')) {
            const lectureId = key.replace('started_lecture_', '');
            // Only add to started if not already watched
            if (!watched.has(lectureId)) {
              started.add(lectureId);
            }
          }
        }
      });
      setWatchedLectures(watched);
      setStartedLectures(started);
    } catch (error) {
      console.log('Error checking watched status:', error);
    }
  };
async function getUserPlaylists(){
  const { data, error } = await supabase.from("user_playlist").select("*").eq("user_id", session?.user.id)
  if( error ){
    console.log( error )
  }
  if( data ){
    setUsersPlaylists(data)
  }
}
  const fadeOutNotification = useAnimatedStyle(() => ({
  opacity : notifade.value
}))

  const getVideoIdFromUrl = (url: string) => {
    if (!url) return null
    if (!url.includes('/') && !url.includes('?')) {
      return url
    }
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    return match ? match[1] : url
  }

  const onStateChange = useCallback((state: string) => {
    if (state === "ended") {
      setPlaying(false);
      // Mark lecture as watched when video ends
      if (selectedLecture) {
        markAsWatched(selectedLecture.lecture_id);
      }
    } else if (state === "playing" && selectedLecture) {
      // Mark lecture as started when video starts playing
      markAsStarted(selectedLecture.lecture_id);
    }
  }, [selectedLecture]);

  const markAsWatched = async (lectureId: string) => {
    try {
      const watchedKey = `watched_lecture_${lectureId}`;
      await AsyncStorage.setItem(watchedKey, 'true');
      setWatchedLectures(prev => new Set([...prev, lectureId]));
      // Remove from started if it's now watched
      setStartedLectures(prev => {
        const newSet = new Set(prev);
        newSet.delete(lectureId);
        return newSet;
      });
    } catch (error) {
      console.log('Error marking lecture as watched:', error);
    }
  };

  const markAsStarted = async (lectureId: string) => {
    try {
      // Only mark as started if not already watched
      if (!watchedLectures.has(lectureId)) {
        const startedKey = `started_lecture_${lectureId}`;
        await AsyncStorage.setItem(startedKey, 'true');
        setStartedLectures(prev => new Set([...prev, lectureId]));
      }
    } catch (error) {
      console.log('Error marking lecture as started:', error);
    }
  };
  useEffect(() => {
    getProgram()
    getProgramLectures()
    getUserPlaylists()
    notifade.value = withTiming(0, {duration : 6000})

    const listenForUserPlaylistChanges = supabase
    .channel('listen for user playlist adds')
    .on(
     'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: "user_playlist",
      filter: `user_id=eq.${session?.user.id}`
    },
    (payload) => getUserPlaylists()
    )
    .subscribe()

    return () => { supabase.removeChannel( listenForUserPlaylistChanges )}
  }, [])

  useEffect(() => {
    setPlaylistAddingTo([])
  }, [!addToPlaylistVisible])

  const GetSheikData =  () => {
    return( 
      <View className='flex-1'>
        
        { 
          speakerData?.map((speakerData) => (
          <View className='border-2 border-gray-400 border-solid rounded-[25px] p-2 my-1'>
            <Animated.View className=' flex-row'>
                <Image source={speakerData?.speaker_img ? { uri : speakerData?.speaker_img }  : require("@/assets/images/MASHomeLogo.png")} style={{width: 110, height: 110, borderRadius: 50}} resizeMode='cover'/>
            <View className='flex-col px-1'>
              <Text className='text-xl font-bold'>Name: </Text>
              <Text className='pt-2 font-semibold' numberOfLines={1}> {speakerData?.speaker_name} </Text>
            </View>
          </Animated.View>
    
          <View className='flex-col py-3'>
            { speakerData?.speaker_name == "MAS" ? <Text className='font-bold'>Impact </Text> :  <Text className='font-bold'>Credentials: </Text> } 
            { speakerData?.speaker_creds.map( (cred, i) => {
              return <Text key={i}> <Icon source="cards-diamond-outline"  size={15} color='black'/> {cred} {'\n'}</Text>
            })}
          </View>
          </View>
          ))
        }
      </View>
    )
  } 

  const NotificationBell = () => {
  const addedToNoti = () => {
    const goToProgram = () => {
      navigation.navigate('myPrograms', { screen : 'notifications/ClassesAndLectures/[program_id]', params : { program_id : programId}, initial: false  })
    }
    Toast.show({
      type : 'addProgramToNotificationsToast',
      props : { props : program, onPress : goToProgram },
      position : 'top',
      topOffset : 50,
    })
  }
  const addToProgramsNoti = () => {
    const goToProgram = () => {
      navigation.navigate('myPrograms')
    }
    Toast.show({
      type : 'ProgramAddedToPrograms',
      props : { props : program, onPress : goToProgram },
      position : 'top',
      topOffset : 50,
    })
  }
   const handlePress = async () => {
    if( programInNotfications ) {
      const { error } = await supabase.from("added_notifications_programs").delete().eq("user_id" , session?.user.id).eq("program_id", programId)
      const { error : settingsError } = await supabase.from('program_notifications_settings').delete().eq('user_id', session?.user.id).eq("program_id", programId)
      const { error : ScheduleNotisError } = await supabase.from('program_notification_schedule').delete().eq('user_id', session?.user.id).eq("program_event_name", program?.program_name)
      setProgramInNotifications(false)
    }
    else{
      const { error } = await supabase.from("added_notifications_programs").insert({user_id :session?.user.id, program_id : programId, has_lectures : program?.has_lectures})
      const TodaysDate = new Date()
      const DaysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const programDays = program?.program_days
      const ProgramStartTime = setTimeToCurrentDate(program?.program_start_time!)

      if ( programDays && isBefore(TodaysDate, ProgramStartTime) ){
      await Promise.all(
        programDays?.map( async (day) => {
          const { data : user_push_token } = await supabase.from('profiles').select('push_notification_token').eq('id', session?.user.id).single()
          if( (TodaysDate.getDay() == DaysOfWeek.indexOf(day)) && (user_push_token?.push_notification_token) ){
            await schedule_notification(session?.user.id!, user_push_token?.push_notification_token,  `${program.program_name} is Starting Now!`, 'When Program Starts', program.program_name, ProgramStartTime)
          }
        })
      )
    }
      

      if( error ){
        console.log(error)
      }
      setProgramInNotifications(true)
      addedToNoti()
    }
    Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    )
  }
  const addToPrograms = async () => {
    if( programInPrograms ){
      const { error } = await supabase.from("added_programs").delete().eq("user_id" , session?.user.id).eq("program_id", programId)
      setProgramInPrograms(false)
    }
    else{
      const { error } = await supabase.from("added_programs").insert({user_id :session?.user.id, program_id : programId})
      if( error ){
        console.log(error)
      }
      setProgramInPrograms(true)
      addToProgramsNoti()
    }
    Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    )
  }
 
  
   return(
    <View className='flex-row items-center gap-x-3'>
      <BlurView intensity={20} tint="dark" style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(128, 128, 128, 0.2)' }}>
        <Pressable onPress={handlePress} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
          {programInNotfications ?  <Icon source={"bell-check"} color='white' size={20}/> : <Icon source={"bell-outline"} color='white' size={20}/> }
        </Pressable>
      </BlurView>
      <BlurView intensity={20} tint="dark" style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(128, 128, 128, 0.2)' }}>
        <Pressable onPress={addToPrograms} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
          { programInPrograms ?  <Icon source={'minus-circle-outline'} color='white' size={20}/> : <Icon source={"plus-circle-outline"} color='white' size={20}/>}
        </Pressable>
      </BlurView>
    </View>
   )
  }

  const AddToProgramsButton = () => {
    const addToProgramsNoti = () => {
      const goToProgram = () => {
        navigation.navigate('myPrograms')
      }
      Toast.show({
        type : 'ProgramAddedToPrograms',
        props : { props : program, onPress : goToProgram },
        position : 'top',
        topOffset : 50,
      })
    }
    const addToPrograms = async () => {
      if( programInPrograms ){
        const { error } = await supabase.from("added_programs").delete().eq("user_id" , session?.user.id).eq("program_id", programId)
        setProgramInPrograms(false)
      }
      else{
        const { error } = await supabase.from("added_programs").insert({user_id :session?.user.id, program_id : programId})
        if( error ){
          console.log(error)
        }
        setProgramInPrograms(true)
        addToProgramsNoti()
      }
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      )
    }
    return(
      <BlurView intensity={20} tint="dark" style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(128, 128, 128, 0.2)' }}>
        <Pressable onPress={addToPrograms} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
          { programInPrograms ?  <Icon source={'minus-circle'} color='white' size={20}/> : <Icon source={"plus-circle-outline"} color='white' size={20}/>}
        </Pressable>
      </BlurView>
    )
  }
  
  const onDonePress = async () => {
    if( playlistAddingTo && playlistAddingTo.length > 0 ){
      playlistAddingTo.map( async (item) => {
          const { data : checkDupe , error : checkDupeError } = await supabase.from("user_playlist_lectures").select("*").eq("user_id ", session?.user.id).eq( "playlist_id" ,item).eq( "program_lecture_id", lectureToBeAddedToPlaylist).single()  
          console.log(checkDupe, checkDupeError)
            if( checkDupe ){
              const { data : dupePlaylistName, error  } = await supabase.from("user_playlist").select("playlist_name").eq("playlist_id", checkDupe.playlist_id).single()
              Alert.alert(`Lecture already found in ${dupePlaylistName?.playlist_name}`, "", [
                {
                  text: "Cancel",
                  onPress : () => setAddToPlaylistVisible(false)
                },
                {
                  text : "Continue",
                  onPress : async () => await supabase.from("user_playlist_lectures").insert({user_id : session?.user.id, playlist_id : item, program_lecture_id : lectureToBeAddedToPlaylist })
                }
              ]
            )
            }
            else{
              const { error } = await supabase.from("user_playlist_lectures").insert({user_id : session?.user.id, playlist_id : item, program_lecture_id : lectureToBeAddedToPlaylist })
              const getPlaylistAddedTo = usersPlaylists?.filter(playlist => playlist.playlist_id == playlistAddingTo[0])
              const goToPlaylist = () => { navigation.navigate('myPrograms', { screen : 'playlists/[playlist_id]', params: { playlist_id : playlistAddingTo }}) }
              if( getPlaylistAddedTo && getPlaylistAddedTo[0] ){
                Toast.show({
                  type : 'LectureAddedToPlaylist',
                  props: { props : getPlaylistAddedTo[0], onPress : goToPlaylist},
                  position : 'bottom',
                  bottomOffset : Tab * 2
                })
              }
          }})
        setAddToPlaylistVisible(false)
      }
    else{
      setAddToPlaylistVisible(false)
    }
  }
  useEffect(() => {
    onDonePress()
    setAddToPlaylistVisible(false)
  }, [playlistAddingTo.length > 0])
  const currDate = new Date().toISOString()
  return (
    <View className='flex-1' style={{flexGrow: 1, backgroundColor: '#0A1628'}}>
     <Stack.Screen options={ { 
       headerShown: false
     } } />
     <StatusBar barStyle={"light-content"}/>
     {/* Custom Header with Liquid Glass Buttons */}
     <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, paddingTop: 50, paddingHorizontal: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
       <BlurView intensity={20} tint="dark" style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(128, 128, 128, 0.2)' }}>
         <Pressable onPress={() => navigation.goBack()} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
           <Icon source="chevron-left" size={20} color="white" />
         </Pressable>
       </BlurView>
       <View style={{ flexDirection: 'row', gap: 10 }}>
         {isBefore(currDate, program?.program_end_date!) ? <NotificationBell /> : <AddToProgramsButton />}
       </View>
     </View>
      <Animated.ScrollView ref={scrollRef}  scrollEventThrottle={16} contentContainerStyle={{justifyContent: "flex-start", alignItems: "stretch", backgroundColor: '#0A1628' }} style={{ backgroundColor: '#0A1628' }}>
          
          <View className=' relative' style={{width: '100%', height: height * 0.5, borderRadius: 0, overflow: 'hidden', marginTop: 100, alignSelf: 'stretch', backgroundColor: '#0A1628' }}>
            {selectedLecture ? (
              <YoutubePlayer 
                height={height * 0.5}
                width={width}
                play={playing}
                videoId={selectedLecture.lecture_link ? getVideoIdFromUrl(selectedLecture.lecture_link) : undefined}
                onChangeState={onStateChange}
              />
            ) : (
              <>
                {/* Show the skeleton until the image is loaded or errored */}
                { !imageReady && 
                  <FlyerSkeleton 
                    width={width} 
                    height={height * 0.5} 
                    style={{ position: 'absolute', top: 0, zIndex: 2 }} 
                  />
                }
                <Animated.Image 
                  source={
                    // If there's an error or no URL, use the fallback image
                    hasError || !program?.program_img 
                      ? require("@/assets/images/MASHomeLogo.png")
                      : { uri: program.program_img }
                  }
                  style={[
                    { width: '100%', height: '100%', borderRadius: 0 },
                    imageAnimatedStyle
                  ]}
                  resizeMode="cover"
                  onLoad={() => setImageReady(true)}
                  onError={() => {
                    // Mark that an error occurred and hide the skeleton
                    setHasError(true);
                    setImageReady(true);
                  }}
                />
              </>
            )}
          </View>
       
          <View className='w-[100%]' style={{paddingBottom : Tab * 3, backgroundColor: '#0A1628'}}>
            <Text className='text-center mt-4 text-2xl text-white font-bold'>{program?.program_name}</Text>
            <Pressable onPress={showModal}>
              <Text className='text-center mt-2 text-[#60A5FA] w-[60%] self-center font-semibold' numberOfLines={1}>{speakerString}</Text>
            </Pressable>

            {/* About This Series Section */}
            {program?.program_desc && (
              <View className='px-4 mt-6 mb-4'>
                <Text className='text-2xl font-bold text-white mb-3'>About This Series</Text>
                <Text className='text-base text-gray-300 leading-6'>{program.program_desc}</Text>
              </View>
            )}

            {/* Classes Section */}
            {(program?.has_lectures || (lectures && lectures?.length >= 1)) && lectures && lectures.length > 0 && (
              <View className='px-4 mt-4 mb-6'>
                <Text className='text-2xl font-bold text-white mb-4'>Classes</Text>
                {lectures.map((lecture, idx) => {
                  const formatLectureDate = (dateString: string) => {
                    try {
                      const date = new Date(dateString)
                      return format(date, 'MMM d, yyyy')
                    } catch {
                      return dateString
                    }
                  }

                  const videoId = lecture.lecture_link ? getVideoIdFromUrl(lecture.lecture_link) : null
                  const isSelected = selectedLecture?.lecture_id === lecture.lecture_id
                  
                  return (
                    <Pressable
                      key={lecture.lecture_id}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedLecture(null)
                          setPlaying(false)
                        } else {
                          setSelectedLecture(lecture)
                          setPlaying(true)
                          // Scroll to top to show the video player
                          scrollRef.current?.scrollTo({ y: 0, animated: true })
                        }
                      }}
                      className='mb-3 rounded-xl overflow-hidden'
                      style={{
                        backgroundColor: isSelected ? '#2D4A6E' : '#1A2332',
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        elevation: 3,
                        borderWidth: isSelected ? 2 : 0,
                        borderColor: '#60A5FA',
                      }}
                    >
                      <View className='flex-row'>
                        {/* Thumbnail */}
                        <View 
                          className='bg-gray-700'
                          style={{ 
                            width: 140, 
                            height: 105,
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                        >
                          {videoId ? (
                            <Image
                              source={{ uri: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` }}
                              style={{ width: 140, height: 105 }}
                              resizeMode="cover"
                            />
                          ) : (
                            <Icon source="play-circle-outline" size={40} color="#9CA3AF" />
                          )}
                          {!isSelected && (
                            <View className='absolute inset-0 bg-black/30 items-center justify-center'>
                              <Icon source="play-circle" size={30} color="white" />
                            </View>
                          )}
                          {isSelected && (
                            <View className='absolute top-2 left-2 bg-blue-500 px-2 py-1 rounded'>
                              <Text className='text-white text-xs font-bold'>NOW PLAYING</Text>
                            </View>
                          )}
                          {watchedLectures.has(lecture.lecture_id) && !isSelected && (
                            <View className='absolute top-2 right-2 bg-green-500 px-2 py-1 rounded-full'>
                              <Icon source="check" size={14} color="white" />
                            </View>
                          )}
                          {startedLectures.has(lecture.lecture_id) && !watchedLectures.has(lecture.lecture_id) && !isSelected && (
                            <View className='absolute top-2 right-2 bg-blue-500 px-2 py-1 rounded-full'>
                              <Icon source="play" size={14} color="white" />
                            </View>
                          )}
                        </View>

                        {/* Content */}
                        <View className='flex-1 p-3 justify-between'>
                          <View>
                            <Text className='text-base font-semibold text-white mb-1' numberOfLines={2}>
                              {lecture.lecture_name || `${lectures.length - idx} Class ${lectures.length - idx}`}
                            </Text>
                            <Text className='text-sm text-gray-400 mt-1'>
                              {lecture.lecture_date ? formatLectureDate(lecture.lecture_date) : ''}
                            </Text>
                            {watchedLectures.has(lecture.lecture_id) ? (
                              <View className='flex-row items-center mt-2'>
                                <Icon source="check-circle" size={16} color="#10B981" />
                                <Text className='text-green-500 text-sm font-semibold ml-1'>Watched</Text>
                              </View>
                            ) : startedLectures.has(lecture.lecture_id) ? (
                              <View className='flex-row items-center mt-2'>
                                <Icon source="play-circle" size={16} color="#60A5FA" />
                                <Text className='text-blue-400 text-sm font-semibold ml-1'>Continue</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  )
                })}
              </View>
            )}

            {/* Description for non-lecture programs */}
            {program?.has_lectures == false && program?.program_desc && (
              <View className='px-4 mt-4 mb-6'>
                <Text className='text-2xl font-bold text-white mb-3'>Description</Text>
                <View className='px-4 py-3 rounded-xl' style={{
                  backgroundColor: '#1A2332',
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 3,
                }}>
                  <Text className='text-base text-gray-300 leading-6'>{program.program_desc}</Text>
                </View>
              </View>
            )}
                <View className='items-center justify-center'>
                    {
                      program?.program_is_paid ? 
                      (
                        <Pressable onPress={() => {
                        Linking.canOpenURL(program.paid_link).then(() => {
                        Linking.openURL(program.paid_link);
                        });
                        }}>
                        <Button icon={() => <Icon source={"cart-variant"} size={20} color='white'/>} mode='elevated' style={{ backgroundColor : "#57BA47", marginTop : 10, width: "90%"}}><Text className='text-white'>Sign Up Now</Text></Button>
                        </Pressable>
                      ) : <></>
                    }
                </View>
          </View>
          
          <Portal>
            <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={{backgroundColor: 'white', padding: 20, minHeight : 400, maxHeight: "70%", width: "95%", borderRadius: 35, alignSelf: "center"}} >
              <ScrollView className='flex-1'
              showsVerticalScrollIndicator={true}
              
              >
                <GetSheikData />
              </ScrollView>
            </Modal>
          </Portal>

          <Portal>
            <Modal visible={addToPlaylistVisible} onDismiss={hideAddToPlaylist} contentContainerStyle={{backgroundColor: 'white', padding: 20, height: "50%", width: "90%", borderRadius: 35, alignSelf: "center"}} >
              <View className=' h-[100%]'>
                  <View className='flex-row items-center justify-between'>
                    <Text className='text-xl font-bold text-black'>Save To...</Text>
                    <Button style={{ alignItems : "center", justifyContent : "center"}} textColor='#007AFF' onPress={() => {setAddToPlaylistVisible(false); handlePresentModalPress()}}><Text className='text-2xl'>+</Text><Text> New Playlist</Text></Button>
                  </View>
                <Divider />
                  { usersPlaylists ?
                  <View className='flex-1'>
                    <ScrollView className='mt-2'>
                    {usersPlaylists.map(( item, index) => {
                        return(<View className='mt-2'><RenderAddToUserPlaylistsListProgram playlist={item} lectureToBeAdded={lectureToBeAddedToPlaylist} setAddToPlaylistVisible={setAddToPlaylistVisible} setPlaylistAddingTo={setPlaylistAddingTo} playListAddingTo={playlistAddingTo}/></View>)
                      })
                    }
                  </ScrollView>
                  <Divider />
                  </View>
                  :
                  ( 
                  <View className=' items-center justify-center '> 
                      <Text> No User Playlists Yet </Text>
                  </View>
                  )
                }
              </View>
            </Modal>
        </Portal>
        <CreatePlaylistBottomSheet ref={bottomSheetRef}/>
      </Animated.ScrollView>
      </View>
  )
}


export default ProgramLectures