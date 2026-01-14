import { DataTable, Divider, Icon, IconButton } from 'react-native-paper';
import { gettingPrayerData, prayerTimeData } from '@/src/types';
import ProgramWidgetSlider from "@/src/components/programWidgetSlider";
import { View, Text, useWindowDimensions, StyleSheet, Pressable, ImageBackground, Platform, Modal, Animated } from "react-native";
import AlertBell from '../app/(user)/prayersTable/alertBell';
import { useCurrentPrayer } from '../hooks/usePrayerTimes';
import { FajrIcon, DhuhrIcon, AsrIcon, MaghribIcon, IshaIcon } from './SalahIcons/FajrIcon';
import { Link } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import { BlurView } from 'expo-blur';
import { X, Check } from 'lucide-react-native';

type NotificationOption = 'prayer_time' | 'iqamah_time' | '30_min_before' | 'mute';

type PrayerNotificationSettings = {
  [key: string]: {
    enabled: boolean;
    options: NotificationOption[]; // Changed to array for multiple selections
  };
};
type prayerDataProp = {
  prayerData: gettingPrayerData,
  setTableIndex: (tableIndex: number) => void
  tableIndex: number
  index: number
  userSettings: { prayer: string, notification_settings: string[] }[] | undefined
}
const Table = ({ prayerData, setTableIndex, tableIndex, index, userSettings }: prayerDataProp) => {
  const currentPrayer = useCurrentPrayer()
  const { width, height } = useWindowDimensions();
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<string | null>(null);
  const blurOpacity = useRef(new Animated.Value(0)).current;
  
  // Prayer notification settings state
  const [prayerSettings, setPrayerSettings] = useState<PrayerNotificationSettings>({
    'Fajr': { enabled: false, options: [] },
    'Dhuhr': { enabled: false, options: [] },
    'Asr': { enabled: false, options: [] },
    'Maghrib': { enabled: false, options: [] },
    'Isha': { enabled: false, options: [] },
  });

  // Animate blur when modal opens
  useEffect(() => {
    if (modalVisible) {
      const timeout = setTimeout(() => {
        Animated.timing(blurOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }, 300);
      return () => clearTimeout(timeout);
    } else {
      blurOpacity.setValue(0);
    }
  }, [modalVisible]);

  const handleBellPress = (salah: string) => {
    setSelectedPrayer(salah);
    setModalVisible(true);
  };

  const handleOptionSelect = (option: NotificationOption) => {
    if (selectedPrayer) {
      setPrayerSettings(prev => {
        const currentOptions = prev[selectedPrayer].options;
        
        // If selecting 'mute', clear all other options and only set mute
        if (option === 'mute') {
          return {
            ...prev,
            [selectedPrayer]: {
              ...prev[selectedPrayer],
              options: currentOptions.includes('mute') ? [] : ['mute'],
            }
          };
        }
        
        // If selecting a non-mute option, remove 'mute' if it exists and toggle the option
        let newOptions: NotificationOption[];
        if (currentOptions.includes(option)) {
          // Remove the option if already selected
          newOptions = currentOptions.filter(o => o !== option);
        } else {
          // Add the option and remove 'mute' if present
          newOptions = [...currentOptions.filter(o => o !== 'mute'), option];
        }
        
        return {
          ...prev,
          [selectedPrayer]: {
            ...prev[selectedPrayer],
            options: newOptions,
          }
        };
      });
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedPrayer(null);
  };

  const handleSave = () => {
    console.log('Saving settings for:', selectedPrayer, prayerSettings[selectedPrayer!]);
    handleCloseModal();
  };

  const handleApplyToAll = () => {
    if (selectedPrayer) {
      const currentOptions = [...prayerSettings[selectedPrayer].options];
      setPrayerSettings({
        'Fajr': { enabled: true, options: currentOptions },
        'Dhuhr': { enabled: true, options: currentOptions },
        'Asr': { enabled: true, options: currentOptions },
        'Maghrib': { enabled: true, options: currentOptions },
        'Isha': { enabled: true, options: currentOptions },
      });
    }
  };
  
  const nextPress = () => {
    const nextPressNum = Math.ceil(index + 1)
    setTableIndex(Math.min(6, nextPressNum))
  }
  const backPress = () => {
    setTableIndex(Math.max(0, index - 1))
  }

  const icons = [
    <FajrIcon color="#1d4681" size={20} />, 
    <DhuhrIcon color="#1d4681" size={20} />, 
    <AsrIcon color="#1d4681" size={20} />, 
    <MaghribIcon color="#1d4681" size={20} />, 
    <IshaIcon color="#1d4681" size={20} />
  ]
  return (
    <>
    <View style={{ width: width }} className='items-center pt-2 pb-0' >
      <View className='items-center justify-center  w-[95%]' >
        {/* Date Selector - Premium Design */}
        <View className='flex-row justify-between items-center px-3 py-2 rounded-2xl h-[70] w-[85%]'
          style={[{ 
            backgroundColor: 'rgba(29, 70, 129, 0.08)',
            borderWidth: 1,
            borderColor: 'rgba(29, 70, 129, 0.15)',
            shadowColor: '#1d4681',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
          },
          Platform.OS == 'android' ? {
            borderWidth: 1,
            borderColor: 'rgba(29, 70, 129, 0.15)',
          } : {}
          ]}>
          <Pressable 
            onPress={backPress}
            style={{ padding: 8 }}
          >
            <Icon source="chevron-left" size={26} color='#1d4681' />
          </Pressable>
          <View className='flex-col items-center justify-center'>
            <Text style={{ color: '#1d4681', fontWeight: '700', fontSize: 17, letterSpacing: 0.3 }}>{prayerData.date}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <View style={{ 
                width: 6, 
                height: 6, 
                borderRadius: 3, 
                backgroundColor: '#10b981',
                marginRight: 6,
              }} />
              <Text style={{ color: '#10b981', fontWeight: '500', fontSize: 13 }}>{prayerData.hijri_month} {prayerData.hijri_date}</Text>
            </View>
          </View>
          <Pressable 
            onPress={nextPress}
            style={{ padding: 8 }}
          >
            <Icon source="chevron-right" size={26} color='#1d4681' />
          </Pressable>
        </View>

        <View className='mt-3 w-[100%]'>
          <View style={
            [{ width: '100%' },
            Platform.OS == 'android' ? {
              borderWidth: 1,
              borderColor: 'rgba(29, 70, 129, 0.1)',
            } : {}

            ]} className='flex-col px-2'>
            {
              index == 0 ?
                ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((salah, prayerIndex) => {
                  const prayerSetting = userSettings?.filter(setting => setting.prayer == salah.toLowerCase())
                  const isCurrentPrayer = currentPrayer == salah && index == 0;
                  const isFajr = prayerIndex === 0;
                  return (
                    <React.Fragment key={prayerIndex}>
                      <View style={{
                        backgroundColor: isCurrentPrayer ? 'rgba(16, 185, 129, 0.12)' : 'rgba(29, 70, 129, 0.06)',
                        borderWidth: isCurrentPrayer ? 1.5 : 1,
                        borderColor: isCurrentPrayer ? 'rgba(16, 185, 129, 0.4)' : 'rgba(29, 70, 129, 0.12)',
                        borderRadius: 16,
                        marginBottom: 8,
                        shadowColor: isCurrentPrayer ? '#10b981' : '#1d4681',
                        shadowOffset: { width: 0, height: isCurrentPrayer ? 4 : 2 },
                        shadowOpacity: isCurrentPrayer ? 0.2 : 0.08,
                        shadowRadius: isCurrentPrayer ? 8 : 4,
                        elevation: isCurrentPrayer ? 8 : 3,
                        flexDirection: 'row',
                        alignItems: 'center',
                        height: isFajr ? 78 : 68,
                        paddingHorizontal: 16,
                      }}>
                        <View style={{ flex: 1.4, justifyContent: 'center' }}>
                          {isFajr && <Text style={{ fontSize: 10, color: "rgba(29,70,129,0.5)", fontWeight: '500', letterSpacing: 0.5, textTransform: 'uppercase', position: 'absolute', top: -2, left: 36 }}>Prayer</Text>}
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: isFajr ? 14 : 0 }}>
                            <View style={{
                              backgroundColor: isCurrentPrayer ? 'rgba(16, 185, 129, 0.15)' : 'rgba(29, 70, 129, 0.08)',
                              borderRadius: 10,
                              padding: 6,
                              marginRight: 10,
                            }}>
                              {icons[prayerIndex]}
                            </View>
                            <Text style={{ 
                              color: isCurrentPrayer ? '#10b981' : '#1d4681', 
                              fontWeight: '600', 
                              fontSize: 15,
                            }}>{salah}</Text>
                          </View>
                        </View>
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                          {isFajr && <Text style={{ fontSize: 10, color: "rgba(29,70,129,0.5)", fontWeight: '500', letterSpacing: 0.5, textTransform: 'uppercase', position: 'absolute', top: -8 }}>Athan</Text>}
                          <Text style={{ 
                            color: "rgba(29,70,129,0.7)", 
                            fontSize: 15,
                            fontWeight: '500',
                            marginTop: isFajr ? 14 : 0,
                          }} adjustsFontSizeToFit numberOfLines={1}>{prayerData[`athan_${salah == 'Dhuhr' ? 'zuhr' : salah.toLowerCase()}` as keyof gettingPrayerData]}</Text>
                        </View>
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                          {isFajr && <Text style={{ fontSize: 10, color: "rgba(29,70,129,0.5)", fontWeight: '500', letterSpacing: 0.5, textTransform: 'uppercase', position: 'absolute', top: -8 }}>Iqamah</Text>}
                          <Text style={{ 
                            color: '#10b981', 
                            fontWeight: '700',
                            fontSize: 15,
                            marginTop: isFajr ? 14 : 0,
                          }} adjustsFontSizeToFit numberOfLines={1}>{prayerData[`iqa_${salah == 'Dhuhr' ? 'zuhr' : salah.toLowerCase()}` as keyof gettingPrayerData]}</Text>
                        </View>
                        <View style={{ width: 44, justifyContent: 'center', alignItems: 'center' }}>
                          <Pressable 
                            hitSlop={10} 
                            onPress={() => handleBellPress(salah)}
                            style={{
                              backgroundColor: isCurrentPrayer ? 'rgba(128, 128, 128, 0.15)' : 'rgba(29, 70, 129, 0.08)',
                              borderRadius: 10,
                              padding: 8,
                            }}
                          >
                            <Icon source="bell-outline" size={20} color={isCurrentPrayer ? "#facc15" : "rgba(29,70,129,0.5)"} />
                          </Pressable>
                        </View>
                      </View>
                    </React.Fragment>
                  )
                })
                :
                ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((salah, prayerIndex) => {
                  const isFajr = prayerIndex === 0;
                  return (
                    <React.Fragment key={prayerIndex}>
                      <View style={{
                        backgroundColor: 'rgba(29, 70, 129, 0.06)',
                        borderWidth: 1,
                        borderColor: 'rgba(29, 70, 129, 0.12)',
                        borderRadius: 16,
                        marginBottom: 8,
                        shadowColor: '#1d4681',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.08,
                        shadowRadius: 4,
                        elevation: 3,
                        flexDirection: 'row',
                        alignItems: 'center',
                        height: isFajr ? 78 : 68,
                        paddingHorizontal: 16,
                      }}>
                        <View style={{ flex: 1.4, justifyContent: 'center' }}>
                          {isFajr && <Text style={{ fontSize: 10, color: "rgba(29,70,129,0.5)", fontWeight: '500', letterSpacing: 0.5, textTransform: 'uppercase', position: 'absolute', top: -2, left: 36 }}>Prayer</Text>}
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: isFajr ? 14 : 0 }}>
                            <View style={{
                              backgroundColor: 'rgba(29, 70, 129, 0.08)',
                              borderRadius: 10,
                              padding: 6,
                              marginRight: 10,
                            }}>
                              {icons[prayerIndex]}
                            </View>
                            <Text style={{ color: '#1d4681', fontWeight: '600', fontSize: 15 }}>{salah}</Text>
                          </View>
                        </View>
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                          {isFajr && <Text style={{ fontSize: 10, color: "rgba(29,70,129,0.5)", fontWeight: '500', letterSpacing: 0.5, textTransform: 'uppercase', position: 'absolute', top: -8 }}>Athan</Text>}
                          <Text style={{ 
                            color: "rgba(29,70,129,0.7)", 
                            fontSize: 15,
                            fontWeight: '500',
                            marginTop: isFajr ? 14 : 0,
                          }} adjustsFontSizeToFit numberOfLines={1}>{prayerData[`athan_${salah == 'Dhuhr' ? 'zuhr' : salah.toLowerCase()}` as keyof gettingPrayerData]}</Text>
                        </View>
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                          {isFajr && <Text style={{ fontSize: 10, color: "rgba(29,70,129,0.5)", fontWeight: '500', letterSpacing: 0.5, textTransform: 'uppercase', position: 'absolute', top: -8 }}>Iqamah</Text>}
                          <Text style={{ 
                            color: '#10b981', 
                            fontWeight: '700',
                            fontSize: 15,
                            marginTop: isFajr ? 14 : 0,
                          }} adjustsFontSizeToFit numberOfLines={1}>{prayerData[`iqa_${salah == 'Dhuhr' ? 'zuhr' : salah.toLowerCase()}` as keyof gettingPrayerData]}</Text>
                        </View>
                        <View style={{ width: 44, justifyContent: 'center', alignItems: 'center' }}>
                          <Pressable 
                            hitSlop={10} 
                            onPress={() => handleBellPress(salah)}
                            style={{
                              backgroundColor: 'rgba(29, 70, 129, 0.08)',
                              borderRadius: 10,
                              padding: 8,
                            }}
                          >
                            <Icon source="bell-outline" size={20} color="rgba(29,70,129,0.5)" />
                          </Pressable>
                        </View>
                      </View>
                    </React.Fragment>
                  )
                })
            }

            <Link href={'/myPrograms/notifications'} asChild>
              <Pressable style={{ paddingVertical: 6, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
                <Text style={{ color: '#10b981', fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' }}>
                  Customize Salah Notifications
                </Text>
              </Pressable>
            </Link>


          </View>

        </View>
      </View>
    </View>

    {/* Modal for Notification Settings */}
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCloseModal}
    >
      <View style={modalStyles.modalOverlay}>
        {/* Animated blur background */}
        <Animated.View style={[modalStyles.blurContainer, { opacity: blurOpacity }]}>
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
        </Animated.View>
        
        <View style={modalStyles.modalContent}>
          {/* Handle Indicator */}
          <View style={modalStyles.modalIndicator} />
          
          {/* Header */}
          <View style={modalStyles.sheetHeader}>
            <Text style={modalStyles.sheetTitle}>
              {selectedPrayer} notification settings
            </Text>
            <Pressable onPress={handleCloseModal} style={modalStyles.closeButton}>
              <X color="rgba(255, 255, 255, 0.7)" size={24} />
            </Pressable>
          </View>

          {/* Options */}
          <View style={modalStyles.optionsContainer}>
            {/* Notify at Prayer Time */}
            <Pressable 
              style={modalStyles.optionRow}
              onPress={() => handleOptionSelect('prayer_time')}
            >
              <View style={[
                modalStyles.checkboxOuter,
                prayerSettings[selectedPrayer || '']?.options?.includes('prayer_time') && modalStyles.checkboxSelected
              ]}>
                {prayerSettings[selectedPrayer || '']?.options?.includes('prayer_time') && (
                  <Check color="#1a3a5c" size={14} strokeWidth={3} />
                )}
              </View>
              <View style={modalStyles.optionTextContainer}>
                <Text style={modalStyles.optionTitle}>Notify at Prayer Time</Text>
                <Text style={modalStyles.optionDescription}>Get notified exactly when it's time to pray</Text>
              </View>
            </Pressable>

            {/* Notify at Iqamah Time */}
            <Pressable 
              style={modalStyles.optionRow}
              onPress={() => handleOptionSelect('iqamah_time')}
            >
              <View style={[
                modalStyles.checkboxOuter,
                prayerSettings[selectedPrayer || '']?.options?.includes('iqamah_time') && modalStyles.checkboxSelected
              ]}>
                {prayerSettings[selectedPrayer || '']?.options?.includes('iqamah_time') && (
                  <Check color="#1a3a5c" size={14} strokeWidth={3} />
                )}
              </View>
              <View style={modalStyles.optionTextContainer}>
                <Text style={modalStyles.optionTitle}>Notify at Iqamah Time</Text>
                <Text style={modalStyles.optionDescription}>Get notified when it's time to gather at the masjid</Text>
              </View>
            </Pressable>

            {/* 30-Minute Reminder */}
            <Pressable 
              style={modalStyles.optionRow}
              onPress={() => handleOptionSelect('30_min_before')}
            >
              <View style={[
                modalStyles.checkboxOuter,
                prayerSettings[selectedPrayer || '']?.options?.includes('30_min_before') && modalStyles.checkboxSelected
              ]}>
                {prayerSettings[selectedPrayer || '']?.options?.includes('30_min_before') && (
                  <Check color="#1a3a5c" size={14} strokeWidth={3} />
                )}
              </View>
              <View style={modalStyles.optionTextContainer}>
                <Text style={modalStyles.optionTitle}>30-Minute Reminder</Text>
                <Text style={modalStyles.optionDescription}>Get reminded 30 minutes before the next prayer time</Text>
              </View>
            </Pressable>

            {/* Mute */}
            <Pressable 
              style={modalStyles.optionRow}
              onPress={() => handleOptionSelect('mute')}
            >
              <View style={[
                modalStyles.checkboxOuter,
                prayerSettings[selectedPrayer || '']?.options?.includes('mute') && modalStyles.checkboxSelected
              ]}>
                {prayerSettings[selectedPrayer || '']?.options?.includes('mute') && (
                  <Check color="#1a3a5c" size={14} strokeWidth={3} />
                )}
              </View>
              <View style={modalStyles.optionTextContainer}>
                <Text style={modalStyles.optionTitle}>Mute</Text>
                <Text style={modalStyles.optionDescription}>Disable all notifications for this prayer</Text>
              </View>
            </Pressable>
          </View>

          {/* Apply to All Prayers Button */}
          <Pressable style={modalStyles.applyAllButton} onPress={handleApplyToAll}>
            <Text style={modalStyles.applyAllButtonText}>Apply to All Prayers</Text>
          </Pressable>

          {/* Save Button */}
          <Pressable style={modalStyles.saveButton} onPress={handleSave}>
            <Check color="#FFFFFF" size={20} strokeWidth={2.5} style={{ marginRight: 8 }} />
            <Text style={modalStyles.saveButtonText}>Save</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
    </>
  )
}

export default Table



{
  /*
  <View style={{borderBottomWidth: 0, backgroundColor : currentPrayer == 'Fajr' && index == 0 ? 'rgba(147, 250, 165, 0.5)' : 'white', paddingHorizontal : currentPrayer == 'Fajr' && index == 0 ? 8 : 0 , borderRadius : currentPrayer == 'Fajr' && index == 0 ? 20 : 0,}} className=' items-center w-[100%] flex-row h-[35]'>
              <View className='w-[34%]  h-[100%] items-start justify-center'>
                { index == 0 ? <AlertBell salah={"Fajr"} athan={prayerData.athan_fajr} iqamah={prayerData.iqa_fajr} nextPrayerAthan={prayerData.athan_zuhr} />
                : < Text className='font-bold text-[#0D509D] text-lg pl-2'>Fajr</Text>
                }
              </View>
              <View className=' w-[33%] h-[100%] justify-center'><Text style={{  color:"#0D509D" , fontWeight: 700 }} className=' text-center' adjustsFontSizeToFit numberOfLines={1}>{prayerData.athan_fajr}</Text></View>
              <View className=' w-[33%] h-[100%] justify-center'><Text style={{  fontWeight: 700, color: 'black' }} className=' text-right' adjustsFontSizeToFit numberOfLines={1}>{prayerData.iqa_fajr}</Text></View>
            </View>

            <View style={{borderBottomWidth: 0, backgroundColor : currentPrayer == 'Dhuhr' && index == 0 ? 'rgba(147, 250, 165, 0.5)' : 'white', paddingHorizontal : currentPrayer == 'Dhuhr' && index == 0 ? 8 : 0 , borderRadius : currentPrayer == 'Dhuhr' && index == 0 ? 20 : 0,}} className=' items-center w-[100%] flex-row h-[35]'>
              <View className='w-[34%]  h-[100%] items-start justify-center'>
               { index == 0 ?  <AlertBell salah={"Dhuhr"}  athan={prayerData.athan_zuhr} iqamah={prayerData.iqa_zuhr} nextPrayerAthan={prayerData.athan_asr}/> 
               : <Text className='font-bold text-[#0D509D] text-lg pl-2'>Dhuhr</Text> }
              </View>
              <View className=' w-[33%] h-[100%] justify-center'><Text style={{  color:"#0D509D" , fontWeight: 700 }} className=' text-center' adjustsFontSizeToFit numberOfLines={1}>{prayerData.athan_zuhr}</Text></View>
              <View className=' w-[33%] h-[100%] justify-center'><Text style={{  fontWeight: 700, color: 'black' }} className=' text-right' adjustsFontSizeToFit numberOfLines={1}>{prayerData.iqa_zuhr}</Text></View>
            </View>

            <View style={{borderBottomWidth: 0, backgroundColor : currentPrayer == 'Asr' && index == 0 ? 'rgba(147, 250, 165, 0.5)' : 'white', paddingHorizontal : currentPrayer == 'Asr'  && index == 0 ? 8 : 0 , borderRadius : currentPrayer == 'Asr' && index == 0? 20 : 0, }} className=' items-center w-[100%] flex-row h-[35]'>
              <View className='w-[34%]  h-[100%] items-start justify-center'>
                { index == 0 ? <AlertBell salah={"Asr"}  athan={prayerData.athan_asr} iqamah={prayerData.iqa_asr} nextPrayerAthan={prayerData.athan_maghrib}/> 
                : <Text className='font-bold text-[#0D509D] text-lg pl-2'>Asr</Text>}
              </View>
              <View className=' w-[33%] h-[100%] items-center justify-center'><Text style={{  color:"#0D509D" , fontWeight: 700 }} className=' text-center' adjustsFontSizeToFit numberOfLines={1}>{prayerData.athan_asr}</Text></View>
              <View className=' w-[33%] h-[100%] justify-center'><Text style={{  fontWeight: 700, color: 'black' }} className=' text-right' adjustsFontSizeToFit numberOfLines={1}>{prayerData.iqa_asr}</Text></View>
            </View>

            <View style={{borderBottomWidth: 0, backgroundColor : currentPrayer == 'Maghrib' && index == 0 ? 'rgba(147, 250, 165, 0.5)' : 'white', paddingHorizontal : currentPrayer == 'Maghrib' && index == 0 ? 8 : 0 , borderRadius : currentPrayer == 'Maghrib' && index == 0  ? 20 : 0,}} className=' items-center w-[100%] flex-row h-[35] justify-center'>
              <View className='w-[34%]  h-[100%] items-start justify-center'>
                { index == 0 ? <AlertBell salah={"Maghrib"}  athan={prayerData.athan_maghrib} iqamah={prayerData.iqa_maghrib} nextPrayerAthan={prayerData.athan_isha}/> 
                : <Text className='font-bold text-[#0D509D] text-lg pl-2'>Maghrib</Text>}
              </View>
              <View className=' w-[33%] h-[100%] justify-center'><Text style={{  color:"#0D509D" , fontWeight: 700 }} className=' text-center' adjustsFontSizeToFit numberOfLines={1}>{prayerData.athan_maghrib}</Text></View>
              <View className=' w-[33%] h-[100%] justify-center'><Text style={{  fontWeight: 700, color: 'black' }} className=' text-right' adjustsFontSizeToFit numberOfLines={1}>{prayerData.iqa_maghrib}</Text></View>
            </View>

            <View style={{borderBottomWidth: 0, backgroundColor : currentPrayer == 'Isha' && index == 0 ? 'rgba(147, 250, 165, 0.5)' : 'white', paddingHorizontal : currentPrayer == 'Isha' && index == 0 ? 8 : 0 , borderRadius : currentPrayer == 'Isha' && index == 0 ? 20 : 0,}} className=' items-center w-[100%] flex-row h-[35]'>
              <View className='w-[34%]  h-[100%] items-start justify-center'>
                {index == 0 ? <AlertBell salah={"Isha"}  athan={prayerData.athan_isha} iqamah={prayerData.iqa_isha} nextPrayerAthan={prayerData.athan_fajr}/> 
                : <Text className='font-bold text-[#0D509D] text-lg pl-2'>Isha</Text>  
              }
              </View>
              <View className=' w-[33%] h-[100%] justify-center'><Text style={{  color:"#0D509D" , fontWeight: 700 }} className=' text-center' adjustsFontSizeToFit numberOfLines={1}>{prayerData.athan_isha}</Text></View>
              <View className=' w-[33%] h-[100%] justify-center'><Text style={{  fontWeight: 700, color: 'black' }} className=' text-right' adjustsFontSizeToFit numberOfLines={1}>{prayerData.iqa_isha}</Text></View>
            </View>
  */
}

{/* <AlertBell salah={salah} 
athan={prayerData[`athan_${salah == 'Dhuhr' ? 'zuhr' : salah.toLowerCase()}` as keyof gettingPrayerData]} 
iqamah={prayerData[`iqa_${salah == 'Dhuhr' ? 'zuhr' : salah.toLowerCase()}` as keyof gettingPrayerData]} 
nextPrayerAthan={ salah == 'Fajr' ? prayerData.athan_zuhr : salah == 'Dhuhr' ? prayerData.athan_asr : salah == 'Asr' ? prayerData.athan_maghrib : salah == 'Maghrib' ? prayerData.athan_isha  : prayerData.athan_fajr }
salahSettings={prayerSetting ? prayerSetting[0] : undefined}
/> */}
const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: '#1a3a5c',
    borderRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  modalIndicator: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    gap: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  checkboxOuter: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6EE7B7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxSelected: {
    backgroundColor: '#6EE7B7',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 0,
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  applyAllButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(110, 231, 183, 0.6)',
  },
  applyAllButtonText: {
    color: '#6EE7B7',
    fontSize: 15,
    fontWeight: '600',
  },
});
