

import {
    createKernelAccount,
    createKernelAccountClient,
    createZeroDevPaymasterClient
} from "@zerodev/sdk"

import { toPermissionValidator } from "@zerodev/permissions"

import { ENTRYPOINT_ADDRESS_V07 } from "permissionless"
import {privateKeyToAccount, generatePrivateKey} from 'viem/accounts'
import { Chain, createPublicClient, http } from "viem"
import { KERNEL_V3_1 } from "@zerodev/sdk/constants"

import {sepolia} from 'viem/chains'

import {signerToEcdsaValidator} from '@zerodev/ecdsa-validator'


import { toECDSASigner } from "@zerodev/permissions/signers"
import { toSudoPolicy } from "@zerodev/permissions/policies"
import { serializePermissionAccount } from "@zerodev/permissions"

let BUNDLER_URL = 'https://rpc.zerodev.app/api/v2/bundler/fecf8828-834c-48e2-8582-aa03c6a91ffd'
let PAYMASTER_URL = 'https://rpc.zerodev.app/api/v2/paymaster/fecf8828-834c-48e2-8582-aa03c6a91ffd'
const publicClient = createPublicClient({
    transport: http('https://eth-sepolia.g.alchemy.com/v2/jogIMyqoY-cGnrTllPVfyIekWM2A3Z98')
})



export async function createSmartAccountWithSessionKey (passkeyValidator:any) {


    
    let sessionPrivateKey = generatePrivateKey()
    
   let sessionKeySigner= privateKeyToAccount(sessionPrivateKey)


    const ecdsaSigner = await toECDSASigner({
        signer: sessionKeySigner
    })

    const sudoPolicy = await toSudoPolicy({})

    const permissionValidator = await toPermissionValidator(publicClient, {
        signer: ecdsaSigner,
        policies: [sudoPolicy],
        entryPoint: ENTRYPOINT_ADDRESS_V07,
        kernelVersion: KERNEL_V3_1,

    })

    const sessionKeyAccount = await createKernelAccount(publicClient, {
        entryPoint: ENTRYPOINT_ADDRESS_V07,
        plugins: {
            sudo: passkeyValidator,
            regular: permissionValidator
        },
        kernelVersion: KERNEL_V3_1,

    })

    const kernelClient = createKernelAccountClient({
        account: sessionKeyAccount,
        chain: sepolia,
        bundlerTransport: http(BUNDLER_URL),
        entryPoint: ENTRYPOINT_ADDRESS_V07,
        middleware: {
            sponsorUserOperation: async ({ userOperation }) => {
                const zeroDevPaymaster = await createZeroDevPaymasterClient(
                    {
                        chain: sepolia,
                        transport: http(PAYMASTER_URL),
                        entryPoint: ENTRYPOINT_ADDRESS_V07
                    }
                )
                return zeroDevPaymaster.sponsorUserOperation({
                    userOperation,
                    entryPoint: ENTRYPOINT_ADDRESS_V07
                })
            }
        }
    })

     // Include the private key when you serialize the session key
  let seri =  await serializePermissionAccount(sessionKeyAccount, sessionPrivateKey)


    return {
        seri,
        kernelClient,
        sessionKeyAccount,
        sessionPrivateKey
    }

   
}


export async function createAccountClientWithPassKey(privateKey:any) {
    let sessionKeySigner= privateKeyToAccount(privateKey)


    const ecdsaSigner = await toECDSASigner({
        signer: sessionKeySigner
    })
    
    const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
        entryPoint:ENTRYPOINT_ADDRESS_V07,
        signer:privateKey,
      })
    

    const sessionKeyAccount = await createKernelAccount(publicClient, {
        entryPoint: ENTRYPOINT_ADDRESS_V07,
        plugins: {
            regular: ecdsaSigner
        },
        kernelVersion: KERNEL_V3_1,

    })

    const kernelClient = createKernelAccountClient({
        account: sessionKeyAccount,
        chain: sepolia,
        bundlerTransport: http(BUNDLER_URL),
        entryPoint: ENTRYPOINT_ADDRESS_V07,
        middleware: {
            sponsorUserOperation: async ({ userOperation }) => {
                const zeroDevPaymaster = await createZeroDevPaymasterClient(
                    {
                        chain: sepolia,
                        transport: http(PAYMASTER_URL),
                        entryPoint: ENTRYPOINT_ADDRESS_V07
                    }
                )
                return zeroDevPaymaster.sponsorUserOperation({
                    userOperation,
                    entryPoint: ENTRYPOINT_ADDRESS_V07
                })
            }
        }
    })
}