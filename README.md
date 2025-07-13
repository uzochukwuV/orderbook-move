Here’s a clean and professional `README.md` description for your **UmiOrderBook DApp** project:

---

# 📈 Umi OrderBook DApp

A decentralized, transparent, and efficient on-chain order book system built for trading ERC-20 tokens. This DApp enables users to place buy and sell orders, view live order books, and track trade history — all directly on the blockchain.

---

## 🛠️ Features

* 🧾 **Fully on-chain order book**
  No off-chain relayers — all buy/sell orders are stored and matched on-chain for full transparency.

* 🛒 **Limit order support**
  Users can place, cancel, and match limit buy/sell orders.

* 🔍 **Live market data**
  View active buy/sell orders and recent trade history in real time.

* 📊 **Statistics dashboard**
  Track total trades, volumes, and active orders.

* 🔐 **Non-custodial**
  You retain control of your tokens — all trades are executed via smart contracts.

---

## 🧱 Built With

* **Solidity / Move (Umi-compatible)** – for the core smart contract logic
* **Hardhat + Ethers.js / Viem** – for testing and deployment
* **React + TypeScript** – for the frontend interface
* **Umi Network** – for deploying and interacting with Move-powered EVM contracts

---

## ⚙️ Core Smart Contracts

* `OrderBook.sol`:
  Handles storage and management of buy/sell orders and trade execution.

* `ERC20Token.sol`:
  A sample token used for testing trades.

---

## 🔧 Key Functions

| Function                                  | Description                      |
| ----------------------------------------- | -------------------------------- |
| `placeBuyOrder(uint amount, uint price)`  | Submit a buy order               |
| `placeSellOrder(uint amount, uint price)` | Submit a sell order              |
| `matchOrders()`                           | Match compatible buy/sell orders |
| `getBuyOrdersCount()`                     | Get total buy orders             |
| `getActiveBuyOrders()`                    | View all active buy orders       |
| `getTrade(uint index)`                    | View a specific trade            |
| `getStatistics()`                         | Get summary metrics              |

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Compile smart contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Umi testnet (update network config)
npx hardhat run scripts/deploy.ts --network umi
```

---

## 🌐 Frontend (React)

```bash
cd frontend

# Install deps
npm install

# Run development server
npm run dev
```

---

## 🔐 Security & Limitations

* Currently supports basic limit order matching (price-time priority)
* No automated market maker (AMM) or slippage protection yet
* Consider adding signature-based order placement for gasless orders in future

---

## 📄 License

MIT © 2025 YourName

---

Let me know if you’d like to:

* Include images/screenshots
* Add badges (e.g. build status, license)
* Include a section for contributors, APIs, or advanced usage

I can also auto-generate the README file for you.
