import { View, Text, Pressable, Image, TextInput, Platform } from 'react-native'
import React, {forwardRef, useCallback, useEffect, useMemo, useRef, useState, } from 'react'
import BottomSheet, { BottomSheetModal, BottomSheetBackdrop, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { Icon, Button, Divider } from 'react-native-paper';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { initializePaymentSheet, openPaymentSheet } from '@/src/lib/stripe';
type Ref = BottomSheetModal
const OtherAmountDonationSheet = forwardRef<Ref, {}>(({}, ref) => {
    const snapPoints = useMemo(() => ["40%"], []);
    const { session } = useAuth()
    const [ amount, setAmount ] = useState('')
    const renderBackDrop = useCallback( (props : any ) => <BottomSheetBackdrop appearsOnIndex={0} disappearsOnIndex={-1} {...props}/> , [])
    const handleAmountChange = (text : string) =>{
        const cleanedValue = text.replace(/[^0-9]/g, '')
        const parsedValue = parseFloat(cleanedValue)

        if(!isNaN(parsedValue)){
            setAmount(parsedValue.toLocaleString('en-usd'))
        }else{
            setAmount('')
        }
    }
    const callForDonationAmount = async (amount : number) => {
        await initializePaymentSheet(Math.floor(amount * 100))
        await openPaymentSheet()
      }
    return(
        <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        detached={true}
        bottomInset={Platform.OS === 'ios' ? 12 : 10}
        style={{ marginHorizontal: 10 }}
        backgroundStyle={{ backgroundColor: "white", borderRadius: 40 }}
        handleIndicatorStyle={{ backgroundColor: "gray" }}
        backdropComponent={renderBackDrop}
        >
            <View className='h-[100%] w-[90%] bg-white flex-col self-center'>
                <View className='w-[100%]'>
                    <Text className='text-left font-bold text-3xl'>Input Amount</Text>
                </View>
                <Pressable className='flex-row w-[100%] mt-3' style={{padding: 12,borderRadius: 12, backgroundColor: "grey", }}>
                    <Text className='font-bold text-white'>$</Text>
                    <BottomSheetTextInput 
                        className='border w-[100%]'
                        keyboardType='numeric'
                        value={amount}
                        onChangeText={handleAmountChange}
                        style={{ textAlign: "center", color : 'white', paddingLeft : 5 }}
                        placeholder='Amount'
                        selectionColor={'white'}
                    />
                    <Divider className=' mt-3 '/>
                </Pressable>
                <View>
                     <Button icon={"account-heart"} mode='contained' style={{width: 150, alignItems: "center", backgroundColor: "#57BA47", marginTop: 30}} onPress={() => callForDonationAmount(Number(amount.replaceAll(',', '')))}>Donate Now</Button>
                </View>
            </View>
        </BottomSheetModal>
    )
})

export default OtherAmountDonationSheet