import { View, Text, Pressable, Image, Dimensions } from 'react-native'
import React, { useState } from 'react'
import { Modal, Portal, Button, PaperProvider, Divider, TextInput, Icon } from 'react-native-paper';
import { Link } from 'expo-router';
import { supabase } from '../lib/supabase';
import { BlurView } from 'expo-blur';

type SignInAnonModalProps = {
    visible : boolean
    setVisible : ( visible : boolean ) => void 
}
const SignInAnonModal = ( { visible, setVisible } : SignInAnonModalProps) => {
  const { height } = Dimensions.get('window')
  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  const containerStyle = {padding: 20};  
  const [ email, setEmail ] = useState('')
  const [ password, setPassword] = useState("")
  const [ loading, setLoading ] = useState(false)
  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
  
    if (error) alert(error.message);
    setVisible(false)
    setLoading(false);
  }  

  return (
    <Portal>
        <Modal visible={visible} onDismiss={hideModal} >
        <BlurView className='' style={{ height : height }}>
            <Pressable className='items-end pr-7 mb-5 flex-2 mt-10' onPress={hideModal} style={{shadowColor: "black", shadowOffset: {width: 0, height: 0}, shadowOpacity: 3, shadowRadius: 3 }}>
                <Icon source={'alpha-x'} size={40} color='rgba(0,0,0,0.2)'/>
            </Pressable>
            <View className=' justify-center items-center flex-2 mt-5'>
                <View className='w-[85%]  items-center h-[550]  bg-white p-2' style={{shadowColor: "black", shadowOffset: {width: 0, height: 0}, shadowOpacity: 3, shadowRadius: 3, borderRadius: 8}}>
                <Text className='font-bold text-[#0D509D] text-3xl mt-[10%]'>LOGIN</Text>

                <View className='mt-2 items-center w-[100%]'>
                <TextInput
                    mode='outlined'
                    theme={{ roundness : 50 }}
                    style={{ width: 250, backgroundColor: "#e8e8e8", height: 45 }}
                    activeOutlineColor='#0D509D'
                    value={email}
                    onChangeText={setEmail}
                    left={<TextInput.Icon icon="email-outline" color="#b7b7b7"/>}
                    placeholder="Email"
                    textColor='black'
                />

                <View className='h-[20]'/>
            
                <TextInput
                    mode='outlined'
                    theme={{ roundness : 50 }}
                    style={{ width: 250, backgroundColor: "#e8e8e8", height: 45}}
                    activeOutlineColor='#0D509D'
                    value={password}
                    onChangeText={setPassword}
                    left={<TextInput.Icon icon="key-outline" color="#b7b7b7"/>}
                    placeholder="Password"
                    secureTextEntry
                    textColor='black'
                />
            
                <View className=' flex-row mt-2 items-center'>
                        <Divider className=' w-[100]' bold/>
                        <Text className='font-semi text-black text-lg' > OR </Text>
                        <Divider className=' w-[100]' bold/>

                </View>

                    </View>
                    <View className='mt-5'/>
                    <Button  mode='contained' onPress={signInWithEmail} disabled={loading} buttonColor='#57BA47' textColor='white' className='w-[150]'>LOGIN</Button>

                    <Link href="/SignUp" asChild>
                        <Pressable className='flex-row justify-center mt-[8%]'>
                        <Text>Don't have an account?  </Text>
                        
                        <Text className='text-[#0D509D]'>Sign Up</Text>
                        </Pressable>
                    </Link>
                </View>
                </View>
            </BlurView>
        </Modal>
    </Portal>
  )
}

export default SignInAnonModal