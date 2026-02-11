import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/src/lib/supabase'
import { queryKeys } from '@/src/lib/queryKeys'
import { useSupabaseRealtime } from './useSupabaseRealtime'
import { useAuth } from '@/src/providers/AuthProvider'

export const useBookmarkedSurahs = () => {
  const { session } = useAuth()
  const userId = session?.user.id || ''

  useSupabaseRealtime({
    channelName: 'bookmarked-surahs-realtime',
    table: 'user_bookmarked_surahs',
    queryKeys: [queryKeys.quran.bookmarkedSurahs(userId)],
    enabled: !!userId,
  })

  return useQuery({
    queryKey: queryKeys.quran.bookmarkedSurahs(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_bookmarked_surahs')
        .select('surah_number')
        .eq('user_id', userId)
      if (error) throw error
      return data || []
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  })
}

export const useBookmarkedAyahs = () => {
  const { session } = useAuth()
  const userId = session?.user.id || ''

  useSupabaseRealtime({
    channelName: 'bookmarked-ayahs-realtime',
    table: 'user_bookmarked_ayahs',
    queryKeys: [queryKeys.quran.bookmarkedAyahs(userId)],
    enabled: !!userId,
  })

  return useQuery({
    queryKey: queryKeys.quran.bookmarkedAyahs(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_bookmarked_ayahs')
        .select('surah_number, ayah_number')
        .eq('user_id', userId)
      if (error) throw error
      return data || []
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  })
}
