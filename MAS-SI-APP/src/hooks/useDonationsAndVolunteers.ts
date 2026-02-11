import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/src/lib/supabase'
import { queryKeys } from '@/src/lib/queryKeys'
import { useSupabaseRealtime } from './useSupabaseRealtime'

type DonationCategory = {
  project_id: string
  project_name: string
  project_goal: number | null
  project_linked_to: string | null
  thumbnail: string | null
  type: 'donation'
}

type VolunteerOpportunity = {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  link: string | null
  type: 'volunteer'
}

type AdvertiseCard = {
  id: string
  type: 'advertise'
}

export type CardItem = DonationCategory | VolunteerOpportunity | AdvertiseCard

export const useDonationsAndVolunteers = () => {
  useSupabaseRealtime({
    channelName: 'donations-realtime',
    table: 'projects',
    queryKeys: [queryKeys.donations.all],
  })

  useSupabaseRealtime({
    channelName: 'volunteers-realtime',
    table: 'volunteers',
    queryKeys: [queryKeys.donations.all],
  })

  return useQuery({
    queryKey: queryKeys.donations.all,
    queryFn: async () => {
      const { data: donations } = await supabase
        .from('projects')
        .select('*')
        .ilike('project_name', '%General Masjid Support%')
        .limit(1)

      const { data: volunteers } = await supabase
        .from('volunteers')
        .select('*')
        .limit(1)

      const combinedItems: CardItem[] = []

      if (donations && donations.length > 0) {
        donations.forEach((donation) => {
          combinedItems.push({ ...donation, type: 'donation' as const })
        })
      }

      if (volunteers && volunteers.length > 0) {
        volunteers.forEach((volunteer) => {
          combinedItems.push({ ...volunteer, type: 'volunteer' as const })
        })
      } else {
        combinedItems.push({
          id: 'default',
          title: 'Volunteer Opportunities',
          description: 'Join us in serving our community',
          thumbnail: null,
          link: 'https://www.mobilize.us/mascenter/',
          type: 'volunteer' as const,
        })
      }

      combinedItems.push({ id: 'advertise', type: 'advertise' as const })

      return combinedItems
    },
    staleTime: 5 * 60 * 1000,
  })
}
