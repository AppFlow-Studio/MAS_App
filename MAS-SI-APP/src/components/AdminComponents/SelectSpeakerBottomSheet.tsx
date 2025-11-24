import { View, Text, Pressable, FlatList, Image, TextInput as RNTextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useState } from 'react'
import Svg, { Path } from 'react-native-svg'
import { BlurView } from 'expo-blur'

interface Speaker {
  speaker_id: string
  speaker_name: string
  speaker_img?: string
  speaker_creds?: string[]
}

interface SelectSpeakerBottomSheetProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  speakers: Speaker[]
  selectedSpeakers?: string[]
  onSelectSpeaker: (speakerId: string) => void
  multiSelect?: boolean
  title?: string
}

const SelectSpeakerBottomSheet = ({
  isOpen,
  setIsOpen,
  speakers,
  selectedSpeakers = [],
  onSelectSpeaker,
  multiSelect = false,
  title = "Select Speaker"
}: SelectSpeakerBottomSheetProps) => {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSpeakers = speakers.filter(speaker =>
    speaker.speaker_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isSelected = (speakerId: string) => selectedSpeakers.includes(speakerId)

  const handleSelect = (speakerId: string) => {
    onSelectSpeaker(speakerId)
    if (!multiSelect) {
      setIsOpen(false)
    }
  }

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setIsOpen(false)}
    >
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable 
            style={{ 
              position: 'absolute', 
              top: 0, 
              bottom: 0, 
              left: 0, 
              right: 0 
            }}
            onPress={() => setIsOpen(false)}
          >
            <BlurView intensity={20} style={{ flex: 1 }} tint="dark" />
          </Pressable>

          <View 
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: '65%',
              width: '100%',
            }}
          >
          {/* Header */}
          <View className="px-6 pt-4 pb-3 border-b border-gray-100">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">{title}</Text>
              <Pressable 
                onPress={() => setIsOpen(false)}
                className="w-8 h-8 items-center justify-center rounded-full bg-gray-100"
              >
                <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <Path d="M15 5L5 15M5 5L15 15" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
                </Svg>
              </Pressable>
            </View>

            {/* Search Bar */}
            <View className="bg-gray-100 rounded-xl px-4 py-3 flex-row items-center">
              <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <Path 
                  d="M8.25 14.25C11.5637 14.25 14.25 11.5637 14.25 8.25C14.25 4.93629 11.5637 2.25 8.25 2.25C4.93629 2.25 2.25 4.93629 2.25 8.25C2.25 11.5637 4.93629 14.25 8.25 14.25Z" 
                  stroke="#9CA3AF" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <Path 
                  d="M15.75 15.75L12.4875 12.4875" 
                  stroke="#9CA3AF" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </Svg>
              <RNTextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search speakers..."
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-3 text-gray-900"
                style={{ fontSize: 16 }}
              />
            </View>
          </View>

          {/* Speaker List */}
          <FlatList
            data={filteredSpeakers}
            keyExtractor={(item) => item.speaker_id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8, paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            renderItem={({ item }) => {
              const selected = isSelected(item.speaker_id)
              return (
                <Pressable
                  onPress={() => handleSelect(item.speaker_id)}
                  className={`flex-row items-center py-3 px-4 rounded-xl mb-2 ${
                    selected ? 'bg-blue-50' : 'bg-white'
                  }`}
                  style={{
                    borderWidth: selected ? 1 : 0,
                    borderColor: selected ? '#6077F5' : 'transparent',
                  }}
                >
                  {/* Avatar */}
                  <View className="mr-4">
                    {item.speaker_img ? (
                      <Image
                        source={{ uri: item.speaker_img }}
                        style={{ width: 50, height: 50, borderRadius: 25 }}
                      />
                    ) : (
                      <View className="w-[50px] h-[50px] rounded-full bg-gray-200 items-center justify-center">
                        <Text className="text-gray-600 text-lg font-bold">
                          {item.speaker_name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Info */}
                  <View className="flex-1">
                    <Text 
                      className={`text-base font-semibold ${
                        selected ? 'text-blue-700' : 'text-gray-900'
                      }`}
                      numberOfLines={1}
                    >
                      {item.speaker_name}
                    </Text>
                    {item.speaker_creds && item.speaker_creds.length > 0 && (
                      <Text 
                        className={`text-sm mt-1 ${
                          selected ? 'text-blue-600' : 'text-gray-500'
                        }`}
                        numberOfLines={1}
                      >
                        {item.speaker_creds[0]}
                      </Text>
                    )}
                  </View>

                  {/* Checkmark */}
                  {selected && (
                    <View className="w-6 h-6 rounded-full bg-blue-600 items-center justify-center ml-3">
                      <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <Path 
                          d="M11.6667 3.5L5.25 9.91667L2.33333 7" 
                          stroke="white" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </View>
                  )}
                </Pressable>
              )
            }}
            ListEmptyComponent={
              <View className="py-8 items-center">
                <Text className="text-gray-400 text-base">No speakers found</Text>
              </View>
            }
          />

          {multiSelect && selectedSpeakers.length > 0 && (
            <View className="px-6 py-3 border-t border-gray-100">
              <Pressable
                onPress={() => setIsOpen(false)}
                className="bg-blue-600 py-3 rounded-xl items-center"
              >
                <Text className="text-white font-semibold text-base">
                  Done ({selectedSpeakers.length} selected)
                </Text>
              </Pressable>
            </View>
          )}
        </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

export default SelectSpeakerBottomSheet

