import { FlatList, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { supabase } from '@/src/lib/supabase'
import { Link } from 'expo-router'

const BusinessAdsApprovalScreen = () => {
  const [ ads, setAds ] = useState<any[]>([])
  const getAds = async () => {
    const { data, error } = await supabase.from('business_ads_submissions').select('*') .neq('status', 'APPROVED')
    if ( data ){
      setAds( data )
    }
  }

  useEffect(() => {
    getAds()
    const checkStatus = supabase.channel('Check for Business Status').on('postgres_changes', { event : "*", schema : 'public', table : 'business_ads_submissions' }, getAds)
    .subscribe()

    return () => { supabase.removeChannel( checkStatus ) }

  }, [])

  return (
    <View className='flex-1'>
      <Text className="font-bold text-2xl p-3 ">Business Ads</Text>
      <View className='flex-1 grow'>
        <FlatList 
        style={{ flex : 1 }}
        data={ads}
        renderItem={({item}) =>(
          <View style={{marginHorizontal: 2}}>
          <Link  href={{pathname: '/(user)/more/Admin/ApproveBusinessScreen', params: { submission : item.submission_id } }}
              asChild >
              <TouchableOpacity>
                <View className='mt-1 self-center justify-center bg-white p-2 flex-row' style={{ borderRadius: 20, width: '95%'}}>
                  
                  <View className='justify-center w-[30%]'>
                    <Image source={{ uri : item.business_flyer_img }} style={{ borderRadius : 8, width : '100%', height : 95}}/>
                  </View>
                  <View className='w-[70%] pl-2'>
                    <Text className='text-lg text-black font-bold ' numberOfLines={1}>{item.business_name}</Text>
                    <Text className='my-2  text-sm text-black font-bold' numberOfLines={1}>{item.business_phone_number}</Text>
                  </View>
                </View>
              </TouchableOpacity>
          </Link>
      </View>
        )}
        />
      </View>
      
    </View>
  )
}

export default BusinessAdsApprovalScreen

const styles = StyleSheet.create({})