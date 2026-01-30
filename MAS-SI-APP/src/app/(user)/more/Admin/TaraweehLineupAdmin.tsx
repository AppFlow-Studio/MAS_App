import { View, Text, Pressable, ScrollView, Alert, Image, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
import Svg, { Path } from 'react-native-svg'
import { Stack } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import Toast from 'react-native-toast-message'
import SelectSpeakerBottomSheet from '@/src/components/AdminComponents/SelectSpeakerBottomSheet'
import DateTimePicker from '@react-native-community/datetimepicker'
import { format } from 'date-fns'

interface SessionLineup {
  firstFourImam?: { imam_name: string; imam_img?: string };
  speaker?: { speaker_name: string; speaker_img?: string };
  secondFourImam?: { imam_name: string; imam_img?: string };
  witrImam?: { imam_name: string; imam_img?: string };
}

interface Speaker {
  speaker_id: string
  speaker_name: string
  speaker_img?: string
  speaker_creds?: string[]
}

type LineupField = 
  | 'session1_firstFour' 
  | 'session1_speaker' 
  | 'session1_secondFour' 
  | 'session1_witr'
  | 'session2_firstFour' 
  | 'session2_speaker' 
  | 'session2_secondFour' 
  | 'session2_witr'

const emptyLineup: SessionLineup = {
  firstFourImam: { imam_name: '' },
  speaker: { speaker_name: '' },
  secondFourImam: { imam_name: '' },
  witrImam: { imam_name: '' },
}

const TaraweehLineupAdmin = () => {
  const handleSubmit = (message: string) => {
    Toast.show({
      type: "success",
      text1: message,
      position: "top",
      topOffset: 50,
      visibilityTime: 2000,
    });
  };
  
  // Date state
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(false)
  
  // Taraweeh Lineup State
  const [sessionOneLineup, setSessionOneLineup] = useState<SessionLineup>({ ...emptyLineup })
  const [sessionTwoLineup, setSessionTwoLineup] = useState<SessionLineup>({ ...emptyLineup })
  
  // Speaker selection state
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [speakerSheetOpen, setSpeakerSheetOpen] = useState(false)
  const [currentField, setCurrentField] = useState<LineupField | null>(null)
  
  // Format date for display
  const formatDateDisplay = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const compareDate = new Date(date)
    compareDate.setHours(0, 0, 0, 0)
    
    const diffTime = compareDate.getTime() - today.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    
    return format(date, 'EEEE, MMM d')
  }
  
  // Fetch speakers
  const getSpeakers = async () => {
    const { data, error } = await supabase.from('speaker_data').select('*')
    if (data) {
      setSpeakers(data)
    }
  }
  
  // Handle speaker selection
  const handleSpeakerSelect = (speakerId: string) => {
    const speaker = speakers.find(s => s.speaker_id === speakerId)
    if (!speaker || !currentField) return
    
    const speakerData = {
      imam_name: speaker.speaker_name,
      imam_img: speaker.speaker_img,
      speaker_name: speaker.speaker_name,
      speaker_img: speaker.speaker_img,
    }
    
    switch (currentField) {
      case 'session1_firstFour':
        setSessionOneLineup(prev => ({ ...prev, firstFourImam: { imam_name: speakerData.imam_name, imam_img: speakerData.imam_img } }))
        break
      case 'session1_speaker':
        setSessionOneLineup(prev => ({ ...prev, speaker: { speaker_name: speakerData.speaker_name, speaker_img: speakerData.speaker_img } }))
        break
      case 'session1_secondFour':
        setSessionOneLineup(prev => ({ ...prev, secondFourImam: { imam_name: speakerData.imam_name, imam_img: speakerData.imam_img } }))
        break
      case 'session1_witr':
        setSessionOneLineup(prev => ({ ...prev, witrImam: { imam_name: speakerData.imam_name, imam_img: speakerData.imam_img } }))
        break
      case 'session2_firstFour':
        setSessionTwoLineup(prev => ({ ...prev, firstFourImam: { imam_name: speakerData.imam_name, imam_img: speakerData.imam_img } }))
        break
      case 'session2_speaker':
        setSessionTwoLineup(prev => ({ ...prev, speaker: { speaker_name: speakerData.speaker_name, speaker_img: speakerData.speaker_img } }))
        break
      case 'session2_secondFour':
        setSessionTwoLineup(prev => ({ ...prev, secondFourImam: { imam_name: speakerData.imam_name, imam_img: speakerData.imam_img } }))
        break
      case 'session2_witr':
        setSessionTwoLineup(prev => ({ ...prev, witrImam: { imam_name: speakerData.imam_name, imam_img: speakerData.imam_img } }))
        break
    }
    setSpeakerSheetOpen(false)
  }
  
  const openSpeakerSheet = (field: LineupField) => {
    setCurrentField(field)
    setSpeakerSheetOpen(true)
  }

  // Taraweeh Lineup Functions
  const getTaraweehLineup = async (date: Date) => {
    setIsLoading(true)
    const dateStr = format(date, 'yyyy-MM-dd')
    
    // Reset lineup before fetching
    setSessionOneLineup({ ...emptyLineup })
    setSessionTwoLineup({ ...emptyLineup })
    
    const { data, error } = await supabase
      .from('taraweeh_lineup')
      .select('*')
      .eq('date', dateStr)
      .single()
    
    if (data && data.lineup) {
      if (data.lineup.sessionOne) {
        setSessionOneLineup(data.lineup.sessionOne)
      }
      if (data.lineup.sessionTwo) {
        setSessionTwoLineup(data.lineup.sessionTwo)
      }
    }
    setIsLoading(false)
  }

  const onUpdateTaraweehLineup = async () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const lineup = {
      sessionOne: sessionOneLineup,
      sessionTwo: sessionTwoLineup,
    }

    // Check if entry exists for selected date
    const { data: existingData } = await supabase
      .from('taraweeh_lineup')
      .select('id')
      .eq('date', dateStr)
      .single()

    if (existingData) {
      // Update existing entry
      const { error } = await supabase
        .from('taraweeh_lineup')
        .update({ lineup })
        .eq('date', dateStr)
      
      if (!error) {
        handleSubmit(`Lineup for ${formatDateDisplay(selectedDate)} Updated`)
      } else {
        Alert.alert('Error', 'Failed to update lineup')
      }
    } else {
      // Insert new entry
      const { error } = await supabase
        .from('taraweeh_lineup')
        .insert({ date: dateStr, lineup })
      
      if (!error) {
        handleSubmit(`Lineup for ${formatDateDisplay(selectedDate)} Created`)
      } else {
        Alert.alert('Error', 'Failed to create lineup')
      }
    }
  }

  useEffect(() => {
    getTaraweehLineup(selectedDate)
    getSpeakers()
  }, [])

  return (
    <View className='flex-1 grow bg-gray-50' style={{ paddingBottom: 30 }}>
      <Stack.Screen
        options={{
          title: "Taraweeh Lineup",
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
        {/* Date Selector - Single Container */}
        <View 
          style={{
            backgroundColor: '#EFF6FF',
            borderRadius: 16,
            padding: 12,
            marginBottom: 16,
            marginTop: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ marginRight: 12 }}>
              <Path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <Path d="M15.695 13.7H15.704M15.695 16.7H15.704M11.995 13.7H12.005M11.995 16.7H12.005M8.295 13.7H8.304M8.295 16.7H8.304" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
            <View>
              <Text style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Scheduling for</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>{formatDateDisplay(selectedDate)}</Text>
            </View>
          </View>
          
          {/* Compact Date Picker */}
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="compact"
            onChange={(event, date) => {
              if (date) {
                setSelectedDate(date)
                getTaraweehLineup(date)
              }
            }}
            accentColor="#3B82F6"
          />
        </View>

        {/* Loading Indicator */}
        {isLoading ? (
          <View className="bg-white rounded-2xl p-8 mb-4 items-center">
            <Text className="text-gray-500">Loading lineup...</Text>
          </View>
        ) : (
          <>
            {/* Session 1 */}
            <View style={{ backgroundColor: 'white', borderRadius: 16, marginBottom: 12, overflow: 'hidden' }}>
              {/* Session Header */}
              <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: '#1F2937' }}>Session 1</Text>
              </View>

              {/* RAKAAT 1-4 Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#9CA3AF', letterSpacing: 0.5 }}>RAKAAT 1-4</Text>
                <Pressable 
                  onPress={() => openSpeakerSheet('session1_firstFour')}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F4', borderRadius: 20, paddingVertical: 6, paddingLeft: 6, paddingRight: 10 }}
                >
                  {sessionOneLineup.firstFourImam?.imam_img ? (
                    <Image source={{ uri: sessionOneLineup.firstFourImam.imam_img }} style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8 }} />
                  ) : (
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', marginRight: 8, alignItems: 'center', justifyContent: 'center' }}>
                      <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <Path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="#9CA3AF" strokeWidth="1.5"/>
                        <Path d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </Svg>
                    </View>
                  )}
                  <Text style={{ fontSize: 14, fontWeight: '500', color: sessionOneLineup.firstFourImam?.imam_name ? '#374151' : '#0E519F', marginRight: 4 }}>
                    {sessionOneLineup.firstFourImam?.imam_name || 'Assign Imam'}
                  </Text>
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <Path d="M6 9L12 15L18 9" stroke="#0E519F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </Pressable>
              </View>

              {/* RAKAAT 5-8 Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#9CA3AF', letterSpacing: 0.5 }}>RAKAAT 5-8</Text>
                <Pressable 
                  onPress={() => openSpeakerSheet('session1_secondFour')}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F4', borderRadius: 20, paddingVertical: 6, paddingLeft: 6, paddingRight: 10 }}
                >
                  {sessionOneLineup.secondFourImam?.imam_img ? (
                    <Image source={{ uri: sessionOneLineup.secondFourImam.imam_img }} style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8 }} />
                  ) : (
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', marginRight: 8, alignItems: 'center', justifyContent: 'center' }}>
                      <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <Path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="#9CA3AF" strokeWidth="1.5"/>
                        <Path d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </Svg>
                    </View>
                  )}
                  <Text style={{ fontSize: 14, fontWeight: '500', color: sessionOneLineup.secondFourImam?.imam_name ? '#374151' : '#0E519F', marginRight: 4 }}>
                    {sessionOneLineup.secondFourImam?.imam_name || 'Assign Imam'}
                  </Text>
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <Path d="M6 9L12 15L18 9" stroke="#0E519F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </Pressable>
              </View>

              {/* SPEAKER Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#9CA3AF', letterSpacing: 0.5 }}>SPEAKER</Text>
                <Pressable 
                  onPress={() => openSpeakerSheet('session1_speaker')}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F4', borderRadius: 20, paddingVertical: 6, paddingLeft: 6, paddingRight: 10 }}
                >
                  {sessionOneLineup.speaker?.speaker_img ? (
                    <Image source={{ uri: sessionOneLineup.speaker.speaker_img }} style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8 }} />
                  ) : (
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', marginRight: 8, alignItems: 'center', justifyContent: 'center' }}>
                      <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <Path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="#9CA3AF" strokeWidth="1.5"/>
                        <Path d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </Svg>
                    </View>
                  )}
                  <Text style={{ fontSize: 14, fontWeight: '500', color: sessionOneLineup.speaker?.speaker_name ? '#374151' : '#0E519F', marginRight: 4 }}>
                    {sessionOneLineup.speaker?.speaker_name || 'Assign Speaker'}
                  </Text>
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <Path d="M6 9L12 15L18 9" stroke="#0E519F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </Pressable>
              </View>

              {/* WITR Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#9CA3AF', letterSpacing: 0.5 }}>WITR</Text>
                <Pressable 
                  onPress={() => openSpeakerSheet('session1_witr')}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F4', borderRadius: 20, paddingVertical: 6, paddingLeft: 6, paddingRight: 10 }}
                >
                  {sessionOneLineup.witrImam?.imam_img ? (
                    <Image source={{ uri: sessionOneLineup.witrImam.imam_img }} style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8 }} />
                  ) : (
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', marginRight: 8, alignItems: 'center', justifyContent: 'center' }}>
                      <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <Path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="#9CA3AF" strokeWidth="1.5"/>
                        <Path d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </Svg>
                    </View>
                  )}
                  <Text style={{ fontSize: 14, fontWeight: '500', color: sessionOneLineup.witrImam?.imam_name ? '#374151' : '#0E519F', marginRight: 4 }}>
                    {sessionOneLineup.witrImam?.imam_name || 'Assign Imam'}
                  </Text>
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <Path d="M6 9L12 15L18 9" stroke="#0E519F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </Pressable>
              </View>
            </View>

            {/* Session 2 */}
            <View style={{ backgroundColor: 'white', borderRadius: 16, marginBottom: 12, overflow: 'hidden' }}>
              {/* Session Header */}
              <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: '#1F2937' }}>Session 2</Text>
              </View>

              {/* RAKAAT 1-4 Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#9CA3AF', letterSpacing: 0.5 }}>RAKAAT 1-4</Text>
                <Pressable 
                  onPress={() => openSpeakerSheet('session2_firstFour')}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F4', borderRadius: 20, paddingVertical: 6, paddingLeft: 6, paddingRight: 10 }}
                >
                  {sessionTwoLineup.firstFourImam?.imam_img ? (
                    <Image source={{ uri: sessionTwoLineup.firstFourImam.imam_img }} style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8 }} />
                  ) : (
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', marginRight: 8, alignItems: 'center', justifyContent: 'center' }}>
                      <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <Path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="#9CA3AF" strokeWidth="1.5"/>
                        <Path d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </Svg>
                    </View>
                  )}
                  <Text style={{ fontSize: 14, fontWeight: '500', color: sessionTwoLineup.firstFourImam?.imam_name ? '#374151' : '#0E519F', marginRight: 4 }}>
                    {sessionTwoLineup.firstFourImam?.imam_name || 'Assign Imam'}
                  </Text>
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <Path d="M6 9L12 15L18 9" stroke="#0E519F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </Pressable>
              </View>

              {/* RAKAAT 5-8 Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#9CA3AF', letterSpacing: 0.5 }}>RAKAAT 5-8</Text>
                <Pressable 
                  onPress={() => openSpeakerSheet('session2_secondFour')}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F4', borderRadius: 20, paddingVertical: 6, paddingLeft: 6, paddingRight: 10 }}
                >
                  {sessionTwoLineup.secondFourImam?.imam_img ? (
                    <Image source={{ uri: sessionTwoLineup.secondFourImam.imam_img }} style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8 }} />
                  ) : (
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', marginRight: 8, alignItems: 'center', justifyContent: 'center' }}>
                      <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <Path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="#9CA3AF" strokeWidth="1.5"/>
                        <Path d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </Svg>
                    </View>
                  )}
                  <Text style={{ fontSize: 14, fontWeight: '500', color: sessionTwoLineup.secondFourImam?.imam_name ? '#374151' : '#0E519F', marginRight: 4 }}>
                    {sessionTwoLineup.secondFourImam?.imam_name || 'Assign Imam'}
                  </Text>
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <Path d="M6 9L12 15L18 9" stroke="#0E519F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </Pressable>
              </View>

              {/* SPEAKER Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#9CA3AF', letterSpacing: 0.5 }}>SPEAKER</Text>
                <Pressable 
                  onPress={() => openSpeakerSheet('session2_speaker')}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F4', borderRadius: 20, paddingVertical: 6, paddingLeft: 6, paddingRight: 10 }}
                >
                  {sessionTwoLineup.speaker?.speaker_img ? (
                    <Image source={{ uri: sessionTwoLineup.speaker.speaker_img }} style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8 }} />
                  ) : (
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', marginRight: 8, alignItems: 'center', justifyContent: 'center' }}>
                      <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <Path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="#9CA3AF" strokeWidth="1.5"/>
                        <Path d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </Svg>
                    </View>
                  )}
                  <Text style={{ fontSize: 14, fontWeight: '500', color: sessionTwoLineup.speaker?.speaker_name ? '#374151' : '#0E519F', marginRight: 4 }}>
                    {sessionTwoLineup.speaker?.speaker_name || 'Assign Speaker'}
                  </Text>
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <Path d="M6 9L12 15L18 9" stroke="#0E519F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </Pressable>
              </View>

              {/* WITR Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#9CA3AF', letterSpacing: 0.5 }}>WITR</Text>
                <Pressable 
                  onPress={() => openSpeakerSheet('session2_witr')}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F4', borderRadius: 20, paddingVertical: 6, paddingLeft: 6, paddingRight: 10 }}
                >
                  {sessionTwoLineup.witrImam?.imam_img ? (
                    <Image source={{ uri: sessionTwoLineup.witrImam.imam_img }} style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8 }} />
                  ) : (
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', marginRight: 8, alignItems: 'center', justifyContent: 'center' }}>
                      <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <Path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="#9CA3AF" strokeWidth="1.5"/>
                        <Path d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </Svg>
                    </View>
                  )}
                  <Text style={{ fontSize: 14, fontWeight: '500', color: sessionTwoLineup.witrImam?.imam_name ? '#374151' : '#0E519F', marginRight: 4 }}>
                    {sessionTwoLineup.witrImam?.imam_name || 'Assign Imam'}
                  </Text>
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <Path d="M6 9L12 15L18 9" stroke="#0E519F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </Pressable>
              </View>
            </View>

            {/* Save Button */}
            <Pressable
              style={{ backgroundColor: '#0E519F', alignSelf: 'center', width: '100%', height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 30 }}
              onPress={onUpdateTaraweehLineup}
            >
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                Save Lineup
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
      
      {/* Speaker Selection Bottom Sheet */}
      <SelectSpeakerBottomSheet
        isOpen={speakerSheetOpen}
        setIsOpen={setSpeakerSheetOpen}
        speakers={speakers}
        selectedSpeakers={[]}
        onSelectSpeaker={handleSpeakerSelect}
        multiSelect={false}
        title="Select Imam/Speaker"
      />
    </View>
  )
}

export default TaraweehLineupAdmin
