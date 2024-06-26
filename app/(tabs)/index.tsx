import { Buffer } from "buffer";

import { Image, StyleSheet, Platform } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import {  Button } from 'react-native';
// import { createSmartAccountWithSessionKey } from '@/createSmartAcctount';
import {createRequestClient, createSessionKeyAccount, createValidator, registerNewPassKey, sendUserOperationPayment} from '../../passkey/passKeyValidator'
import { createAccountClientWithPassKey, createSmartAccountWithSessionKey } from "../../passkey/createSmartAcctount";
import { createKernelSmartAccount, loginUserWithPassKey } from "../../passkey/passKeyValidator";
import React, { useEffect } from "react";

import {paymentWithSession, paymentWithPassKey}  from '../../passkey/blockPayments'
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";



let PASSKEY_SERVER_URL =
  "https://passkeys.zerodev.app/api/v3/fecf8828-834c-48e2-8582-aa03c6a91ffd";
let BUNDLER_URL =
  "https://rpc.zerodev.app/api/v2/bundler/fecf8828-834c-48e2-8582-aa03c6a91ffd";
let PAYMASTER_URL =
  "https://rpc.zerodev.app/api/v2/paymaster/fecf8828-834c-48e2-8582-aa03c6a91ffd";
let defaultChain = sepolia;

let clientInstance = createPublicClient({
  transport: http('https://eth-sepolia.g.alchemy.com/v2/jogIMyqoY-cGnrTllPVfyIekWM2A3Z98')
})

export default function HomeScreen() {
  const [loading, setLoading] = React.useState<boolean>(false)
  const [disableTransaction, setDisableTransaction] = React.useState<boolean>(true)
  const [passKeyValidator, setPassKeyValidator] = React.useState<any | undefined>(undefined)
  const [passKeyInstance, setPassKeyInstance] = React.useState<any | undefined>(undefined)
  const [smartAccountInstance, setSmartAccountInstance] = React.useState<any | undefined>(undefined)
  const [requestClient, setRequestClient] = React.useState<any | undefined>(undefined)
  const [publicClient, setPublicClient] = React.useState<any>(clientInstance)
  const [sessionAccount, setSessionAccount] = React.useState<any | undefined>(undefined)
  const [sessionClient, setSessionClient] = React.useState<any | undefined>(undefined)

window.Buffer = window.Buffer || Buffer;  // used for handling buffer not define error



  async function handleBTN() {
    setLoading(true)
    console.log('wporking ')
    let passVal = await registerNewPassKey()
    
    // console.log('pass key validatoe ', passVal)
    // console.log('pass key validatoe ', passVal.passkeyValidator, 'address')
    // let session = await createSmartAccountWithSessionKey(passVal.passkeyValidator)
    // console.warn('this is seeion ', session)
    setLoading(false)

    
  }


  async function handleLogin() {
    setLoading(true)
    // let det = await createAccountClientWithPassKey()
    // console.warn('det ', det)

    console.log('wporking login')
    let passVal = await loginUserWithPassKey(PASSKEY_SERVER_URL)
    setPassKeyInstance(passVal.webAuthnKey)

    let pValidator = await createValidator(passVal.webAuthnKey, publicClient, PASSKEY_SERVER_URL)
    setPassKeyValidator(pValidator)

    let kernelAccount = await createKernelSmartAccount(pValidator, publicClient)

    console.log('kernalAccount ', kernelAccount)
    setSmartAccountInstance(kernelAccount)

    let requestClient = await createRequestClient(kernelAccount, BUNDLER_URL, PAYMASTER_URL, defaultChain)
    setRequestClient(requestClient)
    
    console.log('pass key validatoe ', passVal)
    // console.log('pass key validatoe ', passVal.passkeyValidator, 'address')
    // let session = await createSmartAccountWithSessionKey(passVal.passkeyValidator)
    // console.warn('this is seeion ', session)
    setLoading(false)

    
  }


  async function handleSendPaymentPass() {
    console.log('handleSendPaymentPass')
    console.log('this is validator ', passKeyValidator)
    let paymentRequest = await sendUserOperationPayment(requestClient, smartAccountInstance)
    console.log('this pass account ', paymentRequest)
    
  }



  async function handleCreateSession() {
    console.log('createSession')
    let sessionCreated = await createSessionKeyAccount(passKeyValidator, publicClient)
    setSessionAccount(sessionCreated)
    console.log('this is the seesion ', sessionCreated)


    let requestClient2 = await createRequestClient(sessionCreated, BUNDLER_URL, PAYMASTER_URL, defaultChain)
    setSessionClient(requestClient2)

    console.log('session created ', requestClient2)
    
  }


  async function handleSendPaymentSession() {
    console.log('handleSendPaymentSession')
    let paymentRequest = await sendUserOperationPayment(sessionClient, sessionAccount)
    console.log('this pass account ', paymentRequest)
    
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
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        </ThemedView>
   
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Pass key start Here</ThemedText>
        <ThemedText>
        <Button disabled={loading} onPress={handleBTN} title="Register new pass Key" color="#841584" />
        </ThemedText>
        <ThemedText>
        <Button disabled={loading} onPress={handleLogin} title="Login With Pass Key" color="#841584" />

        </ThemedText>

        <ThemedText>
        <Button  onPress={handleSendPaymentPass} title="Send Payment with PassKey" color="#841584" />

        </ThemedText>

        <ThemedText>
        <Button  onPress={handleSendPaymentSession} title="Send Payment With Session Key" color="#841584" />

        </ThemedText>


        <ThemedText>
        <Button  onPress={handleCreateSession} title="Create Session" color="#841584" />

        </ThemedText>
      
      </ThemedView>


      
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    // flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom:10
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
