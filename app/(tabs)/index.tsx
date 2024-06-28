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
import React, { useContext, useEffect } from "react";

import {paymentWithSession, paymentWithPassKey}  from '../../passkey/blockPayments'
import { createPublicClient, http } from "viem";
import { arbitrumSepolia, sepolia } from "viem/chains";
import { AppContextCreator } from "../../appcontext";
import { createZeroDevPaymasterClient } from "@zerodev/sdk";
import { EntryPoint } from "permissionless/types";
import { createMultiChainKernelAccountTWO, createMultichainValidatorTwoChain, prepareTransactionTWO, signUsers } from "../../multichain";
import { bundlerActions, ENTRYPOINT_ADDRESS_V07 } from "permissionless"


const getEntryPoint = (): EntryPoint => {
  return ENTRYPOINT_ADDRESS_V07
}


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

const ZERODEVPAYMASTERCLIENT = createZeroDevPaymasterClient({
  chain: sepolia,
  transport: http(PAYMASTER_URL),
  entryPoint: getEntryPoint()
})



let PASSKEY_SERVER_ARB =
  "https://passkeys.zerodev.app/api/v3/b1264e2d-1009-4cf3-8efd-9a677ba6470b";
let BUNDLER_URL_ARB =
  "https://rpc.zerodev.app/api/v2/bundler/80cd78f4-bc97-438e-8af5-319ad779c9f9";
let PAYMASTER_URL_ARB =
  "https://rpc.zerodev.app/api/v2/paymaster/80cd78f4-bc97-438e-8af5-319ad779c9f9";
let defaultChainARB = arbitrumSepolia;

let clientInstanceARB = createPublicClient({
  transport: http('https://rpc.ankr.com/arbitrum_sepolia/88d8da7367895a23352a6910b06ef6f526b8b82b22f2dc62acd2c0266946510a')
})

const ZERODEVPAYMASTERCLIENT_ARB =  createZeroDevPaymasterClient({
    chain: arbitrumSepolia,
    transport: http(BUNDLER_URL_ARB),
    entryPoint: getEntryPoint()
})




export default function HomeScreen() {
  let context = React.useContext(AppContextCreator)

  const [loading, setLoading] = React.useState<boolean>()
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
    context?.setValidatorInstance(passVal.webAuthnKey)
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


  async function sendArbTransaction() {

    console.log('sendArbTransaction')

    let requestClient = await createRequestClient(smartAccountInstance, BUNDLER_URL_ARB, PAYMASTER_URL_ARB, defaultChainARB)

    console.warn('created client ...')

    let paymentRequest = await sendUserOperationPayment(requestClient, smartAccountInstance)
    console.log('this pass account ', paymentRequest)
    
  }


  async function handleSendPaymentSession() {
    console.log('handleSendPaymentSession')
    let paymentRequest = await sendUserOperationPayment(sessionClient, sessionAccount)
    console.log('this pass account ', paymentRequest)
    
  }


  async function multiChainSignTx() {
    console.log('creating ....')
    let validators = await createMultichainValidatorTwoChain()
    console.log('this is multi chain ', validators)
    console.log('sepolia ', validators[0])
    console.log('arbSepolia ', validators[1])


    console.log('createing Accounts .....')

    let multichainAccounts = await createMultiChainKernelAccountTWO(validators)

    console.log('createing multichainAccounts .....', multichainAccounts)


    let transactionA = await prepareTransactionTWO(multichainAccounts.ARBSepoliaKernelClient, multichainAccounts.ARBSepoliaKernelAccount)
    console.log('transactionA signed ....', transactionA)
    let transactionB = await prepareTransactionTWO(multichainAccounts.sepoliaKernelClient, multichainAccounts.sepoliaKernelAccount)
    console.log('transaction B signed .....', transactionB)


    let signingTx = await signUsers(multichainAccounts.sepoliaKernelAccount, transactionB.transactionOps, transactionA.transactionOps )
    console.log('thsi is the signed jointed TX ', signingTx)
  // let transactionb = await prepareTransactionTWO(multichainAccounts. )
  // multichainAccounts.ARBSepoliaKernelAccount


//   const ARB_new_sepoliaBundlerClient =multichainAccounts.ARBSepoliaKernelClient.extend(
//     bundlerActions(ENTRYPOINT_ADDRESS_V07)
// )


// const new_sepoliaBundlerClient =multichainAccounts.sepoliaKernelClient.extend(
//   bundlerActions(ENTRYPOINT_ADDRESS_V07)
// )
//   console.warn('we should not get a prompt for signning ???????', signingTx.signedUserOps[0])
//   let submitTransactonsA = await new_sepoliaBundlerClient.sendUserOperation({
//     userOperation: signingTx.signedUserOps[0]
// })

// console.log('this is the submitted Tx ', submitTransactonsA)


// console.warn('we should not get a prompt for signning ???????', signingTx.signedUserOps[1])
// let submitTransactonsB = await ARB_new_sepoliaBundlerClient.sendUserOperation({
//   userOperation: signingTx.signedUserOps[1]
// })

// console.log('this is the submitted Tx ', submitTransactonsB)
    
  }

  async function handleMultiChainCreateAcct() {
    let validator = await registerNewPassKey(PASSKEY_SERVER_URL)

    console.log('newly created passkey ', validator)
    
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



        <ThemedText>
        <Button  onPress={sendArbTransaction} title="Send ARB Transaction" color="red" />

        </ThemedText>


        <ThemedText>
        <Button  onPress={multiChainSignTx} title="create Multis-chain signed transaction" color="red" />

        </ThemedText>

        <ThemedText>
        <Button  onPress={handleMultiChainCreateAcct} title="create Multis-chain new Account" color="red" />

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
