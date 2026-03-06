import { View, Text, FlatList, Pressable, ScrollView, StatusBar, Image, Dimensions, RefreshControl, ActivityIndicator, Platform } from 'react-native'
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import RenderMyLibraryProgram from '@/src/components/UserProgramComponets/renderMyLibraryProgram';
import { useAuth } from '@/src/providers/AuthProvider';
import { supabase } from '@/src/lib/supabase';
import { Program, UserPlaylistType } from '@/src/types';
import { useUserPrograms } from '@/src/hooks/useUserLibrary';
import { Button, Divider, Icon, TextInput } from 'react-native-paper';
import { Link, useRouter } from 'expo-router';
import RenderLikedLectures from '@/src/components/UserProgramComponets/RenderLikedLectures';
import { UserPlaylistFliers } from '@/src/components/UpcomingFliers';
import LottieView from 'lottie-react-native';
import { EventsType } from '@/src/types';
import SignInAnonModal from '@/src/components/SignInAnonModal';
import { BlurView } from 'expo-blur';
import * as AppleAuthentication from 'expo-apple-authentication'
import Svg, { Path } from 'react-native-svg'
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';
export default function userPrograms() {
  const { session } = useAuth()
  const router = useRouter()
  type program_id  = {
    program_id : string
  }
  const { height, width } = Dimensions.get('screen')
  const [ email, setEmail ] = useState('')
  const [ password, setPassword] = useState("")
  const [ loading, setLoading ] = useState(false)
  const [ name, setName ] = useState('')
  
  const { data: userProgramsData, refetch: refetchUserPrograms } = useUserPrograms(session?.user.id)
  const [ userPlaylists, setUserPlaylists ] = useState<UserPlaylistType[]>()
  const [ latestFlier, setLatestFlier ] = useState<Program>()
  const [ anonStatus, setAnonStatus ] = useState(true)
  const [ latestFlierEvent, setLatestFlierEvent ] = useState<EventsType>()
  const [ userNotis, setUserNotis ] = useState()
  const [ refreshing, setRefreshing ] = useState(false)
  const [ signIn, setSignIn ] = useState(true)
  const [ guestAuthModalVisible, setGuestAuthModalVisible ] = useState(false)
  const GoogleButtonSignUp = () => {
        GoogleSignin.configure({
          iosClientId : '954205600936-3fvho6btee6op0l226scerlhsirsjprc.apps.googleusercontent.com'
        })
      
        return (
          <GoogleSigninButton
            size={GoogleSigninButton.Size.Wide}
            style={[ 
              Platform.OS == 'android' ? {
                height : 64
              } : {height: 48}
            ]}
            color={GoogleSigninButton.Color.Dark}
            onPress={async () => {
              try {
                await GoogleSignin.hasPlayServices()
                const response = await GoogleSignin.signIn()
                const idToken = (response as any).data?.idToken || (response as any).idToken;
                const user = (response as any).data?.user || (response as any).user;
                if (idToken) {
                  const { data, error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: idToken,
                  })
                  console.log(response)
                  if( !error ){
                    const {data : Profile , error : ProfileError } = await supabase.from('profiles').update({ first_name : user?.name, profile_email : user?.email }).eq('id', data?.user.id)
                    console.log(Profile, ProfileError)
                  }
                } else {
                  throw new Error('no ID token present!')
                }
              } catch (error: any) {
                if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                  // user cancelled the login flow
                } else if (error.code === statusCodes.IN_PROGRESS) {
                  // operation (e.g. sign in) is in progress already
                } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                  // play services not available or outdated
                } else {
                  // some other error happened
                }
              }
            }}
          />
        )
      }
  const checkIfAnon = async () => {
    if( session?.user.is_anonymous ){
      setAnonStatus(true)
    }
    else{
      setAnonStatus(false)
    }
  }
  const userPrograms = userProgramsData?.map(p => ({ program_id: p.program_id })) || []

 

  useEffect(() => {
    checkIfAnon()
  }, [ session ])

  // Show guest auth modal every time anonymous user enters/focuses on this screen
  useFocusEffect(
    useCallback(() => {
      if (session?.user.is_anonymous) {
        setGuestAuthModalVisible(true);
      } else {
        setGuestAuthModalVisible(false);
      }
    }, [session])
  );

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
  
    if (error) alert(error.message);
    setLoading(false);
    await refetchUserPrograms()
    checkIfAnon()
  }  
  const tabBarHeight = 20
  const onRefresh = async () => {
    await refetchUserPrograms()
  }
