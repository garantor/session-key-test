import { Buffer } from "buffer";

import { Image, StyleSheet, Platform } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import {  Text, View, SafeAreaView, Button } from 'react-native';
// import { createSmartAccountWithSessionKey } from '@/createSmartAcctount';
import {getPassKeyValidator} from '@/passKeyValidator'
import { createSmartAccountWithSessionKey } from "../../createSmartAcctount";
import { loginUserWithPassKey } from "../../passKeyValidator";
import React from "react";




// console.warn(KernelImplToVersionMap)


export default function HomeScreen() {
  const [loading, setLoading] = React.useState<boolean>(false)

window.Buffer = window.Buffer || Buffer;  // used for handling buffer not define error





  async function handleBTN() {
    setLoading(true)
    console.log('wporking ')
    let passVal = await getPassKeyValidator()
    
    console.log('pass key validatoe ', passVal)
    console.log('pass key validatoe ', passVal.passkeyValidator, 'address')
    let session = await createSmartAccountWithSessionKey(passVal.passkeyValidator)
    console.warn('this is seeion ', session)
    setLoading(false)

    
  }


  async function handleLogin() {
    setLoading(true)

    console.log('wporking login')
    let passVal = await loginUserWithPassKey()
    
    console.log('pass key validatoe ', passVal)
    console.log('pass key validatoe ', passVal.passkeyValidator, 'address')
    // let session = await createSmartAccountWithSessionKey(passVal.passkeyValidator)
    // console.warn('this is seeion ', session)
    setLoading(false)

    
  }


  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      {/* <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
        </ThemedView> */}
   
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Pass key start Here</ThemedText>
        <ThemedText>
        <Button disabled={loading} onPress={handleBTN} title="Register new pass Key" color="#841584" />
        </ThemedText>
        <ThemedText>
        <Button disabled={loading} onPress={handleLogin} title="Login With Pass Key" color="#841584" />

        </ThemedText>
      
      </ThemedView>


      
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
    alignItems:"center",
    
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
