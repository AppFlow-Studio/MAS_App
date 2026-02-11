import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/src/lib/supabase'
import { queryKeys } from '@/src/lib/queryKeys'
import { useSupabaseRealtime } from './useSupabaseRealtime'

export const useJummah = () => {
  useSupabaseRealtime({
    channelName: 'jummah-realtime',
    table: 'jummah',
    queryKeys: [queryKeys.jummah.all],
  })

  return useQuery({
    queryKey: queryKeys.jummah.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jummah')
        .select('*')
        .order('id', { ascending: true })

      if (error) throw error
      if (!data || data.length === 0) return { jummah: [], speakers: [] }

      // Batch fetch all speakers in a single query
      const speakerIds = data.map(j => j.speaker).filter(Boolean)
      const uniqueIds = [...new Set(speakerIds)]
      const { data: speakerData } = await supabase
        .from('speaker_data')
        .select('*')
        .in('speaker_id', uniqueIds)

      const speakerMap = new Map((speakerData || []).map(s => [s.speaker_id, s]))
      const speakers = data.map(j => speakerMap.get(j.speaker) || null)

      return { jummah: data, speakers }
    },
    staleTime: 5 * 60 * 1000,
  })
}