async function signUpWithEmail() {
    setLoading(true)
    if( email && password && name ){
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          first_name: name,
          profile_email: email,
        },
      },
    })

    if (error) {alert(error.message); return}
    setLoading(false)}
    else{
      alert('Fill in the fields to complete sign up')
    }
  } 
  // Menu item component
  const MenuItem = ({ 
    icon, 
    title, 
    subtitle, 
    href, 
    showArrow = true,
  }: { 
    icon: string, 
    title: string, 
    subtitle: string, 
    href?: string, 
    showArrow?: boolean,
  }) => {
    const content = (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginHorizontal: 12,
        marginVertical: 3,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F0F0F0',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: '#EBF5FF',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
          }}>
            <Icon source={icon} size={20} color="#0D509D" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#1a1a1a' }}>
              {title}
            </Text>
            <Text style={{ fontSize: 11, color: '#888' }}>
              {subtitle}
            </Text>
          </View>
        </View>
        {showArrow && (
          <Icon source="chevron-right" size={18} color="#CCC" />
        )}
      </View>
    )

    if (href) {
      return (
        <Link href={href as any} asChild>
          <Pressable>{content}</Pressable>
        </Link>
      )
    }
    return content
  }

  const renderProgramItem = useCallback(({ item: program }: { item: { program_id: string } }) => (
    <View style={{ width: '48%', marginBottom: 10, marginHorizontal: '1%' }}>
      <RenderMyLibraryProgram program_id={program.program_id} />
    </View>
  ), []);

  const programKeyExtractor = useCallback((item: { program_id: string }, index: number) => `${item.program_id}-${index}`, []);

  const ListHeader = useMemo(() => (
    <>

      {/* Auth Modal - uses the same SignInAnonModal as More screen */}
      <SignInAnonModal
        visible={guestAuthModalVisible}
        setVisible={() => setGuestAuthModalVisible(false)}
        dismissable={true}
        showLanding={true}
        onSignUpPress={() => {
          setGuestAuthModalVisible(false);
          router.push('/(auth)/SignUp');
        }}
        onContinueAsGuest={() => {
          router.push('/menu');
        }}
      />

      {/* Header */}
      <View style={{
        paddingTop: Platform.OS === 'ios' ? 30 : 30,
        paddingBottom: 8,
        paddingHorizontal: 18,
        backgroundColor: '#F8F9FA',
      }}>
        <Text style={{ fontSize: 26, fontWeight: '700', color: '#1a1a1a' }}>
          My Library
        </Text>
      </View>

      {refreshing && <ActivityIndicator color='#0D509D' style={{ marginBottom: 4 }}/>}

      {/* Menu Items */}
      <View>
        <MenuItem title="Playlists" subtitle="Add Lectures to Playlist" href="/myPrograms/PlaylistIndex" icon="playlist-music" />
        <MenuItem title="Notifications" subtitle="Customize Your Notifications" href="/myPrograms/notifications" icon="bell" />
        <MenuItem title="Recommended For You" subtitle="Programs & events based on your interests" href="/myPrograms/RecommendedForYou" icon="star-shooting" />
        <MenuItem title="Upcoming Events" subtitle="Enjoy a Lecture? Add it" href="/menu/program/upcomingEvents" icon="play-box-multiple" />
        <MenuItem title="Recorded Lectures" subtitle="View your recorded lectures" href="/myPrograms/recordedLectures" icon="video" />
      </View>

      {/* My Programs */}
      <View style={{ marginTop: 12, paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 10, marginLeft: 4 }}>
          My Programs
        </Text>
      </View>

      {(!userPrograms || userPrograms.length === 0) && (
        <View style={{ paddingHorizontal: 16 }}>
          <Pressable
            onPress={() => router.push('/menu/program/upcomingEvents')}
          >
            <View style={{
              width: 150,
              height: 150,
              borderRadius: 8,
              backgroundColor: '#E8EDF4',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Icon source="plus" size={32} color="#0D509D" />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#0D509D', marginTop: 6 }}>
                Add Program
              </Text>
            </View>
          </Pressable>
        </View>
      )}
    </>
  ), [guestAuthModalVisible, refreshing, userPrograms?.length]);

  const ListFooter = useMemo(() => (
    <View style={{ height: 100 }} />
  ), []);

  return (
    <FlatList
      data={userPrograms && userPrograms.length > 0 ? userPrograms : []}
      renderItem={renderProgramItem}
      keyExtractor={programKeyExtractor}
      numColumns={2}
      columnWrapperStyle={{ paddingHorizontal: 16, justifyContent: 'space-between' }}
      ListHeaderComponent={ListHeader}
      ListFooterComponent={ListFooter}
      removeClippedSubviews={true}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
      style={{ flex: 1, backgroundColor: '#F8F9FA' }}
    />
  )
}