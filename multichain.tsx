import { KernelValidator, WebAuthnMode, toWebAuthnKey } from "@zerodev/passkey-validator";
import { createKernelAccount, createZeroDevPaymasterClient } from "@zerodev/sdk";
import { ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import { EntryPoint } from "permissionless/types";
import { createPublicClient, http, zeroAddress } from "viem";
import { arbitrumSepolia, sepolia } from "viem/chains";

import {ValidatorType, createKernelMultiChainClient, toMultiChainWebAuthnValidator, webauthnSignUserOps} from "@zerodev/multi-chain-validator"
import { KERNEL_V3_1 } from "@zerodev/sdk/constants";

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
      transport: http(PAYMASTER_URL_ARB),
      entryPoint: getEntryPoint()
  })
  



// export async function createMultiChainClientTwoChain() {
//     let sepoliaKernelClient = createKernelMultiChainClient({
//         account: sepoliaKernelAccount,
//         chain: SEPOLIA,
//         bundlerTransport: http(SEPOLIA_BUNDLER_URL),
//         entryPoint: getEntryPoint(),
//         middleware: {
//             sponsorUserOperation: async ({ userOperation }) => {
//                 return sepoliaZeroDevPaymasterClient.sponsorUserOperation({
//                     userOperation,
//                     entryPoint: getEntryPoint()
//                 })
//             }
//         }
//     })

//     let opSepoliaKernelClient = createKernelMultiChainClient({
//         account: opSepoliaKernelAccount,
//         chain: OPTIMISM_SEPOLIA,
//         bundlerTransport: http(OPTIMISM_SEPOLIA_BUNDLER_URL),
//         entryPoint: getEntryPoint(),
//         middleware: {
//             sponsorUserOperation: async ({ userOperation }) => {
//                 return optimismSepoliaZeroDevPaymasterClient.sponsorUserOperation(
//                     {
//                         userOperation,
//                         entryPoint: getEntryPoint()
//                     }
//                 )
//             }
//         }
//     })

    
// }




export async function createMultichainValidatorTwoChain(){
    // this will prompt users for their webauth authenitication and also create validator for numbers of chain we want
    const webAuthnKey = await toWebAuthnKey({
        passkeyName: "ITL-passKey-Demo",
        passkeyServerUrl: PASSKEY_SERVER_URL,
        mode: WebAuthnMode.Login
    })

    console.log("WebAuthnKey: ", webAuthnKey)

    const sepoliaMultiChainWebAuthnValidator =
        await toMultiChainWebAuthnValidator(clientInstance, {
            passkeyServerUrl: PASSKEY_SERVER_URL,
            webAuthnKey,
            entryPoint: ENTRYPOINT_ADDRESS_V07,
            kernelVersion:KERNEL_V3_1
        })

    const ARBtirumSepoliaMultiChainWebAuthnValidator =
        await toMultiChainWebAuthnValidator(clientInstanceARB, {
            passkeyServerUrl: PASSKEY_SERVER_ARB,
            webAuthnKey,
            entryPoint: ENTRYPOINT_ADDRESS_V07,
            kernelVersion:KERNEL_V3_1
        })

        return [sepoliaMultiChainWebAuthnValidator, ARBtirumSepoliaMultiChainWebAuthnValidator]
}




export async function createMultiChainKernelAccountTWO(multiChainWebAuthnValidators: any[]) {

    const sepoliaKernelAccount = await createKernelAccount(clientInstance, {
        entryPoint: getEntryPoint(),
        plugins: {
            sudo: multiChainWebAuthnValidators[0]
        },
        kernelVersion:KERNEL_V3_1
    })

    const ARBSepoliaKernelAccount = await createKernelAccount(
        clientInstanceARB,
        {
            entryPoint: getEntryPoint(),
            plugins: {
                sudo: multiChainWebAuthnValidators[1]
            },
        kernelVersion:KERNEL_V3_1

        }
    )

    if (sepoliaKernelAccount.address !== ARBSepoliaKernelAccount.address) {
        throw new Error("Addresses do not match")
    }

    const sepoliaKernelClient = createKernelMultiChainClient({
        account: sepoliaKernelAccount,
        chain: sepolia,
        bundlerTransport: http(BUNDLER_URL),
        entryPoint: getEntryPoint(),
        middleware: {
            sponsorUserOperation: async ({ userOperation }) => {
                return ZERODEVPAYMASTERCLIENT.sponsorUserOperation({
                    userOperation,
                    entryPoint: getEntryPoint()
                })
            }
        }
    })

    const ARBSepoliaKernelClient = createKernelMultiChainClient({
        account: ARBSepoliaKernelAccount,
        chain: arbitrumSepolia,
        bundlerTransport: http(BUNDLER_URL_ARB),
        entryPoint: getEntryPoint(),
        middleware: {
            sponsorUserOperation: async ({ userOperation }) => {
                return ZERODEVPAYMASTERCLIENT_ARB.sponsorUserOperation(
                    {
                        userOperation,
                        entryPoint: getEntryPoint()
                    }
                )
            }
        }
    })


    return {
        sepoliaKernelClient,
        sepoliaKernelAccount,
        ARBSepoliaKernelClient,
        ARBSepoliaKernelAccount
    }

    
}


export async function prepareTransactionTWO(kernelClient:any, kernelAccount:any){
    // this takes in the numbers of validator as args
    const transactionOps =
            await kernelClient.prepareMultiUserOpRequest(
                {
                    userOperation: {
                        callData: await kernelAccount.encodeCallData({
                            to: zeroAddress,
                            value: BigInt(0),
                            data: "0x"
                        })
                    }
                },
                ValidatorType.WEBAUTHN,
                2
            )


            return {
                transactionOps
            }
        

}

export async function signUsers(sepoliaKernelAccount:any, firstTx:any, secondTx:any) {
    console.log('this is the account ', sepoliaKernelAccount)

    console.log('this is first tx ', firstTx)
    console.log('this is first tx ', secondTx)
  try {
    const signedUserOps = await webauthnSignUserOps({
        account: sepoliaKernelAccount,
        multiUserOps: [
            { userOperation: firstTx, chainId: sepolia.id },
            {
                userOperation: secondTx,
                chainId: arbitrumSepolia.id
            }
        ],
        entryPoint: getEntryPoint()
    })

    return {
        signedUserOps
    }
    
  } catch (error) {
    console.warn('this is the error ', error)
    
  }
    

  
}






// The first time prompt can be handle when the user is sending the first transaction
// ALl chain related stuff is batch all together