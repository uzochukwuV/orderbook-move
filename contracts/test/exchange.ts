import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "hardhat";
import { TypedDataDomain, TypedDataField } from "ethers";

describe("Exchange", function () {
    async function deployExchangeFixture() {
        const [owner, trader1, trader2, liquidator] = await hre.ethers.getSigners();

        // Deploy mock tokens
        const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
        const baseToken = await MockERC20.deploy("Mock Base", "mBASE");
        await baseToken.waitForDeployment();
        const quoteToken = await MockERC20.deploy("Mock Quote", "mQUOTE");
        await quoteToken.waitForDeployment();

        // Deploy supporting contracts
        const TokenVault = await hre.ethers.getContractFactory("TokenVault");
        const tokenVault = await TokenVault.deploy();
        await tokenVault.waitForDeployment();

        const TradeHistory = await hre.ethers.getContractFactory("TradeHistory");
        const tradeHistory = await TradeHistory.deploy(owner.address); // Temporarily set owner, will be transferred
        await tradeHistory.waitForDeployment();

        const MockPriceOracle = await hre.ethers.getContractFactory("MockPriceOracle");
        const priceOracle = await MockPriceOracle.deploy();
        await priceOracle.waitForDeployment();

        // Deploy main contracts
        const OrderMatcher = await hre.ethers.getContractFactory("OrderMatcher");
        const orderMatcher = await OrderMatcher.deploy(await tokenVault.getAddress(), await tradeHistory.getAddress());
        await orderMatcher.waitForDeployment();

        const PerpetualSwaps = await hre.ethers.getContractFactory("PerpetualSwaps");
        const perpetualSwaps = await PerpetualSwaps.deploy(await tokenVault.getAddress(), await priceOracle.getAddress(), await quoteToken.getAddress());
        await perpetualSwaps.waitForDeployment();

        // Transfer ownership
        await tokenVault.transferOwnership(await orderMatcher.getAddress());
        await tradeHistory.transferOwnership(await orderMatcher.getAddress());
        await perpetualSwaps.transferOwnership(await orderMatcher.getAddress());


        // Mint and approve tokens for traders
        await baseToken.mint(trader1.address, ethers.parseEther("100"));
        await quoteToken.mint(trader1.address, ethers.parseEther("10000"));
        await baseToken.mint(trader2.address, ethers.parseEther("100"));
        await quoteToken.mint(trader2.address, ethers.parseEther("10000"));

        await baseToken.connect(trader1).approve(await tokenVault.getAddress(), ethers.parseEther("100"));
        await quoteToken.connect(trader1).approve(await tokenVault.getAddress(), ethers.parseEther("10000"));
        await baseToken.connect(trader2).approve(await tokenVault.getAddress(), ethers.parseEther("100"));
        await quoteToken.connect(trader2).approve(await tokenVault.getAddress(), ethers.parseEther("10000"));

        return {
            owner,
            trader1,
            trader2,
            liquidator,
            baseToken,
            quoteToken,
            priceOracle,
            tokenVault,
            orderMatcher,
            tradeHistory,
            perpetualSwaps,
        };
    }

    async function signOrder(trader: any, order: any, orderMatcher: any) {
        const domain = {
            name: "OrderMatcher",
            version: "1",
            chainId: (await hre.ethers.provider.getNetwork()).chainId,
            verifyingContract: await orderMatcher.getAddress()
        };

        const types = {
            Order: [
                { name: "trader", type: "address" },
                { name: "baseToken", type: "address" },
                { name: "quoteToken", type: "address" },
                { name: "price", type: "uint256" },
                { name: "amount", type: "uint256" },
                { name: "nonce", type: "uint256" },
                { name: "isBuy", type: "bool" },
            ]
        };

        return await trader.signTypedData(domain, types, order);
    }

    describe("TokenVault", function () {
        it("Should allow users to deposit and withdraw tokens", async function () {
            const { tokenVault, baseToken, trader1 } = await loadFixture(deployExchangeFixture);
            const amount = ethers.parseEther("10");

            await tokenVault.connect(trader1).deposit(await baseToken.getAddress(), amount);
            expect(await tokenVault.balances(await baseToken.getAddress(), trader1.address)).to.equal(amount);

            await tokenVault.connect(trader1).withdraw(await baseToken.getAddress(), amount);
            expect(await tokenVault.balances(await baseToken.getAddress(), trader1.address)).to.equal(0);
        });
    });

    describe("OrderMatcher", function () {
        it("Should execute a trade and update balances", async function () {
            const { tokenVault, orderMatcher, tradeHistory, baseToken, quoteToken, trader1, trader2 } = await loadFixture(deployExchangeFixture);

            // Deposit funds
            await tokenVault.connect(trader1).deposit(await quoteToken.getAddress(), ethers.parseEther("1000"));
            await tokenVault.connect(trader2).deposit(await baseToken.getAddress(), ethers.parseEther("10"));

            const buyOrder = {
                trader: trader1.address,
                baseToken: await baseToken.getAddress(),
                quoteToken: await quoteToken.getAddress(),
                price: ethers.parseEther("100"),
                amount: ethers.parseEther("1"),
                nonce: 0,
                isBuy: true
            };

            const sellOrder = {
                trader: trader2.address,
                baseToken: await baseToken.getAddress(),
                quoteToken: await quoteToken.getAddress(),
                price: ethers.parseEther("100"),
                amount: ethers.parseEther("1"),
                nonce: 0,
                isBuy: false
            };

            const buySig = await signOrder(trader1, buyOrder, orderMatcher);
            const sellSig = await signOrder(trader2, sellOrder, orderMatcher);

            await orderMatcher.executeTrade(buyOrder, sellOrder, buySig, sellSig);

            // Check balances
            const quoteAmount = (buyOrder.price * buyOrder.amount) / ethers.parseEther("1");
            expect(await tokenVault.balances(await quoteToken.getAddress(), trader1.address)).to.equal(ethers.parseEther("1000") - quoteAmount);
            expect(await tokenVault.balances(await baseToken.getAddress(), trader1.address)).to.equal(buyOrder.amount);
            expect(await tokenVault.balances(await quoteToken.getAddress(), trader2.address)).to.equal(quoteAmount);
            expect(await tokenVault.balances(await baseToken.getAddress(), trader2.address)).to.equal(ethers.parseEther("10") - sellOrder.amount);

            // Check trade history
            expect(await tradeHistory.getTradesCount()).to.equal(1);
        });
    });

    describe("PerpetualSwaps", function () {
        it("Should open and close a position using the vault", async function () {
            const { tokenVault, perpetualSwaps, quoteToken, trader1, priceOracle } = await loadFixture(deployExchangeFixture);

            // Deposit collateral
            await tokenVault.connect(trader1).deposit(await quoteToken.getAddress(), ethers.parseEther("1000"));

            await perpetualSwaps.openPosition(trader1.address, ethers.parseEther("1"), ethers.parseEther("100"), true, ethers.parseEther("100"));

            expect(await tokenVault.balances(await quoteToken.getAddress(), trader1.address)).to.equal(ethers.parseEther("900"));

            await perpetualSwaps.closePosition(trader1.address, ethers.parseEther("110"));

            // PnL = (110 - 100) * 1 = 10
            expect(await tokenVault.balances(await quoteToken.getAddress(), trader1.address)).to.equal(ethers.parseEther("910"));
        });
    });
});
