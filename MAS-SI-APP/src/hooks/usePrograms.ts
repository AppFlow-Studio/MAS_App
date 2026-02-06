import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/src/lib/supabase'
import { queryKeys } from '@/src/lib/queryKeys'
import { useSupabaseRealtime } from './useSupabaseRealtime'
import type { Program, Lectures } from '@/src/types'

export const useCurrentPrograms = () => {
  useSupabaseRealtime({
    channelName: 'programs-current-realtime',
    table: 'programs',
    queryKeys: [queryKeys.programs.all],
  })

  return useQuery({
    queryKey: queryKeys.programs.current(),
    queryFn: async () => {
      const currDate = new Date().toISOString()
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .gte('program_end_date', currDate)
      if (error) throw error
      return (data ?? []) as Program[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

export const usePastRecordedPrograms = () => {
  return useQuery({
    queryKey: queryKeys.programs.past(),
    queryFn: async () => {
      const currDate = new Date().toISOString()
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .lte('program_end_date', currDate)
        .eq('has_lectures', true)
      if (error) throw error
      return (data ?? []) as Program[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

export const useProgramsWithRecordedLectures = () => {
  return useQuery({
    queryKey: queryKeys.programs.withRecordedLectures(),
    queryFn: async () => {
      const { data: allPrograms, error } = await supabase
        .from('programs')
        .select('*')
        .eq('has_lectures', true)
      if (error) throw error
      if (!allPrograms || allPrograms.length === 0) return [] as Program[]

      const programIds = allPrograms.map((p) => p.program_id)
      const { data: allLectures } = await supabase
        .from('program_lectures')
        .select('lecture_program, lecture_link')
        .in('lecture_program', programIds)

      const programsWithYouTube = new Set<string>()
      allLectures?.forEach((lecture) => {
        if (lecture.lecture_link && lecture.lecture_link.trim() !== '' && lecture.lecture_link !== 'N/A') {
          programsWithYouTube.add(lecture.lecture_program)
        }
      })

      return allPrograms.filter((p) => programsWithYouTube.has(p.program_id)) as Program[]
    },
    staleTime: 10 * 60 * 1000,
  })
}

export const useProgramDetail = (programId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.programs.detail(programId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('program_id', programId)
        .single()
      if (error) throw error
      return data as Program
    },
    enabled: !!programId,
    staleTime: 5 * 60 * 1000,
  })
}

export const useProgramLectures = (programId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.programs.lectures(programId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_lectures')
        .select('*')
        .eq('lecture_program', programId)
        .order('lecture_date', { ascending: false })
      if (error) throw error
      return (data ?? []) as Lectures[]
    },
    enabled: !!programId,
    staleTime: 5 * 60 * 1000,
  })
}
