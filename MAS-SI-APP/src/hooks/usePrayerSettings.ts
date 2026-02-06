import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/src/lib/supabase'
import { queryKeys } from '@/src/lib/queryKeys'
import { useSupabaseRealtime } from './useSupabaseRealtime'

export const usePrayerNotificationSettings = (userId: string | undefined) => {
  useSupabaseRealtime({
    channelName: `prayer-settings-${userId}`,
    table: 'prayer_notification_settings',
    filter: userId ? `user_id=eq.${userId}` : undefined,
    queryKeys: [queryKeys.prayerSettings.notifications(userId ?? '')],
    enabled: !!userId,
  })

  return useQuery({
    queryKey: queryKeys.prayerSettings.notifications(userId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prayer_notification_settings')
        .select('*')
        .eq('user_id', userId)
      if (error) throw error
      return (data ?? []) as { prayer: string; notification_settings: string[] }[]
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  })
}
