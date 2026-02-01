import { View, Text, Pressable, ScrollView, Modal, Platform, KeyboardAvoidingView } from 'react-native'
import React, { useState, useMemo, useCallback } from 'react'
import Svg, { Path } from 'react-native-svg'
import { BlurView } from 'expo-blur'
import { Icon } from 'react-native-paper'
import {
  useGroupedIslamicInterests,
  useGroupedProgramTags,
  LIFE_STAGE_OPTIONS,
  GENDER_OPTIONS,
  KNOWLEDGE_LEVEL_OPTIONS,
  type ProgramTag,
} from '@/src/hooks/useProgramTags'
import type { IslamicInterestCategory } from '@/src/types/preferences'

// Types for selected preferences
export interface SelectedPreferences {
  targetAudience: string[] // tag_keys from audience tags
  topicInterests: number[] // IDs from islamic_interest_categories
  knowledgeLevel: string | null // beginner, intermediate, advanced
  lifeStages: string[] // life stage values
  gender: string | null // brothers, sisters, all
  programTags: number[] // Additional tag IDs from program_tags
}

export const DEFAULT_SELECTED_PREFERENCES: SelectedPreferences = {
  targetAudience: [],
  topicInterests: [],
  knowledgeLevel: null,
  lifeStages: [],
  gender: 'all',
  programTags: [],
}

interface SelectPreferencesBottomSheetProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  selectedPreferences: SelectedPreferences
  onPreferencesChange: (preferences: SelectedPreferences) => void
}

// Step configuration
const STEPS_CONFIG = [
  { 
    key: 'audience', 
    title: 'Audience', 
    subtitle: 'Who is this program for?',
    icon: 'account-group',
    requiredFields: ['gender'] as const,
  },
  { 
    key: 'topics', 
    title: 'Topics', 
    subtitle: 'What subjects does it cover?',
    icon: 'book-open-variant',
    requiredFields: [] as const, // Topics are optional
  },
  { 
    key: 'level', 
    title: 'Level', 
    subtitle: 'Expected knowledge level',
    icon: 'chart-bar',
    requiredFields: [] as const, // Level is optional
  },
  { 
    key: 'lifeStage', 
    title: 'Life Stage', 
    subtitle: 'Target life stages',
    icon: 'account-clock',
    requiredFields: [] as const, // Life stage is optional
  },
]

