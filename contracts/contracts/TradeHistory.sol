// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TradeHistory
 * @dev A contract to store the history of trades from the OrderMatcher
 */
contract TradeHistory is Ownable {
    // The address of the OrderMatcher contract
    address public orderMatcher;

    // Struct for a trade
    struct Trade {
        uint256 id;
        address maker;
        address taker;
        uint256 price;
        uint256 amount;
        uint256 timestamp;
    }

    // Array to store all trades
    Trade[] public trades;
    uint256 public nextTradeId = 1;

    // Event for when a trade is recorded
    event TradeRecorded(
        uint256 indexed tradeId,
        address indexed maker,
        address indexed taker,
        uint256 price,
        uint256 amount,
        uint256 timestamp
    );

    modifier onlyOrderMatcher() {
        require(msg.sender == orderMatcher, "Only the OrderMatcher can call this function");
        _;
    }

    constructor(address _orderMatcher) {
        orderMatcher = _orderMatcher;
    }

    /**
     * @dev Records a new trade. Can only be called by the OrderMatcher contract.
     * @param maker The address of the maker
     * @param taker The address of the taker
     * @param price The price of the trade
     * @param amount The amount of the trade
     */
    function recordTrade(
        address maker,
        address taker,
        uint256 price,
        uint256 amount
    ) external onlyOrderMatcher {
        trades.push(
            Trade({
                id: nextTradeId,
                maker: maker,
                taker: taker,
                price: price,
                amount: amount,
                timestamp: block.timestamp
            })
        );

        emit TradeRecorded(
            nextTradeId,
            maker,
            taker,
            price,
            amount,
            block.timestamp
        );

        nextTradeId++;
    }

    /**
     * @dev Get the total number of trades
     * @return The total number of trades
     */
    function getTradesCount() external view returns (uint256) {
        return trades.length;
    }

    /**
     * @dev Get a specific trade by its index in the trades array
     * @param index The index of the trade
     * @return The trade
     */
    function getTrade(uint256 index) external view returns (Trade memory) {
        require(index < trades.length, "Index out of bounds");
        return trades[index];
    }

    /**
     * @dev Get a slice of the trades array for pagination
     * @param offset The starting index of the slice
     * @param limit The number of trades to return
     * @return A slice of the trades array
     */
    function getTrades(uint256 offset, uint256 limit) external view returns (Trade[] memory) {
        uint256 count = trades.length;
        if (offset >= count) {
            return new Trade[](0);
        }

        uint256 end = offset + limit;
        if (end > count) {
            end = count;
        }

        Trade[] memory result = new Trade[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = trades[i];
        }

        return result;
    }
}
