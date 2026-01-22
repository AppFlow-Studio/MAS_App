import { View, Text, Pressable, Platform, ScrollView, SafeAreaView, TextInput } from 'react-native'
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Icon, ActivityIndicator } from 'react-native-paper'
import { Stack, router } from "expo-router"
import { LinearGradient } from 'expo-linear-gradient'
import { LiquidGlassView, isLiquidGlassSupported } from '@/src/lib/liquidGlass'
import { useAuth } from '@/src/providers/AuthProvider'
import {
  useGroupedInterests,
  useIslamicGoals,
  useIslamicInterests,
  useAllUserPreferences,
  useSavePreferences,
} from '@/src/hooks/usePreferences'
import type {
  PreferencesFormData,
  Gender,
  LifeStage,
  IslamicKnowledgeLevel,
} from '@/src/types/preferences'
import {
  DEFAULT_PREFERENCES_FORM,
  GENDER_OPTIONS,
  LIFE_STAGE_OPTIONS,
  ISLAMIC_KNOWLEDGE_OPTIONS,
  PREFERRED_DAYS_OPTIONS,
  PREFERRED_TIMES_OPTIONS,
  LANGUAGE_OPTIONS,
  SPORTS_OPTIONS,
  CHILDREN_AGE_RANGES,
} from '@/src/types/preferences'

// Step configuration with titles, subtitles, and required fields
const STEPS_CONFIG = [
  { 
    title: 'Demographics', 
    subtitle: 'Tell us about yourself', 
    requiredFields: ['birthYear', 'gender', 'lifeStage'] as const,
    icon: 'account'
  },
  { 
    title: 'Islamic Journey', 
    subtitle: 'Your background', 
    requiredFields: ['islamicKnowledgeLevel'] as const,
    icon: 'book-open-variant'
  },
  { 
    title: 'Availability', 
    subtitle: 'When you can attend', 
    requiredFields: ['preferredDays', 'preferredTimes', 'preferredLanguage'] as const,
    icon: 'calendar-clock'
  },
  { 
    title: 'Interests', 
    subtitle: 'Topics you care about', 
    requiredFields: ['selectedInterestIds'] as const,
    icon: 'star'
  },
  { 
    title: 'Goals', 
    subtitle: 'What you want to achieve', 
    requiredFields: ['selectedGoalIds'] as const,
    icon: 'target'
  },
  { 
    title: 'Review', 
    subtitle: 'Confirm your preferences', 
    requiredFields: [] as const,
    icon: 'check-circle'
  },
]

// Radio button component
const RadioOption = ({ selected, label, description, onPress }: { 
  selected: boolean; label: string; description?: string; onPress: () => void 
}) => (
  <Pressable
    onPress={onPress}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderRadius: 14,
      backgroundColor: selected ? 'rgba(15, 65, 132, 0.12)' : 'rgba(15, 65, 132, 0.04)',
      borderWidth: 2,
      borderColor: selected ? '#0F4184' : 'rgba(15, 65, 132, 0.1)',
      marginBottom: 10,
    }}
  >
    <View style={{
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: selected ? '#0F4184' : 'rgba(15, 65, 132, 0.3)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    }}>
      {selected && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#0F4184' }} />}
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 15, color: selected ? '#0F4184' : '#0f172a' }}>
        {label}
      </Text>
      {description && (
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: selected ? 'rgba(15, 65, 132, 0.7)' : 'rgba(15, 23, 42, 0.5)', marginTop: 2 }}>
          {description}
        </Text>
      )}
    </View>
  </Pressable>
)

// Checkbox option component
const CheckOption = ({ checked, label, sublabel, icon, onPress, compact = false }: { 
  checked: boolean; label: string; sublabel?: string; icon?: string; onPress: () => void; compact?: boolean 
}) => (
  <Pressable
    onPress={onPress}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: compact ? 10 : 14,
      paddingHorizontal: compact ? 14 : 18,
      borderRadius: 14,
      backgroundColor: checked ? 'rgba(15, 65, 132, 0.12)' : 'rgba(15, 65, 132, 0.04)',
      borderWidth: 2,
      borderColor: checked ? '#0F4184' : 'rgba(15, 65, 132, 0.1)',
      marginBottom: 10,
      flex: compact ? 1 : undefined,
    }}
  >
    {icon && <Icon source={icon} size={20} color={checked ? '#0F4184' : 'rgba(15, 65, 132, 0.5)'} />}
    <View style={{ flex: 1, marginLeft: icon ? 12 : 0 }}>
      <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: compact ? 13 : 15, color: checked ? '#0F4184' : '#0f172a' }}>
        {label}
      </Text>
      {sublabel && (
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 11, color: checked ? 'rgba(15, 65, 132, 0.7)' : 'rgba(15, 23, 42, 0.5)', marginTop: 2 }}>
          {sublabel}
        </Text>
      )}
    </View>
    <View style={{
      width: 22, height: 22, borderRadius: 6, borderWidth: 2,
      borderColor: checked ? '#0F4184' : 'rgba(15, 65, 132, 0.3)',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: checked ? '#0F4184' : 'transparent',
    }}>
      {checked && <Icon source="check" size={14} color="#fff" />}
    </View>
  </Pressable>
)

