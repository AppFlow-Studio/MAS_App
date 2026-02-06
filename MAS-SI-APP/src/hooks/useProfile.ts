import { useQuery } from '@tanstack/react-query'
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
