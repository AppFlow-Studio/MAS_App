import { PropsWithChildren, createContext, useContext, useState } from "react";
import { gettingPrayerData } from "../types";
type programsContextProp = {
    prayerTimesWeek : gettingPrayerData[],
    currentPrayer : string,
    timeToNextPrayer : string,
    onSetTimeToNextPrayer : (timeToNextPrayer: string) =>void,
    onSetCurrentPrayer : ( currentPrayer : string ) => void,
    onSetPrayerTimesWeek : (prayer: gettingPrayerData[]) => void
}
const PrayersContext = createContext<programsContextProp>({
    prayerTimesWeek: [],
    onSetPrayerTimesWeek: () => {},
    currentPrayer : '',
    onSetCurrentPrayer : () => {},
    timeToNextPrayer : '',
    onSetTimeToNextPrayer: () => {}
})

const PrayerTimesProvider = ( {children} : PropsWithChildren ) =>{
    const[prayerTimesWeek, setPrayerTimesWeek] = useState<gettingPrayerData[]>([]);
    const [ currentPrayer, setCurrentPrayer ] = useState<string>('')
    const [ timeToNextPrayer, setTimeToNextPrayer ] = useState('')
    const onSetPrayerTimesWeek = ( prayer: gettingPrayerData[] ) =>{
        setPrayerTimesWeek(prayer)
    }
    const onSetCurrentPrayer = ( prayer : string ) => {
        setCurrentPrayer(prayer)
    }

    const onSetTimeToNextPrayer = ( prayer : string ) =>{
        setTimeToNextPrayer(prayer)
    }

return(
    <PrayersContext.Provider
        value={{prayerTimesWeek, onSetPrayerTimesWeek, currentPrayer, onSetCurrentPrayer, timeToNextPrayer, onSetTimeToNextPrayer}}
    >
        {children}
    </PrayersContext.Provider>
)
}

export default PrayerTimesProvider

export const usePrayer = () =>  useContext(PrayersContext) ;