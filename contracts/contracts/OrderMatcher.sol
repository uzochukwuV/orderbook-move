// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./TokenVault.sol";
import "./TradeHistory.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract OrderMatcher is Ownable, EIP712 {
    TokenVault public tokenVault;
    TradeHistory public tradeHistory;

    bytes32 private constant ORDER_TYPEHASH = keccak256(
        "Order(address trader,address baseToken,address quoteToken,uint256 price,uint256 amount,uint256 nonce,bool isBuy)"
    );

    struct Order {
        address trader;
        address baseToken;
        address quoteToken;
        uint256 price;
        uint256 amount;
        uint256 nonce;
        bool isBuy;
    }

    mapping(address => uint256) public nonces;

    event TradeExecuted(
        address indexed maker,
        address indexed taker,
        uint256 price,
        uint256 amount
    );

    constructor(address _tokenVault, address _tradeHistory) EIP712("OrderMatcher", "1") Ownable(msg.sender) {
        tokenVault = TokenVault(_tokenVault);
        tradeHistory = TradeHistory(_tradeHistory);
    }

    function executeTrade(
        Order calldata buyOrder,
        Order calldata sellOrder,
        bytes calldata buySignature,
        bytes calldata sellSignature
    ) external onlyOwner {
        _verifyOrder(buyOrder, buySignature);
        _verifyOrder(sellOrder, sellSignature);

        require(buyOrder.isBuy, "First order must be a buy order");
        require(!sellOrder.isBuy, "Second order must be a sell order");
        require(buyOrder.price >= sellOrder.price, "Price mismatch");
        require(buyOrder.baseToken == sellOrder.baseToken, "Base token mismatch");
        require(buyOrder.quoteToken == sellOrder.quoteToken, "Quote token mismatch");

        uint256 quoteAmount = (sellOrder.price * sellOrder.amount) / 1e18; // Assume 18 decimals for price

        tokenVault.internalTransfer(sellOrder.quoteToken, buyOrder.trader, sellOrder.trader, quoteAmount);
        tokenVault.internalTransfer(sellOrder.baseToken, sellOrder.trader, buyOrder.trader, sellOrder.amount);

        nonces[buyOrder.trader]++;
        nonces[sellOrder.trader]++;

        tradeHistory.recordTrade(sellOrder.trader, buyOrder.trader, sellOrder.price, sellOrder.amount);

        emit TradeExecuted(
            sellOrder.trader,
            buyOrder.trader,
            sellOrder.price,
            sellOrder.amount
        );
    }

    function _verifyOrder(Order calldata order, bytes calldata signature) internal view {
        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    ORDER_TYPEHASH,
                    order.trader,
                    order.baseToken,
                    order.quoteToken,
                    order.price,
                    order.amount,
                    nonces[order.trader],
                    order.isBuy
                )
            )
        );
        address signer = ECDSA.recover(digest, signature);
        require(signer == order.trader, "Invalid signature");
    }
}
