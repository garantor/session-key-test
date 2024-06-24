
import { toPasskeyValidator, toWebAuthnKey, WebAuthnMode } from "@zerodev/passkey-validator"
import { KERNEL_V3_1 } from "@zerodev/sdk/constants"
import { ENTRYPOINT_ADDRESS_V07 } from "permissionless"
import { createPublicClient, http, parseAbi, encodeFunctionData } from "viem"


let PASSKEY_SERVER_URL = "https://passkeys.zerodev.app/api/v3/fecf8828-834c-48e2-8582-aa03c6a91ffd"
    

const publicClient = createPublicClient({
  transport: http('https://eth-sepolia.g.alchemy.com/v2/jogIMyqoY-cGnrTllPVfyIekWM2A3Z98')
})



export async function getPassKeyValidator() {

const webAuthnKey = await toWebAuthnKey({
  passkeyName: "ITL-passKey-Demo",
  passkeyServerUrl: PASSKEY_SERVER_URL,
  mode: WebAuthnMode.Register
})


 
const passkeyValidator = await toPasskeyValidator(publicClient, {
  webAuthnKey,
  passkeyServerUrl: PASSKEY_SERVER_URL,
  entryPoint: ENTRYPOINT_ADDRESS_V07,
  kernelVersion: KERNEL_V3_1
})


console.warn('thsi new val ', passkeyValidator)
return {passkeyValidator}

}


// "0x90973004ceeb4cdcdd8182c765118009c07051c2bee8fc45bfb026a3af543ab3"
export async function loginUserWithPassKey() {
  const webAuthnKey = await toWebAuthnKey({
    passkeyName: "ITL-passKey-Demo",
    passkeyServerUrl: PASSKEY_SERVER_URL,
    mode: WebAuthnMode.Login
  })

  const passkeyValidator = await toPasskeyValidator(publicClient, {
    webAuthnKey,
    passkeyServerUrl: PASSKEY_SERVER_URL,
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    kernelVersion: KERNEL_V3_1
  })


  return {
    passkeyValidator
  }
  
}