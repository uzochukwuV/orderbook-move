import { BCS, getRustConfig } from "@benfen/bcs";
import { BrowserProvider, ethers } from "ethers";
import {
  createPublicClient,
  createWalletClient,
  custom,
  defineChain,
} from "viem";
import { publicActionsL2, walletActionsL2 } from "viem/op-stack";
import abi2 from "../assets/json/umix.json";
import abi from "../assets/json/Orderbook.json";
import ERCABI from "../assets/json/MockERC20.json";
import { CONTRACT_ADDRESS } from "./constants";

export const umixInterface = new ethers.Interface(abi2);
export const orderbookInterface = new ethers.Interface(abi);
export const erc20Interface = new ethers.Interface(ERCABI);

const bcs = new BCS(getRustConfig());
bcs.registerEnumType("SerializableTransactionData", {
  EoaBaseTokenTransfer: "",
  ScriptOrDeployment: "",
  EntryFunction: "",
  L2Contract: "",
  EvmContract: "Vec<u8>",
});


const serializeFunction = (data: string): `0x${string}` => {
  const code = Uint8Array.from(Buffer.from(data.replace("0x", ""), "hex"));
  const evmContract = bcs.ser("SerializableTransactionData", {
    EvmContract: code,
  });
  return `0x${evmContract.toString("hex")}`;
};

export const umiDevnet = defineChain({
  id: 42069,
  sourceId: 42069,
  name: "Umi",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://devnet.uminetwork.com"],
    },
  },
});

async function switchOrAddChain(
  ethProvider: ethers.JsonRpcApiProvider,
  switchChainId: string | number
) {
  try {
    const currentChainId = Number(
      await ethProvider.provider.send("eth_chainId", [])
    );
    const targetChainId = Number(switchChainId);
    const chainIdHex = `0x${targetChainId.toString(16)}`;

    console.log(
      `Current chainId: ${currentChainId}, Switch chainId: ${targetChainId}`
    );

    if (currentChainId === targetChainId) {
      console.log(`Already connected to ${targetChainId}`);
      return;
    }

    try {
      await ethProvider.provider.send("wallet_switchEthereumChain", [
        { chainId: chainIdHex },
      ]);
      console.log(`Switched to ${targetChainId}`);
    } catch (error: any) {
      console.error(`Error switching chain:`, error);

      if (error.code === 4902) {
        console.log(`Chain ${targetChainId} not found. Attempting to add.`);

        if (targetChainId === Number(umiDevnet.id)) {
          await ethProvider.provider.send("wallet_addEthereumChain", [
            {
              chainId: chainIdHex,
              chainName: umiDevnet.name,
              nativeCurrency: {
                name: umiDevnet.nativeCurrency.name,
                symbol: umiDevnet.nativeCurrency.symbol,
                decimals: 18,
              },
              rpcUrls: [umiDevnet.rpcUrls.default.http[0]],
              blockExplorerUrls: [umiDevnet.blockExplorers?.default.url],
            },
          ]);
          console.log(`${umiDevnet.id} added and switched`);
        }
      } else {
        console.error(`Failed to switch to ${targetChainId}:`, error);
      }
    }
  } catch (error) {
    console.error(`Unexpected error in switchOrAddChain:`, error);
  }
}

export const getAccount = async () => {
  const [account] = await window.ethereum!.request({
    method: "eth_requestAccounts",
  });
  return account;
};

export const publicClient = () =>
  createPublicClient({
    chain: umiDevnet,
    transport: custom(window.ethereum!),
  }).extend(publicActionsL2());

export const walletClient = () =>
  createWalletClient({
    chain: umiDevnet,
    transport: custom(window.ethereum!),
  }).extend(walletActionsL2());

export const getSigner = async () => {
  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
};

export const getFunction = async (name: string, ...args: any[]) => {
  const signer = await getSigner();

  
  await switchOrAddChain(signer.provider, umiDevnet.id);
  // console.log(orderbookInterface)
 
  const contract = new ethers.Contract(CONTRACT_ADDRESS, orderbookInterface, signer);
  const fn = contract.getFunction(name);
  // console.log(fn)
  if (!fn) throw new Error(`Function "${name}" not found in ABI`);

  const tx = await fn.populateTransaction(...args);
  // console.log(tx)
  return {
    to: tx.to as `0x${string}`,
    data: serializeFunction(tx.data),
  };
};


export const getFunctionERC20 = async (name: string, contractAdress :string,  ...args: any[]) => {
  const signer = await getSigner();

  
  await switchOrAddChain(signer.provider, umiDevnet.id);
  
 
  const contract = new ethers.Contract(contractAdress, erc20Interface, signer);
  const fn = contract.getFunction(name);
  // console.log(fn)
  if (!fn) throw new Error(`Function "${name}" not found in ABI`);

  const tx = await fn.populateTransaction(...args);
  // console.log(tx)
  return {
    to: tx.to as `0x${string}`,
    data: serializeFunction(tx.data),
  };
};
