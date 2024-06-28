import { Buffer } from "buffer";
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Image, Platform, Button } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React, { useContext } from 'react';
import { createPublicClient, http } from 'viem';
import { avalancheFuji, arbitrumSepolia} from 'viem/chains';
import { createKernelSmartAccount, createRequestClient, createSessionKeyAccount, createValidator, loginUserWithPassKey, sendUserOperationPayment } from '../../passkey/passKeyValidator';
import { AppContextCreator } from '../../appcontext';
import { useFocusEffect } from 'expo-router';


let PASSKEY_SERVER_URL =
  "https://passkeys.zerodev.app/api/v3/b1264e2d-1009-4cf3-8efd-9a677ba6470b";
let BUNDLER_URL =
  "https://rpc.zerodev.app/api/v2/bundler/80cd78f4-bc97-438e-8af5-319ad779c9f9";
let PAYMASTER_URL =
  "https://rpc.zerodev.app/api/v2/paymaster/80cd78f4-bc97-438e-8af5-319ad779c9f9";
let defaultChain = arbitrumSepolia;

let clientInstance = createPublicClient({
  transport: http('https://rpc.ankr.com/arbitrum_sepolia/88d8da7367895a23352a6910b06ef6f526b8b82b22f2dc62acd2c0266946510a')
})

export default function TabTwoScreen() {
  let contextAPI = React.useContext(AppContextCreator)
  const [loading, setLoading] = React.useState<boolean>(  contextAPI?.validatorInstance ? false : false  )
  const [disableTransaction, setDisableTransaction] = React.useState<boolean>(true)
  const [passKeyValidator, setPassKeyValidator] = React.useState<any | undefined>(undefined)
  const [passKeyInstance, setPassKeyInstance] = React.useState<any | undefined>(undefined)
  const [smartAccountInstance, setSmartAccountInstance] = React.useState<any | undefined>(undefined)
  const [requestClient, setRequestClient] = React.useState<any | undefined>(undefined)
  const [publicClient, setPublicClient] = React.useState<any>(clientInstance)
  const [sessionAccount, setSessionAccount] = React.useState<any | undefined>(undefined)
  const [sessionClient, setSessionClient] = React.useState<any | undefined>(undefined)
  window.Buffer = window.Buffer || Buffer;  // used for handling buffer not define error


//   useFocusEffect(() => {
// console.log('inside o', contextAPI?.validatorInstance)
// setPassKeyInstance(contextAPI?.validatorInstance)
// console.log('is ready ... ')




//   })



  async function setValidatorAndAcct() {
    setPassKeyInstance(contextAPI?.validatorInstance)
    console.log('setValidatorAndAcct ', contextAPI?.validatorInstance )
    let pValidator = await createValidator(contextAPI?.validatorInstance!, publicClient, PASSKEY_SERVER_URL)
    setPassKeyValidator(pValidator)

    let kernelAccount = await createKernelSmartAccount(pValidator, publicClient)

    console.log('kernalAccount setValidatorAndAcct', kernelAccount)
    setSmartAccountInstance(kernelAccount)

    let requestClient = await createRequestClient(kernelAccount, BUNDLER_URL, PAYMASTER_URL, defaultChain)
    console.log('client request ', requestClient)
    setRequestClient(requestClient)
    
  }
  async function handleLogin() {
    setLoading(true)
    // let det = await createAccountClientWithPassKey()
    // console.warn('det ', det)

    console.log('wporking login')
    let passVal = await loginUserWithPassKey(PASSKEY_SERVER_URL)
    // context?.setValidatorInstance(passVal.webAuthnKey)
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
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={<Ionicons size={310} name="code-slash" style={styles.headerImage} />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Explore Session Key with Fuji Network</ThemedText>
      </ThemedView>
      {/* <ThemedText>This app includes example code to help you get started.</ThemedText> */}

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">{contextAPI?.validatorInstance ? `Pass key start Here` : `Signing with passkey on the sepolia tab`}</ThemedText>
        {/* <ThemedText>
        <Button  onPress={() => console.log('okayw')} title="Register new pass Key" color="yellowgreen" />
        </ThemedText> */}
        <ThemedText>
        <Button disabled={loading} onPress={handleLogin} title="Login With Pass Key" color="yellowgreen" />

        </ThemedText>

        <ThemedText>
        <Button disabled={loading}  onPress={handleSendPaymentPass} title="Send Payment with PassKey" color="yellowgreen" />

        </ThemedText>

        <ThemedText>
        <Button disabled={loading} onPress={handleSendPaymentSession} title="Send Payment With Session Key" color="yellowgreen" />

        </ThemedText>


        <ThemedText>
        <Button  disabled={loading} onPress={handleCreateSession} title="Create Session" color="yellowgreen" />

        </ThemedText>
      
      </ThemedView>

    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    // flexDirection: 'row',
    alignItems:'center',
    gap: 8,
  },
  stepContainer:{
    gap: 8,
    marginBottom: 8,
    alignItems:"center",
  }
});
