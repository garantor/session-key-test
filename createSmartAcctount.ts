
"use client"

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

import { toECDSASigner } from "@zerodev/permissions/signers"
import { toSudoPolicy } from "@zerodev/permissions/policies"






export async function createSmartAccountWithSessionKey (publicClientRPC:string, passkeyValidator:any, CHAIN:Chain, BUNDLER_URL:string, PAYMASTER_URL:string) {
    const publicClient = createPublicClient({
        transport: http(publicClientRPC)
    })

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
        chain: CHAIN,
        bundlerTransport: http(BUNDLER_URL),
        entryPoint: ENTRYPOINT_ADDRESS_V07,
        middleware: {
            sponsorUserOperation: async ({ userOperation }) => {
                const zeroDevPaymaster = await createZeroDevPaymasterClient(
                    {
                        chain: CHAIN,
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


    return {
        kernelClient,
        sessionKeyAccount
    }

   
}