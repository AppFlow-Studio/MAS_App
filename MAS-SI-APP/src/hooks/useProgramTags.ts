import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/src/lib/supabase'
import { useMemo } from 'react'
import type { IslamicInterestCategory } from '@/src/types/preferences'

// Types for program tags
export type ProgramTagType = 'topic' | 'format' | 'audience' | 'commitment' | 'difficulty'

export interface ProgramTag {
  id: number
  tag_key: string
  tag_name: string
  tag_type: ProgramTagType
  maps_to_interest_id: number | null
}

export interface ProgramTagAssignment {
  id?: number
  program_id: string | null
  event_id: string | null
  tag_id: number
  relevance_weight: number
}

// Query keys for cache management
export const PROGRAM_TAG_QUERY_KEYS = {
  programTags: ['program-tags'] as const,
  programTagsByType: (type: ProgramTagType) => ['program-tags', type] as const,
  islamicInterests: ['islamic-interests'] as const,
}

/**
 * Hook to fetch all program tags
 */
export const useProgramTags = () => {
  return useQuery({
    queryKey: PROGRAM_TAG_QUERY_KEYS.programTags,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_tags')
        .select('*')
        .order('tag_name')

      if (error) {
        console.error('Error fetching program tags:', error)
        throw error
      }

      return data as ProgramTag[]
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - tags rarely change
  })
}

/**
 * Hook to get program tags grouped by type
 */
export const useGroupedProgramTags = () => {
  const { data: tags, isLoading, error } = useProgramTags()

  const groupedTags = useMemo(() => {
    if (!tags) return {
      audience: [],
      topic: [],
      format: [],
      commitment: [],
      difficulty: [],
    }

    return {
      audience: tags.filter(t => t.tag_type === 'audience'),
      topic: tags.filter(t => t.tag_type === 'topic'),
      format: tags.filter(t => t.tag_type === 'format'),
      commitment: tags.filter(t => t.tag_type === 'commitment'),
      difficulty: tags.filter(t => t.tag_type === 'difficulty'),
    }
  }, [tags])

  return { data: groupedTags, isLoading, error }
}

/**
 * Hook to fetch islamic interest categories (reusing from preferences)
 */
export const useIslamicInterestCategories = () => {
  return useQuery({
    queryKey: PROGRAM_TAG_QUERY_KEYS.islamicInterests,
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
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * Hook to get parent interest categories with their children
 */
export const useGroupedIslamicInterests = () => {
  const { data: interests, isLoading, error } = useIslamicInterestCategories()

  const groupedInterests = useMemo(() => {
    if (!interests) return []

    // Get parent categories (no parent_category_id)
    const parents = interests.filter(i => !i.parent_category_id)

    // Map parents with their children
    return parents.map(parent => ({
      ...parent,
      children: interests.filter(i => i.parent_category_id === parent.id),
    }))
  }, [interests])

  return { data: groupedInterests, isLoading, error }
}

/**
 * Function to save program tag assignments after creating a program
 */
export const saveProgramTagAssignments = async (
  programId: string,
  tagIds: number[],
  relevanceWeight: number = 1.0
) => {
  if (tagIds.length === 0) return { success: true }

  const assignments = tagIds.map(tagId => ({
    program_id: programId,
    tag_id: tagId,
    relevance_weight: relevanceWeight,
  }))

  const { error } = await supabase
    .from('program_tag_assignments')
    .insert(assignments)

  if (error) {
    console.error('Error saving program tag assignments:', error)
    throw error
  }

  return { success: true }
}

// Static options for preferences that don't come from database
export const LIFE_STAGE_OPTIONS = [
  { value: 'student_high_school', label: 'High School Students' },
  { value: 'student_college', label: 'College Students' },
  { value: 'young_professional', label: 'Young Professionals' },
  { value: 'parent_young_kids', label: 'Parents (Young Kids)' },
  { value: 'parent_teens', label: 'Parents (Teenagers)' },
  { value: 'empty_nester', label: 'Empty Nesters' },
  { value: 'retiree', label: 'Retirees' },
]

export const GENDER_OPTIONS = [
  { value: 'brothers', label: 'Brothers Only' },
  { value: 'sisters', label: 'Sisters Only' },
  { value: 'all', label: 'Everyone' },
]

export const KNOWLEDGE_LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

