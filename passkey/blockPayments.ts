import { toECDSASigner } from "@zerodev/permissions/signers";
import { privateKeyToAccount } from "viem/accounts";

import {
  toPasskeyValidator,
  toWebAuthnKey,
  WebAuthnMode,
} from "@zerodev/passkey-validator";
import { KERNEL_V3_1 } from "@zerodev/sdk/constants";
import { ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import { WebAuthnKey } from "@zerodev/passkey-validator/_types/toWebAuthnKey";
import { createPublicClient, http } from "viem";

const privateKey =
  "0x347b9a6820e9b7bbcec2b2b69ca3ab84d8bcccb990c79c10d8436f219333c53d";

  const passkeyServer = "https://passkeys.zerodev.app/api/v3/fecf8828-834c-48e2-8582-aa03c6a91ffd"
const publicClient = createPublicClient({
  transport: http("https://ethereum-sepolia.blockpi.network/v1/rpc/public"),
});

export async function paymentWithSession() {
  const sessionKeySigner = toECDSASigner({
    signer: privateKeyToAccount(privateKey),
  });

  return sessionKeySigner;
}

export async function paymentWithPassKey(passKeyValidatorKey: WebAuthnKey) {
  const passkeyValidator = await toPasskeyValidator(publicClient, {
    webAuthnKey: passKeyValidatorKey,
    passkeyServerUrl: passkeyServer,
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    kernelVersion: KERNEL_V3_1,
  });

  return passkeyValidator;
}
