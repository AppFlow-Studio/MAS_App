import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/src/lib/supabase'
import { queryKeys } from '@/src/lib/queryKeys'
import type { Profile } from '@/src/types'

export const useProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.profile.detail(userId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) throw error
      return data as Profile
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

export const usePreferencesCompleted = (userId: string | undefined) => {
  return useQuery({
    queryKey: [...queryKeys.profile.detail(userId ?? ''), 'preferences-completed'],
    queryFn: async () => {
      const { data: userInterests } = await supabase
        .from('user_islamic_interests')
        .select('id')
        .eq('user_id', userId!)
        .limit(1)

      return !!(userInterests && userInterests.length > 0)
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

export const useInvalidateProfile = () => {
  const queryClient = useQueryClient()
  return (userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail(userId) })
  }
}
