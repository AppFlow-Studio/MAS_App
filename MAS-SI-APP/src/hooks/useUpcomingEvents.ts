import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/src/lib/supabase'
import { queryKeys } from '@/src/lib/queryKeys'
import { useSupabaseRealtime } from './useSupabaseRealtime'

export const useUpcomingEvents = () => {
  useSupabaseRealtime({
    channelName: 'upcoming-programs-realtime',
    table: 'programs',
    queryKeys: [queryKeys.upcoming.all],
  })

  useSupabaseRealtime({
    channelName: 'upcoming-events-realtime',
    table: 'events',
    queryKeys: [queryKeys.upcoming.all],
  })

  return useQuery({
    queryKey: queryKeys.upcoming.all,
    queryFn: async () => {
      const isoString = new Date().toISOString()
      const [{ data: programs }, { data: events }] = await Promise.all([
        supabase.from('programs').select('*').gte('program_end_date', isoString),
        supabase.from('events').select('*').gte('event_end_date', isoString),
      ])

      return {
        programs: programs || [],
        events: events || [],
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}
