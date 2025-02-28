import { View, Text, ImageBackground, TouchableOpacity, Pressable } from 'react-native'
import  React, { useState, useEffect } from 'react'
import { gettingPrayerData } from '../types';
import { format } from 'date-fns';
import moment from 'moment';
import { Link } from 'expo-router';
import { Icon } from 'react-native-paper';
import { usePrayer } from '../providers/prayerTimesProvider';
type salahDisplayWidgetProp = {
    prayer : gettingPrayerData,
    nextPrayer: gettingPrayerData
}
type timeProp = {
    time: string
}
type currentSalahProp = {
    salah: string,
    athan: string,
    iqamah: string
}
export default function SalahDisplayWidget ( {prayer, nextPrayer} : salahDisplayWidgetProp ) {
    if ( !prayer ){
        return
    }
    const { currentPrayer, onSetCurrentPrayer } = usePrayer()
    const { onSetTimeToNextPrayer } = usePrayer()
    const salahArray = ["fajr", "dhuhr", "asr", "maghrib", "isha", "nextDayFajr"];
    const [liveTime, setLiveTime] = useState(new Date());
    const [salahIndex, setCurrentSalahIndex] = useState(0);
    const [currentSalah, setCurrentSalah] = useState<currentSalahProp>({
        salah : "Fajr",
        athan : prayer.athan_fajr,
        iqamah : prayer.iqa_fajr
    });
    const refreshLiveTime = () => {
        setLiveTime(new Date())
      }
    const onSetCurrentSalah = () =>{
        if (salahArray[salahIndex] == "fajr"){
            const fajrSalah = {
                salah: "Fajr",
                athan: prayer.athan_fajr,
                iqamah: prayer.iqa_fajr
            }
            setCurrentSalah(fajrSalah)
            onSetCurrentPrayer('Fajr')
        }
        else if(salahArray[salahIndex] == "dhuhr"){
            const dhuhrSalah = {
                salah: "Dhuhr",
                athan: prayer.athan_zuhr,
                iqamah: prayer.iqa_zuhr
            }
            setCurrentSalah(dhuhrSalah)
            onSetCurrentPrayer('Dhuhr')

        }
        else if(salahArray[salahIndex] == "asr"){
            const asrSalah = {
                salah: "Asr",
                athan: prayer.athan_asr,
                iqamah: prayer.iqa_asr
            }
            setCurrentSalah(asrSalah)
            onSetCurrentPrayer('Asr')

        }
        else if(salahArray[salahIndex] == "maghrib"){
            const maghribSalah = {
                salah: "Maghrib",
                athan: prayer.athan_maghrib,
                iqamah: prayer.iqa_maghrib
            }
            setCurrentSalah(maghribSalah)
            onSetCurrentPrayer('Maghrib')

        }
        else if(salahArray[salahIndex] == "isha"){
            const ishaSalah = {
                salah: "Isha",
                athan: prayer.athan_isha,
                iqamah: prayer.iqa_isha
            }
            setCurrentSalah(ishaSalah)
            onSetCurrentPrayer('Isha')

        }
        else if(salahArray[salahIndex] == "nextDayFajr"){
            const nextDayFajrSalah = {
                salah : "Fajr",
                athan: nextPrayer.athan_fajr,
                iqamah: nextPrayer.iqa_fajr
            }
            setCurrentSalah(nextDayFajrSalah)
            onSetCurrentPrayer('Isha')

        }
    }

    const getTimeToNextPrayer = () => {
        const time1 = moment(currentTime, "HH:mm A")
        let time2 = moment(currentSalah.iqamah, "HH:mm A")
        
        // Time After Fajr & Before Maghrib -> Countdown To Iftar
        // Time After Maghrib & Before Fajr -> Countdown To Suhoor

        const AthanTime = moment(currentTime, "HH:mm A")

        let NextAthanTime = ( currentSalah.salah != 'Fajr' ) ? moment(prayer.athan_maghrib, "HH:mm A") :  moment(prayer.athan_fajr, "HH:mm A")

        if (salahIndex == 6){
            time2.add(1, "day")
            NextAthanTime.add(1, "day")
        }else{
            time2 = moment(currentSalah.iqamah, "HH:mm A")
            NextAthanTime = ( currentSalah.salah != 'Fajr' )  ? moment(prayer.athan_maghrib, "HH:mm A") :  moment(prayer.athan_fajr, "HH:mm A")
        }

        const duration = moment.duration(time2.diff(time1))
        const AthanDuration = moment.duration(NextAthanTime.diff(AthanTime))

        const hours = Math.floor(duration.asHours());
        const minutes = duration.minutes();

        const TimeToAthanHours = Math.floor(AthanDuration.asHours())
        const TimeToAthanMinutes = AthanDuration.minutes()
        
        if( TimeToAthanHours <= 0 && TimeToAthanMinutes <= 0 ){
            onSetTimeToNextPrayer('Now')
        }
        if( TimeToAthanHours == 0  ){
            onSetTimeToNextPrayer(`${TimeToAthanMinutes} min`)
        }
        if( TimeToAthanHours > 0 ){
            onSetTimeToNextPrayer(`${TimeToAthanHours}hr ${TimeToAthanMinutes} min`)
        }
        
        if( hours == 0 && minutes == 0){
            return 'Now'
        }
        if (hours == 0){
            return `${minutes} mins`
        }
        return `${hours} hr ${minutes} mins`
    }

    const currentTime = liveTime.toLocaleTimeString("en-US", {hour12: true, hour: "numeric", minute:"numeric"});
    const timeToNextPrayer = getTimeToNextPrayer();
    const nextFajr = nextPrayer.iqa_fajr
    const nextFajrTime = moment(nextFajr, "HH::mm A");
    const nextFajrDay = nextFajrTime.add(1, "days");  
    const midNight = moment("12:01AM" , "HH:mm A");
    const nextDayMidnight = midNight.add(1, "days");
    const getTimeToMidNight = () =>{
        const time1 = moment(currentTime, "HH:mm A");
        const time2 = nextDayMidnight;

        const duration = moment.duration(time2.diff(time1));
        return duration.asMilliseconds();
    }
    const compareTime = ( ) =>{
        const time1 = moment(currentTime, "HH:mm A");
        const time2 = moment(currentSalah.iqamah, "HH:mm A")
        if (salahIndex == 6) {
            time2.add(1, "days")
        }
        
        if ( time1.isAfter(time2) && salahIndex > 6){
            setCurrentSalahIndex(0)
        }
        else if ( time1.isAfter(time2) ){
            setCurrentSalahIndex(salahIndex => salahIndex + 1)
            onSetCurrentSalah()
        }
    }
    compareTime()
    useEffect(() => {
        const timerId = setInterval(refreshLiveTime, 1000)        
        return function cleanup() {
          clearInterval(timerId)
        }
    }, [])
  return (
    <View>
        <Link href={"/prayersTable"} asChild>  
        <Pressable>
        <ImageBackground 
            source={require("@/assets/images/salahPictures/DJI_0049.jpg")}
            style={{height: "100%", width: "100%" }}
        >
        <View className='flex-row mt-4 items-center w-[100%]'>
            <Text className='text-white px-5 font-bold text-lg w-[50%]' style={{textShadowColor: "#000", textShadowOffset: { width: 0.5, height: 3 }, textShadowRadius: 1 }} numberOfLines={1} adjustsFontSizeToFit>{prayer.hijri_month} {prayer.hijri_date}</Text>
            <Text className='text-gray-100 ml-[23%] font-bold text-lg w-[50%]' style={{textShadowColor: "#000", textShadowOffset: { width: 0.5, height: 3 }, textShadowRadius: 1 }}>Athan</Text>
        </View>
        <View className='flex-row mt-9 w-[100%]'>
            <Text className='text-white px-5 font-bold text-4xl w-[50%] text-left' style={{textShadowColor: "#000", textShadowOffset: { width: 0.5, height: 3 }, textShadowRadius: 1}} >{currentSalah.salah}</Text>
            <Text className='text-gray-100 font-bold text-3xl w-[50%] text-center' style={[{textShadowColor: "#000", textShadowOffset: { width: 0.5, height: 3 }, textShadowRadius: 1 }]}>{currentSalah.athan}</Text>
        </View>
        <View className='flex-row mt-12 items-center w-[100%]'>
            <Text className='text-white pl-4 pr-1 font-bold text-xl w-[50%] text-left' style={{textShadowColor: "#000", textShadowOffset: { width: 0.5, height: 3 }, textShadowRadius: 1 }}>Next Iqamah in</Text>
            <Text className='text-white font-bold text-2xl w-[50%] text-center' style={{textShadowColor: "#000", textShadowOffset: { width: 0.5, height: 3 }, textShadowRadius: 1 }}>{timeToNextPrayer}</Text>
        </View>
        <View className='items-center flex-row justify-end w-[100%] mt-3'>
            <Text className='text-right text-gray-300' style={{textShadowColor: "#000", textShadowOffset: { width: 0.5, height: 2 }, textShadowRadius: 1 }}>Full Prayer Schedule</Text>
            <Icon source={'chevron-right'} size={20} color='#D3D3D3'/>
        </View>
        </ImageBackground>
        </Pressable>
        </Link>      
    </View>
  )
}