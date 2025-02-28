import { PropsWithChildren, createContext, useContext, useState } from "react";
import { gettingPrayerData } from "../types";
type programsContextProp = {
    prayerTimesWeek : gettingPrayerData[],
    currentPrayer : string,
    timeToNextPrayer : string,
    onSetTimeToNextPrayer : (timeToNextPrayer: string) =>void,
    onSetCurrentPrayer : ( currentPrayer : string ) => void,
    onSetPrayerTimesWeek : (prayer: gettingPrayerData[]) => void,
    upcomingPrayer : string,
    onSetUpcomingPrayer : ( upcomingPrayer : string ) => void
}
const PrayersContext = createContext<programsContextProp>({
    prayerTimesWeek: [],
    onSetPrayerTimesWeek: () => {},
    currentPrayer : '',
    onSetCurrentPrayer : () => {},
    timeToNextPrayer : '',
    onSetTimeToNextPrayer: () => {},
    upcomingPrayer : '',
    onSetUpcomingPrayer : () => {}
})

const PrayerTimesProvider = ( {children} : PropsWithChildren ) =>{
    const [prayerTimesWeek, setPrayerTimesWeek] = useState<gettingPrayerData[]>([]);
    const [ currentPrayer, setCurrentPrayer ] = useState<string>('')
    const [ timeToNextPrayer, setTimeToNextPrayer ] = useState<string>('')
    const [ upcomingPrayer, setUpcomingPrayer ] = useState<string>('')
    const onSetPrayerTimesWeek = ( prayer: gettingPrayerData[] ) =>{
        setPrayerTimesWeek(prayer)
    }
    const onSetCurrentPrayer = ( prayer : string ) => {
        setCurrentPrayer(prayer)
    }

    const onSetTimeToNextPrayer = ( prayer : string ) =>{
        setTimeToNextPrayer(prayer)
    }

    const onSetUpcomingPrayer = ( prayer : string ) => {
        setUpcomingPrayer(prayer)
    }

return(
    <PrayersContext.Provider
        value={{
            prayerTimesWeek, onSetPrayerTimesWeek, 
            currentPrayer, onSetCurrentPrayer, 
            timeToNextPrayer, onSetTimeToNextPrayer,
            upcomingPrayer, onSetUpcomingPrayer
        }}
    >
        {children}
    </PrayersContext.Provider>
)
}

export default PrayerTimesProvider

export const usePrayer = () =>  useContext(PrayersContext) ;