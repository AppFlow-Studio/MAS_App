import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/src/lib/supabase'
import { queryKeys } from '@/src/lib/queryKeys'
import type { SheikDataType } from '@/src/types'

export const useSpeakers = (speakerIds: string[] | undefined | null) => {
  const sortedIds = [...(speakerIds ?? [])].sort()

  return useQuery({
    queryKey: queryKeys.speakers.batch(sortedIds),
    queryFn: async () => {
      if (!speakerIds || speakerIds.length === 0) return [] as SheikDataType[]

      const { data, error } = await supabase
        .from('speaker_data')
        .select('*')
        .in('speaker_id', speakerIds)
      if (error) throw error

      // Return in the same order as speakerIds
      const speakerMap = new Map((data ?? []).map((s) => [s.speaker_id, s]))
      return speakerIds
        .map((id) => speakerMap.get(id))
        .filter((s): s is SheikDataType => s != null)
    },
    enabled: !!speakerIds && speakerIds.length > 0,
    staleTime: 30 * 60 * 1000,
  })
}
