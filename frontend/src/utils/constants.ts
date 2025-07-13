// import usdc from "../assets/images/usdc.png";
import logo from "../assets/images/umi.svg";
import { ethers } from "ethers";
export const tokens = [
  {
    name: "ETH",
    address: ethers.ZeroAddress,
    image: logo,
  },
];
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
export const SUBQUERY_ENDPOINT = import.meta.env.VITE_SUBQUERY_ENDPOINT;
export const WALLET_CONNECT_PROJECT_ID = import.meta.env
  .VITE_WALLET_CONNECT_PROJECT_ID;


export const MOCK_USDC = import.meta.env.VITE_MOCK_USDC;
export const MOCK_USDT = import.meta.env.VITE_MOCK_USDT;