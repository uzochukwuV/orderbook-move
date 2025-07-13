import {
  getAccount,
  getFunction,
  publicClient,
  walletClient,
  orderbookInterface,
  umixInterface,
  getFunctionERC20,
} from "../utils/config";
import { ethers, toBigInt } from "ethers";
import { CONTRACT_ADDRESS, MOCK_USDC, MOCK_USDT } from "../utils/constants";
import abi from "../assets/json/Orderbook.json";
export const  base_coin = MOCK_USDC;
export const quote_coin = MOCK_USDT

export const placeBuyOrder = async ({
  price,
  amount,
}: {
  price: number;
  amount: number;
}) => {
  const scaledPrice = BigInt(Math.trunc(price * 1e6));
  const scaledAmount = BigInt(Math.trunc(amount * 1e18));
  const totalQuote = (scaledAmount * scaledPrice) / 1_000_000n;

  await approveERC20({erc20:quote_coin, amount})
  const { to, data } = await getFunction("placeBuyOrder", scaledPrice, scaledAmount);
  const hash = await walletClient().sendTransaction({
    account: await getAccount(),
    to,
    data,
    value: 0n, // if ETH is used as quoteCoin, set to totalQuote
  });

  const tx = await publicClient().waitForTransactionReceipt({ hash });
  revertOnError(tx);
};


export const getOwner = async (): Promise<string> => {
  const { to, data } = await getFunction("nextOrderId");
  const result = await publicClient().call({ to, data });
  return result as string;
};

export const cancelOrder = async (orderId: number) => {
  const { to, data } = await getFunction("cancelOrder", BigInt(orderId));
  const hash = await walletClient().sendTransaction({
    account: await getAccount(),
    to,
    data,
  });

  const tx = await publicClient().waitForTransactionReceipt({ hash });
  revertOnError(tx);
};


// export const getActiveBuyOrders = async () => {
//   const { to, data } = await getFunction("getActiveBuyOrders");
//   const result = await publicClient().call({ to, data });
//   return orderbookInterface.decodeFunctionResult("getActiveBuyOrders", result.data);
// };

// export const getActiveSellOrders = async () => {
//   const { to, data } = await getFunction("getActiveSellOrders");
//   const result = await publicClient().call({ to, data });
//   return orderbookInterface.decodeFunctionResult("getActiveSellOrders", result.data);
// };

// export const getRecentTrades = async (limit: number) => {
//   const { to, data } = await getFunction("getRecentTrades", BigInt(limit));
//   const result = await publicClient().call({ to, data });
//   return orderbookInterface.decodeFunctionResult("getRecentTrades", result.data);
// };



export const pauseOrderbook = async () => {
  const { to, data } = await getFunction("pauseOrderbook");
  const hash = await walletClient().sendTransaction({
    account: await getAccount(),
    to,
    data,
  });
  const tx = await publicClient().waitForTransactionReceipt({ hash });
  revertOnError(tx);
};

export const resumeOrderbook = async () => {
  const { to, data } = await getFunction("resumeOrderbook");
  const hash = await walletClient().sendTransaction({
    account: await getAccount(),
    to,
    data,
  });
  const tx = await publicClient().waitForTransactionReceipt({ hash });
  revertOnError(tx);
};

export const emergencyWithdraw = async ({
  token,
  amount,
}: {
  token: `0x${string}`;
  amount: number;
}) => {
  const scaledAmount = BigInt(Math.trunc(amount * 1e18));
  const { to, data } = await getFunction("emergencyWithdraw", token, scaledAmount);
  const hash = await walletClient().sendTransaction({
    account: await getAccount(),
    to,
    data,
  });
  const tx = await publicClient().waitForTransactionReceipt({ hash });
  revertOnError(tx);
};


export const placeSellOrder = async ({
  price,
  amount,
}: {
  price: number;
  amount: number;
}) => {
  const scaledPrice = BigInt(Math.trunc(price * 1e6));
  const scaledAmount = BigInt(Math.trunc(amount * 1e18));


  await approveERC20({erc20:base_coin, amount})
  const { to, data } = await getFunction("placeSellOrder", scaledPrice, scaledAmount);
  const hash = await walletClient().sendTransaction({
    account: await getAccount(),
    to,
    data,
  });

  const tx = await publicClient().waitForTransactionReceipt({ hash });
  revertOnError(tx);
};

export const approveERC20 = async ({
  erc20,
  amount
}:{
  erc20:string,
  amount: number 
}) =>{
  const scaledAmount = BigInt(Math.trunc(amount * 1e18));
  const {to, data} = await getFunctionERC20("approve", erc20, CONTRACT_ADDRESS, scaledAmount)
   const hash = await walletClient().sendTransaction({
    account: await getAccount(),
    to,
    data,
  });

  const tx = await publicClient().waitForTransactionReceipt({ hash });
  revertOnError(tx);
}

