import { KernelMultiChainClient, KernelValidator, ValidatorType, WebAuthnKey, createKernelMultiChainClient, toMultiChainWebAuthnValidator } from "@zerodev/multi-chain-validator";
import { KernelSmartAccount, ZeroDevPaymasterClient, createKernelAccount } from "@zerodev/sdk";
import { KERNEL_V3_1 } from "@zerodev/sdk/constants";
import { ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import { EntryPoint } from "permissionless/types";
import { Chain, PublicClient, http, zeroAddress } from "viem";



const getEntryPoint = (): EntryPoint => {
    return ENTRYPOINT_ADDRESS_V07;
  };


  
export async function createMultiChainValidator(
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

export async function createKernelMultiChainAccount(
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

export async function createMultiChainClient(
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

export async function encodeMultiChainTransaction(
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



  export async function encodeMultiChainTransactionTransfer(
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