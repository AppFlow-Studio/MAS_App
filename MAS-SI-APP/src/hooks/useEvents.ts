import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/src/lib/supabase'
import { queryKeys } from '@/src/lib/queryKeys'
import { useSupabaseRealtime } from './useSupabaseRealtime'
import type { EventsType, EventLectureType } from '@/src/types'

export const useEventsWithRecordedLectures = () => {
  useSupabaseRealtime({
    channelName: 'events-recorded-realtime',
    table: 'events',
    queryKeys: [queryKeys.events.all],
  })

  return useQuery({
    queryKey: queryKeys.events.withRecordedLectures(),
    queryFn: async () => {
      const { data: allEvents, error } = await supabase
        .from('events')
        .select('*')
        .eq('pace', false)
        .eq('has_lecture', true)
      if (error) throw error
      if (!allEvents || allEvents.length === 0) return [] as EventsType[]

      const eventIds = allEvents.map((e) => e.event_id)
      const { data: allLectures } = await supabase
        .from('events_lectures')
        .select('event_id, event_lecture_link')
        .in('event_id', eventIds)

      const eventsWithYouTube = new Set<string>()
      allLectures?.forEach((lecture) => {
        if (lecture.event_lecture_link && lecture.event_lecture_link.trim() !== '' && lecture.event_lecture_link !== 'N/A') {
          eventsWithYouTube.add(lecture.event_id)
        }
      })

      return allEvents.filter((e) => eventsWithYouTube.has(e.event_id)) as EventsType[]
    },
    staleTime: 10 * 60 * 1000,
  })
}

export const useEventDetail = (eventId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.events.detail(eventId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('event_id', eventId)
        .single()
      if (error) throw error
      return data as EventsType
    },
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000,
  })
}

export const useEventLectures = (eventId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.events.lectures(eventId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events_lectures')
        .select('*')
        .eq('event_id', eventId)
        .order('event_lecture_date', { ascending: false })
      if (error) throw error
      return (data ?? []) as EventLectureType[]
    },
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000,
  })
}