import { getAddress } from "viem";

export const getOwn = async () => {
  const { to, data } = await getFunction("owner");
  const response = await publicClient().call({ to, data });

  if (!response.data) throw new Error("No data found");

  const bytes = new Uint8Array(response.data);
  const addressBytes = bytes.slice(12); // last 20 bytes
  const hex = "0x" + Buffer.from(addressBytes).toString("hex");

  return getAddress(hex); // checksummed address
};

export async function getUint256(functionName: string) {
  const { to, data } = await getFunction(functionName);
  const response = await publicClient().call({ to, data });

  if (!response.data) throw new Error("No data found");

  const bytes = new Uint8Array(response.data);
  return toBigInt(bytes);
}


import { decodeFunctionResult, encodeFunctionData } from 'viem';

export async function getBuyOrder(index: bigint, ) {
  const { to, data } = await getFunction("getBuyOrder", index);

  
  const response = await publicClient().call({ to, data });
  console.log("Called Buyorde ")
  console.log(response)
  if (!response.data) throw new Error("No data found");
  const bytes = new Uint8Array(response.data);
  console.log(bytes)
  const result = decodeFunctionResult({
    abi: abi,
    functionName: "getBuyOrder",
    data: bytes
  });
  console.log(result)

  const [order] = result;
  return {
    trader: order.trader,
    amount: BigInt(order.amount),
    price: BigInt(order.price)
  };
}


export async function getActiveBuyOrders() {
  const { to , data} = await getFunction("getActiveBuyOrders");


  const response = await publicClient().call({ to, data });
  console.log(response)
  console.log("Called getactive buy")
  if (!response.data) throw new Error("No data returned");

  const bytes = new Uint8Array(response.data);
  

  const result = decodeFunctionResult({
    abi: abi,
    functionName: "getActiveBuyOrders",
    data: bytes,
  });
  console.log(result)
    console.log(result[0])
  return result.map(order => ({
    trader: order.trader,
    amount: BigInt(order.amount),
    price: BigInt(order.price),
    remainingAmount: BigInt(order.remainingAmount),
    createdAt: BigInt(order.createdAt),
    isActive: BigInt(order.isActive)
  }));
}



export async function getActiveSellOrders() {
  const { to , data} = await getFunction("getActiveSellOrders");



  const response = await publicClient().call({ to, data });
  console.log(response)
  console.log("Called getactive sell")
  if (!response.data) throw new Error("No data returned");
  const bytes = new Uint8Array(response.data);

  const result = decodeFunctionResult({
    abi: abi,
    functionName: "getActiveSellOrders",
    data: bytes,
  });

  return result.map(order => ({
    trader: order.trader,
    amount: BigInt(order.amount),
    price: BigInt(order.price),
     remainingAmount: BigInt(order.remainingAmount),
    createdAt: BigInt(order.createdAt),
    isActive: BigInt(order.isActive)
  }));
}


export async function getRecentTrades(limit: bigint) {
  const { to, data } = await getFunction("getRecentTrades", limit);

  
  const response = await publicClient().call({ to, data });
  console.log(response)
  if (!response.data) throw new Error("No data returned");
  const bytes = new Uint8Array(response.data);
  const result = decodeFunctionResult({
    abi: abi,
    functionName: "getRecentTrades",
    data: bytes,
  });

  return result.map(trade => ({
    buyer: trade.buyer,
    seller: trade.seller,
    amount: BigInt(trade.amount),
    price: BigInt(trade.price)
  }));
}


export async function getStatistics() {
  const { to,data } = await getFunction("getStatistics");


  const response = await publicClient().call({ to, data });
  console.log(response)
  if (!response.data) throw new Error("No data returned");
  const bytes = new Uint8Array(response.data);
  const [activeBuy, activeSell, totalTrades, volume] = decodeFunctionResult({
    abi: abi,
    functionName: "getStatistics",
    data: bytes
  });

  return {
    activeBuyOrders: BigInt(activeBuy),
    activeSellOrders: BigInt(activeSell),
    totalTrades: BigInt(totalTrades),
    volume: BigInt(volume),
  };
}


const revertOnError = (tx: any) => {
  try {
    console.log(tx);
    if (!tx || !tx.status) {
      throw new Error("Transaction receipt is not available or invalid");
    }
    if (tx.status === "reverted") {
      const errorData = tx.logs[0]?.data;
      const errorMessage =
        errorData || "Transaction reverted without a message";
      if (errorData) {
        const fragment = umixInterface.fragments.filter((fragment) => {
          return fragment.type === "error";
        });
        console.log({ fragments: fragment });
        console.log(umixInterface.parseError(errorData));
      }
      throw new Error(`Transaction failed: ${errorMessage}`);
    }
    return tx;
  } catch (error) {
    console.error("Error occurred:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
};