const SelectPreferencesBottomSheet = ({
  isOpen,
  setIsOpen,
  selectedPreferences,
  onPreferencesChange,
}: SelectPreferencesBottomSheetProps) => {
  const [currentStep, setCurrentStep] = useState(0)
  const totalSteps = STEPS_CONFIG.length
  
  // Fetch data
  const { data: groupedInterests, isLoading: interestsLoading } = useGroupedIslamicInterests()
  const { data: groupedTags, isLoading: tagsLoading } = useGroupedProgramTags()

  const isLoading = interestsLoading || tagsLoading

  // Reset step when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
    }
  }, [isOpen])

  // Toggle functions
  const toggleGender = (value: string) => {
    onPreferencesChange({
      ...selectedPreferences,
      gender: selectedPreferences.gender === value ? 'all' : value,
    })
  }

  const toggleAudienceTag = (tagKey: string) => {
    const current = selectedPreferences.targetAudience
    const updated = current.includes(tagKey)
      ? current.filter(k => k !== tagKey)
      : [...current, tagKey]
    onPreferencesChange({ ...selectedPreferences, targetAudience: updated })
  }

  const toggleTopicInterest = (interestId: number) => {
    const current = selectedPreferences.topicInterests
    const updated = current.includes(interestId)
      ? current.filter(id => id !== interestId)
      : [...current, interestId]
    onPreferencesChange({ ...selectedPreferences, topicInterests: updated })
  }

  const toggleKnowledgeLevel = (value: string) => {
    onPreferencesChange({
      ...selectedPreferences,
      knowledgeLevel: selectedPreferences.knowledgeLevel === value ? null : value,
    })
  }

  const toggleLifeStage = (value: string) => {
    const current = selectedPreferences.lifeStages
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    onPreferencesChange({ ...selectedPreferences, lifeStages: updated })
  }

  // Check if current step is complete
  const canProceed = useMemo(() => {
    const step = STEPS_CONFIG[currentStep]
    if (!step) return true

    // Gender is always set (defaults to 'all'), so audience step is always valid
    return true
  }, [currentStep, selectedPreferences])

  // Get selections count for each step
  const getStepSelectionCount = useCallback((stepIndex: number) => {
    switch (stepIndex) {
      case 0: // Audience
        let count = 0
        if (selectedPreferences.gender && selectedPreferences.gender !== 'all') count++
        count += selectedPreferences.targetAudience.length
        return count
      case 1: // Topics
        return selectedPreferences.topicInterests.length
      case 2: // Level
        return selectedPreferences.knowledgeLevel ? 1 : 0
      case 3: // Life Stage
        return selectedPreferences.lifeStages.length
      default:
        return 0
    }
  }, [selectedPreferences])

  // Count total selections
  const totalSelections = useMemo(() => {
    let count = 0
    if (selectedPreferences.gender && selectedPreferences.gender !== 'all') count++
    count += selectedPreferences.targetAudience.length
    count += selectedPreferences.topicInterests.length
    if (selectedPreferences.knowledgeLevel) count++
    count += selectedPreferences.lifeStages.length
    return count
  }, [selectedPreferences])

  // Navigation
  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      setIsOpen(false)
    }
  }, [currentStep, totalSteps, setIsOpen])

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  // Chip component for selections
  const SelectionChip = ({ 
    label, 
    selected, 
    onPress 
  }: { 
    label: string
    selected: boolean
    onPress: () => void 
  }) => (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center px-4 py-2.5 rounded-xl mr-2 mb-2 ${
        selected ? 'bg-blue-500' : 'bg-gray-100'
      }`}
    >
      <Text className={`text-sm font-medium ${selected ? 'text-white' : 'text-gray-700'}`}>
        {label}
      </Text>
      {selected && (
        <View className="ml-2">
          <Icon source="check" size={16} color="white" />
        </View>
      )}
    </Pressable>
  )

  // Section header component
  const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <View className="mb-3">
      <Text className="text-base font-bold text-gray-900">{title}</Text>
      {subtitle && <Text className="text-sm text-gray-500 mt-1">{subtitle}</Text>}
    </View>
  )

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Audience
        return (
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            {/* Gender Selection */}
            <View className="mb-6">
              <SectionHeader 
                title="Gender" 
                subtitle="Who is this program primarily for?"
              />
              <View className="flex-row flex-wrap">
                {GENDER_OPTIONS.map(option => (
                  <SelectionChip
                    key={option.value}
                    label={option.label}
                    selected={selectedPreferences.gender === option.value}
                    onPress={() => toggleGender(option.value)}
                  />
                ))}
              </View>
            </View>

            {/* Audience Tags from Database */}
            {groupedTags.audience.length > 0 && (
              <View className="mb-6">
                <SectionHeader 
                  title="Target Groups" 
                  subtitle="Select specific groups this program targets"
                />
                <View className="flex-row flex-wrap">
                  {groupedTags.audience.map((tag: ProgramTag) => (
                    <SelectionChip
                      key={tag.tag_key}
                      label={tag.tag_name}
                      selected={selectedPreferences.targetAudience.includes(tag.tag_key)}
                      onPress={() => toggleAudienceTag(tag.tag_key)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Default audience options if no tags in DB */}
            {groupedTags.audience.length === 0 && (
              <View className="mb-6">
                <SectionHeader 
                  title="Target Groups" 
                  subtitle="Select specific groups this program targets"
                />
                <View className="flex-row flex-wrap">
                  {[
                    { key: 'youth', label: 'Youth' },
                    { key: 'families', label: 'Families' },
                    { key: 'reverts', label: 'Converts/Reverts' },
                    { key: 'seniors', label: 'Seniors' },
                    { key: 'singles', label: 'Singles' },
                    { key: 'couples', label: 'Couples' },
                  ].map(option => (
                    <SelectionChip
                      key={option.key}
                      label={option.label}
                      selected={selectedPreferences.targetAudience.includes(option.key)}
                      onPress={() => toggleAudienceTag(option.key)}
                    />
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        )

      case 1: // Topics
        return (
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            <SectionHeader 
              title="Islamic Topics" 
              subtitle="What subjects does this program cover?"
            />
            
            {isLoading ? (
              <View className="py-8 items-center">
                <Text className="text-gray-400">Loading topics...</Text>
              </View>
            ) : groupedInterests.length > 0 ? (
              groupedInterests.map((parent: IslamicInterestCategory & { children: IslamicInterestCategory[] }) => (
                <View key={parent.id} className="mb-5">
                  <Text className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                    {parent.category_name}
                  </Text>
                  <View className="flex-row flex-wrap">
                    {/* Parent as selectable option */}
                    <SelectionChip
                      label={parent.category_name}
                      selected={selectedPreferences.topicInterests.includes(parent.id)}
                      onPress={() => toggleTopicInterest(parent.id)}
                    />
                    {/* Children */}
                    {parent.children?.map((child: IslamicInterestCategory) => (
                      <SelectionChip
                        key={child.id}
                        label={child.category_name}
                        selected={selectedPreferences.topicInterests.includes(child.id)}
                        onPress={() => toggleTopicInterest(child.id)}
                      />
                    ))}
                  </View>
                </View>
              ))
            ) : (
              <View className="flex-row flex-wrap">
                {[
                  { id: 1, label: 'Quran Study' },
                  { id: 2, label: 'Fiqh (Islamic Law)' },
                  { id: 3, label: 'Seerah (Prophet\'s Life)' },
                  { id: 4, label: 'Aqeedah (Beliefs)' },
                  { id: 5, label: 'Spirituality' },
                  { id: 6, label: 'Arabic Language' },
                  { id: 7, label: 'Family & Marriage' },
                  { id: 8, label: 'Youth Development' },
                ].map(topic => (
                  <SelectionChip
                    key={topic.id}
                    label={topic.label}
                    selected={selectedPreferences.topicInterests.includes(topic.id)}
                    onPress={() => toggleTopicInterest(topic.id)}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        )

      case 2: // Level
        return (
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            <SectionHeader 
              title="Knowledge Level" 
              subtitle="What level of Islamic knowledge is expected?"
            />
            <View className="flex-row flex-wrap mb-6">
              {KNOWLEDGE_LEVEL_OPTIONS.map(option => (
                <SelectionChip
                  key={option.value}
                  label={option.label}
                  selected={selectedPreferences.knowledgeLevel === option.value}
                  onPress={() => toggleKnowledgeLevel(option.value)}
                />
              ))}
            </View>

            {/* Description for each level */}
            <View className="bg-gray-50 rounded-xl p-4">
              <View className="flex-row items-start mb-3">
                <View className="w-2 h-2 rounded-full bg-green-500 mt-1.5 mr-3" />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-800">Beginner</Text>
                  <Text className="text-xs text-gray-500">New to learning about Islam</Text>
                </View>
              </View>
              <View className="flex-row items-start mb-3">
                <View className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5 mr-3" />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-800">Intermediate</Text>
                  <Text className="text-xs text-gray-500">Some foundational knowledge</Text>
                </View>
              </View>
              <View className="flex-row items-start">
                <View className="w-2 h-2 rounded-full bg-red-500 mt-1.5 mr-3" />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-800">Advanced</Text>
                  <Text className="text-xs text-gray-500">Strong Islamic foundation</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        )

      case 3: // Life Stage
        return (
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            <SectionHeader 
              title="Life Stage" 
              subtitle="What life stage is this program suited for?"
            />
            <View className="flex-row flex-wrap">
              {LIFE_STAGE_OPTIONS.map(option => (
                <SelectionChip
                  key={option.value}
                  label={option.label}
                  selected={selectedPreferences.lifeStages.includes(option.value)}
                  onPress={() => toggleLifeStage(option.value)}
                />
              ))}
            </View>
          </ScrollView>
        )

      default:
        return null
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
              borderRadius: 40,
              marginHorizontal: 10,
              marginBottom: Platform.OS === 'ios' ? 12 : 10,
              height: '80%',
              width: undefined,
            }}
          >
            {/* Header */}
            <View className="px-6 pt-4 pb-3 border-b border-gray-100">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-1">
                  <Text className="text-xl font-bold text-gray-900">Target Preferences</Text>
                  <Text className="text-sm text-gray-500 mt-1">
                    {totalSelections > 0 
                      ? `${totalSelections} preference${totalSelections !== 1 ? 's' : ''} selected` 
                      : 'Define who this program is for'}
                  </Text>
                </View>
                <Pressable 
                  onPress={() => setIsOpen(false)}
                  className="w-8 h-8 items-center justify-center rounded-full bg-gray-100"
                >
                  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <Path d="M15 5L5 15M5 5L15 15" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
                  </Svg>
                </Pressable>
              </View>

              {/* Progress Bar */}
              <View className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <View 
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                />
              </View>

              {/* Step Indicators */}
              <View className="flex-row justify-between mt-3">
                {STEPS_CONFIG.map((step, index) => {
                  const isActive = index === currentStep
                  const isCompleted = index < currentStep
                  const selectionCount = getStepSelectionCount(index)
                  
                  return (
                    <Pressable 
                      key={step.key}
                      onPress={() => setCurrentStep(index)}
                      className="items-center flex-1"
                    >
                      <View 
                        className={`w-8 h-8 rounded-full items-center justify-center mb-1 ${
                          isActive ? 'bg-blue-500' : 
                          isCompleted ? 'bg-blue-100' : 'bg-gray-100'
                        }`}
                      >
                        {isCompleted ? (
                          <Icon source="check" size={16} color="#3B82F6" />
                        ) : (
                          <Icon 
                            source={step.icon} 
                            size={16} 
                            color={isActive ? 'white' : '#9CA3AF'} 
                          />
                        )}
                      </View>
                      <Text 
                        className={`text-xs font-medium ${
                          isActive ? 'text-blue-600' : 'text-gray-400'
                        }`}
                      >
                        {step.title}
                      </Text>
                      {selectionCount > 0 && (
                        <View className="bg-blue-100 rounded-full px-1.5 py-0.5 mt-0.5">
                          <Text className="text-xs font-semibold text-blue-600">{selectionCount}</Text>
                        </View>
                      )}
                    </Pressable>
                  )
                })}
              </View>
            </View>

            {/* Step Title */}
            <View className="px-6 pt-4 pb-2">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-3">
                  <Icon source={STEPS_CONFIG[currentStep]?.icon || 'help'} size={22} color="#3B82F6" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-blue-600">
                    Step {currentStep + 1} of {totalSteps}
                  </Text>
                  <Text className="text-lg font-bold text-gray-900">
                    {STEPS_CONFIG[currentStep]?.title}
                  </Text>
                </View>
                {getStepSelectionCount(currentStep) > 0 && (
                  <View className="bg-green-100 rounded-full px-3 py-1">
                    <Text className="text-sm font-semibold text-green-600">
                      {getStepSelectionCount(currentStep)} selected
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Content */}
            <View className="flex-1 px-6 pt-2">
              {renderStepContent()}
            </View>

            {/* Footer with Navigation Buttons */}
            <View className="px-6 py-4 border-t border-gray-100">
              <View className="flex-row gap-3">
                {currentStep > 0 ? (
                  <Pressable
                    onPress={handleBack}
                    className="flex-1 py-3.5 rounded-xl items-center bg-gray-100 flex-row justify-center"
                  >
                    <Icon source="arrow-left" size={18} color="#374151" />
                    <Text className="text-gray-700 font-semibold ml-2">Back</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => onPreferencesChange(DEFAULT_SELECTED_PREFERENCES)}
                    className="flex-1 py-3.5 rounded-xl items-center bg-gray-100"
                  >
                    <Text className="text-gray-700 font-semibold">Clear All</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={handleNext}
                  disabled={!canProceed}
                  className={`flex-[2] py-3.5 rounded-xl items-center flex-row justify-center ${
                    canProceed ? 'bg-blue-600' : 'bg-blue-300'
                  }`}
                >
                  <Text className="text-white font-semibold">
                    {currentStep === totalSteps - 1 ? 'Done' : 'Next'}
                  </Text>
                  {currentStep < totalSteps - 1 && (
                    <Icon source="arrow-right" size={18} color="white" />
                  )}
                  {currentStep === totalSteps - 1 && totalSelections > 0 && (
                    <Text className="text-white font-semibold ml-1">({totalSelections})</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

export default SelectPreferencesBottomSheet
