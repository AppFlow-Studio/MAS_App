import { View, Text, Pressable, Image, Dimensions, StatusBar, Linking, ImageBackground, FlatList } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { Animated, PanResponder } from 'react-native'
import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Link, useRouter } from 'expo-router'
import { FlyerSkeleton } from './FlyerSkeleton'
import { Program, Lectures, SheikDataType } from '../types'
import { Icon, Portal, Modal, Button } from 'react-native-paper'
import { parse, format } from 'date-fns'
import moment from 'moment'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '@/src/lib/supabase'
import { useAuth } from '@/src/providers/AuthProvider'
import YoutubePlayer from "react-native-youtube-iframe"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { isBefore } from 'date-fns'
import { UserPlaylistType } from '../types'
import RenderAddToUserPlaylistsListProgram from './RenderAddToUserPlaylistsList'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import CreatePlaylistBottomSheet from './UserProgramComponets/CreatePlaylistBottomSheet'
import { Divider } from 'react-native-paper'
import { useNavigation } from '@react-navigation/native'
import type { NavigationProp } from '@react-navigation/native'
import Toast from 'react-native-toast-message'
import * as Haptics from 'expo-haptics'
import DeckSwiper from 'react-native-deck-swiper'

// Toast configuration
const toastConfig = {
  addProgramToNotificationsToast: ({ props }: any) => (
    <Pressable className='rounded-xl overflow-hidden ' onPress={props.onPress}>
      <BlurView intensity={40} className='flex-row items-center justify-between px-4 rounded-xl p-1 max-h-[60]' 
        experimentalBlurMethod={'dimezisBlurView'}
        style={{ width: '100%', maxWidth: '100%' }}
      >
        <View>
          <Image source={props.props.program_img ? { uri: props.props.program_img } : require("@/assets/images/MASHomeLogo.png")} style={{ width: 50, height: 50, objectFit: 'fill', borderRadius: 10 }}/>
        </View>
        <View className='flex-col pl-2'>
          <View>
            <Text>1 Program Added To Notifications</Text>
          </View>
          <View className='flex-row'>
            <Text className='text-sm'>{props.props.program_name}</Text>
            <Icon source={'chevron-right'} size={20} />
          </View>
        </View>
      </BlurView>
    </Pressable>
  ),
  LectureAddedToPlaylist: ({ props }: any) => (
    <Pressable className='rounded-xl overflow-hidden' onPress={props.onPress}>
      <BlurView intensity={40} className='flex-row items-center justify-between px-3 p-1 max-w-[85%] max-h-[60]'
        experimentalBlurMethod={'dimezisBlurView'}
      >
        <View className=''>
          <Image source={props.props?.playlist_img ? { uri: props.props.playlist_img } : require("@/assets/images/MASHomeLogo.png")} style={{ width: 50, height: 50, objectFit: 'fill', borderRadius: 10 }}/>
        </View>
        <View className='flex-col pl-2'>
          <View>
            <Text numberOfLines={1} allowFontScaling adjustsFontSizeToFit>1 lecture added</Text>
          </View>
          <View className='flex-row'>
            <Text>{props.props?.playlist_name}</Text>
            <Icon source={'chevron-right'} size={20} />
          </View>
        </View>
      </BlurView>
    </Pressable>
  ),
  ProgramAddedToPrograms: ({ props }: any) => (
    <Pressable className='rounded-xl overflow-hidden ' onPress={props.onPress}>
      <BlurView intensity={40} className='flex-row items-center justify-between px-4 rounded-xl p-1 max-h-[60]' 
        experimentalBlurMethod={'dimezisBlurView'}
        style={{ width: '100%', maxWidth: '100%' }}
      >
        <View>
          <Image source={props.props.program_img ? { uri: props.props.program_img } : require("@/assets/images/MASHomeLogo.png")} style={{ width: 50, height: 50, objectFit: 'fill', borderRadius: 10 }}/>
        </View>
        <View className='flex-col pl-2'>
          <View>
            <Text>1 Program Added to Library</Text>
          </View>
          <View className='flex-row'>
            <Text className='text-sm'>{props.props.program_name}</Text>
            <Icon source={'chevron-right'} size={20} />
          </View>
        </View>
      </BlurView>
    </Pressable>
  ),
  addEventToNotificationsToast: ({ props }: any) => (
    <Pressable className='rounded-xl overflow-hidden ' onPress={props.onPress}>
      <BlurView intensity={40} className='flex-row items-center justify-between px-4 rounded-xl p-1 max-w-[85%] max-h-[60]' 
        experimentalBlurMethod={'dimezisBlurView'}
      >
        <View>
          <Image source={props.props.event_img ? { uri: props.props.event_img } : require("@/assets/images/MASHomeLogo.png")} style={{ width: 50, height: 50, objectFit: 'fill', borderRadius: 10 }}/>
        </View>
        <View className='flex-col pl-2'>
          <View>
            <Text>1 Program Added To Notifications</Text>
          </View>
          <View className='flex-row'>
            <Text className='text-sm'>{props.props.event_name}</Text>
            <Icon source={'chevron-right'} size={20} />
          </View>
        </View>
      </BlurView>
    </Pressable>
  ),
  ConfirmNotificationOption: ({ props }: any) => (
    <Pressable className='rounded-xl overflow-hidden ' onPress={props.onPress}>
      <BlurView intensity={40} className='flex-row items-center justify-between px-4 rounded-xl p-2 max-w-[90%] max-h-[60]' 
        experimentalBlurMethod={'dimezisBlurView'}
      >
        <View className='flex-col pl-2'>
          <View>
            <Text className="text-white">{props.message} : {props.time}</Text>
          </View>
          <View className='flex-row'>
            <Text className='text-md font-bold text-white'>{props.prayer}</Text>
          </View>
        </View>
        <View className="pl-5"/>
        <View className="bg-white p-1 rounded-full">
          <Icon source={'check'} size={20} color="green"/>
        </View>
      </BlurView>
    </Pressable>
  )
}

