import { encodeFunctionData, parseUnits, zeroAddress } from "viem";
import { BigNumber } from "ethers";
import { KernelMultiChainClient, ValidatorType } from "@zerodev/multi-chain-validator";
import { KernelSmartAccount } from "@zerodev/sdk";


export const ERC20_APPROVAL = [
    {
      inputs: [
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "approve",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
  ] as const;


  export const DEPOSITV3_ABI = [
    {
      inputs: [
        { internalType: "address", name: "depositor", type: "address" },
        { internalType: "address", name: "recipient", type: "address" },
        { internalType: "address", name: "inputToken", type: "address" },
        { internalType: "address", name: "outputToken", type: "address" },
        { internalType: "uint256", name: "inputAmount", type: "uint256" },
        { internalType: "uint256", name: "outputAmount", type: "uint256" },
        { internalType: "uint256", name: "destinationChainId", type: "uint256" },
        { internalType: "address", name: "exclusiveRelayer", type: "address" },
        { internalType: "uint32", name: "quoteTimestamp", type: "uint32" },
        { internalType: "uint32", name: "fillDeadline", type: "uint32" },
        { internalType: "uint32", name: "exclusivityDeadline", type: "uint32" },
        { internalType: "bytes", name: "message", type: "bytes" },
      ],
      name: "depositV3",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
  ];



export async function getAcrossBridgeFees() {
    let url = `https://testnet.across.to/api/suggested-fees?token=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238&originChainId=11155111&destinationChainId=11155420&amount=2000000`;
    console.log("url ", url);
    // used to get accross bridge fees
    let quote = await fetch(url);
    if (quote.status === 200) {
      return await quote.json();
    }
    throw new Error("There is an error getting cross chain fees");
  }




  export async function encodeCrossChainTransaction(
    lKernelClient: KernelMultiChainClient<any>,
    lKernelAccount:KernelSmartAccount<any>,
    numberOfUserOps:number
) {

  
    //get bridging details
    let quoteResponse = await getAcrossBridgeFees()

    console.log('this is quote reply ', quoteResponse)
    console.log('this is quote reply ', quoteResponse.spokePoolAddress)
    console.log('this is quote reply ', quoteResponse.totalRelayFee.total)
    console.log('this is quote reply ', quoteResponse.timestamp)

    let lTransaction = await lKernelClient.prepareMultiUserOpRequest(
      {
        userOperation: {
          callData: await lKernelAccount.encodeCallData([ 
            {
            to: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
            value: BigInt(0),
            data: encodeFunctionData({
              abi: ERC20_APPROVAL,
              functionName: "approve",
              args: [
                quoteResponse.spokePoolAddress,
                2000000n,
              ],
            }),
          },
        {


        to: quoteResponse.spokePoolAddress,
        data: encodeFunctionData({
          abi: DEPOSITV3_ABI,
          functionName: "depositV3",
          args: [
            lKernelAccount.address,
            lKernelAccount.address,
            '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
            zeroAddress,
            2000000,
            BigNumber.from(2000000).sub(
              BigNumber.from(quoteResponse.totalRelayFee.total)
            ),
            11155420,
            zeroAddress,
            quoteResponse.timestamp,
            Math.round(Date.now() / 1000) + 21600,
            "0",
            "0x",
          ],
        }),
        value: BigInt(0),


        }
        
        ]   
        
        
        ),
        },
      },
      ValidatorType.WEBAUTHN,
      numberOfUserOps
    );

    return lTransaction

  }
