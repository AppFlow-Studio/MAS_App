import { View, Text, ScrollView, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@/src/lib/supabase'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { Button } from 'react-native-paper'
import Toast from 'react-native-toast-message'
import { format } from 'date-fns'
const ApproveBusinessScreen = () => {
    const { submission } = useLocalSearchParams()
    const tabHeight = useBottomTabBarHeight()
    const [ submissionInfo, setSubmissionInfo ] = useState<any>()
    const [ date, setDate ] = useState('')
    const router = useRouter()
    const handleSubmit = () => {
        Toast.show({
          type: "success",
          text1: "Ad Approved, It will now show in Home and Prayer table screen",
          position: "top",
          topOffset: 50,
        });
      };

      const handleReject = () => {
        Toast.show({
          type: "success",
          text1: "Ad Rejected",
          position: "top",
          topOffset: 50,
        });
      };
    const getSubmission = async () => {
        const { data, error } = await supabase.from('business_ads_submissions').select('*').eq('submission_id', submission).single()
        if( data ){
            setSubmissionInfo(data)
            setDate(data.created_at)
        }
    }
    if( !setSubmissionInfo ){
        return<></>
    }

    const onApprove = async () => {
        const { error } = await supabase.from('business_ads_submissions').update({ status : 'APPROVED' }).eq('submission_id', submission)
        console.log(error)
        handleSubmit()
        router.back()
    }

    const onReject = async () => {
        const { error } = await supabase.from('business_ads_submissions').update({ status : 'REJECT' }).eq('submission_id', submission)
        handleReject()
        router.back()
    }
    useEffect(() => {
        getSubmission()
    }, [])
  return (
    <>
     <Stack.Screen
        options={{
          headerBackTitleVisible: false,
          headerStyle: { backgroundColor: "white" },
          headerTintColor : 'black',
          title: "Approve Business Ads",
        }}
      />
    <View style={{ padding: 16, backgroundColor: 'white' , flex : 1}}>
    <ScrollView
        contentContainerStyle={{ paddingBottom: tabHeight }}
        showsVerticalScrollIndicator={false}
    >
        <Text className="text-base font-bold mb-1 ml-2">Personal Information</Text>

        <Text className="text-black ml-4">Full Name: {submissionInfo?.personal_full_name}</Text>
        <Text className="text-black ml-4">Phone Number: {submissionInfo?.personal_phone_number}</Text>
        <Text className="text-black ml-4">Email: {submissionInfo?.personal_email}</Text>

        <Text className="text-base font-bold mb-1 mt-2 ml-2">Business Information</Text>

        <Text className="text-black ml-4">Business Name: {submissionInfo?.business_name}</Text>
        <Text className="text-black ml-4">Business Address: {submissionInfo?.business_address}</Text>
        <Text className="text-black ml-4">Business Phone Number: {submissionInfo?.business_phone_number}</Text>
        <Text className="text-black ml-4">Business Email: {submissionInfo?.business_email}</Text>

        <Text className="text-base font-bold mb-1 mt-2 ml-2">Flyer Information</Text>

        <Text className="text-black ml-4">Flyer Duration: {submissionInfo?.business_flyer_duration}</Text>        
        <Text className="text-base font-bold mb-1 mt-2 ml-2">Flyer: </Text>
            <Image
                source={{ uri: submissionInfo?.business_flyer_img }}
                style={{
                    width: '80%',
                    height: 200,
                    marginVertical: '1%',
                    alignSelf: 'center',
                    borderRadius: 15,
                }}
                resizeMode="contain"
            />

        <Text className="text-base font-bold mb-1 mt-2 ml-2">Submission Information</Text>

        <Text className="text-black ml-4 my-1">Created At: {date ? format(date, 'PPPP') : ''}</Text>
        <Text className="text-black ml-4 my-1">Submission ID: {submissionInfo?.submission_id}</Text>

        <Text className="text-base font-bold mt-2 ml-2">Approve or Reject</Text>
        <View className='flex-row gap-x-2 justify-center'>
            <Button
                mode="contained"
                buttonColor="#57BA47"
                textColor="white"
                theme={{ roundness: 1 }}
                className='w-[40%]'
                onPress={ async () => await onApprove() }
            >
                Approve
            </Button>

            <Button
                mode="contained"
                buttonColor="red"
                textColor="white"
                theme={{ roundness: 1 }}
                className='w-[40%]'
                onPress={ async () => await onReject() }
            >
                Reject
            </Button>
        </View>
    </ScrollView>
</View>

    </>
  )
}

export default ApproveBusinessScreen