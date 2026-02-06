import { useEffect } from 'react'
import { useQueryClient, type QueryKey } from '@tanstack/react-query'
import { supabase } from '@/src/lib/supabase'

interface UseSupabaseRealtimeOptions {
  channelName: string
  table: string
  filter?: string
  queryKeys: QueryKey[]
  enabled?: boolean
}

export const useSupabaseRealtime = ({
  channelName,
  table,
  filter,
  queryKeys,
  enabled = true,
}: UseSupabaseRealtimeOptions) => {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          ...(filter ? { filter } : {}),
        },
        () => {
          queryKeys.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: key })
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelName, table, filter, enabled])
}
