import { View, Text, Pressable, Image, Dimensions, Platform } from 'react-native'
import React, { useState } from 'react'
import { Modal, Portal, Button, PaperProvider, Divider, TextInput, Icon } from 'react-native-paper';
import { Link } from 'expo-router';
import { supabase } from '../lib/supabase';
import { BlurView } from 'expo-blur';
import * as AppleAuthentication from 'expo-apple-authentication'
import { useAuth } from '../providers/AuthProvider';

type SignInAnonModalProps = {
    visible : boolean
    setVisible : () => void 
}
const SignInAnonModal = ( { visible, setVisible } : SignInAnonModalProps) => {
  const { height } = Dimensions.get('window')
  const [ signIn, setSignIn ] = useState(true)
  const { session } = useAuth()
  const hideModal = () => setVisible();
  const containerStyle = {padding: 20};  
  const [ email, setEmail ] = useState('')
  const [ password, setPassword] = useState("")
  const [ loading, setLoading ] = useState(false)
  const [ name, setName ] = useState('')
  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
  
    if (error) {alert(error.message);setLoading(false);return};
    setVisible()
    setLoading(false);
  }  
  async function signUpWithEmail() {
    setLoading(true)
    if( email && password && name ){
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          first_name: name,
          profile_email: email,
        },
      },
    })

    if (error) { alert(error.message); setLoading(false); return }
    setLoading(false)
    setVisible()
    }
    else {
      alert("Enter Name")
    }
  }
  return (
    <Portal>
        <Modal visible={visible} onDismiss={hideModal} >
        { signIn ? 
        <BlurView className='' style={{ height : height }}>
            
            <View className=' justify-center items-center flex-2 mt-5'>
                <View className='w-[85%]  items-center h-[550]  bg-white p-2 mt-[25%]' style={{shadowColor: "black", shadowOffset: {width: 0, height: 0}, shadowOpacity: 3, shadowRadius: 3, borderRadius: 8}}>
                <Pressable className='items-end pr-7  flex-2 w-[100%] ml-12 ' onPress={hideModal} style={{shadowColor: "black", shadowOffset: {width: 0, height: 0}, shadowOpacity: 3, shadowRadius: 3 }}>
                    <Icon source={'alpha-x'} size={40} color='black'/>
                </Pressable>
                <Text className='font-bold text-[#0D509D] text-3xl mt-[2%] mb-[4%]'>Login</Text>
  
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
                <Button  mode='contained' onPress={signInWithEmail} disabled={loading} buttonColor='#57BA47' textColor='white' className='w-[150] mt-5'>LOGIN</Button>
                <View className=' flex-row mt-2 items-center'>
                        <Divider className=' w-[100]' bold/>
                        <Text className='font-semi text-black text-lg' > OR </Text>
                        <Divider className=' w-[100]' bold/>

                </View>
                <View className='items-center mt-[5%] w-[100%]'>
        { Platform.OS == 'ios' ? (
          <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={5}
          style={{ width: '70%', height: 64 }}
          onPress={async () => {
            try {
              const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                  AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                  AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
              })
              // Sign in via Supabase Auth.
              if (credential.identityToken) {
                const {
                  error,
                  data: { user },
                } = await supabase.auth.signInWithIdToken({
                  provider: 'apple',
                  token: credential.identityToken,
                })
                console.log(JSON.stringify({ error, user }, null, 2))
                if (!error) {
                  // User is signed in.
                  const{
                    error,
                    data
                  } = await supabase.from('profiles').update({ profile_email : credential.email, first_name : credential.fullName }).eq('id', session?.user.id)
                  setLoading(false)
                  setVisible()
                }
              } else {
                throw new Error('No identityToken.')
              }
            } catch (e) {
              if (e.code === 'ERR_REQUEST_CANCELED') {
                // handle that the user canceled the sign-in flow
              } else {
                // handle other errors
              }
            }
          }}
  
        />
        ) : <></>}
      </View>
            </View>
            <View className='mt-5'/>

                <Pressable className='flex-row justify-center mt-[8%]' onPress={() => setSignIn(false)}>
                <Text>Don't have an account?  </Text>
                
                <Text className='text-[#0D509D]'>Sign Up</Text>
                </Pressable>
        </View>
        </View>
            </BlurView> :         
            <BlurView className='' style={{ height : height }}>
               
                    
                      <View className=' justify-start items-center bg-white pt-[4%] flex-col flex-2 h-[550] w-[85%] self-center rounded-xl mt-[25%]'>
                      <Pressable className='items-end pr-7  flex-2 w-[100%] ml-12 ' onPress={hideModal} style={{shadowColor: "black", shadowOffset: {width: 0, height: 0}, shadowOpacity: 3, shadowRadius: 3 }}>
                        <Icon source={'alpha-x'} size={40} color='black'/>
                     </Pressable>
                      <Text className='font-bold text-[#0D509D] text-3xl mt-[2%] mb-[4%]'>Sign Up</Text>

                    <View className='w-[95%] items-center' style={{ shadowColor : 'black', shadowOffset : { width : 0, height : 2 }, shadowOpacity : 0.5, shadowRadius : 1 }}>
                        <TextInput
                          mode='outlined'
                          theme={{ roundness : 50 }}
                          style={{ width: 250, backgroundColor: "#e8e8e8", height: 45 }}
                          activeOutlineColor='#0D509D'
                          value={name}
                          onChangeText={setName}
                          left={<TextInput.Icon icon="account" color="#b7b7b7"/>}
                          placeholder="Name"
                          textColor='black'
                        />
                        
                        <View className='h-[20]'/>

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
                    </View>
                    <View className='w-[40%] flex-2 mt-10' style={{ shadowColor : 'black', shadowOffset : { width : 0, height : 2 }, shadowOpacity : 0.5, shadowRadius : 1 }}>
                    <Button onPress={signUpWithEmail} mode='contained' buttonColor='#57BA47' textColor='white'>Sign Up</Button>
                    </View>
                    <View className=' flex-row mt-2 items-center self-center'>
                    <Divider className=' w-[100]' bold/>
                    <Text className='font-semi text-black text-lg' > OR </Text>
                    <Divider className=' w-[100]' bold/>
                </View>
                <View className='items-center mt-[5%] w-[100%]'>
                    { Platform.OS == 'ios' ? (
                    <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    cornerRadius={5}
                    style={{ width: '70%', height: 64 }}
                    onPress={async () => {
                        try {
                        const credential = await AppleAuthentication.signInAsync({
                            requestedScopes: [
                            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                            AppleAuthentication.AppleAuthenticationScope.EMAIL,
                            ],
                        })
                        // Sign in via Supabase Auth.
                        console.log(credential)
                        if (credential.identityToken) {
                            const {
                            error,
                            data: { user },
                            } = await supabase.auth.signInWithIdToken({
                            provider: 'apple',
                            token: credential.identityToken,
                            })
                            console.log(JSON.stringify({ error, user }, null, 2))
                            if (!error) {
                            // User is signed in.
                            const{
                                error,
                                data
                            } = await supabase.from('profiles').update({ profile_email : credential.email, first_name : credential.fullName }).eq('id', session?.user.id)
                            setLoading(false)
                            setVisible()
                            }
                        } else {
                            throw new Error('No identityToken.')
                        }
                        } catch (e) {
                        if (e.code === 'ERR_REQUEST_CANCELED') {
                            // handle that the user canceled the sign-in flow
                        } else {
                            // handle other errors
                        }
                        }
                    }}
            
                    />
                    ) : <></>}
                    <Pressable className='flex-row justify-center mt-[8%]' onPress={() => setSignIn(true)}>
                        <Text>Have an Account?  </Text>
                        
                        <Text className='text-[#0D509D]'>Sign In</Text>
                    </Pressable>
                </View>
                </View>
                    

            </BlurView>
        }
        </Modal>
    </Portal>
  )
}

export default SignInAnonModal