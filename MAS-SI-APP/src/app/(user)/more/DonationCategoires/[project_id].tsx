import { View, Text, Pressable, Image, Dimensions, useWindowDimensions, FlatList, ScrollView } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import Svg, { Circle, Path } from 'react-native-svg'
import { Dialog, Modal, Portal, ProgressBar } from 'react-native-paper'
import OtherAmountDonationSheet from '@/src/components/ShopComponets/OtherAmountDonationSheet'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { initializePaymentSheet, openPaymentSheet } from '@/src/lib/stripe'
import { supabase } from '@/src/lib/supabase'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { BlurView } from 'expo-blur'
const ProjectDetails = () => {
  const { project_id, project_name, project_linked_to, project_goal, thumbnail } = useLocalSearchParams()
  const [ projectInfo, setProjectInfo ] = useState<{ project_id : string, }[]>()
  const [ progressBar, setProgressBar ] = useState(0)
  const [ progressCircleLeft, setProgressCircle ] = useState(0)
  const [ buttonOn, setButtonOn ] = useState(true)
  const [ percentage, setPercentage ] = useState(0)
  const [ seeGallery, setSeeGallery ] = useState(false)
  const [ gallery, setGallery ] = useState<string[]>([])
  const [ currentIndex, setCurrentIndex ] = useState(0)
  const galleryScrollRef = useRef<ScrollView>(null)
  const layoutWidth = useWindowDimensions().width
  const progressCircle = useAnimatedStyle(() => {
    return {
      left : withTiming(progressCircleLeft - 1.5, { duration : 2000 })
    }
  })

  const progressBarAnim = useAnimatedStyle(() => {
    return { 
      width : withTiming(progressBar, { duration : 2000 })
    }
  })
  const hideModal = () => setSeeGallery(false)
  const onPressNext = ( ) => {
    galleryScrollRef.current?.scrollTo({
      x : ((layoutWidth * .85) + 5) * ((currentIndex + 1) % gallery.length) ,
      animated : true
    })
   console.log('Current Index', currentIndex)
   console.log('New Index',  ((currentIndex + 1) % gallery.length))
  }
  const onPressBack = () => {
    galleryScrollRef.current?.scrollTo({
      x : ((layoutWidth * .85) + 5) * ((currentIndex - 1) % gallery.length) ,
      animated : true
    })
  }
  const getProjectDonations = async ( ) => {
    if (project_goal == null){
        const { data : GalleryPics, error } = await supabase.storage.from('fliers').list(project_id as string)
        if( GalleryPics && GalleryPics.length > 0 ){
          await Promise.all(
            GalleryPics.map( async (pic) => {
                const { data } = supabase
                .storage
                .from('fliers')
                .getPublicUrl(`${project_id}/${pic.name}`)
                if( data ){
                    setGallery(prev => [...prev, data.publicUrl])
                }
            })
            )
        }   
    
      return
    } 
    const { data , error } = await supabase.from('donations').select('*').contains('project_donated_to', [project_id])

    if( data ){
      const totalAmount = data.reduce((sum, donation) => sum + donation.amountGiven, 0);
      const Percentage = (totalAmount / Number(project_goal)) * 100
      const progressCircleInterpolate = interpolate(totalAmount, [0, Number(project_goal)], [0, layoutWidth * .9], Extrapolation.CLAMP)
      const progressBarInterpolate = interpolate(Percentage, [0, 100], [0, layoutWidth * .92], Extrapolation.CLAMP)
      setProgressCircle(progressCircleInterpolate)
      setProgressBar(progressBarInterpolate)
      setPercentage(Percentage)
    }
  }

  const DonationButtonBoxs = [30, 50, 100, 250]
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const handlePresentModalPress = () => bottomSheetRef.current?.present();
  const callForDonationAmount = async (amount : number) => {
    setButtonOn(false)
    const paymentIntent = await initializePaymentSheet(Math.floor(amount * 100))
    const paymentSuccess = await openPaymentSheet()
    if(paymentSuccess){
      const { data : getLatestTotal , error } = await supabase.from('donations').select('*').order('date', { ascending : false }).limit(1).single()
      const { error : insertError } = await supabase.from('donations').insert({  amountGiven : amount, project_donated_to : project_linked_to ?  [project_id, project_linked_to] : [project_id] })
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

  useEffect(() => {
    getProjectDonations()
  }, [])
  console.log(gallery.length)
  return (
    <View className='flex-1 bg-white'>
        <Stack.Screen options={{
            headerTransparent : true,
            header : () => 
                (
                <View style={{ borderBottomLeftRadius: 20, borderBottomRightRadius : 20, backgroundColor : '#81CB77', height : 100 }} 
                className='items-end justify-center flex flex-row'>
                  
                  <View className='mb-[1%] flex flex-row items-center w-[100%]'>
      
                    <Pressable className='self-start ml-4' onPress={() => router.back()}>
                      <Svg width="35" height="35" viewBox="0 0 29 29" fill="none">
                        <Path d="M18.125 7.25L10.875 14.5L18.125 21.75" stroke="#1B85FF" stroke-width="2"/>
                      </Svg>
                    </Pressable>
      
                    <Text className='font-bold text-xl text-center self-center ml-[25%] text-white'>Donation</Text>
                  </View>
                </View>
                )
            
        }}
        />
      <View className='w-[100%] items-center pt-[110] bg-[#F6F6F6] rounded-br-[15px] rounded-bl-[15px] pb-2'>
       { thumbnail as string ? <Image src={thumbnail as string} className='w-[95%] h-[273px] rounded-[15px]'/> : <Image source={require('@/assets/images/Donations5.png')} className='w-[95%] h-[273px] rounded-[15px]' /> }
        <View className=' flex flex-col w-[100%] items-center mt-2 '>
            <View className='flex flex-row w-[100%] items-center justify-center'>
              {
                !project_goal ?
                <>
                  <Text className='text-black text-[15px] mb-2 font-[700] text-center ml-[25%]' numberOfLines={1} adjustsFontSizeToFit>{project_name}</Text>
                  <Pressable className='self-start bg-[#D9D9D9] rounded-full h-[35px] w-[35px] items-center justify-center ml-[15%]' onPress={() => setSeeGallery(true)}>
                    <Svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                      <Path d="M10.625 19.375V18.875H11.125V19.375H10.625ZM4.72855 25.9786C4.53329 26.1738 4.21671 26.1738 4.02145 25.9786C3.82618 25.7833 3.82618 25.4667 4.02145 25.2714L4.72855 25.9786ZM10.125 25V19.375H11.125V25H10.125ZM10.625 19.875H5V18.875H10.625V19.875ZM10.9786 19.7286L4.72855 25.9786L4.02145 25.2714L10.2714 19.0214L10.9786 19.7286Z" fill="#222222"/>
                      <Path d="M15 26.875H22.875C25.0841 26.875 26.875 25.0841 26.875 22.875V7.125C26.875 4.91586 25.0841 3.125 22.875 3.125H7.125C4.91586 3.125 3.125 4.91586 3.125 7.125V15" stroke="#222222"/>
                      <Path d="M10.625 10.625L15.0466 17.0115C15.7001 17.9555 17.0125 18.1567 17.9188 17.4518L20.4814 15.4588C21.2775 14.8395 22.4102 14.9101 23.1234 15.6233L26.875 19.3748" stroke="#222222"/>
                      <Circle cx="20.625" cy="9.375" r="1.875" fill="#222222"/>
                    </Svg>
                  </Pressable>
                </>:
                <Text className='text-black text-[15px] mb-2 font-[700] text-center px-3' numberOfLines={1} adjustsFontSizeToFit>{project_name}</Text>
              }
            </View>
           
            { project_goal && 
            <View className='w-[93%] relative ' >

                <Animated.View className=' absolute h-[15px] w-[16px] bottom-7.5 z-[2] bg-[#57BA49] rounded-full' 
                style={[{ shadowColor : 'black', shadowOffset : { width : 0, height : 4}, shadowOpacity : 1, shadowRadius : 4},progressCircle ]}/>
                <Animated.View style={[progressBarAnim, { height : 16}]} className='bg-[#57BA49] absolute bottom-7.5 rounded-l-xl z-[1] '/>
                <View className='bg-[#0D509E] rounded-xl self-center h-[16px]' style={{width : layoutWidth * .93}}/>
                <Text className='text-black text-lg font-[300]'>Raised:  {percentage}%</Text>
            </View>
            }
            </View> 
            
      </View>

      <View className='mt-5'>
        <Text className='text-black text-lg font-bold ml-3'>Select Amount: </Text>

        <View style={{ width : '100%',  backgroundColor : 'white', flexWrap : "wrap", flexDirection : 'row', columnGap : 20, justifyContent : 'center', marginTop : "2%", rowGap : 25}}
        className=''
        >
            {DonationButtonBoxs.map((item, index) => (
                  <Pressable style={{ width : '35%', height : 45,}} onPress={ () =>  callForDonationAmount(DonationButtonBoxs[index]) } key={index} disabled={!buttonOn}>
                      <LinearGradient colors={['#57BA47','#0D509D']} style={{ width : '100%', height : '100%', borderRadius  : 20, justifyContent : "center" }}>
                          <Text className='text-white text-xl font-bold text-center'>${item}.00</Text>
                      </LinearGradient>
                  </Pressable>
            ))}
             <Pressable style={{ width : '50%', height : 50 }} onPress={handlePresentModalPress} disabled={!buttonOn}>
                 <View className='bg-black' style={{ width : '100%', height : '100%', borderRadius  : 20, justifyContent : "center"}}>
                     <Text className='text-white text-xl font-bold text-center'>Other Amount...</Text>
                 </View>
             </Pressable>
        </View>

        <View>
            <Text className='text-black font-bold text-center mt-5'>Help Us Complete The Expansion Of Our Center </Text>
        </View>
      </View>
      <OtherAmountDonationSheet ref={bottomSheetRef} />
      <Portal>
        <Modal  
        visible={seeGallery} 
        contentContainerStyle={{ height : '110%', width : '100%', alignItems : 'center' }}
        dismissable
        >
              <BlurView className='h-[110%] w-[100%] pt-[130px] items-center '
              intensity={50}
              >
                <View className='rounded-[15px] mb-6 relative z-[1]' 
                style={{ width : layoutWidth * .9, height : '70%', alignSelf : 'center', alignItems : 'center', justifyContent : 'center', backgroundColor : 'white' }} 
                >
                  <Pressable className=' absolute right-[90%] bottom-[95%] rounded-full bg-white p-2 items-center justify-center' onPress={() => setSeeGallery(false)}>
                      <Svg  width="34" height="34" viewBox="0 0 34 34" fill="none">
                        <Circle cx="17" cy="17" r="12.15" stroke="#7E869E" stroke-opacity="0.25" stroke-width="1.2"/>
                        <Path d="M22.6673 11.3335L11.334 22.6668" stroke="#FF0000" stroke-width="1.2" stroke-linecap="square" stroke-linejoin="round"/>
                        <Path d="M11.3327 11.3335L22.666 22.6668" stroke="#FF0000" stroke-width="1.2" stroke-linecap="square" stroke-linejoin="round"/>
                      </Svg>
                  </Pressable>
                    <View className='w-[95%] h-[95%] '>
                      <ScrollView style={{  
                      }} 
                      horizontal 
                      pagingEnabled
                      disableIntervalMomentum={ true } 
                      snapToInterval={ layoutWidth * .85 + 5 }
                      snapToAlignment='start'
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ 
                        flexGrow : 1,            
                        gap: 5
                      }}
                      ref={galleryScrollRef}
                      onScroll={e => {
                        const indexlayout = e.nativeEvent.contentOffset.x;
                        setCurrentIndex( Math.floor( indexlayout / (layoutWidth * .84) ) )
                      }}
                      >
                        {
                          gallery.map((item, index) => (
                            <View className={`rounded-[15px] overflow-hidden`} style={{ backgroundColor : item, width : layoutWidth * .85 }}>
                              <Image src={item} className='w-[100%] h-[100%] '/>
                            </View>
                          ))
                        }
                      </ScrollView>
                      
                    </View>
                    <Pressable className='bg-black h-[32px] w-[32px] rounded-full absolute bottom-[50%] right-[95%] items-center justify-center' onPress={onPressBack}>
                        <Svg width="29" height="29" viewBox="0 0 29 29" fill="none">
                          <Path d="M18.125 7.25L10.875 14.5L18.125 21.75" stroke="#1B85FF" stroke-width="2"/>
                        </Svg>
                      </Pressable>
    
                    <Pressable className='bg-black h-[32px] w-[32px] rounded-full absolute bottom-[50%] left-[95%] items-center justify-center' onPress={onPressNext}>
                    <Svg  width="29" height="29" viewBox="0 0 29 29" fill="none">
                      <Path d="M10.875 21.75L18.125 14.5L10.875 7.25" stroke="#1B85FF" stroke-width="2"/>
                    </Svg>
                    </Pressable>
                </View>
              </BlurView>
        </Modal>
      </Portal>
    </View>
  )
}

export default ProjectDetails