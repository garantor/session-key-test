import { encodeFunctionData, Address, parseUnits, zeroAddress } from "viem";
import { BigNumber } from "ethers";


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


export const SUPPLY_TO_AAVE = [
    {
      inputs: [
        { internalType: "address", name: "asset", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
        { internalType: "address", name: "onBehalfOf", type: "address" },
        { internalType: "uint16", name: "referralCode", type: "uint16" },
      ],
      name: "supply",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ] as const;

type tAcrossDepositV3 = {
  spokeAddress: string;
  relayerTotalFee: BigNumber;
  timeStamp: number;
};


type tTransactionAmount ={
    amount:number,
    decimals:number

  }


  
export async function encodeApprovalTransaction(
  toAddress: Address,
  spenderAddress: Address,
  amount: tTransactionAmount
) {
  //this will return an encoded approval Transaction ready for signing
  let transaction = {
    to: toAddress,
    data: encodeFunctionData({
      abi: ERC20_APPROVAL,
      functionName: "approve",
      args: [
        spenderAddress,
        parseUnits(String(amount.amount), amount.decimals),
      ],
    }),
    value: BigInt(0),
  };

  return transaction;
}

export async function encodeAcrossDepositV3(
  acrossDetails: tAcrossDepositV3,
  sender: Address,
  recipient: Address,
  sendToken: Address,
  sendingAmount: tTransactionAmount,
  destinationChainId: number
) {
  // this is across function for bridging asset cross-chain

  let transactionAmount = parseUnits(
    String(sendingAmount.amount),
    sendingAmount.decimals
  );

  let transaction = {
    to: acrossDetails.spokeAddress,
    data: encodeFunctionData({
      abi: DEPOSITV3_ABI,
      functionName: "depositV3",
      args: [
        sender,
        recipient,
        sendToken,
        zeroAddress,
        transactionAmount,
        BigNumber.from(transactionAmount).sub(
          BigNumber.from(acrossDetails.relayerTotalFee)
        ),
        destinationChainId,
        zeroAddress,
        acrossDetails.timeStamp,
        Math.round(Date.now() / 1000) + 21600,
        "0",
        "0x",
      ],
    }),
    value: BigInt(0),
  };
  return transaction;
}



export async function encodeAaveV3SupplyTransaction(poolAddress:Address, selecetdAsset:Address, amount:tTransactionAmount, senderPub:Address) {
    let transaction = {
        to:poolAddress,
        data: encodeFunctionData({
          abi: SUPPLY_TO_AAVE,
          functionName: 'supply',
          args: [ 
            selecetdAsset,
            parseUnits(`${amount.amount}`, amount.decimals),
            senderPub,
            0,],
        }),

        }

        return transaction
}



// does the bundling work
// can we sign a transaction for use later



// export async function bundleEncodedTransaction() {
//     ;
// }