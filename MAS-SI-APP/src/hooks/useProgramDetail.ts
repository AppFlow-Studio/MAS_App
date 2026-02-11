import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/src/lib/supabase'
import { queryKeys } from '@/src/lib/queryKeys'
import { useSupabaseRealtime } from './useSupabaseRealtime'
import { useAuth } from '@/src/providers/AuthProvider'

export const useProgramDetail = (programId: string) => {
  useSupabaseRealtime({
    channelName: `program-detail-${programId}`,
    table: 'programs',
    queryKeys: [queryKeys.programs.detail(programId)],
  })

  return useQuery({
    queryKey: queryKeys.programs.detail(programId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('program_id', programId)
        .single()

      if (error) throw error

      let speakers: any[] = []
      let speakerString = ''

      if (data.program_speaker && Array.isArray(data.program_speaker) && data.program_speaker.length > 0) {
        const { data: speakerDataList } = await supabase
          .from('speaker_data')
          .select('*')
          .in('speaker_id', data.program_speaker)

        const speakerMap = new Map((speakerDataList || []).map((s: any) => [s.speaker_id, s]))
        const nameStrings: string[] = []

        data.program_speaker.forEach((speaker_id: string, index: number) => {
          const speakerInfo = speakerMap.get(speaker_id)
          if (speakerInfo) {
            if (index === data.program_speaker.length - 1) {
              nameStrings.push(speakerInfo.speaker_name)
            } else {
              nameStrings.push(speakerInfo.speaker_name + ' & ')
            }
            speakers.push(speakerInfo)
          }
        })
        speakerString = nameStrings.join('')
      }

      return { program: data, speakers, speakerString }
    },
    enabled: !!programId,
    staleTime: 5 * 60 * 1000,
  })
}

export const useProgramLectures = (programId: string) => {
  useSupabaseRealtime({
    channelName: `program-lectures-${programId}`,
    table: 'program_lectures',
    queryKeys: [queryKeys.programs.lectures(programId)],
  })

  return useQuery({
    queryKey: queryKeys.programs.lectures(programId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_lectures')
        .select('*')
        .eq('lecture_program', programId)
        .order('lecture_date', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!programId,
    staleTime: 5 * 60 * 1000,
  })
}

export const useProgramStatus = (programId: string) => {
  const { session } = useAuth()
  const userId = session?.user.id || ''

  return useQuery({
    queryKey: [...queryKeys.programs.detail(programId), 'status', userId],
    queryFn: async () => {
      const [{ data: notificationData }, { data: programData }] = await Promise.all([
        supabase
          .from('added_notifications_programs')
          .select('*')
          .eq('user_id', userId)
          .eq('program_id', programId)
          .single(),
        supabase
          .from('added_programs')
          .select('*')
          .eq('user_id', userId)
          .eq('program_id', programId)
          .single(),
      ])

      return {
        inNotifications: !!notificationData,
        inPrograms: !!programData,
      }
    },
    enabled: !!programId && !!userId,
    staleTime: 2 * 60 * 1000,
  })
}

