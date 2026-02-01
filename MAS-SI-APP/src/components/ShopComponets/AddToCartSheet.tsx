import { View, Text, Pressable, Image, Platform } from 'react-native'
import React, {forwardRef, useCallback, useEffect, useMemo, useRef, useState, } from 'react'
import BottomSheet, { BottomSheetModal, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { Icon, Button } from 'react-native-paper';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
type AddtoCartProgramProp = {
    program_id : string
    program_img : string
    program_price : number
    program_name : string
    program_speaker : string
}
type Ref = BottomSheetModal

const AddToCartProgramSheet = forwardRef<Ref, AddtoCartProgramProp>(({program_id, program_img, program_price, program_name, program_speaker }, ref) => {
    const snapPoints = useMemo(() => ["35%", "50%"], []);
    const { session } = useAuth()
    const [ quantity, setQuantity ] = useState(1)
    const [ visible, setVisible ] = useState(false);
    const showModal = () => setVisible(true);
    const hideModal = () => setVisible(false);
    const renderBackDrop = useCallback( (props : any ) => <BottomSheetBackdrop appearsOnIndex={0} disappearsOnIndex={-1} {...props}/> , [])
    
    const addToCart = async () => {
        const { data : checkIfExists, error : c } = await supabase.from('user_cart').select('*').eq('user_id', session?.user.id).eq('program_id', program_id)
        console.log(checkIfExists)
        if( checkIfExists && checkIfExists.length > 0 ){
            const { data : currQurantity, error } = await supabase.from('user_cart').select('product_quantity').eq('user_id', session?.user.id).eq('program_id', program_id).single()
            if( currQurantity ){
            const newQurantity = currQurantity.product_quantity + quantity
            const cartSum = program_price * newQurantity
            console.log(cartSum)
            const { data, error } = await supabase.from('user_cart').update({product_quantity : newQurantity, product_price : cartSum }).eq("user_id", session?.user.id).eq("program_id", program_id)
            }
        }
        else{
            const cartSum = program_price * quantity
            const { error } = await supabase.from('user_cart').insert({ user_id : session?.user.id, program_id: program_id, product_quantity : quantity, product_price : cartSum })
        }
            if (ref && 'current' in ref && ref.current) {
                setQuantity(1)
                ref.current.dismiss();
            }
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
        onDismiss={() => setQuantity(1)}
        >
            <View className='flex-col w-[100%] px-1'>
                <View className='flex-row'>
                    <View className='w-[40%] h-[140]'>
                        <Image source={{ uri : program_img }} style={{ width : '100%', height : '100%', borderRadius : 10, objectFit : 'fill' }} />
                    </View>
                    <View className='flex-col items-center flex-1'>
                        <Text className='font-bold text-2xl text-center'>{program_name}</Text>
                        <Text className='font-bold text-gray-400 text-xl text-center' numberOfLines={1}>{program_speaker}</Text>
                    </View>
                </View>
                <View className='flex-row mt-4'>
                    <View className='items-center flex-row flex-1 justify-center'>
                        <Pressable className='bg-gray-400' style={{ borderTopLeftRadius : 10, borderBottomLeftRadius : 10}} onPress={() => setQuantity(quantity => Math.max(1, quantity - 1))}><Icon source={'minus'} size={50} color='white'/></Pressable>
                        <View className='w-[60] justify-center items-center bg-gray-400 h-[50]'><View className='p-3 bg-white rounded-lg'><Text className='font-bold'>{quantity}</Text></View></View>
                        <Pressable  className='bg-gray-400' style={{ borderTopRightRadius : 10, borderBottomRightRadius : 10 }} onPress={() => setQuantity(quantity + 1)}><Icon source={'plus'} size={50} color='#57BA47'/></Pressable>
                    </View>
                </View>
                <View className='mt-1 w-[100%]'>
                        <Button mode='contained' style={{ backgroundColor : "gray" }} icon={ () => <Icon source={"cart-outline"} size={20}/>} onPress={addToCart}>Add to Cart</Button>
                </View>
            </View>
        </BottomSheetModal>
    )
})

export default AddToCartProgramSheet