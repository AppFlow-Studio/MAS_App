import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/src/lib/supabase'
import { queryKeys } from '@/src/lib/queryKeys'
import { useSupabaseRealtime } from './useSupabaseRealtime'

type AdItem = {
  business_flyer_img: string
  business_name: string
  business_address: string
  business_phone_number: number
  business_email: string
}

export const useApprovedAds = () => {
  useSupabaseRealtime({
    channelName: 'approved-ads-realtime',
    table: 'approved_business_ads',
    queryKeys: [queryKeys.ads.all],
  })

  return useQuery({
    queryKey: queryKeys.ads.approved(),
    queryFn: async () => {
      const { data: approvedAds, error } = await supabase
        .from('approved_business_ads')
        .select('submission_id')
      if (error) throw error
      if (!approvedAds || approvedAds.length === 0) return [] as AdItem[]

      const submissionIds = approvedAds.map((ad) => ad.submission_id)
      const { data: adsData, error: adsError } = await supabase
        .from('business_ads_submissions')
        .select('business_flyer_img, business_name, business_address, business_phone_number, business_email')
        .in('submission_id', submissionIds)
      if (adsError) throw adsError

      return (adsData ?? []) as AdItem[]
    },
    staleTime: 5 * 60 * 1000,
  })
}