// Helper function to extract video ID from YouTube URL
const getVideoIdFromUrl = (url: string) => {
  if (!url) return null;
  if (!url.includes('/') && !url.includes('?')) {
    return url;
  }
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : null;
};

const FlyerImageComponent = ({item, autoOpen = false, onModalClose} : {item : Program, autoOpen?: boolean, onModalClose?: () => void}) => {
    const { session } = useAuth()
    const [ imageReady, setImageReady ] = useState(false)
    const [modalVisible, setModalVisible] = useState(autoOpen)
    const [program, setProgram] = useState<Program | null>(null)
    const [lectures, setLectures] = useState<Lectures[]>([])
    const [speakerData, setSpeakerData] = useState<SheikDataType[]>([])
    const [speakerString, setSpeakerString] = useState('')
    const [speakerModalVisible, setSpeakerModalVisible] = useState(false)
    const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0)
    const [isHorizontalScrolling, setIsHorizontalScrolling] = useState(false)
    const speakerFlatListRef = useRef<FlatList>(null)
    const deckSwiperRef = useRef<any>(null)
    const [modalImageReady, setModalImageReady] = useState(false)
    const [hasError, setHasError] = useState(false)
    const [selectedLecture, setSelectedLecture] = useState<Lectures | null>(null)
    const [playing, setPlaying] = useState(false)
    const [watchedLectures, setWatchedLectures] = useState<Set<string>>(new Set())
    const [startedLectures, setStartedLectures] = useState<Set<string>>(new Set())
    const [programInNotifications, setProgramInNotifications] = useState(false)
    const [programInPrograms, setProgramInPrograms] = useState(false)
    const [addToPlaylistVisible, setAddToPlaylistVisible] = useState(false)
    const [lectureToBeAddedToPlaylist, setLectureToBeAddedToPlaylist] = useState<string>("")
    const [playlistAddingTo, setPlaylistAddingTo] = useState<string[]>([])
    const [usersPlaylists, setUsersPlaylists] = useState<UserPlaylistType[]>()
    const slideAnim = useRef(new Animated.Value(0)).current
    const panY = useRef(new Animated.Value(0)).current
    const panYValue = useRef(0)
    const modalScrollRef = useRef<ScrollView>(null)
    const isScrolling = useRef(false)
    const scrollOffset = useRef(0)
    const previousScrollOffset = useRef(0)
    const isClosing = useRef(false)
    const [modalToast, setModalToast] = useState<{ type: string; props: any } | null>(null)
    const bottomSheetRef = useRef<BottomSheetModal>(null)
    const router = useRouter()
    const navigation = useNavigation<NavigationProp<any>>()
    const { width, height } = Dimensions.get("window")
    
    // Pan responder for slide-down gesture - only on drag handle
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => {
                // Only respond if ScrollView is at the top
                return scrollOffset.current === 0 && !isScrolling.current;
            },
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                // Only respond to downward gestures when scroll is at top
                if (scrollOffset.current > 0 || isScrolling.current) return false;
                // Require significant downward movement to avoid conflicts
                return gestureState.dy > 15 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 2;
            },
            onPanResponderGrant: () => {
                panY.setValue(0);
                panYValue.current = 0;
            },
            onPanResponderMove: (evt, gestureState) => {
                // Only allow downward movement, with resistance at the top
                if (gestureState.dy > 0) {
                    // Add slight resistance for smoother feel
                    const resistance = gestureState.dy < 50 ? 0.5 : 1;
                    const newValue = gestureState.dy * resistance;
                    panY.setValue(newValue);
                    panYValue.current = newValue;
                }
            },
            onPanResponderTerminate: () => {
                // Snap back
                Animated.spring(panY, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 40,
                    friction: 8,
                }).start(() => {
                    panYValue.current = 0;
                });
            },
            onPanResponderRelease: (evt, gestureState) => {
                const threshold = -10; // Dismiss immediately on any downward drag
                
                if (gestureState.dy > threshold || gestureState.vy > 0.5) {
                    // Mark as closing to prevent re-renders
                    isClosing.current = true;
                    
                    // Stop any ongoing animations
                    slideAnim.stopAnimation();
                    panY.stopAnimation();
                    
                    // Get current panY value from gesture
                    const currentPanY = gestureState.dy;
                    const remainingDistance = height - currentPanY;
                    
                    // Ensure panY is at current position before animating
                    panY.setValue(currentPanY);
                    panYValue.current = currentPanY;
                    
                    // Animate panY from current position to height
                    // slideAnim stays at 1, so transform = 0 + panY
                    Animated.timing(panY, {
                        toValue: height,
                        duration: Math.max(150, Math.min(300, 300 * (remainingDistance / height))),
                        useNativeDriver: true,
                    }).start((finished) => {
                        if (finished) {
                            // Clean up after animation completes
                            setModalVisible(false);
                            setSelectedLecture(null);
                            setPlaying(false);
                            panY.setValue(0);
                            panYValue.current = 0;
                            slideAnim.setValue(0);
                            scrollOffset.current = 0;
                            previousScrollOffset.current = 0;
                            isScrolling.current = false;
                            isClosing.current = false;
                        }
                    });
                } else {
                    // Snap back to open position
                    Animated.spring(panY, {
                        toValue: 0,
                        useNativeDriver: true,
                        tension: 50,
                        friction: 9,
                    }).start(() => {
                        panYValue.current = 0;
                    });
                }
            },
        })
    ).current
    
    // Helper function to set time to current date
    const setTimeToCurrentDate = (timeString: string) => {
        const [hours, minutes, seconds] = timeString.split(':').map(Number);
        const timestampWithTimeZone = new Date();
        timestampWithTimeZone.setHours(hours, minutes, seconds || 0, 0);
        return timestampWithTimeZone;
    };
    
    // Helper function to schedule notifications
    const schedule_notification = async (
        user_id: string,
        push_notification_token: string,
        message: string,
        notification_type: string,
        program_event_name: string,
        notification_time: Date
    ) => {
        const { error } = await supabase.from('program_notification_schedule').insert({
            user_id: user_id,
            push_notification_token: push_notification_token,
            message: message,
            notification_type: notification_type,
            program_event_name: program_event_name,
            notification_time: notification_time,
            title: program_event_name
        });
        if (error) {
            console.log(error);
        }
    };

    // Helper function to convert time string to moment and format as 12-hour
    const parseTimeToMoment = (timeString: string) => {
        if (!timeString) return moment();
        
        try {
            const parsed12 = parse(timeString, 'h:mm a', new Date());
            if (!isNaN(parsed12.getTime())) {
                return moment(parsed12);
            }
        } catch (error) {
            // Continue to try other formats
        }
        
        try {
            const parsed24 = parse(timeString, 'HH:mm', new Date());
            if (!isNaN(parsed24.getTime())) {
                return moment(parsed24);
            }
        } catch (error) {
            // Continue to try other formats
        }
        
        try {
            const parsed24Sec = parse(timeString, 'HH:mm:ss', new Date());
            if (!isNaN(parsed24Sec.getTime())) {
                return moment(parsed24Sec);
            }
        } catch (error) {
            // Continue
        }
        
        const momentTime = moment(timeString, ['h:mm a', 'HH:mm', 'HH:mm:ss', 'h:mm:ss a'], true);
        if (momentTime.isValid()) {
            return momentTime;
        }
        
        return moment();
    };
    
    // Helper function to format time as 12-hour format
    const formatTime12Hour = (timeString: string): string => {
        if (!timeString) return 'TBD';
        
        try {
            const time = parseTimeToMoment(timeString);
            if (time.isValid()) {
                return time.format('h:mm A');
            }
        } catch (error) {
            console.error('Error formatting time:', error);
        }
        
        return timeString;
    };

    const closeModal = useCallback((skipAnimation = false) => {
        // Don't close if already closing via drag
        if (isClosing.current) return;
        
        // Haptic feedback for closing
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        // Stop all ongoing animations
        slideAnim.stopAnimation();
        panY.stopAnimation();
        
        panY.setValue(0);
        panYValue.current = 0;
        scrollOffset.current = 0; // Reset scroll position
        previousScrollOffset.current = 0; // Reset previous scroll position
        isScrolling.current = false; // Reset scrolling state
        
        // Only animate if not already dragged off screen
        if (!skipAnimation) {
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 65,
                    friction: 11,
                }),
                Animated.spring(panY, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 65,
                    friction: 11,
                })
            ]).start(() => {
                setModalVisible(false);
                setSelectedLecture(null);
                setPlaying(false);
            });
        } else {
            // If already off screen, just reset immediately
            slideAnim.setValue(0);
            panY.setValue(0);
            panYValue.current = 0;
            setModalVisible(false);
            setSelectedLecture(null);
            setPlaying(false);
        }
    }, [slideAnim, panY]);

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

    const onStateChange = useCallback((state: string) => {
        if (state === "ended") {
            setPlaying(false);
            if (selectedLecture) {
                AsyncStorage.setItem(`watched_lecture_${selectedLecture.lecture_id}`, 'true');
                setWatchedLectures(prev => new Set([...prev, selectedLecture.lecture_id]));
            }
        }
    }, [selectedLecture]);

    const fetchProgramData = async () => {
        const { data, error } = await supabase
            .from("programs")
            .select("*")
            .eq("program_id", item.program_id)
            .single();
        
        if (data && !error) {
            setProgram(data);
            
            // Check if program is in notifications
            if (session?.user.id) {
                const { data: checkIfExists } = await supabase
                    .from("added_notifications_programs")
                    .select("*")
                    .eq("user_id", session.user.id)
                    .eq("program_id", item.program_id)
                    .single();
                
                if (checkIfExists) {
                    setProgramInNotifications(true);
                }
                
                // Check if program is in programs
                const { data: programExists } = await supabase
                    .from('added_programs')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .eq('program_id', item.program_id)
                    .single();
                
                if (programExists) {
                    setProgramInPrograms(true);
                }
            }
        }
    };
    
    const getUserPlaylists = async () => {
        if (!session?.user.id) return;
        const { data, error } = await supabase
            .from("user_playlist")
            .select("*")
            .eq("user_id", session.user.id);
        
        if (data && !error) {
            setUsersPlaylists(data);
        }
    };
    
    const handlePresentModalPress = () => bottomSheetRef.current?.present();
    const hideAddToPlaylist = () => setAddToPlaylistVisible(false);
    
    const onDonePress = async () => {
        if (playlistAddingTo && playlistAddingTo.length > 0) {
            playlistAddingTo.map(async (playlistId) => {
                const { data: checkDupe } = await supabase
                    .from("user_playlist_lectures")
                    .select("*")
                    .eq("user_id", session?.user.id)
                    .eq("playlist_id", playlistId)
                    .eq("program_lecture_id", lectureToBeAddedToPlaylist)
                    .single();
                
                if (checkDupe) {
                    const { data: dupePlaylistName } = await supabase
                        .from("user_playlist")
                        .select("playlist_name")
                        .eq("playlist_id", checkDupe.playlist_id)
                        .single();
                    // Handle duplicate - could show alert here
                } else {
                    const { error } = await supabase
                        .from("user_playlist_lectures")
                        .insert({
                            user_id: session?.user.id,
                            playlist_id: playlistId,
                            program_lecture_id: lectureToBeAddedToPlaylist
                        });
                }
            });
            setAddToPlaylistVisible(false);
        } else {
            setAddToPlaylistVisible(false);
        }
    };
    
    useEffect(() => {
        if (playlistAddingTo.length > 0) {
            onDonePress();
            setAddToPlaylistVisible(false);
        }
    }, [playlistAddingTo.length > 0]);

    // Reset speaker index when modal opens
    useEffect(() => {
        if (speakerModalVisible) {
            setCurrentSpeakerIndex(0);
            // Jump to first card when modal opens
            setTimeout(() => {
                if (deckSwiperRef.current && speakerData.length > 0) {
                    try {
                        deckSwiperRef.current.jumpToCardIndex(0);
                    } catch (error) {
                        console.log('Error jumping to card index:', error);
                    }
                }
            }, 100);
        }
    }, [speakerModalVisible]);

    // Reset error state when item changes
    useEffect(() => {
        setHasError(false);
        setImageReady(false);
    }, [item.program_id]);

    // Fetch lectures on mount to check if they exist
    useEffect(() => {
        if (item.has_lectures) {
            fetchLectures();
        }
    }, [item.has_lectures, item.program_id]);

    // Auto-open modal when autoOpen prop is true
    const hasOpenedRef = useRef(false);
    useEffect(() => {
        if (autoOpen && !hasOpenedRef.current) {
            hasOpenedRef.current = true;
            // Trigger animation
            Animated.spring(slideAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 40,
                friction: 8,
            }).start();
            // Fetch data
            fetchProgramData();
            fetchSpeakerData();
        }
    }, [autoOpen]);

    // Call onModalClose callback when modal closes (only after it was opened)
    useEffect(() => {
        if (!modalVisible && hasOpenedRef.current && onModalClose) {
            onModalClose();
        }
    }, [modalVisible]);
    
    const handleNotificationPress = async () => {
        if (!session?.user.id || !program) return;
        
        if (programInNotifications) {
            const { error } = await supabase
                .from("added_notifications_programs")
                .delete()
                .eq("user_id", session.user.id)
                .eq("program_id", item.program_id);
            
            const { error: settingsError } = await supabase
                .from('program_notifications_settings')
                .delete()
                .eq('user_id', session.user.id)
                .eq("program_id", item.program_id);
            
            const { error: ScheduleNotisError } = await supabase
                .from('program_notification_schedule')
                .delete()
                .eq('user_id', session.user.id)
                .eq("program_event_name", program.program_name);
            
            setProgramInNotifications(false);
        } else {
            const { error } = await supabase
                .from("added_notifications_programs")
                .insert({
                    user_id: session.user.id,
                    program_id: item.program_id,
                    has_lectures: program.has_lectures
                });
            
            const TodaysDate = new Date();
            const DaysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const programDays = program.program_days;
            const ProgramStartTime = setTimeToCurrentDate(program.program_start_time || '');
            
            if (programDays && isBefore(TodaysDate, ProgramStartTime)) {
                await Promise.all(
                    (Array.isArray(programDays) ? programDays : [programDays]).map(async (day: string) => {
                        const { data: user_push_token } = await supabase
                            .from('profiles')
                            .select('push_notification_token')
                            .eq('id', session.user.id)
                            .single();
                        
                        if ((TodaysDate.getDay() === DaysOfWeek.indexOf(day)) && user_push_token?.push_notification_token) {
                            await schedule_notification(
                                session.user.id,
                                user_push_token.push_notification_token,
                                `${program.program_name} is Starting Now!`,
                                'When Program Starts',
                                program.program_name,
                                ProgramStartTime
                            );
                        }
                    })
                );
            }
            
            setProgramInNotifications(true);
            
            const goToProgram = () => {
                navigation.navigate('myPrograms', { 
                    screen: 'notifications/ClassesAndLectures/[program_id]', 
                    params: { program_id: item.program_id }, 
                    initial: false 
                });
            };
            
            // Show toast in modal
            setModalToast({
                type: 'addProgramToNotificationsToast',
                props: { props: program, onPress: goToProgram }
            });
            // Also show root toast for when modal is closed
            // Toast.show({
            //     type: 'addProgramToNotificationsToast',
            //     props: { props: program, onPress: goToProgram },
            //     position: 'top',
            //     topOffset: 50,
            // });
            // Auto-hide modal toast after 3 seconds
            setTimeout(() => setModalToast(null), 3000);
        }
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };
    
    const handleAddToProgramsPress = async () => {
        if (!session?.user.id) return;
        
        if (programInPrograms) {
            const { error } = await supabase
                .from("added_programs")
                .delete()
                .eq("user_id", session.user.id)
                .eq("program_id", item.program_id);
            
            setProgramInPrograms(false);
        } else {
            const { error } = await supabase
                .from("added_programs")
                .insert({
                    user_id: session.user.id,
                    program_id: item.program_id
                });
            
            if (!error) {
                setProgramInPrograms(true);
                
                const goToProgram = () => {
                    navigation.navigate('myPrograms');
                };
                
                // Show toast in modal
                setModalToast({
                    type: 'ProgramAddedToPrograms',
                    props: { props: program, onPress: goToProgram }
                });
                // Also show root toast for when modal is closed
                // Toast.show({
                //     type: 'ProgramAddedToPrograms',
                //     props: { props: program, onPress: goToProgram },
                //     position: 'top',
                //     topOffset: 50,
                // });
                // Auto-hide modal toast after 3 seconds
                setTimeout(() => setModalToast(null), 3000);
            }
        }
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const fetchSpeakerData = async () => {
        const speakerArray = Array.isArray(item.program_speaker) ? item.program_speaker : (item.program_speaker ? [item.program_speaker] : []);
        if (speakerArray && speakerArray.length > 0) {
            const speakers: SheikDataType[] = [];
            let speaker_string: string[] = speakerArray.map(() => '');
            
            await Promise.all(
                speakerArray.map(async (speaker_id: string, index: number) => {
                    const { data: speakerInfo } = await supabase
                        .from('speaker_data')
                        .select('*')
                        .eq('speaker_id', speaker_id)
                        .single();
                    
                    if (speakerInfo) {
                        if (index === speakerArray.length - 1) {
                            speaker_string[index] = speakerInfo.speaker_name;
                        } else {
                            speaker_string[index] = speakerInfo.speaker_name + ' & ';
                        }
                        speakers.push(speakerInfo);
                    }
                })
            );
            
            setSpeakerData(speakers);
            setSpeakerString(speaker_string.join(''));
        }
    };

    const openModal = useCallback(() => {
        // Reset closing state
        isClosing.current = false;
        
        // Haptic feedback for opening
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        setModalVisible(true);
        setModalImageReady(false);
        setHasError(false);
        setSelectedLecture(null);
        setPlaying(false);
        panY.setValue(0); // Reset pan gesture
        panYValue.current = 0;
        scrollOffset.current = 0; // Reset scroll position
        previousScrollOffset.current = 0; // Reset previous scroll position
        isScrolling.current = false; // Reset scrolling state
        setCurrentSpeakerIndex(0); // Reset speaker index
        
        // Stop any ongoing animations
        slideAnim.stopAnimation();
        panY.stopAnimation();
        
        // Enhanced spring animation for smoother feel
        Animated.spring(slideAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
        }).start();
        
        // Fetch full program data
        fetchProgramData();
        
        // Fetch lectures if program has them (but only if none exist yet)
        if (item.has_lectures && lectures.length === 0) {
            fetchLectures();
        }
        
        // Fetch speaker data
        fetchSpeakerData();
    }, [slideAnim, item.has_lectures, item.program_id, lectures.length]);

    
    const renderSpeakerCard = (speakerData: SheikDataType, index: number) => {
        const cardWidth = width * 0.85;
        const maxCardHeight = height * 0.55; // 55% of screen height
        
        return (
            <View style={{ 
                width: width,
                height: maxCardHeight,
                justifyContent: 'center', 
                alignItems: 'center',
            }}>
                <BlurView
                    intensity={80}
                    tint="dark"
                    style={{
                        borderRadius: 50,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 8,
                        elevation: 4,
                        backgroundColor: 'rgba(107, 114, 128, 0.6)',
                        overflow: 'hidden',
                        width: cardWidth,
                        height: maxCardHeight,
                    }}
                >
                    <ScrollView
                        showsVerticalScrollIndicator={true}
                        scrollEnabled={true}
                        nestedScrollEnabled={true}
                        scrollEventThrottle={16}
                        directionalLockEnabled={true}
                        alwaysBounceVertical={false}
                        bounces={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{
                            paddingTop: 24,
                            paddingBottom: 30,
                            paddingHorizontal: 24,
                        }}
                        style={{ flex: 1 }}
                    >
                        <View className='flex-row items-center mb-4'>
                            <View style={{
                                width: 100,
                                height: 100,
                                borderRadius: 50,
                                overflow: 'hidden',
                                borderWidth: 3,
                                borderColor: '#E5E7EB',
                                marginRight: 16,
                            }}>
                                <Image 
                                    source={speakerData?.speaker_img ? { uri: speakerData.speaker_img } : require("@/assets/images/MASHomeLogo.png")} 
                                    style={{ width: '100%', height: '100%' }} 
                                    resizeMode='cover'
                                />
                            </View>
                            <View className='flex-1'>
                                <Text className='text-xs text-gray-300 font-medium mb-1'>SPEAKER</Text>
                                <Text className='text-xl font-bold text-white' numberOfLines={2}>
                                    {speakerData?.speaker_name}
                                </Text>
                            </View>
                        </View>
                        <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(156, 163, 175, 0.4)', paddingTop: 16, marginTop: 4 }}>
                            {speakerData?.speaker_name === "MAS" ? (
                                <Text className='text-sm font-bold text-white mb-3'>Impact</Text>
                            ) : (
                                <Text className='text-sm font-bold text-white mb-3'>Credentials</Text>
                            )}
                            <View className='flex-col'>
                                {speakerData?.speaker_creds?.map((cred, i) => (
                                    <View key={i} className='flex-row items-start mb-2'>
                                        <View style={{ marginRight: 8, marginTop: 2 }}>
                                            <Icon source="cards-diamond-outline" size={16} color='#60A5FA'/>
                                        </View>
                                        <Text className='text-sm text-gray-100 flex-1'>{cred}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </ScrollView>
                </BlurView>
            </View>
        );
    };

    const GetSheikData = () => {
        if (!speakerData || speakerData.length === 0) {
            return (
                <View className='flex-1 items-center justify-center'>
                    <Text className='text-white'>No speaker data available</Text>
                </View>
            );
        }

        const cardWidth = width * 0.85;
        const maxCardHeight = height * 0.55;
        
        // If only one speaker, render the card directly without DeckSwiper
        if (speakerData.length === 1) {
            return (
                <View style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ height: maxCardHeight, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                        {renderSpeakerCard(speakerData[0], 0)}
                    </View>
                </View>
            );
        }
        
        // Multiple speakers - use DeckSwiper
        return (
            <View style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ height: maxCardHeight, width: '100%' }}>
                    <DeckSwiper
                        ref={deckSwiperRef}
                        cards={speakerData}
                        renderCard={renderSpeakerCard}
                        cardIndex={currentSpeakerIndex}
                        onSwiped={(swipedIndex) => {
                            // After swiping, the next card becomes visible
                            const nextIndex = swipedIndex + 1;
                            if (nextIndex < speakerData.length) {
                                setCurrentSpeakerIndex(nextIndex);
                            } else {
                                // If we've swiped all cards, reset to 0
                                setCurrentSpeakerIndex(0);
                            }
                        }}
                        onSwipedAll={() => {
                            setCurrentSpeakerIndex(0);
                        }}
                        cardVerticalMargin={0}
                        cardHorizontalMargin={0}
                        stackSize={3}
                        stackSeparation={0}
                        animateCardOpacity
                        disableTopSwipe
                        disableBottomSwipe
                        swipeBackCard
                        verticalSwipe={false}
                        backgroundColor="transparent"
                        overlayLabels={{
                            left: {
                                title: 'NOPE',
                                style: {
                                    label: {
                                        backgroundColor: 'transparent',
                                        borderColor: 'transparent',
                                        color: 'transparent',
                                    },
                                    wrapper: {
                                        flexDirection: 'column',
                                        alignItems: 'flex-end',
                                        justifyContent: 'flex-start',
                                        marginTop: 20,
                                        marginLeft: -20,
                                    }
                                }
                            },
                            right: {
                                title: 'LIKE',
                                style: {
                                    label: {
                                        backgroundColor: 'transparent',
                                        borderColor: 'transparent',
                                        color: 'transparent',
                                    },
                                    wrapper: {
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        justifyContent: 'flex-start',
                                        marginTop: 20,
                                        marginLeft: 20,
                                    }
                                }
                            }
                        }}
                    />
                </View>
                {/* Pagination Indicators */}
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 16,
                    gap: 8,
                }}>
                    {speakerData.map((_, index) => (
                        <View
                            key={index}
                            style={{
                                width: currentSpeakerIndex === index ? 24 : 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: currentSpeakerIndex === index ? '#60A5FA' : 'rgba(255, 255, 255, 0.3)',
                            }}
                        />
                    ))}
                </View>
            </View>
        );
    };

    const fetchLectures = async () => {
        const { data, error } = await supabase
            .from("program_lectures")
            .select("*")
            .eq("lecture_program", item.program_id)
            .order('lecture_date', { ascending: false });
        
        if (data && !error) {
            setLectures(data);
            checkWatchedStatus(data);
        }
    };

    // Handle press - navigate if program has lectures with YouTube links, otherwise open modal
    const handlePress = useCallback(async () => {
        // If program has lectures flag, check if lectures exist and have YouTube links
        if (item.has_lectures) {
            // If lectures haven't been fetched yet, fetch them first
            if (lectures.length === 0) {
                const { data, error } = await supabase
                    .from("program_lectures")
                    .select("*")
                    .eq("lecture_program", item.program_id)
                    .order('lecture_date', { ascending: false });
                
                if (data && data.length > 0) {
                    // Check if any lectures have YouTube links
                    const hasYouTubeLectures = data.some(lecture => 
                        lecture.lecture_link && 
                        lecture.lecture_link.trim() !== '' && 
                        lecture.lecture_link !== 'N/A'
                    );
                    
                    if (hasYouTubeLectures) {
                        router.push(`/menu/program/${item.program_id}` as any);
                        return;
                    }
                }
            } else {
                // Lectures already loaded, check if any have YouTube links
                const hasYouTubeLectures = lectures.some(lecture => 
                    lecture.lecture_link && 
                    lecture.lecture_link.trim() !== '' && 
                    lecture.lecture_link !== 'N/A'
                );
                
                if (hasYouTubeLectures) {
                    router.push(`/menu/program/${item.program_id}` as any);
                    return;
                }
            }
        }
        
        // If no YouTube lectures found, open the slide-up modal
        openModal();
    }, [item.has_lectures, item.program_id, lectures, router, openModal]);

    return (
        <>
            {/* Card View - Hide when autoOpen is true (modal-only mode) */}
            {!autoOpen && (
                <View className='flex-col relative'>
                    <Pressable onPress={handlePress}>
                        { !imageReady && 
                            <FlyerSkeleton width={150} height={150} style={{position : 'absolute', top : 0, zIndex : 2}}/>
                        }
                        <Image 
                            source={(hasError || !item.program_img || item.program_img.trim() === '') 
                                ? require("@/assets/images/massicliquidglassicon.png") 
                                : { uri : item.program_img }} 
                            style={{ width : 150, height : 150, borderRadius : 8, margin : 5 }}
                            resizeMode="cover"
                            onLoad={() => setImageReady(true)}
                            onError={() => {
                                setImageReady(true);
                                setHasError(true);
                            }}
                        />
                        <Text className='text-black font-medium pl-2 text-[10px] w-[150px] text-center' numberOfLines={1}>{item.program_name}</Text>
                    </Pressable>

                    {/* Description Card - Show for all programs with descriptions */}
                    {item.program_desc && (
                        <View style={{
                            marginHorizontal: 5,
                            marginTop: 4,
                        }}>
                            <Pressable onPress={openModal}>
                                <Text 
                                    className="text-[#0D509D] text-[10px] text-center"
                                >
                                    Read full description
                                </Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            )}

            {/* Program Detail Modal - Slide Up - Show if no lectures/videos OR if autoOpen is true */}
            {(modalVisible || isClosing.current) && (autoOpen || !item.has_lectures || (item.has_lectures && lectures.length === 0)) && (
                <Portal>
                    <Modal
                        visible={modalVisible}
                        onDismiss={() => {}}
                        dismissable={false}
                        contentContainerStyle={{
                            backgroundColor: 'transparent',
                            margin: 0,
                            padding: 0,
                            height: '100%',
                            width: '100%',
                            borderWidth: 0,
                        }}
                        style={{ justifyContent: 'flex-end', margin: 0, padding: 0 }}
                    >
                        <Animated.View
                            style={{
                                opacity: slideAnim,
                                flex: 1,
                                backgroundColor: 'transparent',
                            }}
                        >
                            {/* Full screen backdrop (tap to close) */}
                            <Pressable 
                                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'transparent' }}
                                onPress={() => closeModal()}
                            />
                            {/* Bottom sheet positioned at bottom */}
                            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                            <Animated.View
                                style={{
                                    height: height * 0.90,
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 40,
                                    marginHorizontal: 10,
                                    marginBottom: -20,
                                    overflow: 'hidden',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: -4 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 20,
                                    elevation: 20,
                                    transform: [
                                        {
                                            translateY: Animated.add(
                                                slideAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [height, 0],
                                                }),
                                                panY
                                            )
                                        }
                                    ]
                                }}
                            >
                                {/* Drag Handle */}
                                <Animated.View
                                    {...panResponder.panHandlers}
                                    style={{
                                        width: '100%',
                                        paddingTop: 12,
                                        paddingBottom: 8,
                                        alignItems: 'center',
                                        backgroundColor: '#FFFFFF',
                                        zIndex: 10,
                                    }}
                                >
                                    <View style={{
                                        width: 40,
                                        height: 4,
                                        borderRadius: 2,
                                        backgroundColor: '#D1D5DB',
                                    }} />
                                </Animated.View>
                                
                                {/* Main Content */}
                                <ScrollView 
                                    ref={modalScrollRef}
                                    showsVerticalScrollIndicator={false}
                                    bounces={true}
                                    contentContainerStyle={{ paddingBottom: 120 }}
                                    style={{ flex: 1 }}
                                >
                                    {/* Image/Video Section with overlayed buttons */}
                                    <View style={{ 
                                        marginHorizontal: 16, 
                                        borderRadius: 16, 
                                        overflow: 'hidden',
                                        marginBottom: 20,
                                        position: 'relative',
                                    }}>
                                        {selectedLecture ? (
                                            <YoutubePlayer 
                                                height={height * 0.3}
                                                width={width - 32}
                                                play={playing}
                                                videoId={selectedLecture.lecture_link ? getVideoIdFromUrl(selectedLecture.lecture_link) : undefined}
                                                onChangeState={onStateChange}
                                            />
                                        ) : (
                                            <View>
                                                {!modalImageReady && (
                                                    <FlyerSkeleton 
                                                        width={width - 32} 
                                                        height={height * 0.55} 
                                                        style={{ position: 'absolute', top: 0, zIndex: 2, borderRadius: 16 }} 
                                                    />
                                                )}
                                                <Image
                                                    source={hasError || !item.program_img || item.program_img.trim() === ''
                                                        ? require("@/assets/images/massicliquidglassicon.png")
                                                        : { uri: item.program_img }}
                                                    style={{
                                                        width: '100%',
                                                        height: undefined,
                                                        aspectRatio: 0.7,
                                                    }}
                                                    resizeMode="cover"
                                                    onLoad={() => setModalImageReady(true)}
                                                    onError={() => {
                                                        setHasError(true);
                                                        setModalImageReady(true);
                                                    }}
                                                />
                                            </View>
                                        )}
                                        
                                        {/* Overlayed buttons on image */}
                                        <View style={{ 
                                                    position: 'absolute',
                                            top: 12,
                                            left: 12,
                                            right: 12,
                                            flexDirection: 'row', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            zIndex: 10,
                                        }}>
                                            <Pressable 
                                                onPress={() => closeModal()} 
                                                style={{ 
                                                    width: 36, 
                                                    height: 36, 
                                                    borderRadius: 18,
                                                    backgroundColor: 'rgba(255,255,255,0.9)',
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    shadowColor: '#000',
                                                    shadowOffset: { width: 0, height: 2 },
                                                    shadowOpacity: 0.1,
                                                    shadowRadius: 4,
                                                    elevation: 3,
                                                }}
                                            >
                                                <Icon source="close" size={20} color="#374151" />
                                            </Pressable>
                                            
                                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                                {program && isBefore(new Date().toISOString(), program.program_end_date || '') && (
                                                    <Pressable
                                                        onPress={handleNotificationPress} 
                                                        style={{ 
                                                            width: 36, 
                                                            height: 36, 
                                                            borderRadius: 18,
                                                            backgroundColor: programInNotifications ? '#0D509D' : 'rgba(255,255,255,0.9)',
                                                            alignItems: 'center', 
                                                            justifyContent: 'center',
                                                            shadowColor: '#000',
                                                            shadowOffset: { width: 0, height: 2 },
                                                            shadowOpacity: 0.1,
                                                            shadowRadius: 4,
                                                            elevation: 3,
                                                        }}
                                                    >
                                                        <Icon source={programInNotifications ? "bell-check" : "bell-outline"} size={18} color={programInNotifications ? '#FFFFFF' : '#374151'}/>
                                                    </Pressable>
                                        )}
                                            </View>
                                        </View>
                                    </View>
                                    
                                    {/* Program Info Section */}
                                    <View style={{ paddingHorizontal: 16 }}>
                                        {/* Program Name */}
                                        <Text style={{ 
                                            color: '#111827', 
                                            fontSize: 24, 
                                            fontWeight: '700',
                                            marginBottom: 8,
                                        }}>
                                            {program?.program_name || item.program_name}
                                        </Text>
                                        
                                        {/* Speaker Pill */}
                                        {speakerString && (
                                            <Pressable 
                                                onPress={() => setSpeakerModalVisible(true)} 
                                                style={{ 
                                                    alignSelf: 'flex-start',
                                                    marginBottom: 16,
                                                }}
                                            >
                                                <View style={{
                                                    backgroundColor: 'rgba(13, 80, 157, 0.1)',
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 8,
                                                    borderRadius: 20,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    borderWidth: 1,
                                                    borderColor: 'rgba(13, 80, 157, 0.2)',
                                                }}>
                                                    <Icon source="account" size={16} color="#0D509D" />
                                                    <Text style={{ color: '#0D509D', fontWeight: '600', fontSize: 14, marginLeft: 6, marginRight: 4 }}>
                                                    {speakerString}
                                                </Text>
                                                    <Icon source="chevron-right" size={14} color="#0D509D" />
                                                </View>
                                            </Pressable>
                                        )}

                                        {/* Description */}
                                        {(program?.program_desc || item.program_desc) && (
                                            <View style={{
                                                backgroundColor: '#F9FAFB',
                                                borderRadius: 16,
                                                padding: 16,
                                                marginBottom: 20,
                                                borderWidth: 1,
                                                borderColor: '#E5E7EB',
                                            }}>
                                                <Text style={{ 
                                                    color: '#6B7280', 
                                                    fontSize: 11, 
                                                    fontWeight: '600',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: 1,
                                                    marginBottom: 10,
                                                }}>
                                                    About
                                            </Text>
                                                <Text style={{ 
                                                    color: '#374151', 
                                                    fontSize: 15, 
                                                    lineHeight: 24,
                                                }}>
                                                        {program?.program_desc || item.program_desc}
                                                    </Text>
                                                </View>
                                        )}
                                    </View>
                                </ScrollView>

                                {/* Fixed Bottom Action Bar */}
                                <View style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    paddingHorizontal: 16,
                                    paddingTop: 16,
                                    paddingBottom: 20,
                                    backgroundColor: '#FFFFFF',
                                    borderTopWidth: 1,
                                    borderTopColor: '#E5E7EB',
                                    borderBottomLeftRadius: 32,
                                    borderBottomRightRadius: 32,
                                }}>
                                    <View style={{ flexDirection: 'row', gap: 12 }}>
                                        {(program?.program_is_paid || item.program_is_paid) && (
                                            <Pressable
                                                onPress={() => {
                                                    const paidLink = program?.paid_link || item.paid_link;
                                                    if (paidLink) {
                                                        Linking.canOpenURL(paidLink).then(() => {
                                                            Linking.openURL(paidLink);
                                                        });
                                                    }
                                                }}
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: '#0D509D',
                                                    paddingVertical: 16,
                                                    borderRadius: 14,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: 8,
                                                }}
                                            >
                                                <Icon source="cart-outline" size={20} color="#FFFFFF"/>
                                                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>
                                                    Register Now
                                                    </Text>
                                            </Pressable>
                                        )}
                                        
                                        <Pressable
                                            onPress={handleAddToProgramsPress}
                                            style={{
                                                width: (program?.program_is_paid || item.program_is_paid) ? 56 : undefined,
                                                flex: (program?.program_is_paid || item.program_is_paid) ? undefined : 1,
                                                backgroundColor: programInPrograms ? 'rgba(16,185,129,0.15)' : '#F3F4F6',
                                                paddingVertical: 16,
                                                borderRadius: 14,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 8,
                                                borderWidth: 1,
                                                borderColor: programInPrograms ? 'rgba(16,185,129,0.3)' : '#E5E7EB',
                                            }}
                                        >
                                            <Icon 
                                                source={programInPrograms ? 'heart' : 'heart-outline'} 
                                                size={22} 
                                                color={programInPrograms ? '#10B981' : '#374151'}
                                            />
                                            {!(program?.program_is_paid || item.program_is_paid) && (
                                                <Text style={{ color: programInPrograms ? '#10B981' : '#374151', fontWeight: '700', fontSize: 16 }}>
                                                    {programInPrograms ? 'Saved' : 'Save to Library'}
                                                </Text>
                                            )}
                                        </Pressable>
                                        </View>
                                    </View>
                            </Animated.View>
                            </View>
                        </Animated.View>
                        
                        {/* Speaker Modal */}
                        <Portal>
                            <Modal
                                visible={speakerModalVisible}
                                onDismiss={() => {
                                    setSpeakerModalVisible(false);
                                    setCurrentSpeakerIndex(0);
                                    // Reset to first card when closing
                                    setTimeout(() => {
                                        if (deckSwiperRef.current && speakerData.length > 0) {
                                            try {
                                                deckSwiperRef.current.jumpToCardIndex(0);
                                            } catch (error) {
                                                console.log('Error jumping to card index:', error);
                                            }
                                        }
                                    }, 100);
                                }}
                                contentContainerStyle={{
                                    backgroundColor: 'transparent',
                                    padding: 20,
                                    minHeight: 400,
                                    maxHeight: "70%",
                                    width: "100%",
                                    borderRadius: 35,
                                    alignSelf: "center",
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <View style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                                    <GetSheikData />
                                </View>
                            </Modal>
                        </Portal>
                        
                        {/* Add to Playlist Modal */}
                        <Portal>
                            <Modal 
                                visible={addToPlaylistVisible} 
                                onDismiss={hideAddToPlaylist} 
                                contentContainerStyle={{
                                    backgroundColor: 'white', 
                                    padding: 20, 
                                    height: "50%", 
                                    width: "90%", 
                                    borderRadius: 35, 
                                    alignSelf: "center"
                                }}
                            >
                                <View className='h-[100%]'>
                                    <View className='flex-row items-center justify-between'>
                                        <Text className='text-xl font-bold text-black'>Save To...</Text>
                                        <Button 
                                            style={{ alignItems: "center", justifyContent: "center" }} 
                                            textColor='#007AFF' 
                                            onPress={() => {
                                                setAddToPlaylistVisible(false);
                                                handlePresentModalPress();
                                            }}
                                        >
                                            <Text className='text-2xl'>+</Text>
                                            <Text> New Playlist</Text>
                                        </Button>
                                    </View>
                                    <Divider />
                                    {usersPlaylists ? (
                                        <View className='flex-1'>
                                            <ScrollView className='mt-2'>
                                                {usersPlaylists.map((playlistItem, index) => (
                                                    <View key={index} className='mt-2'>
                                                        <RenderAddToUserPlaylistsListProgram 
                                                            playlist={playlistItem} 
                                                            lectureToBeAdded={lectureToBeAddedToPlaylist} 
                                                            setAddToPlaylistVisible={setAddToPlaylistVisible} 
                                                            setPlaylistAddingTo={setPlaylistAddingTo} 
                                                            playListAddingTo={playlistAddingTo}
                                                        />
                                                    </View>
                                                ))}
                                            </ScrollView>
                                            <Divider />
                                        </View>
                                    ) : (
                                        <View className='items-center justify-center'>
                                            <Text> No User Playlists Yet </Text>
                                        </View>
                                    )}
                                </View>
                            </Modal>
                        </Portal>
                        
                        <CreatePlaylistBottomSheet ref={bottomSheetRef}/>
                    </Modal>
                    
                    {/* Custom Toast Notification - Renders inside modal Portal to appear on top */}
                    {modalToast && (
                        <View
                            style={{
                                position: 'absolute',
                                top: 50,
                                left: 0,
                                right: 0,
                                alignItems: 'flex-start',
                                justifyContent: 'flex-start',
                                zIndex: 999999,
                                elevation: 9999,
                                pointerEvents: 'box-none',
                                paddingHorizontal: 16,
                            }}
                        >
                            <View style={{ width: '100%', maxWidth: '100%' }}>
                                <Pressable 
                                    onPress={() => {
                                        if (modalToast.props.onPress) {
                                            modalToast.props.onPress();
                                        }
                                        setModalToast(null);
                                    }}
                                    className='rounded-xl overflow-hidden'
                                    style={{ width: '100%', maxWidth: '100%' }}
                                >
                                    <View style={{ maxWidth: '100%', overflow: 'hidden' }}>
                                        {toastConfig[modalToast.type as keyof typeof toastConfig]?.({ props: modalToast.props })}
                                    </View>
                                </Pressable>
                            </View>
                        </View>
                    )}
                </Portal>
            )}

        </>
    )
}

export default FlyerImageComponent