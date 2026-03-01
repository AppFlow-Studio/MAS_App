import AsyncStorage from '@react-native-async-storage/async-storage'
import { File } from 'expo-file-system'
import { decode } from 'base64-arraybuffer'
import { supabase } from '@/src/lib/supabase'

const PENDING_SUBMISSION_KEY = '@BusinessAds/pending_submission'

type PendingSubmission = {
  personalInfo: { name: string; phoneNumber: string; email: string }
  businessInfo: {
    businessName: string
    address: string
    city: string
    state: string
    businessPhoneNumber: string
    businessEmail: string
  }
  selectedDuration: string
  flyerPath: string
  userId: string
}

/**
 * Save submission from persisted pending data (used when returning from Safari / deep link).
 * Call this when verification succeeds so we can save and navigate even if BusinessAds is not mounted.
 */
export async function savePendingBusinessAdSubmission(): Promise<boolean> {
  try {
    const pendingJson = await AsyncStorage.getItem(PENDING_SUBMISSION_KEY)
    if (!pendingJson) return false

    const pending = JSON.parse(pendingJson) as PendingSubmission
    const base64 = await new File(pending.flyerPath).base64()
    const storagePath = `${pending.userId}/${new Date().getTime()}.png`
    const { data: image, error: image_upload_error } = await supabase.storage
      .from('business_flyers')
      .upload(storagePath, decode(base64))

    if (image_upload_error) {
      console.log('savePendingBusinessAdSubmission upload error:', image_upload_error)
      return false
    }

    const { data: business_flyer_url } = await supabase.storage
      .from('business_flyers')
      .getPublicUrl(image?.path)
    if (!business_flyer_url) return false

    const { error } = await supabase.from('business_ads_submissions').insert({
      personal_full_name: pending.personalInfo.name,
      personal_phone_number: pending.personalInfo.phoneNumber,
      personal_email: pending.personalInfo.email,
      business_name: pending.businessInfo.businessName,
      business_address: pending.businessInfo.address,
      business_phone_number: pending.businessInfo.businessPhoneNumber,
      business_email: pending.businessInfo.businessEmail,
      business_flyer_duration: pending.selectedDuration,
      business_flyer_img: business_flyer_url.publicUrl,
      user_id: pending.userId,
    })

    if (error) {
      console.log('savePendingBusinessAdSubmission insert error:', error)
      return false
    }

    await supabase.functions.invoke('resend', {
      body: {
        submission: {
          personal_full_name: pending.personalInfo.name,
          personal_phone_number: pending.personalInfo.phoneNumber,
          personal_email: pending.personalInfo.email,
          business_name: pending.businessInfo.businessName,
          business_address: pending.businessInfo.address,
          business_phone_number: pending.businessInfo.businessPhoneNumber,
          business_email: pending.businessInfo.businessEmail,
          business_flyer_duration: pending.selectedDuration,
          business_flyer_img: business_flyer_url.publicUrl,
        },
      },
    })

    await AsyncStorage.removeItem(PENDING_SUBMISSION_KEY)
    const pendingFile = new File(pending.flyerPath)
    if (pendingFile.exists) pendingFile.delete()
    return true
  } catch (err) {
    console.log('savePendingBusinessAdSubmission error:', err)
    return false
  }
}