// Toggle switch component for boolean options
const ToggleOption = ({ enabled, label, sublabel, onPress }: {
  enabled: boolean; label: string; sublabel?: string; onPress: () => void
}) => (
  <Pressable
    onPress={onPress}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderRadius: 14,
      backgroundColor: enabled ? 'rgba(15, 65, 132, 0.12)' : 'rgba(15, 65, 132, 0.04)',
      borderWidth: 2,
      borderColor: enabled ? '#0F4184' : 'rgba(15, 65, 132, 0.1)',
      marginBottom: 10,
    }}
  >
    <View style={{ flex: 1 }}>
      <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 15, color: enabled ? '#0F4184' : '#0f172a' }}>
        {label}
      </Text>
      {sublabel && (
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: enabled ? 'rgba(15, 65, 132, 0.7)' : 'rgba(15, 23, 42, 0.5)', marginTop: 2 }}>
          {sublabel}
        </Text>
      )}
    </View>
    <View style={{
      width: 50, height: 28, borderRadius: 14,
      backgroundColor: enabled ? '#0F4184' : 'rgba(15, 65, 132, 0.2)',
      justifyContent: 'center',
      paddingHorizontal: 2,
    }}>
      <View style={{
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: '#fff',
        alignSelf: enabled ? 'flex-end' : 'flex-start',
      }} />
    </View>
  </Pressable>
)

// Required field label component
const RequiredLabel = ({ label, isComplete, showRequired = true }: { 
  label: string; isComplete: boolean; showRequired?: boolean 
}) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
    <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#0f172a' }}>
      {label}
    </Text>
    {showRequired && (
      <View style={{ 
        marginLeft: 8,
        backgroundColor: isComplete ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.08)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        {isComplete ? (
          <>
            <Icon source="check" size={12} color="#16a34a" />
            <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 11, color: '#16a34a', marginLeft: 4 }}>Done</Text>
          </>
        ) : (
          <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 11, color: '#dc2626' }}>Required</Text>
        )}
      </View>
    )}
  </View>
)

// Loading skeleton component
const LoadingSkeleton = () => (
  <View style={{ padding: 20 }}>
    {[1, 2, 3, 4].map((i) => (
      <View key={i} style={{ marginBottom: 16 }}>
        <View style={{ width: '40%', height: 20, backgroundColor: 'rgba(15, 65, 132, 0.1)', borderRadius: 8, marginBottom: 12 }} />
        <View style={{ width: '100%', height: 52, backgroundColor: 'rgba(15, 65, 132, 0.05)', borderRadius: 14, marginBottom: 10 }} />
        <View style={{ width: '100%', height: 52, backgroundColor: 'rgba(15, 65, 132, 0.05)', borderRadius: 14, marginBottom: 10 }} />
      </View>
    ))}
  </View>
)

