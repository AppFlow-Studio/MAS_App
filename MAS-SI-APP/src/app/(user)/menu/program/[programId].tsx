import { View, Text, Pressable, FlatList, Image, TouchableOpacity, Dimensions, Easing, Alert, StatusBar, } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import { useLocalSearchParams, Stack, useRouter, Link, useNavigation } from 'expo-router';
import LecturesListLecture from '@/src/components/LectureListLecture';
import { defaultProgramImage }  from '@/src/components/ProgramsListProgram';
import { Divider, Portal, Modal, IconButton, Icon, Button, Badge } from 'react-native-paper';
import { Lectures, SheikDataType, Program } from '@/src/types';
import { ScrollView } from 'react-native-gesture-handler';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import Animated,{ FadeInLeft, interpolate, useAnimatedRef, useAnimatedStyle, useScrollViewOffset, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { UserPlaylistType } from '@/src/types';
import RenderAddToUserPlaylistsListProgram from '@/src/components/RenderAddToUserPlaylistsList';
import { SharedTransition, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import CreatePlaylistBottomSheet from '@/src/components/UserProgramComponets/CreatePlaylistBottomSheet';
import * as Haptics from "expo-haptics"
import LottieView from 'lottie-react-native';
import Toast from 'react-native-toast-message';
import { isBefore } from 'date-fns';

const ProgramLectures = () => {
  const { session } = useAuth()
  const { programId } = useLocalSearchParams();
  const [ lectures, setLectures ] = useState<Lectures[] | null>(null)
  const [ program, setProgram ] = useState<Program>()
  const [ visible, setVisible ] = useState(false);
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
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const handlePresentModalPress = () => bottomSheetRef.current?.present();
  const hideAddToPlaylist = () => setAddToPlaylistVisible(false)
  const navigation = useNavigation<any>()
  const Tab = useBottomTabBarHeight()
  const { width } = Dimensions.get("window")
  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const scrollOffset = useScrollViewOffset(scrollRef)
  const imageAnimatedStyle = useAnimatedStyle(() => {
    return{
      transform: [
        {
          translateY : interpolate(
          scrollOffset.value,
          [-250, 0, 250 ],
          [-250/2, 0, 250 * 0.75]
          )
        },
        {
          scale: interpolate(scrollOffset.value, [-250, 0, 250], [2, 1, 1])
        }
      ]
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
    console.log('speakers', speaker_string)
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
  const { data, error } = await supabase.from("program_lectures").select("*").eq("lecture_program", programId)
  if( error ) {
    alert(error)
  }
  if ( data ) {
    setLectures(data)
  }
}
async function getUserPlaylists(){
  const { data, error } = await supabase.from("user_playlist").select("*").eq("user_id", session?.user.id)
  if( error ){
    console.log( error )
  }
  if( data ){
    setUsersPlaylists(data)
  }
}
  useEffect(() => {
    getProgram()
    getProgramLectures()
    getUserPlaylists()
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
          <>
            <Animated.View className=' flex-row'>
                <Image source={{uri : speakerData?.speaker_img || defaultProgramImage}} style={{width: 110, height: 110, borderRadius: 50}} resizeMode='cover'/>
            <View className='flex-col px-5'>
              <Text className='text-xl font-bold'>Name: </Text>
              <Text className='pt-2 font-semibold'> {speakerData?.speaker_name} </Text>
            </View>
          </Animated.View>
    
          <View className='flex-col py-3'>
            { speakerData?.speaker_name == "MAS" ? <Text className='font-bold'>Impact </Text> :  <Text className='font-bold'>Credentials: </Text> } 
            { speakerData?.speaker_creds.map( (cred, i) => {
              return <Text key={i}> <Icon source="cards-diamond-outline"  size={15} color='black'/> {cred} {'\n'}</Text>
            })}
          </View>
          </>
          ))
        }
      </View>
    )
  } 

  const NotificationBell = () => {
  const notifade = useSharedValue(1)
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
      setProgramInNotifications(false)
    }
    else{
      const { error } = await supabase.from("added_notifications_programs").insert({user_id :session?.user.id, program_id : programId})
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
    const fadeOutNotification = useAnimatedStyle(() => ({
      opacity : notifade.value
    }))
    useEffect(() => {
      notifade.value = withTiming(0, {duration : 4000})
    }, [])
   return(
    <View className='flex-row items-center gap-x-5'>
      <Animated.View style={fadeOutNotification}>
        <Badge style={{ opacity : 1}} className='left-10 bottom-4 bg-gray-400 text-black h-[23px] w-[75px] text-[10px] items-center justify-end font-semibold'>
          Notifications
        </Badge>
      </Animated.View>
      <Pressable onPress={handlePress} className='w-[30] h-[35] items-center justify-center'>
        {programInNotfications ?  <Icon source={"bell-check"} color='#007AFF' size={30}/> : <Icon source={"bell-outline"} color='#007AFF' size={30}/> }
      </Pressable>
      <Pressable onPress={addToPrograms}>
        { programInPrograms ?  <Icon source={'minus-circle-outline'} color='#007AFF' size={30}/> : <Icon source={"plus-circle-outline"} color='#007AFF' size={30}/>}
      </Pressable>
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
      <Pressable onPress={addToPrograms}>
        { programInPrograms ?  <Icon source={'minus-circle'} color='#007AFF' size={30}/> : <Icon source={"plus-circle-outline"} color='#007AFF' size={30}/>}
      </Pressable>
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
    <View className='flex-1 bg-white' style={{flexGrow: 1}}>
     <Stack.Screen options={ { title: "" , headerBackTitleVisible : false, headerRight : () => { if(isBefore(currDate, program?.program_end_date!)){ return ( <NotificationBell /> )} else{ return <AddToProgramsButton />}}, headerStyle : {backgroundColor : "white"} } } />
     <StatusBar barStyle={"dark-content"}/>
      <Animated.ScrollView ref={scrollRef}  scrollEventThrottle={16} contentContainerStyle={{justifyContent: "center", alignItems: "center", marginTop: "2%" }} >
          
          <View>
            <Animated.Image 
              source={ { uri: program?.program_img || defaultProgramImage }}
              style={ [{width: width / 1.2, height: 300, borderRadius: 8 }, imageAnimatedStyle] }
              resizeMode='stretch'
            />
          </View>
       
          <View className='bg-white w-[100%]' style={{paddingBottom : Tab * 3}}>
            <Text className='text-center mt-2 text-xl text-black font-bold'>{program?.program_name}</Text>
            <Text className='text-center mt-2  text-[#0D509D] w-[60%] self-center' onPress={showModal} numberOfLines={1}>{speakerString}</Text>
              <View>
                {
                  lectures && lectures?.length >= 1 ? lectures.map((item, index) => {
                    return(
                      <Animated.View key={index} entering={FadeInLeft.duration(400).delay(100)}>
                        <LecturesListLecture  lecture={item} index={index} speaker={program?.program_speaker} setAddToPlaylistVisible={setAddToPlaylistVisible} setLectureToBeAddedToPlaylist={setLectureToBeAddedToPlaylist}/>
                        <Divider style={{width: "95%", marginLeft: 8}}/>
                      </Animated.View>
                    )
                  }) : (

                    <View className=''> 
                      <View>
                        <Text className='text-left text-2xl font-bold text-black ml-4'>Description: </Text>
                      </View>

                      <View className='items-center justify-center'>
                        <View className='w-[95%] bg-white px-3 flex-wrap h-[300] py-2' style={{ borderRadius : 15, shadowColor : "gray", shadowOffset : { width : 0, height :0}, shadowOpacity : 2, shadowRadius : 1}}>
                          <ScrollView><Text>{program?.program_desc}</Text></ScrollView>
                        </View>
                      </View>
                    </View>
                  )
                }
                <View className='items-center justify-center'>
                    {
                      program?.program_is_paid ? 
                      (
                        <Link href={`more/ProgramsPage/${program.program_id}`} asChild>
                        <Button icon={() => <Icon source={"cart-variant"} size={20} color='white'/>} mode='elevated' style={{ backgroundColor : "#57BA47", marginTop : 10, width: "90%"}}><Text className='text-white'>Sign Up Now</Text></Button>
                        </Link>
                      ) : <></>
                    }
                </View>
              </View>
          </View>
          
          <Portal>
            <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={{backgroundColor: 'white', padding: 20, height: "55%", width: "90%", borderRadius: 35, alignSelf: "center"}} >
              <ScrollView className='flex-1'>
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