import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/src/lib/supabase'
import { useMemo } from 'react'
import type {
  UserPreferences,
  IslamicInterestCategory,
  IslamicGoal,
  UserIslamicInterest,
  UserIslamicGoal,
  GroupedInterestCategory,
  PreferencesFormData,
} from '@/src/types/preferences'
import type { Program, EventsType } from '@/src/types'

// Query keys for cache management
export const PREFERENCE_QUERY_KEYS = {
  islamicInterests: ['islamic-interests'] as const,
  islamicGoals: ['islamic-goals'] as const,
  userPreferences: (userId: string) => ['user-preferences', userId] as const,
  userInterests: (userId: string) => ['user-interests', userId] as const,
  userGoals: (userId: string) => ['user-goals', userId] as const,
  recommendedPrograms: (userId: string) => ['recommended-programs', userId] as const,
  recommendedEvents: (userId: string) => ['recommended-events', userId] as const,
}

/**
 * Hook to fetch all islamic interest categories
 */
export const useIslamicInterests = () => {
  return useQuery({
    queryKey: PREFERENCE_QUERY_KEYS.islamicInterests,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('islamic_interest_categories')
        .select('*')
        .order('display_order')

      if (error) {
        console.error('Error fetching islamic interests:', error)
        throw error
      }

      return data as IslamicInterestCategory[]
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - these rarely change
  })
}

/**
 * Hook to get grouped interests (parent categories with children)
 */
export const useGroupedInterests = () => {
  const { data: interests, isLoading, error } = useIslamicInterests()

  const groupedInterests = useMemo(() => {
    if (!interests) return []

    // Get parent categories (no parent_category_id)
    const parents = interests.filter((i) => !i.parent_category_id)

    // Map parents with their children
    return parents.map((parent) => ({
      ...parent,
      children: interests.filter((i) => i.parent_category_id === parent.id),
    })) as GroupedInterestCategory[]
  }, [interests])

  return { data: groupedInterests, isLoading, error }
}

/**
 * Hook to fetch all islamic goals
 */