const PreferencesOnboarding = () => {
  const { session } = useAuth()
  const userId = session?.user?.id

  // TanStack Query hooks
  const { data: groupedInterests, isLoading: interestsLoading } = useGroupedInterests()
  const { data: allInterests } = useIslamicInterests() // Flat list for lookup
  const { data: goals, isLoading: goalsLoading } = useIslamicGoals()
  const { preferences, interests: userInterests, goals: userGoals, isLoading: userDataLoading } = useAllUserPreferences(userId)
  const savePreferencesMutation = useSavePreferences()

  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<PreferencesFormData>(DEFAULT_PREFERENCES_FORM)
  const [isInitialized, setIsInitialized] = useState(false)
  const scrollViewRef = useRef<ScrollView>(null)

  const totalSteps = 6 // Added review step

  // Initialize form with existing user data
  useEffect(() => {
    if (userDataLoading || isInitialized) return

    if (preferences || userInterests.length > 0 || userGoals.length > 0) {
      setFormData({
        birthYear: preferences?.birth_year?.toString() || '',
        gender: preferences?.gender || null,
        lifeStage: preferences?.life_stage || null,
        hasChildren: preferences?.has_children || false,
        childrenAges: preferences?.children_ages || [],
        isRevert: preferences?.is_revert || false,
        revertYear: preferences?.revert_year?.toString() || '',
        islamicKnowledgeLevel: preferences?.islamic_knowledge_level || null,
        preferredDays: preferences?.preferred_days || [],
        preferredTimes: preferences?.preferred_times || [],
        preferredLanguage: preferences?.preferred_language || null,
        preferredSports: preferences?.preferred_sports || [],
        selectedInterestIds: userInterests.map(i => i.interest_id),
        selectedGoalIds: userGoals.map(g => g.goal_id),
      })
    }
    setIsInitialized(true)
  }, [preferences, userInterests, userGoals, userDataLoading, isInitialized])

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false })
      setCurrentStep(prev => prev + 1)
    } else {
      handleComplete()
    }
  }, [currentStep])

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false })
      setCurrentStep(prev => prev - 1)
    } else {
      router.back()
    }
  }, [currentStep])

  const handleComplete = async () => {
    if (!userId) return

    try {
      await savePreferencesMutation.mutateAsync({
        userId,
        formData,
      })
      router.back()
    } catch (error) {
      console.error('Error saving preferences:', error)
    }
  }

  const updateField = useCallback(<K extends keyof PreferencesFormData>(key: K, value: PreferencesFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }, [])

  const toggleStringArrayItem = useCallback((key: keyof PreferencesFormData, value: string) => {
    setFormData(prev => {
      const arr = prev[key] as string[]
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
      }
    })
  }, [])

  const toggleNumberArrayItem = useCallback((key: keyof PreferencesFormData, value: number) => {
    setFormData(prev => {
      const arr = prev[key] as number[]
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
      }
    })
  }, [])

  // Calculate completion percentage
  const calculateCompletionPercentage = useMemo(() => {
    let completed = 0
    const totalQuestions = 9

    // Step 1 (3 questions)
    if (formData.birthYear && formData.birthYear.length === 4) completed++
    if (formData.gender) completed++
    if (formData.lifeStage) completed++

    // Step 2 (1 question - knowledge level)
    if (formData.islamicKnowledgeLevel) completed++

    // Step 3 (3 questions)
    if (formData.preferredDays.length > 0) completed++
    if (formData.preferredTimes.length > 0) completed++
    if (formData.preferredLanguage) completed++

    // Step 4 (1 question)
    if (formData.selectedInterestIds.length > 0) completed++

    // Step 5 (1 question)
    if (formData.selectedGoalIds.length > 0) completed++

    return Math.round((completed / totalQuestions) * 100)
  }, [formData])

  const isLoading = interestsLoading || goalsLoading || userDataLoading

  // Helper function to get display names for selected interests
  const getSelectedInterestNames = useMemo(() => {
    if (!allInterests || formData.selectedInterestIds.length === 0) return []
    return formData.selectedInterestIds
      .map(id => allInterests.find(i => i.id === id)?.category_name)
      .filter(Boolean) as string[]
  }, [allInterests, formData.selectedInterestIds])

  // Helper function to get display names for selected goals
  const getSelectedGoalNames = useMemo(() => {
    if (!goals || formData.selectedGoalIds.length === 0) return []
    return formData.selectedGoalIds
      .map(id => goals.find(g => g.id === id)?.goal_name)
      .filter(Boolean) as string[]
  }, [goals, formData.selectedGoalIds])

  // Helper to get label from options
  const getOptionLabel = (options: { value: string; label: string }[], value: string | null) => {
    if (!value) return 'Not specified'
    return options.find(o => o.value === value)?.label || value
  }

  // Jump to specific step for editing
  const goToStep = useCallback((step: number) => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: false })
    setCurrentStep(step)
  }, [])

  // Validation function to check if current step is complete
  const canProceed = useMemo(() => {
    const currentStepConfig = STEPS_CONFIG[currentStep]
    if (!currentStepConfig || currentStepConfig.requiredFields.length === 0) return true

    return currentStepConfig.requiredFields.every((field) => {
      const value = formData[field as keyof PreferencesFormData]
      
      // Check different types of values
      if (Array.isArray(value)) {
        return value.length > 0
      }
      if (typeof value === 'string') {
        // Special case for birthYear - must be 4 digits
        if (field === 'birthYear') {
          return value.length === 4
        }
        return value.trim() !== ''
      }
      if (typeof value === 'boolean') {
        return true // Booleans are always valid
      }
      return value !== null && value !== undefined
    })
  }, [currentStep, formData])

  // Get incomplete fields for current step (for UI feedback)
  const incompleteFields = useMemo(() => {
    const currentStepConfig = STEPS_CONFIG[currentStep]
    if (!currentStepConfig) return []

    return currentStepConfig.requiredFields.filter((field) => {
      const value = formData[field as keyof PreferencesFormData]
      
      if (Array.isArray(value)) {
        return value.length === 0
      }
      if (typeof value === 'string') {
        if (field === 'birthYear') {
          return value.length !== 4
        }
        return value.trim() === ''
      }
      if (typeof value === 'boolean') {
        return false
      }
      return value === null || value === undefined
    })
  }, [currentStep, formData])

  const renderStepContent = () => {
    if (isLoading && !isInitialized) {
      return <LoadingSkeleton />
    }

    switch (currentStep) {
      // Step 1: Demographics
      case 0:
        return (
          <View>
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 26, color: '#0f172a', marginBottom: 8 }}>
              Help us serve you better
            </Text>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 15, color: 'rgba(15, 23, 42, 0.6)', lineHeight: 22, marginBottom: 24 }}>
              This helps us recommend programs tailored to your life stage.
            </Text>

            {/* Birth Year */}
            <RequiredLabel label="Birth Year" isComplete={formData.birthYear.length === 4} />
            <View style={{
              backgroundColor: 'rgba(15, 65, 132, 0.04)',
              borderRadius: 14,
              borderWidth: 2,
              borderColor: formData.birthYear ? '#0F4184' : 'rgba(15, 65, 132, 0.1)',
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              marginBottom: 24,
            }}>
              <Icon source="calendar" size={22} color={formData.birthYear ? '#0F4184' : 'rgba(15, 65, 132, 0.4)'} />
              <TextInput
                value={formData.birthYear}
                onChangeText={(text) => {
                  const cleaned = text.replace(/\D/g, '').slice(0, 4)
                  updateField('birthYear', cleaned)
                }}
                placeholder="Enter your birth year (e.g., 1990)"
                placeholderTextColor="rgba(15, 65, 132, 0.4)"
                keyboardType="number-pad"
                maxLength={4}
                style={{
                  flex: 1,
                  fontSize: 16,
                  fontFamily: 'Poppins_500Medium',
                  color: '#0f172a',
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                }}
              />
              {formData.birthYear.length === 4 && (
                <View style={{
                  width: 24, height: 24, borderRadius: 12,
                  backgroundColor: '#22c55e',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon source="check" size={14} color="#fff" />
                </View>
              )}
            </View>

            {/* Gender */}
            <RequiredLabel label="Gender" isComplete={formData.gender !== null} />
            {GENDER_OPTIONS.map((opt) => (
              <RadioOption 
                key={opt.value} 
                selected={formData.gender === opt.value} 
                label={opt.label} 
                onPress={() => updateField('gender', opt.value as Gender)} 
              />
            ))}

            {/* Life Stage */}
            <View style={{ marginTop: 12 }}>
              <RequiredLabel label="Life Stage" isComplete={formData.lifeStage !== null} />
            </View>
            {LIFE_STAGE_OPTIONS.map((opt) => (
              <RadioOption 
                key={opt.value} 
                selected={formData.lifeStage === opt.value} 
                label={opt.label} 
                onPress={() => updateField('lifeStage', opt.value as LifeStage)} 
              />
            ))}

            {/* Has Children Toggle */}
            <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#0f172a', marginBottom: 12, marginTop: 12 }}>Do you have children?</Text>
            <ToggleOption
              enabled={formData.hasChildren}
              label={formData.hasChildren ? 'Yes, I have children' : 'No children'}
              onPress={() => {
                updateField('hasChildren', !formData.hasChildren)
                if (formData.hasChildren) {
                  updateField('childrenAges', [])
                }
              }}
            />

            {/* Children Ages (conditional) */}
            {formData.hasChildren && (
              <>
                <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#0f172a', marginBottom: 12, marginTop: 12 }}>Children's Ages</Text>
                {CHILDREN_AGE_RANGES.map((opt) => (
                  <CheckOption 
                    key={opt.value} 
                    checked={formData.childrenAges.includes(opt.value)} 
                    label={opt.label} 
                    onPress={() => toggleNumberArrayItem('childrenAges', opt.value)} 
                  />
                ))}
              </>
            )}
          </View>
        )

      // Step 2: Islamic Journey
      case 1:
        return (
          <View>
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 26, color: '#0f172a', marginBottom: 8 }}>
              Your Islamic Journey
            </Text>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 15, color: 'rgba(15, 23, 42, 0.6)', lineHeight: 22, marginBottom: 24 }}>
              Help us understand your background to suggest appropriate programs.
            </Text>

            {/* Revert Toggle */}
            <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#0f172a', marginBottom: 12 }}>Are you a revert/convert?</Text>
            <ToggleOption
              enabled={formData.isRevert}
              label={formData.isRevert ? 'Yes, I am a revert' : 'No, I was born Muslim'}
              sublabel={formData.isRevert ? "We'll connect you with convert support resources" : undefined}
              onPress={() => {
                updateField('isRevert', !formData.isRevert)
                if (!formData.isRevert) {
                  updateField('revertYear', '')
                }
              }}
            />

            {/* Revert Year (conditional) */}
            {formData.isRevert && (
              <>
                <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#0f172a', marginBottom: 12, marginTop: 12 }}>Year you accepted Islam</Text>
                <View style={{
                  backgroundColor: 'rgba(15, 65, 132, 0.04)',
                  borderRadius: 14,
                  borderWidth: 2,
                  borderColor: formData.revertYear ? '#0F4184' : 'rgba(15, 65, 132, 0.1)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  marginBottom: 24,
                }}>
                  <Icon source="heart" size={22} color={formData.revertYear ? '#0F4184' : 'rgba(15, 65, 132, 0.4)'} />
                  <TextInput
                    value={formData.revertYear}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/\D/g, '').slice(0, 4)
                      updateField('revertYear', cleaned)
                    }}
                    placeholder="e.g., 2020"
                    placeholderTextColor="rgba(15, 65, 132, 0.4)"
                    keyboardType="number-pad"
                    maxLength={4}
                    style={{
                      flex: 1,
                      fontSize: 16,
                      fontFamily: 'Poppins_500Medium',
                      color: '#0f172a',
                      paddingVertical: 14,
                      paddingHorizontal: 12,
                    }}
                  />
                </View>
              </>
            )}

            {/* Islamic Knowledge Level */}
            <View style={{ marginTop: 12 }}>
              <RequiredLabel label="Islamic Knowledge Level" isComplete={formData.islamicKnowledgeLevel !== null} />
            </View>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 13, color: 'rgba(15, 23, 42, 0.5)', marginBottom: 16, marginTop: -4 }}>
              This helps us suggest programs at the right level for you.
            </Text>
            {ISLAMIC_KNOWLEDGE_OPTIONS.map((opt) => (
              <RadioOption 
                key={opt.value} 
                selected={formData.islamicKnowledgeLevel === opt.value} 
                label={opt.label}
                description={opt.description}
                onPress={() => updateField('islamicKnowledgeLevel', opt.value as IslamicKnowledgeLevel)} 
              />
            ))}
          </View>
        )

      // Step 3: Availability & Language
      case 2:
        return (
          <View>
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 26, color: '#0f172a', marginBottom: 8 }}>
              When can you attend?
            </Text>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 15, color: 'rgba(15, 23, 42, 0.6)', lineHeight: 22, marginBottom: 24 }}>
              We'll prioritize programs that fit your schedule.
            </Text>

            {/* Preferred Days */}
            <RequiredLabel label="Preferred Days" isComplete={formData.preferredDays.length > 0} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {PREFERRED_DAYS_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => toggleStringArrayItem('preferredDays', opt.value)}
                  style={{
                    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20,
                    backgroundColor: formData.preferredDays.includes(opt.value) ? '#0F4184' : 'rgba(15, 65, 132, 0.08)',
                    borderWidth: 1, borderColor: formData.preferredDays.includes(opt.value) ? '#0F4184' : 'rgba(15, 65, 132, 0.15)',
                  }}
                >
                  <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 13, color: formData.preferredDays.includes(opt.value) ? '#fff' : '#0f172a' }}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Preferred Times */}
            <RequiredLabel label="Preferred Times" isComplete={formData.preferredTimes.length > 0} />
            {PREFERRED_TIMES_OPTIONS.map((opt) => (
              <CheckOption 
                key={opt.value} 
                checked={formData.preferredTimes.includes(opt.value)} 
                label={opt.label} 
                sublabel={opt.sublabel} 
                icon={opt.icon} 
                onPress={() => toggleStringArrayItem('preferredTimes', opt.value)} 
              />
            ))}

            {/* Preferred Language */}
            <View style={{ marginTop: 24 }}>
              <RequiredLabel label="Preferred Language" isComplete={formData.preferredLanguage !== null} />
            </View>
            {LANGUAGE_OPTIONS.map((opt) => (
              <RadioOption 
                key={opt.value} 
                selected={formData.preferredLanguage === opt.value} 
                label={opt.label} 
                onPress={() => updateField('preferredLanguage', opt.value)} 
              />
            ))}

            {/* Preferred Sports */}
            <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#0f172a', marginBottom: 12, marginTop: 24 }}>Sports Interests (Optional)</Text>
            {SPORTS_OPTIONS.map((opt) => (
              <CheckOption 
                key={opt.value} 
                checked={formData.preferredSports.includes(opt.value)} 
                label={opt.label} 
                icon={opt.icon} 
                onPress={() => toggleStringArrayItem('preferredSports', opt.value)} 
              />
            ))}
          </View>
        )

      // Step 4: Interests (from database)
      case 3:
        return (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 26, color: '#0f172a' }}>
                Select your interests
              </Text>
              <View style={{ 
                marginLeft: 10,
                backgroundColor: formData.selectedInterestIds.length > 0 ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
              }}>
                <Text style={{ 
                  fontFamily: 'Poppins_600SemiBold', 
                  fontSize: 12, 
                  color: formData.selectedInterestIds.length > 0 ? '#16a34a' : '#dc2626' 
                }}>
                  {formData.selectedInterestIds.length > 0 ? `${formData.selectedInterestIds.length} selected` : 'Required'}
                </Text>
              </View>
            </View>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 15, color: 'rgba(15, 23, 42, 0.6)', lineHeight: 22, marginBottom: 24 }}>
              Choose at least one topic or activity that matters to you.
            </Text>

            {interestsLoading ? (
              <ActivityIndicator size="large" color="#0F4184" style={{ marginTop: 40 }} />
            ) : groupedInterests && groupedInterests.length > 0 ? (
              groupedInterests.map((category) => (
                <View key={category.id} style={{ marginBottom: 24 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    {category.icon_name && (
                      <Icon source={category.icon_name} size={20} color="#0F4184" />
                    )}
                    <Text style={{ 
                      fontFamily: 'Poppins_600SemiBold', 
                      fontSize: 15, 
                      color: '#0F4184', 
                      letterSpacing: 0.5,
                      marginLeft: category.icon_name ? 8 : 0,
                    }}>
                      {category.category_name}
                    </Text>
                  </View>
                  {category.category_description && (
                    <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: 'rgba(15, 23, 42, 0.5)', marginBottom: 12 }}>
                      {category.category_description}
                    </Text>
                  )}
                  {category.children.length > 0 ? (
                    category.children.map((interest) => (
                      <CheckOption 
                        key={interest.id} 
                        checked={formData.selectedInterestIds.includes(interest.id)} 
                        label={interest.category_name}
                        icon={interest.icon_name || undefined}
                        onPress={() => toggleNumberArrayItem('selectedInterestIds', interest.id)} 
                      />
                    ))
                  ) : (
                    // If no children, the parent is selectable itself
                    <CheckOption 
                      checked={formData.selectedInterestIds.includes(category.id)} 
                      label={category.category_name}
                      icon={category.icon_name || undefined}
                      onPress={() => toggleNumberArrayItem('selectedInterestIds', category.id)} 
                    />
                  )}
                </View>
              ))
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Icon source="information-outline" size={48} color="rgba(15, 65, 132, 0.3)" />
                <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 15, color: 'rgba(15, 23, 42, 0.5)', marginTop: 16, textAlign: 'center' }}>
                  No interest categories available yet.
                </Text>
              </View>
            )}
          </View>
        )

      // Step 5: Goals (from database)
      case 4:
        return (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 26, color: '#0f172a' }}>
                What are your goals?
              </Text>
              <View style={{ 
                marginLeft: 10,
                backgroundColor: formData.selectedGoalIds.length > 0 ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
              }}>
                <Text style={{ 
                  fontFamily: 'Poppins_600SemiBold', 
                  fontSize: 12, 
                  color: formData.selectedGoalIds.length > 0 ? '#16a34a' : '#dc2626' 
                }}>
                  {formData.selectedGoalIds.length > 0 ? `${formData.selectedGoalIds.length} selected` : 'Required'}
                </Text>
              </View>
            </View>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 15, color: 'rgba(15, 23, 42, 0.6)', lineHeight: 22, marginBottom: 24 }}>
              Select at least one Islamic goal you'd like to achieve.
            </Text>

            {goalsLoading ? (
              <ActivityIndicator size="large" color="#0F4184" style={{ marginTop: 40 }} />
            ) : goals && goals.length > 0 ? (
              goals.map((goal) => (
                <Pressable
                  key={goal.id}
                  onPress={() => toggleNumberArrayItem('selectedGoalIds', goal.id)}
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 18,
                    borderRadius: 14,
                    backgroundColor: formData.selectedGoalIds.includes(goal.id) ? 'rgba(15, 65, 132, 0.12)' : 'rgba(15, 65, 132, 0.04)',
                    borderWidth: 2,
                    borderColor: formData.selectedGoalIds.includes(goal.id) ? '#0F4184' : 'rgba(15, 65, 132, 0.1)',
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{
                      width: 24, height: 24, borderRadius: 12, borderWidth: 2,
                      borderColor: formData.selectedGoalIds.includes(goal.id) ? '#0F4184' : 'rgba(15, 65, 132, 0.3)',
                      alignItems: 'center', justifyContent: 'center',
                      backgroundColor: formData.selectedGoalIds.includes(goal.id) ? '#0F4184' : 'transparent',
                      marginRight: 14,
                      marginTop: 2,
                    }}>
                      {formData.selectedGoalIds.includes(goal.id) && <Icon source="check" size={14} color="#fff" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ 
                        fontFamily: 'Poppins_600SemiBold', 
                        fontSize: 15, 
                        color: formData.selectedGoalIds.includes(goal.id) ? '#0F4184' : '#0f172a',
                        marginBottom: goal.goal_description ? 4 : 0,
                      }}>
                        {goal.goal_name}
                      </Text>
                      {goal.goal_description && (
                        <Text style={{ 
                          fontFamily: 'Poppins_400Regular', 
                          fontSize: 13, 
                          color: formData.selectedGoalIds.includes(goal.id) ? 'rgba(15, 65, 132, 0.7)' : 'rgba(15, 23, 42, 0.5)',
                          lineHeight: 19,
                        }}>
                          {goal.goal_description}
                        </Text>
                      )}
                    </View>
                  </View>
                </Pressable>
              ))
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Icon source="target" size={48} color="rgba(15, 65, 132, 0.3)" />
                <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 15, color: 'rgba(15, 23, 42, 0.5)', marginTop: 16, textAlign: 'center' }}>
                  No goals available yet.
                </Text>
              </View>
            )}

            {/* Summary Card */}
            {formData.selectedGoalIds.length > 0 && (
              <View style={{
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderRadius: 12,
                padding: 16,
                marginTop: 12,
                borderLeftWidth: 4,
                borderLeftColor: '#22c55e',
              }}>
                <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#16a34a', marginBottom: 4 }}>
                  🎯 {formData.selectedGoalIds.length} goal{formData.selectedGoalIds.length > 1 ? 's' : ''} selected
                </Text>
                <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: 'rgba(15, 23, 42, 0.6)' }}>
                  We'll recommend programs to help you achieve these goals.
                </Text>
              </View>
            )}
          </View>
        )

      // Step 6: Review & Confirm
      case 5:
        return (
          <View>
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 26, color: '#0f172a', marginBottom: 8 }}>
              Review Your Preferences
            </Text>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 15, color: 'rgba(15, 23, 42, 0.6)', lineHeight: 22, marginBottom: 24 }}>
              Please confirm your selections before saving.
            </Text>

            {/* About You Section */}
            <View style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: 'rgba(15, 65, 132, 0.1)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon source="account" size={20} color="#0F4184" />
                  <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: '#0F4184', marginLeft: 8 }}>
                    About You
                  </Text>
                </View>
                <Pressable onPress={() => goToStep(0)} style={{ padding: 4 }}>
                  <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#0F4184' }}>Edit</Text>
                </Pressable>
              </View>
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: 'rgba(15, 23, 42, 0.6)' }}>Birth Year</Text>
                  <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#0f172a' }}>{formData.birthYear || 'Not specified'}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: 'rgba(15, 23, 42, 0.6)' }}>Gender</Text>
                  <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#0f172a' }}>{getOptionLabel(GENDER_OPTIONS, formData.gender)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: 'rgba(15, 23, 42, 0.6)' }}>Life Stage</Text>
                  <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#0f172a' }}>{getOptionLabel(LIFE_STAGE_OPTIONS, formData.lifeStage)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: 'rgba(15, 23, 42, 0.6)' }}>Children</Text>
                  <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#0f172a' }}>
                    {formData.hasChildren 
                      ? `Yes (${formData.childrenAges.length} age group${formData.childrenAges.length !== 1 ? 's' : ''})` 
                      : 'No'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Islamic Journey Section */}
            <View style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: 'rgba(15, 65, 132, 0.1)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon source="book-open-variant" size={20} color="#0F4184" />
                  <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: '#0F4184', marginLeft: 8 }}>
                    Islamic Journey
                  </Text>
                </View>
                <Pressable onPress={() => goToStep(1)} style={{ padding: 4 }}>
                  <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#0F4184' }}>Edit</Text>
                </Pressable>
              </View>
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: 'rgba(15, 23, 42, 0.6)' }}>Revert</Text>
                  <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#0f172a' }}>
                    {formData.isRevert ? `Yes${formData.revertYear ? ` (${formData.revertYear})` : ''}` : 'No'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: 'rgba(15, 23, 42, 0.6)' }}>Knowledge Level</Text>
                  <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#0f172a' }}>{getOptionLabel(ISLAMIC_KNOWLEDGE_OPTIONS, formData.islamicKnowledgeLevel)}</Text>
                </View>
              </View>
            </View>

            {/* Availability Section */}
            <View style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: 'rgba(15, 65, 132, 0.1)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon source="calendar-clock" size={20} color="#0F4184" />
                  <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: '#0F4184', marginLeft: 8 }}>
                    Availability
                  </Text>
                </View>
                <Pressable onPress={() => goToStep(2)} style={{ padding: 4 }}>
                  <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#0F4184' }}>Edit</Text>
                </Pressable>
              </View>
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: 'rgba(15, 23, 42, 0.6)' }}>Days</Text>
                  <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#0f172a', textAlign: 'right', flex: 1, marginLeft: 8 }}>
                    {formData.preferredDays.length > 0 
                      ? formData.preferredDays.map(d => PREFERRED_DAYS_OPTIONS.find(o => o.value === d)?.label).join(', ')
                      : 'Not specified'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: 'rgba(15, 23, 42, 0.6)' }}>Times</Text>
                  <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#0f172a', textAlign: 'right', flex: 1, marginLeft: 8 }}>
                    {formData.preferredTimes.length > 0 
                      ? formData.preferredTimes.map(t => PREFERRED_TIMES_OPTIONS.find(o => o.value === t)?.label).join(', ')
                      : 'Not specified'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: 'rgba(15, 23, 42, 0.6)' }}>Language</Text>
                  <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#0f172a' }}>{getOptionLabel(LANGUAGE_OPTIONS, formData.preferredLanguage)}</Text>
                </View>
                {formData.preferredSports.length > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: 'rgba(15, 23, 42, 0.6)' }}>Sports</Text>
                    <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#0f172a', textAlign: 'right', flex: 1, marginLeft: 8 }}>
                      {formData.preferredSports.map(s => SPORTS_OPTIONS.find(o => o.value === s)?.label).join(', ')}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Interests Section */}
            <View style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: 'rgba(15, 65, 132, 0.1)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon source="star" size={20} color="#0F4184" />
                  <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: '#0F4184', marginLeft: 8 }}>
                    Interests ({getSelectedInterestNames.length})
                  </Text>
                </View>
                <Pressable onPress={() => goToStep(3)} style={{ padding: 4 }}>
                  <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#0F4184' }}>Edit</Text>
                </Pressable>
              </View>
              {getSelectedInterestNames.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {getSelectedInterestNames.map((name, index) => (
                    <View key={index} style={{
                      backgroundColor: 'rgba(15, 65, 132, 0.08)',
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: 16,
                    }}>
                      <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#0F4184' }}>{name}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: 'rgba(15, 23, 42, 0.5)', fontStyle: 'italic' }}>
                  No interests selected
                </Text>
              )}
            </View>

            {/* Goals Section */}
            <View style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: 'rgba(15, 65, 132, 0.1)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon source="target" size={20} color="#0F4184" />
                  <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: '#0F4184', marginLeft: 8 }}>
                    Goals ({getSelectedGoalNames.length})
                  </Text>
                </View>
                <Pressable onPress={() => goToStep(4)} style={{ padding: 4 }}>
                  <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#0F4184' }}>Edit</Text>
                </Pressable>
              </View>
              {getSelectedGoalNames.length > 0 ? (
                <View style={{ gap: 8 }}>
                  {getSelectedGoalNames.map((name, index) => (
                    <View key={index} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Icon source="check-circle" size={16} color="#22c55e" />
                      <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#0f172a', marginLeft: 8 }}>{name}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: 'rgba(15, 23, 42, 0.5)', fontStyle: 'italic' }}>
                  No goals selected
                </Text>
              )}
            </View>

            {/* Confirmation Note */}
            <View style={{
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              borderRadius: 12,
              padding: 16,
              borderLeftWidth: 4,
              borderLeftColor: '#22c55e',
            }}>
              <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#16a34a', marginBottom: 4 }}>
                Ready to save?
              </Text>
              <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 13, color: 'rgba(15, 23, 42, 0.6)', lineHeight: 19 }}>
                You can update your preferences anytime from your profile settings.
              </Text>
            </View>
          </View>
        )

      default:
        return null
    }
  }

  const isSaving = savePreferencesMutation.isPending

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      
      {/* Blue Header Area - extends to top of screen */}
      <View style={{ backgroundColor: '#0F4184' }}>
        <SafeAreaView>
          {/* Header - Blue Background */}
          <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pressable onPress={handleBack}>
              <LiquidGlassView 
                style={{ 
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                interactive
                effect="clear"
              >
                <Icon source="arrow-left" size={22} color="#ffffff" />
              </LiquidGlassView>
            </Pressable>
            
            {/* Percentage */}
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#ffffff' }}>
                {calculateCompletionPercentage}%
              </Text>
              <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 11, color: 'rgba(255, 255, 255, 0.7)' }}>
                Complete
              </Text>
            </View>
            
            {/* Skip button */}
            <Pressable onPress={() => router.back()} style={{ padding: 10 }}>
              <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 16, color: 'rgba(255, 255, 255, 0.9)' }}>
                Skip
              </Text>
            </Pressable>
          </View>
          
          {/* Progress bar */}
          <View style={{ marginTop: 16, height: 6, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 3 }}>
            <View 
              style={{ 
                width: `${calculateCompletionPercentage}%`, 
                height: '100%', 
                backgroundColor: '#ffffff', 
                borderRadius: 3 
              }} 
            />
          </View>
          
          {/* Step indicators */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View key={i} style={{ alignItems: 'center' }}>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: i < currentStep ? '#22c55e' : (i === currentStep ? '#ffffff' : 'rgba(255, 255, 255, 0.2)'),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {i < currentStep ? (
                    <Icon source="check" size={14} color="#ffffff" />
                  ) : (
                    <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: i === currentStep ? '#0F4184' : 'rgba(255, 255, 255, 0.5)' }}>
                      {i + 1}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
        </SafeAreaView>
      </View>

      {/* Content Area - Light Background */}
      <LinearGradient colors={['#ffffff', '#f8fafc', '#f1f5f9']} style={{ flex: 1 }}>
        {/* Content */}
        <ScrollView 
          ref={scrollViewRef}
          style={{ flex: 1 }} 
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Step Label */}
          <View style={{ 
            backgroundColor: 'rgba(15, 65, 132, 0.06)', 
            borderRadius: 12, 
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#0F4184',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}>
              <Icon source={STEPS_CONFIG[currentStep]?.icon || 'help-circle'} size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ 
                fontFamily: 'Poppins_600SemiBold', 
                fontSize: 14, 
                color: '#0F4184',
              }}>
                Step {currentStep + 1} of {totalSteps}: {STEPS_CONFIG[currentStep]?.title}
              </Text>
              <Text style={{ 
                fontFamily: 'Poppins_400Regular', 
                fontSize: 12, 
                color: 'rgba(15, 23, 42, 0.6)',
                marginTop: 2,
              }}>
                {STEPS_CONFIG[currentStep]?.subtitle}
              </Text>
            </View>
            {canProceed && currentStep < totalSteps - 1 && (
              <View style={{
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
              }}>
                <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 11, color: '#16a34a' }}>Ready</Text>
              </View>
            )}
          </View>
          {renderStepContent()}
        </ScrollView>

        {/* Bottom Button */}
        <View style={{
          paddingHorizontal: 20,
          paddingBottom: Platform.OS === 'ios' ? 30 : 20,
          paddingTop: 16,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(15, 65, 132, 0.08)',
        }}>
          {/* Validation message when can't proceed */}
          {!canProceed && incompleteFields.length > 0 && (
            <View style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              borderRadius: 10,
              padding: 12,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Icon source="alert-circle-outline" size={18} color="#dc2626" />
              <Text style={{ 
                fontFamily: 'Poppins_500Medium', 
                fontSize: 13, 
                color: '#dc2626',
                marginLeft: 8,
                flex: 1,
              }}>
                Please complete all required fields to continue
              </Text>
            </View>
          )}
          
          <Pressable
            onPress={handleNext}
            disabled={isSaving || !canProceed}
            style={{
              backgroundColor: canProceed ? '#0F4184' : 'rgba(15, 65, 132, 0.3)',
              paddingVertical: 16,
              borderRadius: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" size={22} />
            ) : (
              <>
                <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 17, marginRight: 8 }}>
                  {currentStep === totalSteps - 1 ? 'Confirm & Save' : 'Continue'}
                </Text>
                <Icon source={currentStep === totalSteps - 1 ? 'check' : 'arrow-right'} size={18} color="#fff" />
              </>
            )}
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  )
}

export default PreferencesOnboarding
