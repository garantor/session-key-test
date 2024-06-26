import {
  toPasskeyValidator,
  toWebAuthnKey,
  WebAuthnMode,
} from "@zerodev/passkey-validator";
import { WebAuthnKey } from "@zerodev/passkey-validator/_types/toWebAuthnKey";
import { toPermissionValidator } from "@zerodev/permissions";
import { toSudoPolicy } from "@zerodev/permissions/policies";
import { toECDSASigner } from "@zerodev/permissions/signers";
import {
  addressToEmptyAccount,
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
  KernelAccountClient,
} from "@zerodev/sdk";
import { KERNEL_V3_1 } from "@zerodev/sdk/constants";
import { ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import {
  createPublicClient,
  http,
  parseAbi,
  encodeFunctionData,
  zeroAddress,
  PublicClient,
  parseUnits,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

let PASSKEY_SERVER_URL =
  "https://passkeys.zerodev.app/api/v3/fecf8828-834c-48e2-8582-aa03c6a91ffd";
let BUNDLER_URL =
  "https://rpc.zerodev.app/api/v2/bundler/fecf8828-834c-48e2-8582-aa03c6a91ffd";
let PAYMASTER_URL =
  "https://rpc.zerodev.app/api/v2/paymaster/fecf8828-834c-48e2-8582-aa03c6a91ffd";
let defaultChain = sepolia;

export const transferAbi = [
  {
    inputs: [
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export async function registerNewPassKey() {
  const webAuthnKey = await toWebAuthnKey({
    passkeyName: "ITL-passKey-Demo",
    passkeyServerUrl: PASSKEY_SERVER_URL,
    mode: WebAuthnMode.Register,
  });

  return webAuthnKey;
}

// "0x90973004ceeb4cdcdd8182c765118009c07051c2bee8fc45bfb026a3af543ab3"
export async function loginUserWithPassKey() {
  // just create a simple user login with their passkey
  const webAuthnKey = await toWebAuthnKey({
    passkeyName: "ITL-passKey-Demo",
    passkeyServerUrl: PASSKEY_SERVER_URL,
    mode: WebAuthnMode.Login,
  });

  return {
    webAuthnKey,
  };
}

export async function createValidator(
  webAuthInstance: WebAuthnKey,
  pubClientInstance: PublicClient
) {
  // this create a passkey validator
  const passkeyValidator = await toPasskeyValidator(pubClientInstance, {
    webAuthnKey: webAuthInstance,
    passkeyServerUrl: PASSKEY_SERVER_URL,
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    kernelVersion: KERNEL_V3_1,
  });

  return passkeyValidator;
}

export async function createKernelSmartAccount(
  passKeyValidator: any,
  publicClient: PublicClient
) {
  // ------------------------------------------------------------------------------
  // smart account create here without serilizing it

  const account = await createKernelAccount(publicClient, {
    plugins: {
      sudo: passKeyValidator,
    },
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    kernelVersion: KERNEL_V3_1,
  });

  console.log("this is the main one ", account);
  // ------------------------------------------------------------------------------

  return account;
}

export async function createRequestClient(accountAndSigner: any) {
  // ------------------------------------------------------------------------------
  // this handle blockchain request, sending request to the blockchain
  const kernelClient = createKernelAccountClient({
    account: accountAndSigner,
    entryPoint: ENTRYPOINT_ADDRESS_V07,

    // Replace with your chain
    chain: defaultChain,

    // Replace with your bundler RPC.
    // For ZeroDev, you can find the RPC on your dashboard.
    bundlerTransport: http(BUNDLER_URL),

    middleware: {
      sponsorUserOperation: async ({ userOperation }) => {
        const zeroDevPaymaster = await createZeroDevPaymasterClient({
          chain: defaultChain,
          transport: http(PAYMASTER_URL),
          entryPoint: ENTRYPOINT_ADDRESS_V07,
        });
        return zeroDevPaymaster.sponsorUserOperation({
          userOperation,
          entryPoint: ENTRYPOINT_ADDRESS_V07,
        });
      },
    },
  });

  return kernelClient;
}

export async function sendUserOperationPayment(
  kernelClient: any,
  kernelAccount: any
) {
  // ------------------------------------------------------------------------------
  // sending an actual raw transaction on the blockchain

  let transactionAmt = await encodeTransaction();
  const userOpHash = await kernelClient.sendUserOperation({
    userOperation: {
      callData: await kernelAccount.encodeCallData({
        to: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
        value: BigInt(0),
        data: transactionAmt,
      }),
    },
  });

  console.log("userOpHash ", userOpHash);

  return userOpHash;
}

async function encodeTransaction() {
  let amt = parseUnits("1", 6);

  let encoded = encodeFunctionData({
    abi: transferAbi,
    functionName: "transfer",
    args: ["0x796a710a806388d5287729d7a88f31971dea9C0b", amt],
  });

  return encoded;
}

const sessionPrivateKey =
  "0x347b9a6820e9b7bbcec2b2b69ca3ab84d8bcccb990c79c10d8436f219333c53d";
let sessionKeypair = privateKeyToAccount(sessionPrivateKey);

export async function createSessionKeyAccount(passkeyValidator:any, publicClient:PublicClient) {
  // let sessionPubKey = sessionKeypair.address; // the public key

  // const emptyAccount = addressToEmptyAccount(sessionPubKey);
  const emptySessionKeySigner = await toECDSASigner({ signer: sessionKeypair });

  const permissionPlugin = await toPermissionValidator(publicClient, {
    entryPoint:ENTRYPOINT_ADDRESS_V07,
    kernelVersion:KERNEL_V3_1,
    signer: emptySessionKeySigner,
    policies: [
     toSudoPolicy({})
    ],
  })

  console.log('after sudo')


  const sessionKeyAccount = await createKernelAccount(publicClient, {
    entryPoint:ENTRYPOINT_ADDRESS_V07,
    kernelVersion:KERNEL_V3_1,
    plugins: {
      sudo: passkeyValidator,
      regular: permissionPlugin,
    },
  })

  return sessionKeyAccount
   
}

//FLOW

// - User login with their passKey
// - Passkey instance is user to create a passkey validator with zerodev server
// - Passkey validator is then used to create a smart Account. At this point you already have a smart account address
// - This requires a publicclient which needs an rpc for it configuration
// - The smart account instance can be used to create a client which can be used to send transaction
