import { Buffer } from "buffer";

import { Image, StyleSheet, Platform } from "react-native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "react-native";
// import { createSmartAccountWithSessionKey } from '@/createSmartAcctount';
import {
  createRequestClient,
  createSessionKeyAccount,
  createValidator,
  registerNewPassKey,
  sendUserOperationPayment,
} from "../../passkey/passKeyValidator";
import {
  createAccountClientWithPassKey,
  createSmartAccountWithSessionKey,
} from "../../passkey/createSmartAcctount";
import {
  createKernelSmartAccount,
  loginUserWithPassKey,
} from "../../passkey/passKeyValidator";
import React, { useContext, useEffect } from "react";

import {
  paymentWithSession,
  paymentWithPassKey,
} from "../../passkey/blockPayments";
import {
  Chain,
  PublicClient,
  createPublicClient,
  http,
  zeroAddress,
} from "viem";
import { arbitrumSepolia, sepolia } from "viem/chains";
import { AppContextCreator } from "../../appcontext";
import {
  KernelSmartAccount,
  KernelValidator,
  ZeroDevPaymasterClient,
  createKernelAccount,
  createZeroDevPaymasterClient,
} from "@zerodev/sdk";
import { EntryPoint, UserOperation } from "permissionless/types";
import {
  createMultiChainKernelAccountTWO,
  createMultichainValidatorTwoChain,
  prepareTransactionTWO,
  signUsers,
} from "../../multichain";
import { bundlerActions, ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import {
  KernelMultiChainClient,
  MultiChainUserOperation,
  ValidatorType,
  WebAuthnMode,
  createKernelMultiChainClient,
  toMultiChainWebAuthnValidator,
  toWebAuthnKey,
  webauthnSignUserOps,
} from "@zerodev/multi-chain-validator";
import { KERNEL_V3_1 } from "@zerodev/sdk/constants";
import { WebAuthnKey } from "@zerodev/passkey-validator/_types/toWebAuthnKey";

const getEntryPoint = (): EntryPoint => {
  return ENTRYPOINT_ADDRESS_V07;
};

let PASSKEY_SERVER_URL =
  "https://passkeys.zerodev.app/api/v3/fecf8828-834c-48e2-8582-aa03c6a91ffd";
let BUNDLER_URL =
  "https://rpc.zerodev.app/api/v2/bundler/fecf8828-834c-48e2-8582-aa03c6a91ffd";
let PAYMASTER_URL =
  "https://rpc.zerodev.app/api/v2/paymaster/fecf8828-834c-48e2-8582-aa03c6a91ffd";
let defaultChain = sepolia;

let clientInstance = createPublicClient({
  transport: http(
    "https://eth-sepolia.g.alchemy.com/v2/jogIMyqoY-cGnrTllPVfyIekWM2A3Z98"
  ),
});

const ZERODEVPAYMASTERCLIENT = createZeroDevPaymasterClient({
  chain: sepolia,
  transport: http(PAYMASTER_URL),
  entryPoint: getEntryPoint(),
});

let PASSKEY_SERVER_ARB =
  "https://passkeys.zerodev.app/api/v3/80cd78f4-bc97-438e-8af5-319ad779c9f9";
let BUNDLER_URL_ARB =
  "https://rpc.zerodev.app/api/v2/bundler/80cd78f4-bc97-438e-8af5-319ad779c9f9";
let PAYMASTER_URL_ARB =
  "https://rpc.zerodev.app/api/v2/paymaster/80cd78f4-bc97-438e-8af5-319ad779c9f9";
let defaultChainARB = arbitrumSepolia;

let clientInstanceARB = createPublicClient({
  transport: http(
    "https://rpc.ankr.com/arbitrum_sepolia/88d8da7367895a23352a6910b06ef6f526b8b82b22f2dc62acd2c0266946510a"
  ),
});

const ZERODEVPAYMASTERCLIENT_ARB = createZeroDevPaymasterClient({
  chain: arbitrumSepolia,
  transport: http(PAYMASTER_URL_ARB),
  entryPoint: getEntryPoint(),
});

let sepoliaKernelClient;
let ARBSepoliaKernelClient: KernelMultiChainClient<any>;
let sepoliaKernelAccount;
let ARBSepoliaKernelAccount;

export default function HomeScreen() {
  let context = React.useContext(AppContextCreator);

  const [loading, setLoading] = React.useState<boolean>();
  const [disableTransaction, setDisableTransaction] =
    React.useState<boolean>(true);
  const [passKeyValidator, setPassKeyValidator] = React.useState<
    any | undefined
  >(undefined);
  const [passKeyInstance, setPassKeyInstance] = React.useState<any | undefined>(
    undefined
  );
  const [smartAccountInstance, setSmartAccountInstance] = React.useState<
    any | undefined
  >(undefined);
  const [requestClient, setRequestClient] = React.useState<any | undefined>(
    undefined
  );
  const [publicClient, setPublicClient] = React.useState<any>(clientInstance);
  const [sessionAccount, setSessionAccount] = React.useState<any | undefined>(
    undefined
  );
  const [sessionClient, setSessionClient] = React.useState<any | undefined>(
    undefined
  );
  const [arbBundler, setArbBundler] = React.useState<any | undefined>(
    undefined
  );
  const [arbUserOps, setArbUserOps] = React.useState<UserOperation<any>>();

  const [sepoliaBundler, setSepoliaBundler] = React.useState<any | undefined>(
    undefined
  );
  const [sepoliaUserOps, setSepoliaUserOps] =
    React.useState<UserOperation<any>>();


    const [signedUserOperations, setSignedUserOperations] =
    React.useState<UserOperation<any>>();
    const [transactionSigned, setTransactionSigned] = React.useState<boolean>(false)

  window.Buffer = window.Buffer || Buffer; // used for handling buffer not define error

  async function handleBTN() {
    setLoading(true);
    console.log("wporking ");
    let passVal = await registerNewPassKey();

    // console.log('pass key validatoe ', passVal)
    // console.log('pass key validatoe ', passVal.passkeyValidator, 'address')
    // let session = await createSmartAccountWithSessionKey(passVal.passkeyValidator)
    // console.warn('this is seeion ', session)
    setLoading(false);
  }

  async function handleLogin() {
    setLoading(true);
    // let det = await createAccountClientWithPassKey()
    // console.warn('det ', det)

    console.log("wporking login");
    let passVal = await loginUserWithPassKey(PASSKEY_SERVER_URL);
    context?.setValidatorInstance(passVal.webAuthnKey);
    setPassKeyInstance(passVal.webAuthnKey);

    let pValidator = await createValidator(
      passVal.webAuthnKey,
      publicClient,
      PASSKEY_SERVER_URL
    );
    setPassKeyValidator(pValidator);

    let kernelAccount = await createKernelSmartAccount(
      pValidator,
      publicClient
    );

    console.log("kernalAccount ", kernelAccount);
    setSmartAccountInstance(kernelAccount);

    let requestClient = await createRequestClient(
      kernelAccount,
      BUNDLER_URL,
      PAYMASTER_URL,
      defaultChain
    );
    setRequestClient(requestClient);

    console.log("pass key validatoe ", passVal);
    // console.log('pass key validatoe ', passVal.passkeyValidator, 'address')
    // let session = await createSmartAccountWithSessionKey(passVal.passkeyValidator)
    // console.warn('this is seeion ', session)
    setLoading(false);
  }

  async function handleSendPaymentPass() {
    console.log("handleSendPaymentPass");
    console.log("this is validator ", passKeyValidator);
    let paymentRequest = await sendUserOperationPayment(
      requestClient,
      smartAccountInstance
    );
    console.log("this pass account ", paymentRequest);
  }

  async function handleCreateSession() {
    console.log("createSession");
    let sessionCreated = await createSessionKeyAccount(
      passKeyValidator,
      publicClient
    );
    setSessionAccount(sessionCreated);
    console.log("this is the seesion ", sessionCreated);

    let requestClient2 = await createRequestClient(
      sessionCreated,
      BUNDLER_URL,
      PAYMASTER_URL,
      defaultChain
    );
    setSessionClient(requestClient2);

    console.log("session created ", requestClient2);
  }

  async function sendArbTransaction() {
    console.log("sendArbTransaction");

    let requestClient = await createRequestClient(
      smartAccountInstance,
      BUNDLER_URL_ARB,
      PAYMASTER_URL_ARB,
      defaultChainARB
    );

    console.warn("created client ...");

    let paymentRequest = await sendUserOperationPayment(
      requestClient,
      smartAccountInstance
    );
    console.log("this pass account ", paymentRequest);
  }

  async function handleSendPaymentSession() {
    console.log("handleSendPaymentSession");
    let paymentRequest = await sendUserOperationPayment(
      sessionClient,
      sessionAccount
    );
    console.log("this pass account ", paymentRequest);
  }

  async function createMultiChainValidator(
    lPublicClient: PublicClient,
    passkeyUrl: string,
    webauthInstance: WebAuthnKey
  ) {
    let validator = await toMultiChainWebAuthnValidator(lPublicClient, {
      passkeyServerUrl: passkeyUrl,
      webAuthnKey: webauthInstance,
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      kernelVersion: KERNEL_V3_1,
    });

    return validator;
  }

  async function createKernelMultiChainAccount(
    lPublicClient: PublicClient,
    chainValidator: KernelValidator<any>
  ) {
    let lKernelAccount = await createKernelAccount(lPublicClient, {
      entryPoint: getEntryPoint(),
      plugins: {
        sudo: chainValidator,
      },
      kernelVersion: KERNEL_V3_1,
    });

    return lKernelAccount;
  }

  async function createMultiChainClient(
    lKernelAccount: KernelSmartAccount<any>,
    chain: Chain,
    bundlerUrl: string,
    zerodevPaymasterInstane: ZeroDevPaymasterClient<any>
  ) {
    let lChainClient = await createKernelMultiChainClient({
      account: lKernelAccount,
      chain: chain,
      bundlerTransport: http(bundlerUrl),
      entryPoint: getEntryPoint(),
      middleware: {
        sponsorUserOperation: async ({ userOperation }) => {
          return zerodevPaymasterInstane.sponsorUserOperation({
            userOperation,
            entryPoint: getEntryPoint(),
          });
        },
      },
    });

    return lChainClient;
  }

  async function encodeMultiChainTransaction(
    lKernelClient: KernelMultiChainClient<any>,
    lKernelAccount: KernelSmartAccount<any>,
    numberOfUserOps: number
  ) {
    let lTransaction = await lKernelClient.prepareMultiUserOpRequest(
      {
        userOperation: {
          callData: await lKernelAccount.encodeCallData({
            to: zeroAddress,
            value: BigInt(0),
            data: "0x",
          }),
        },
      },
      ValidatorType.WEBAUTHN,
      numberOfUserOps
    );

    return lTransaction;
  }

  async function signTransactions(
    sourceAccount: KernelSmartAccount<any>,
    lTransaction1: UserOperation<any>,
    lTransaction1ChainId: number,
    lTransaction2: UserOperation<any>,
    lTransaction2ChainId: number
  ) {
    const signedUserOps = await webauthnSignUserOps({
      account: sourceAccount,
      multiUserOps: [
        { userOperation: lTransaction1, chainId: lTransaction1ChainId },
        {
          userOperation: lTransaction2,
          chainId: lTransaction2ChainId,
        },
      ],
      entryPoint: getEntryPoint(),
    });

    return signedUserOps;
  }

  async function submitAbteriumTransaction() {
    console.log("the  signedUserOperations[1]  tex ",  signedUserOperations![1]);
    let tx1 = await arbBundler.sendUserOperation({
      userOperation: signedUserOperations![1],
    });

    console.log(tx1)

    
  }


  async function submitSepoliaTransaction() {
    console.log("the  signedUserOperations[1]  tex ",  signedUserOperations![0]);
    let tx1 = await sepoliaBundler.sendUserOperation({
      userOperation: signedUserOperations![0],
    });

    console.log(tx1)

    
  }

  async function multiChainSignTx() {
    console.log("creating ....");
    // let validators = await createMultichainValidatorTwoChain()
    const webAuthnKey: any = await toWebAuthnKey({
      passkeyName: "ITL-passKey-Demo",
      passkeyServerUrl: PASSKEY_SERVER_URL,
      mode: WebAuthnMode.Login,
    });

    console.log("WebAuthnKey: ", webAuthnKey);

    const sepoliaMultiChainWebAuthnValidator = await createMultiChainValidator(
      clientInstance,
      PASSKEY_SERVER_URL,
      webAuthnKey
    );

    const ARBtirumSepoliaMultiChainWebAuthnValidator =
      await createMultiChainValidator(
        clientInstanceARB,
        PASSKEY_SERVER_ARB,
        webAuthnKey
      );

    console.log("sepolia ", sepoliaMultiChainWebAuthnValidator);
    console.log("arbSepolia ", ARBtirumSepoliaMultiChainWebAuthnValidator);

    console.log("createing Accounts .....");

    sepoliaKernelAccount = await createKernelMultiChainAccount(
      clientInstance,
      sepoliaMultiChainWebAuthnValidator
    );
    ARBSepoliaKernelAccount = await createKernelMultiChainAccount(
      clientInstanceARB,
      ARBtirumSepoliaMultiChainWebAuthnValidator
    );

    if (sepoliaKernelAccount.address !== ARBSepoliaKernelAccount.address) {
      throw new Error("Addresses do not match");
    }

    sepoliaKernelClient = await createMultiChainClient(
      sepoliaKernelAccount,
      sepolia,
      BUNDLER_URL,
      ZERODEVPAYMASTERCLIENT
    );

    ARBSepoliaKernelClient = await createMultiChainClient(
      ARBSepoliaKernelAccount,
      arbitrumSepolia,
      BUNDLER_URL_ARB,
      ZERODEVPAYMASTERCLIENT_ARB
    );

    console.log("createing multichainAccounts .....");
    console.log("preparing transaction ......");

    const sepoliaUserOp = await encodeMultiChainTransaction(
      sepoliaKernelClient,
      sepoliaKernelAccount,
      2
    );

    const arbSepoliaUserops = await encodeMultiChainTransaction(
      ARBSepoliaKernelClient,
      ARBSepoliaKernelAccount,
      2
    );

    console.log("this is my user ops sepolia ", sepoliaUserOp);
    console.log("this is my user ops sepolia ", arbSepoliaUserops);
    setSepoliaUserOps(sepoliaUserOp);
    setArbUserOps(arbSepoliaUserops);

    // let transactionA = await prepareTransactionTWO(multichainAccounts.ARBSepoliaKernelClient, multichainAccounts.ARBSepoliaKernelAccount)
    // console.log('transactionA signed ....', transactionA)
    // let transactionB = await prepareTransactionTWO(multichainAccounts.sepoliaKernelClient, multichainAccounts.sepoliaKernelAccount)
    // console.log('transaction B signed .....', transactionB)

    console.log("signature not requested for ");
    //   const signedUserOps = await webauthnSignUserOps({
    //     account: sepoliaKernelAccount,
    //     multiUserOps: [
    //         { userOperation: sepoliaUserOp, chainId: sepolia.id },
    //         {
    //             userOperation:arbSepoliaUserops,
    //             chainId: arbitrumSepolia.id
    //         }
    //     ],
    //     entryPoint: getEntryPoint()
    // })
    // let signingTx = await signUsers(multichainAccounts.sepoliaKernelAccount, transactionB.transactionOps, transactionA.transactionOps )
    // console.log('thsi is the signed jointed TX ', signedUserOps)
    // let transactionb = await prepareTransactionTWO(multichainAccounts. )
    // multichainAccounts.ARBSepoliaKernelAccount

    const ARB_new_sepoliaBundlerClient = ARBSepoliaKernelClient.extend(
      bundlerActions(ENTRYPOINT_ADDRESS_V07)
    );

    setArbBundler(ARB_new_sepoliaBundlerClient);

    const new_sepoliaBundlerClient = sepoliaKernelClient.extend(
      bundlerActions(ENTRYPOINT_ADDRESS_V07)
    );

    setSepoliaBundler(new_sepoliaBundlerClient);
    // console.warn('we should not get a prompt for signning ???????', signedUserOps[0])
    //   let submitTransactonsA = await new_sepoliaBundlerClient.sendUserOperation({
    //     userOperation: signedUserOps[0]
    // })

    // setSepoliaUserOps(signedUserOps[0])
    // console.log('this is the submitted Tx ', submitTransactonsA)

    // console.warn('we should not get a prompt for signning ???????', signedUserOps[1])
    // let submitTransactonsB = await ARB_new_sepoliaBundlerClient.sendUserOperation({
    //   userOperation: signedUserOps[1]

    // })
    // setArbUserOps(signedUserOps[1])

    // console.log('this is the submitted Tx ', submitTransactonsB)
    console.warn("end of tx ........");
  }

  // async function handleMultiChainCreateAcct() {
  //   let validator = await registerNewPassKey(PASSKEY_SERVER_URL);

  //   console.log("newly created passkey ", validator);
  // }

  // async function submitArbTransac() {
  //   console.warn("submitting -----", arbUserOps);
  //   console.log("no sig, just submit ");
  //   let submitTransactonsB = await arbBundler.sendUserOperation({
  //     userOperation: arbUserOps,
  //   });

  //   console.log("args ", submitTransactonsB);
  // }

  async function signAndSubmitTx() {
    console.log('got inside ')
    let signedUserOps = await signTransactions(
      sepoliaKernelAccount,
      sepoliaUserOps as UserOperation<any>,
      sepolia.id,
      arbUserOps as UserOperation<any>,
      arbitrumSepolia.id
    );

    setSignedUserOperations(signedUserOps)
    setTransactionSigned(true)

    // console.log("the sigjed  tex ", signedUserOps);
    // let tx1 = await arbBundler.sendUserOperation({
    //   userOperation: signedUserOps[1],
    // });

    // console.log("user ops 1 ", tx1);

    // let tx2 = await sepoliaBundler.sendUserOperation({
    //   userOperation: signedUserOps[0],
    // });

    // console.log("tx2 ..", tx2);
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Pass key start Here</ThemedText>
        {/* <ThemedText> */}
          {/* <Button
            disabled={loading}
            onPress={handleBTN}
            title="Register new pass Key"
            color="#841584"
          />
        </ThemedText>
        <ThemedText>
          <Button
            disabled={loading}
            onPress={handleLogin}
            title="Login With Pass Key"
            color="#841584"
          />
        </ThemedText>

        <ThemedText>
          <Button
            onPress={handleSendPaymentPass}
            title="Send Payment with PassKey"
            color="#841584"
          />
        </ThemedText>

        <ThemedText>
          <Button
            onPress={handleSendPaymentSession}
            title="Send Payment With Session Key"
            color="#841584"
          />
        </ThemedText>

        <ThemedText>
          <Button
            onPress={handleCreateSession}
            title="Create Session"
            color="#841584"
          />
        </ThemedText>

        <ThemedText>
          <Button
            onPress={sendArbTransaction}
            title="Send ARB Transaction"
            color="red"
          />
        </ThemedText> */}

        <ThemedText>
          <Button
            onPress={multiChainSignTx}
            title="Login "
            color="red"
          />
        </ThemedText>

        {/* <ThemedText>
          <Button
            onPress={handleMultiChainCreateAcct}
            title="create Multis-chain new Account"
            color="red"
          />
        </ThemedText>

        <ThemedText>
          <Button
            onPress={submitArbTransac}
            title="Submited Arb transaction "
            color="green"
          />
        </ThemedText> */}

        {/* <ThemedText>
          <Button
            onPress={signAndSubmitTx}
            title="signAndSubmitTransaction "
            color="grey"
          />
        </ThemedText> */}




        
        <ThemedText>
          <Button
            onPress={signAndSubmitTx}
            title="sign Transaction "
            color="#841584"

          />
        </ThemedText>

        {/* <ThemedText>
          <Button
            onPress={signAndSubmitTx}
            title="submit signed Transaction "
            color="#841584"

          />
        </ThemedText> */}


        
        <ThemedText>
          <Button
          disabled={!transactionSigned}
            onPress={submitAbteriumTransaction}
            title="submit signed arbitrum transaction "
            color="#841584"

          />
        </ThemedText>

        
        <ThemedText>
          <Button
           disabled={!transactionSigned}
            onPress={submitSepoliaTransaction}
            title="submit signed Sepolia Transaction "
            color="#841584"

          />
        </ThemedText>
      </ThemedView>


      
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    // flexDirection: 'row',
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
