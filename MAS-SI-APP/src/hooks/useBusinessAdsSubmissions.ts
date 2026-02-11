import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/src/lib/supabase'
import { queryKeys } from '@/src/lib/queryKeys'
import { useSupabaseRealtime } from './useSupabaseRealtime'

export const useBusinessAdsSubmissions = () => {
  useSupabaseRealtime({
    channelName: 'business-ads-submissions-realtime',
    table: 'business_ads_submissions',
    queryKeys: [queryKeys.businessAds.submissions()],
  })

  return useQuery({
    queryKey: queryKeys.businessAds.submissions(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_ads_submissions')
        .select('*')
        .neq('status', 'APPROVED')
        .neq('status', 'REJECT')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    staleTime: 2 * 60 * 1000,
  })
}
