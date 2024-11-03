import { View, Text, ScrollView, useWindowDimensions, Pressable, Image } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import DonationChart from '@/src/components/DonationChart'
import { format } from 'date-fns'
import { SharedValue, useDerivedValue, useSharedValue } from 'react-native-reanimated'
import { Canvas, SkFont, useFont } from '@shopify/react-native-skia'
import AnimatedDonationAmount from '@/src/components/AnimatedDonationText'
import { defaultProgramImage } from '@/src/components/ProgramsListProgram'
import { LinearGradient } from 'expo-linear-gradient'
import YoutubePlayer from "react-native-youtube-iframe"
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { Button, Divider, Icon } from 'react-native-paper'
import { Stack } from 'expo-router'
import { initializePaymentSheet, openPaymentSheet } from '@/src/lib/stripe'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import OtherAmountDonationSheet from '@/src/components/ShopComponets/OtherAmountDonationSheet'
import { supabase } from '@/src/lib/supabase'
import { useStripe } from '@stripe/stripe-react-native'
type DonationGoalType = {
    date : string
    amount : number
    amountGiven : number
}
const Donation = () => {
  const { retrievePaymentIntent } = useStripe()
  const layout = useWindowDimensions().width
  const layoutHeight = useWindowDimensions().height
  const [ playing, setPlaying ] = useState(false)
  const [ buttonOn, setButtonOn ] = useState(true)
  const [ newDonationAnimation, setNewDonationAnimation ] = useState(false)
  const [ currentDonations, setCurrentDonations ] = useState([])
  const layoutMargin = 40
  const [ selectedDate, setSelectedDate ] = useState('Total')
  const onStateChange = useCallback((state : any) => {
    if (state === "ended") {
      setPlaying(false);
    }
  }, []);
  const tabBarHeight = useBottomTabBarHeight() + 60
  const togglePlaying = useCallback(() => {
    setPlaying((prev) => !prev);
  }, []);
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const handlePresentModalPress = () => bottomSheetRef.current?.present();
  const callForDonationAmount = async (amount : number) => {
    setButtonOn(false)
    const paymentIntent = await initializePaymentSheet(Math.floor(amount * 100))
    const paymentSuccess = await openPaymentSheet()
    if(paymentSuccess){
      const { data : getLatestTotal , error } = await supabase.from('donations').select('*').order('date', { ascending : false }).limit(1).single()
      const { error : insertError } = await supabase.from('donations').insert({ amount : getLatestTotal.amount + amount, amountGiven : amount })
      const { error : emailError } = await supabase.functions.invoke('donation-confirmation-email',{ body : { donation_amount : amount } })
      if( emailError ){
        console.log(emailError)
      }
      if( insertError ){
        console.log(insertError)
      }
      setButtonOn(true)
    }else{
      console.log('Failed')
      setButtonOn(true)
    }
    setButtonOn(true)
  }
  const selectedValue = useSharedValue(0)
  const DONATIONGOAL : DonationGoalType[] = [
    {date : "2017-02-01T05:00:00.000Z", amount : 0, amountGiven : 0},
    {date : "2026-02-01T05:00:00.000Z", amount : 13000000, amountGiven : 0}
  ]

  { /* 1857000, 3714000, 5571000, 7428000, 9285000, 11142000, 13000000 */ }
  const getDonations = async ( ) => {
    const { data , error } = await supabase.from('donations').select('*').order('date', { ascending : true })
    if( data ){
      setCurrentDonations(data)
    }
  }
  useEffect(() => {
    getDonations()
    const DonationUpdate = supabase.channel('Check for new donations').on(
      'postgres_changes',
     {
       event: '*',
       schema: 'public',
       table: 'donations',
     },
     (payload) => getDonations()
     )
     .subscribe()

     return () => { supabase.removeChannel( DonationUpdate ) }
  }, [])
  const font = useFont(require('@/assets/fonts/SpaceMono-Regular.ttf'), 20)
  if(!font) {return null}
  const DonationButtonBoxs = [30, 50, 100, 250]
  const currTotalAmount =  currentDonations && currentDonations.length > 0 ? currentDonations[currentDonations.length - 1].amount : 0
  const perctangeToGoal = ((currTotalAmount / 13000000 ) * 100).toFixed(1)
  return (
    <ScrollView style={{ width : layout, height : layoutHeight, backgroundColor : "white" }} contentContainerStyle={{ paddingBottom : tabBarHeight }}> 
        <Stack.Screen options={{ headerBackTitleVisible : false,  headerTintColor : '#007AFF' , headerTitleStyle: { color : 'black'}, headerStyle : {backgroundColor : 'white',} }}/>
        <View className='items-center flex-row'  style={{ backgroundColor : "#0D509D", width : '90%', alignSelf : 'center', marginTop : 2, borderTopLeftRadius : 20, borderTopRightRadius : 20, paddingHorizontal : 8, paddingVertical : 8}}>
            <Image  source={require('@/assets/images/MASHomeLogo.png')} style={{ backgroundColor : 'white', borderRadius : 50, width : 50, height : 50}}/>
            <Text className='text-white text-2xl font-bold ml-4'>MAS Staten Island</Text>
        </View>
        <Divider style={{width : '90%', alignSelf : 'center'}}/>
        <View style={{ backgroundColor : "#0D509D", width : '90%', alignSelf : 'center', borderBottomLeftRadius : 20, borderBottomRightRadius : 20}} className='flex-row'>
            <View style={{ width : (layout * .9) / 1.5}}>
              <AnimatedDonationAmount font={font} selectedValue={selectedValue} percantageToGoal={perctangeToGoal}/>
            </View>
            <View style={{ width : (layout * .9) / 3}} className='items-center justify-center flex-row'>
              <Text className='text-xl font-bold text-[#57BA47]'>{perctangeToGoal}%</Text>
              <Icon size={20} source={'arrow-up-thin'} color='#57BA47'/>
            </View>
        </View>
        <View style={{ width : '90%', height: layoutHeight / 2.8, shadowColor : 'black', shadowOffset : { width : 0, height : 0}, shadowOpacity : 1, shadowRadius : 2, borderRadius : 20, justifyContent : 'center', alignItems : 'center', backgroundColor : 'white', marginTop : 5, alignSelf : 'center' }}> 
          {currentDonations.length > 0 &&<DonationChart CHART_HEIGHT={layoutHeight / 3} CHART_WIDTH={layout * .89}  DONATION_GOAL={DONATIONGOAL} CHART_MARGIN={layoutMargin} CURR_DONATIONS={currentDonations} setSelectedDate={setSelectedDate} selectedValue={selectedValue} setNewDonationAnimation={setNewDonationAnimation} newDonationAnimation={newDonationAnimation}/>}        
        </View> 
        <View style={{ width : layout, height : layoutHeight / 5, backgroundColor : 'white', flexWrap : "wrap", flexDirection : 'row', columnGap : 5, justifyContent : 'center', marginTop : "10%", rowGap : 5 }}>
            {DonationButtonBoxs.map((item, index) => (
                  <Pressable style={{ width : layout / 2.2, height : 50, shadowColor : 'black', shadowOffset : { width : 0, height : 2}, shadowOpacity : 1, shadowRadius : 3 }} onPress={ () =>  callForDonationAmount(DonationButtonBoxs[index]) } key={index} disabled={!buttonOn}>
                      <LinearGradient colors={['#0D509D', '#57BA47']} style={{ width : '100%', height : '100%', opacity : 0.8, borderRadius  : 20, justifyContent : "center" }}>
                          <Text className='text-white text-xl font-bold text-center'>${item}</Text>
                      </LinearGradient>
                  </Pressable>
            ))}
             <Pressable style={{ width : layout / 2.2, height : 50, shadowColor : 'black', shadowOffset : { width : 0, height : 2}, shadowOpacity : 1, shadowRadius : 3  }} onPress={handlePresentModalPress} disabled={!buttonOn}>
                 <LinearGradient colors={['#0D509D', '#57BA47']} style={{ width : '100%', height : '100%', opacity : 0.8, borderRadius  : 20, justifyContent : "center"}}>
                     <Text className='text-white text-xl font-bold text-center'>Other Amount...</Text>
                 </LinearGradient>
             </Pressable>
        </View>
        
        <View>
            <YoutubePlayer
                height={layoutHeight / 4}
                width={layout * 0.98}
                webViewStyle={{ borderRadius : 20, marginLeft : '2%', marginTop : 8, backgroundColor : "#ededed" }}
                play={playing}
                videoId={'pTKXtYdCg9c'}
                onChangeState={onStateChange}
            />
        </View>
        <OtherAmountDonationSheet ref={bottomSheetRef} />
    </ScrollView>
  )
}

export default Donation