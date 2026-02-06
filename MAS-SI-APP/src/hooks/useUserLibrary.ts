import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/src/lib/supabase'
import { queryKeys } from '@/src/lib/queryKeys'
import { useSupabaseRealtime } from './useSupabaseRealtime'
import type { Program, Lectures, EventLectureType, UserPlaylistType } from '@/src/types'

export const useUserPrograms = (userId: string | undefined) => {
  useSupabaseRealtime({
    channelName: `user-programs-${userId}`,
    table: 'added_programs',
    filter: userId ? `user_id=eq.${userId}` : undefined,
    queryKeys: [queryKeys.userLibrary.programs(userId ?? '')],
    enabled: !!userId,
  })

  return useQuery({
    queryKey: queryKeys.userLibrary.programs(userId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('added_programs')
        .select('program_id')
        .eq('user_id', userId)
      if (error) throw error
      return (data ?? []) as { program_id: string }[]
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  })
}

export const useUserLikedLectures = (userId: string | undefined) => {
  useSupabaseRealtime({
    channelName: `user-liked-lectures-${userId}`,
    table: 'liked_lectures',
    filter: userId ? `user_id=eq.${userId}` : undefined,
    queryKeys: [queryKeys.userLibrary.likedLectures(userId ?? '')],
    enabled: !!userId,
  })

  return useQuery({
    queryKey: queryKeys.userLibrary.likedLectures(userId ?? ''),
    queryFn: async () => {
      const { data: likedIds, error } = await supabase
        .from('liked_lectures')
        .select('lecture_id')
        .eq('user_id', userId)
      if (error) throw error
      if (!likedIds || likedIds.length === 0) return [] as Lectures[]

      const ids = likedIds.map((l) => l.lecture_id)
      const { data: lectures, error: lecturesError } = await supabase
        .from('program_lectures')
        .select('*')
        .in('lecture_id', ids)
      if (lecturesError) throw lecturesError

      return (lectures ?? []) as Lectures[]
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  })
}

export const useUserLikedEventLectures = (userId: string | undefined) => {
  useSupabaseRealtime({
    channelName: `user-liked-event-lectures-${userId}`,
    table: 'liked_event_lectures',
    filter: userId ? `user_id=eq.${userId}` : undefined,
    queryKeys: [queryKeys.userLibrary.likedEventLectures(userId ?? '')],
    enabled: !!userId,
  })

  return useQuery({
    queryKey: queryKeys.userLibrary.likedEventLectures(userId ?? ''),
    queryFn: async () => {
      const { data: likedIds, error } = await supabase
        .from('liked_event_lectures')
        .select('event_lecture_id')
        .eq('user_id', userId)
      if (error) throw error
      if (!likedIds || likedIds.length === 0) return [] as EventLectureType[]

      const ids = likedIds.map((l) => l.event_lecture_id)
      const { data: lectures, error: lecturesError } = await supabase
        .from('events_lectures')
        .select('*')
        .in('event_lecture_id', ids)
      if (lecturesError) throw lecturesError

      return (lectures ?? []) as EventLectureType[]
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  })
}

export const useUserLikedPrograms = (userId: string | undefined) => {
  useSupabaseRealtime({
    channelName: `user-added-programs-${userId}`,
    table: 'added_programs',
    filter: userId ? `user_id=eq.${userId}` : undefined,
    queryKeys: [queryKeys.userLibrary.programs(userId ?? '')],
    enabled: !!userId,
  })

  return useQuery({
    queryKey: [...queryKeys.userLibrary.programs(userId ?? ''), 'full'],
    queryFn: async () => {
      const { data: addedIds, error } = await supabase
        .from('added_programs')
        .select('program_id')
        .eq('user_id', userId)
      if (error) throw error
      if (!addedIds || addedIds.length === 0) return [] as Program[]

      const ids = addedIds.map((p) => p.program_id)
      const { data: programs, error: programsError } = await supabase
        .from('programs')
        .select('*')
        .in('program_id', ids)
      if (programsError) throw programsError

      return (programs ?? []) as Program[]
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  })
}

export const useUserPlaylists = (userId: string | undefined) => {
  useSupabaseRealtime({
    channelName: `user-playlists-${userId}`,
    table: 'user_playlist',
    filter: userId ? `user_id=eq.${userId}` : undefined,
    queryKeys: [queryKeys.userLibrary.playlists(userId ?? '')],
    enabled: !!userId,
  })

  return useQuery({
    queryKey: queryKeys.userLibrary.playlists(userId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_playlist')
        .select('*')
        .eq('user_id', userId)
      if (error) throw error
      return (data ?? []) as UserPlaylistType[]
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  })
}
