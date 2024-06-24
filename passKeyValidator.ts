
import { toPasskeyValidator, toWebAuthnKey, WebAuthnMode } from "@zerodev/passkey-validator"
import { KERNEL_V3_1 } from "@zerodev/sdk/constants"
import { ENTRYPOINT_ADDRESS_V07 } from "permissionless"
import { createPublicClient, http, parseAbi, encodeFunctionData } from "viem"

export async function getPassKeyValidator() {
    let PASSKEY_SERVER_URL = "https://passkeys.zerodev.app/api/v3/fecf8828-834c-48e2-8582-aa03c6a91ffd"
    

const webAuthnKey = await toWebAuthnKey({
  passkeyName: "ITL-passKey-Demo",
  passkeyServerUrl: PASSKEY_SERVER_URL,
  mode: WebAuthnMode.Register
})

const publicClient = createPublicClient({
    transport: http('https://eth-sepolia.g.alchemy.com/v2/jogIMyqoY-cGnrTllPVfyIekWM2A3Z98')
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