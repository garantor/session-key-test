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
  http,
  encodeFunctionData,
  PublicClient,
  parseUnits,
  Chain,
  zeroAddress,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";



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

export async function registerNewPassKey(passKeyUrl:string) {
  const webAuthnKey = await toWebAuthnKey({
    passkeyName: "ITL-passKey-Demo",
    passkeyServerUrl: passKeyUrl,
    mode: WebAuthnMode.Register,
  });

  return webAuthnKey;
}

// "0x90973004ceeb4cdcdd8182c765118009c07051c2bee8fc45bfb026a3af543ab3"
export async function loginUserWithPassKey(passKeyURL:string) {
  // just create a simple user login with their passkey
  const webAuthnKey = await toWebAuthnKey({
    passkeyName: "ITL-passKey-Demo",
    passkeyServerUrl: passKeyURL,
    mode: WebAuthnMode.Login,
  });

  return {
    webAuthnKey,
  };
}




export async function createValidator(
  webAuthInstance: WebAuthnKey,
  pubClientInstance: PublicClient,
  passKeyURL:string
) {
  // this create a passkey validator
  const passkeyValidator = await toPasskeyValidator(pubClientInstance, {
    webAuthnKey: webAuthInstance,
    passkeyServerUrl: passKeyURL,
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

export async function createRequestClient(accountAndSigner: any, bundlerRPC:string,paymasterRPC:string, chain:Chain) {
  // ------------------------------------------------------------------------------
  // this handle blockchain request, sending request to the blockchain
  const kernelClient = createKernelAccountClient({
    account: accountAndSigner,
    entryPoint: ENTRYPOINT_ADDRESS_V07,

    // Replace with your chain
    chain: chain,

    // Replace with your bundler RPC.
    // For ZeroDev, you can find the RPC on your dashboard.
    bundlerTransport: http(bundlerRPC),

    middleware: {
      sponsorUserOperation: async ({ userOperation }) => {
        const zeroDevPaymaster = await createZeroDevPaymasterClient({
          chain: chain,
          transport: http(paymasterRPC),
          entryPoint: ENTRYPOINT_ADDRESS_V07,
        });
        return zeroDevPaymaster.sponsorUserOperation({
          userOperation,
          entryPoint: ENTRYPOINT_ADDRESS_V07,
        });
      },
    },
  })

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
        to: zeroAddress,
        value: BigInt(0),
        data: '0x',
      }),
    },
  });

  console.log("userOpHash ", userOpHash);

  return userOpHash;
}

async function encodeTransaction() {
  let amt = parseUnits("1.521", 6);

  let encoded = encodeFunctionData({
    abi: transferAbi,
    functionName: "transfer",
    args: ["0x796a710a806388d5287729d7a88f31971dea9C0b", amt],
  });

  return encoded;
}

const sessionPrivateKey =
  "0x347b9a6820e9b7bbcec2b2b69ca3ab84d8bcccb990c79c10d8436f219333c53d";
let sessionKeypair = privateKeyToAccount(generatePrivateKey());

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