export const useIslamicGoals = () => {
  return useQuery({
    queryKey: PREFERENCE_QUERY_KEYS.islamicGoals,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('islamic_goals')
        .select('*')
        .order('display_order')

      if (error) {
        console.error('Error fetching islamic goals:', error)
        throw error
      }

      return data as IslamicGoal[]
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to fetch user's existing preferences
 */
export const useUserPreferences = (userId: string | undefined) => {
  return useQuery({
    queryKey: PREFERENCE_QUERY_KEYS.userPreferences(userId ?? ''),
    queryFn: async () => {
      if (!userId) return null

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        // No preferences yet is ok
        if (error.code === 'PGRST116') {
          return null
        }
        console.error('Error fetching user preferences:', error)
        throw error
      }

      return data as UserPreferences
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to fetch user's selected interests
 */
export const useUserIslamicInterests = (userId: string | undefined) => {
  return useQuery({
    queryKey: PREFERENCE_QUERY_KEYS.userInterests(userId ?? ''),
    queryFn: async () => {
      if (!userId) return []

      const { data, error } = await supabase
        .from('user_islamic_interests')
        .select('*')
        .eq('user_id', userId)

      if (error) {
        console.error('Error fetching user interests:', error)
        throw error
      }

      return data as UserIslamicInterest[]
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to fetch user's selected goals
 */
export const useUserIslamicGoals = (userId: string | undefined) => {
  return useQuery({
    queryKey: PREFERENCE_QUERY_KEYS.userGoals(userId ?? ''),
    queryFn: async () => {
      if (!userId) return []

      const { data, error } = await supabase
        .from('user_islamic_goals')
        .select('*')
        .eq('user_id', userId)

      if (error) {
        console.error('Error fetching user goals:', error)
        throw error
      }

      return data as UserIslamicGoal[]
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Combined hook to load all user preference data at once
 */
export const useAllUserPreferences = (userId: string | undefined) => {
  const preferences = useUserPreferences(userId)
  const interests = useUserIslamicInterests(userId)
  const goals = useUserIslamicGoals(userId)

  const isLoading = preferences.isLoading || interests.isLoading || goals.isLoading
  const error = preferences.error || interests.error || goals.error

  return {
    preferences: preferences.data,
    interests: interests.data ?? [],
    goals: goals.data ?? [],
    isLoading,
    error,
  }
}

// Type for the save mutation input
interface SavePreferencesInput {
  userId: string
  formData: PreferencesFormData
}

/**
 * Mutation hook to save all preferences at once
 */
export const useSavePreferences = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, formData }: SavePreferencesInput) => {
      console.log('[SavePreferences] Starting save for user:', userId)
      console.log('[SavePreferences] Form data:', JSON.stringify(formData, null, 2))

      // 1. Upsert user_preferences
      const preferencesPayload: Partial<UserPreferences> = {
        user_id: userId,
        birth_year: formData.birthYear ? parseInt(formData.birthYear, 10) : null,
        gender: formData.gender,
        life_stage: formData.lifeStage,
        has_children: formData.hasChildren,
        children_ages: formData.childrenAges.length > 0 ? formData.childrenAges : null,
        is_revert: formData.isRevert,
        revert_year: formData.revertYear ? parseInt(formData.revertYear, 10) : null,
        islamic_knowledge_level: formData.islamicKnowledgeLevel,
        preferred_days: formData.preferredDays,
        preferred_times: formData.preferredTimes,
        preferred_language: formData.preferredLanguage,
        preferred_sports: formData.preferredSports,
      }

      console.log('[SavePreferences] Upserting user_preferences...')
      const { error: preferencesError } = await supabase
        .from('user_preferences')
        .upsert(preferencesPayload, { onConflict: 'user_id' })

      if (preferencesError) {
        console.error('[SavePreferences] Error saving preferences:', preferencesError)
        throw preferencesError
      }
      console.log('[SavePreferences] user_preferences saved successfully')

      // 2. Replace user_islamic_interests
      console.log('[SavePreferences] Deleting existing interests...')
      const { error: deleteInterestsError } = await supabase
        .from('user_islamic_interests')
        .delete()
        .eq('user_id', userId)

      if (deleteInterestsError) {
        console.error('[SavePreferences] Error deleting interests:', deleteInterestsError)
        throw deleteInterestsError
      }

      // Then insert new selections
      if (formData.selectedInterestIds.length > 0) {
        // Ensure interest_id is explicitly a number (bigint in DB)
        const interestsPayload = formData.selectedInterestIds.map((interestId) => ({
          user_id: userId,
          interest_id: Number(interestId),
          interest_level: 3,
        }))

        console.log('[SavePreferences] Inserting interests:', interestsPayload)
        const { error: insertInterestsError } = await supabase
          .from('user_islamic_interests')
          .insert(interestsPayload)

        if (insertInterestsError) {
          console.error('[SavePreferences] Error inserting interests:', insertInterestsError)
          throw insertInterestsError
        }
        console.log('[SavePreferences] Interests saved successfully')
      } else {
        console.log('[SavePreferences] No interests to save')
      }

      // 3. Replace user_islamic_goals
      console.log('[SavePreferences] Deleting existing goals...')
      const { error: deleteGoalsError } = await supabase
        .from('user_islamic_goals')
        .delete()
        .eq('user_id', userId)

      if (deleteGoalsError) {
        console.error('[SavePreferences] Error deleting goals:', deleteGoalsError)
        throw deleteGoalsError
      }

      // Then insert new selections
      if (formData.selectedGoalIds.length > 0) {
        // Ensure goal_id is explicitly a number (bigint in DB)
        const goalsPayload = formData.selectedGoalIds.map((goalId) => ({
          user_id: userId,
          goal_id: Number(goalId),
          priority: 2,
        }))

        console.log('[SavePreferences] Inserting goals:', goalsPayload)
        const { data: insertedGoals, error: insertGoalsError } = await supabase
          .from('user_islamic_goals')
          .insert(goalsPayload)
          .select()

        if (insertGoalsError) {
          console.error('[SavePreferences] Error inserting goals:', insertGoalsError)
          console.error('[SavePreferences] Goals payload was:', JSON.stringify(goalsPayload, null, 2))
          throw insertGoalsError
        }
        console.log('[SavePreferences] Goals saved successfully:', insertedGoals)
      } else {
        console.log('[SavePreferences] No goals to save')
      }

      console.log('[SavePreferences] All preferences saved successfully!')
      return { success: true }
    },
    onSuccess: (_, { userId }) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: PREFERENCE_QUERY_KEYS.userPreferences(userId) })
      queryClient.invalidateQueries({ queryKey: PREFERENCE_QUERY_KEYS.userInterests(userId) })
      queryClient.invalidateQueries({ queryKey: PREFERENCE_QUERY_KEYS.userGoals(userId) })
    },
    onError: (error) => {
      console.error('[SavePreferences] Mutation failed:', error)
    },
  })
}

// Types for recommended content with match scores
export interface RecommendedProgram extends Program {
  matchScore: number
  matchedInterests: number[]
  matchedGoals: number[]
}

export interface RecommendedEvent extends EventsType {
  matchScore: number
  matchedInterests: number[]
  matchedGoals: number[]
}

/**
 * Hook to fetch programs recommended based on user's interests and goals
 */
export const useRecommendedPrograms = (userId: string | undefined) => {
  const { data: userInterests } = useUserIslamicInterests(userId)
  const { data: userGoals } = useUserIslamicGoals(userId)

  const interestIds = useMemo(() => userInterests?.map((i) => i.interest_id) ?? [], [userInterests])
  const goalIds = useMemo(() => userGoals?.map((g) => g.goal_id) ?? [], [userGoals])

  return useQuery({
    queryKey: [...PREFERENCE_QUERY_KEYS.recommendedPrograms(userId ?? ''), interestIds, goalIds],
    queryFn: async () => {
      if (!userId || (interestIds.length === 0 && goalIds.length === 0)) {
        return []
      }

      // Fetch programs that match user's interests
      const programsFromInterests: Set<string> = new Set()
      const programInterestMatches: Map<string, number[]> = new Map()

      if (interestIds.length > 0) {
        const { data: interestMatches, error: interestError } = await supabase
          .from('program_islamic_interests')
          .select('program_id, interest_id')
          .in('interest_id', interestIds)

        if (interestError) {
          console.error('Error fetching program interests:', interestError)
        } else if (interestMatches) {
          interestMatches.forEach((match) => {
            programsFromInterests.add(match.program_id)
            const existing = programInterestMatches.get(match.program_id) ?? []
            programInterestMatches.set(match.program_id, [...existing, match.interest_id])
          })
        }
      }

      // Fetch programs that match user's goals
      const programsFromGoals: Set<string> = new Set()
      const programGoalMatches: Map<string, number[]> = new Map()

      if (goalIds.length > 0) {
        const { data: goalMatches, error: goalError } = await supabase
          .from('program_islamic_goals')
          .select('program_id, goal_id')
          .in('goal_id', goalIds)

        if (goalError) {
          console.error('Error fetching program goals:', goalError)
        } else if (goalMatches) {
          goalMatches.forEach((match) => {
            programsFromGoals.add(match.program_id)
            const existing = programGoalMatches.get(match.program_id) ?? []
            programGoalMatches.set(match.program_id, [...existing, match.goal_id])
          })
        }
      }

      // Combine all matched program IDs
      const allProgramIds = [...new Set([...programsFromInterests, ...programsFromGoals])]

      if (allProgramIds.length === 0) {
        return []
      }

      // Fetch full program data
      const { data: programs, error: programsError } = await supabase
        .from('programs')
        .select('*')
        .in('program_id', allProgramIds)

      if (programsError) {
        console.error('Error fetching programs:', programsError)
        throw programsError
      }

      // Calculate match scores and add metadata
      const recommendedPrograms: RecommendedProgram[] = (programs ?? []).map((program) => {
        const matchedInterests = programInterestMatches.get(program.program_id) ?? []
        const matchedGoals = programGoalMatches.get(program.program_id) ?? []
        const matchScore = matchedInterests.length + matchedGoals.length

        return {
          ...program,
          matchScore,
          matchedInterests,
          matchedGoals,
        }
      })

      // Sort by match score (highest first)
      return recommendedPrograms.sort((a, b) => b.matchScore - a.matchScore)
    },
    enabled: !!userId && (interestIds.length > 0 || goalIds.length > 0),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to fetch events recommended based on user's interests and goals
 */
export const useRecommendedEvents = (userId: string | undefined) => {
  const { data: userInterests } = useUserIslamicInterests(userId)
  const { data: userGoals } = useUserIslamicGoals(userId)

  const interestIds = useMemo(() => userInterests?.map((i) => i.interest_id) ?? [], [userInterests])
  const goalIds = useMemo(() => userGoals?.map((g) => g.goal_id) ?? [], [userGoals])

  return useQuery({
    queryKey: [...PREFERENCE_QUERY_KEYS.recommendedEvents(userId ?? ''), interestIds, goalIds],
    queryFn: async () => {
      if (!userId || (interestIds.length === 0 && goalIds.length === 0)) {
        return []
      }

      // Fetch events that match user's interests
      const eventsFromInterests: Set<string> = new Set()
      const eventInterestMatches: Map<string, number[]> = new Map()

      if (interestIds.length > 0) {
        const { data: interestMatches, error: interestError } = await supabase
          .from('event_islamic_interests')
          .select('event_id, interest_id')
          .in('interest_id', interestIds)

        if (interestError) {
          console.error('Error fetching event interests:', interestError)
        } else if (interestMatches) {
          interestMatches.forEach((match) => {
            eventsFromInterests.add(match.event_id)
            const existing = eventInterestMatches.get(match.event_id) ?? []
            eventInterestMatches.set(match.event_id, [...existing, match.interest_id])
          })
        }
      }

      // Fetch events that match user's goals
      const eventsFromGoals: Set<string> = new Set()
      const eventGoalMatches: Map<string, number[]> = new Map()

      if (goalIds.length > 0) {
        const { data: goalMatches, error: goalError } = await supabase
          .from('event_islamic_goals')
          .select('event_id, goal_id')
          .in('goal_id', goalIds)

        if (goalError) {
          console.error('Error fetching event goals:', goalError)
        } else if (goalMatches) {
          goalMatches.forEach((match) => {
            eventsFromGoals.add(match.event_id)
            const existing = eventGoalMatches.get(match.event_id) ?? []
            eventGoalMatches.set(match.event_id, [...existing, match.goal_id])
          })
        }
      }

      // Combine all matched event IDs
      const allEventIds = [...new Set([...eventsFromInterests, ...eventsFromGoals])]

      if (allEventIds.length === 0) {
        return []
      }

      // Fetch full event data
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .in('event_id', allEventIds)

      if (eventsError) {
        console.error('Error fetching events:', eventsError)
        throw eventsError
      }

      // Calculate match scores and add metadata
      const recommendedEvents: RecommendedEvent[] = (events ?? []).map((event) => {
        const matchedInterests = eventInterestMatches.get(event.event_id) ?? []
        const matchedGoals = eventGoalMatches.get(event.event_id) ?? []
        const matchScore = matchedInterests.length + matchedGoals.length

        return {
          ...event,
          matchScore,
          matchedInterests,
          matchedGoals,
        }
      })

      // Sort by match score (highest first)
      return recommendedEvents.sort((a, b) => b.matchScore - a.matchScore)
    },
    enabled: !!userId && (interestIds.length > 0 || goalIds.length > 0),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Combined hook to get all recommended content
 */
export const useRecommendedContent = (userId: string | undefined) => {
  const programs = useRecommendedPrograms(userId)
  const events = useRecommendedEvents(userId)
  const { interests, goals, isLoading: prefsLoading } = useAllUserPreferences(userId)

  const isLoading = programs.isLoading || events.isLoading || prefsLoading
  const error = programs.error || events.error
  const hasPreferences = interests.length > 0 || goals.length > 0

  return {
    programs: programs.data ?? [],
    events: events.data ?? [],
    isLoading,
    error,
    hasPreferences,
  }
}

