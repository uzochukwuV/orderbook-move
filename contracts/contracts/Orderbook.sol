// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title Orderbook
 * @dev A decentralized orderbook implementation for trading ERC20 tokens
 */
contract Orderbook is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // Constants
    uint8 public constant ORDER_TYPE_BUY = 0;
    uint8 public constant ORDER_TYPE_SELL = 1;
    uint256 public constant MAX_ORDER_LIFETIME = 86400; // 24 hours in seconds
    uint256 public constant MIN_ORDER_AMOUNT = 1;
    uint256 public constant PRICE_PRECISION = 1000000; // 6 decimal places

    // Error messages
    error InvalidPrice();
    error InvalidAmount();
    error OrderNotFound();
    error InsufficientFunds();
    error OrderExpired();
    error InvalidOrderType();
    error CannotMatchOwnOrder();
    error PriceMismatch();
    error NotAuthorized();

    // Structs
    struct Order {
        uint256 id;
        address trader;
        uint8 orderType;
        uint256 price;
        uint256 amount;
        uint256 remainingAmount;
        uint256 createdAt;
        uint256 expiresAt;
        bool isActive;
    }

    struct Trade {
        uint256 id;
        uint256 buyOrderId;
        uint256 sellOrderId;
        address buyer;
        address seller;
        uint256 price;
        uint256 amount;
        uint256 timestamp;
    }

    struct OrderEscrow {
        uint256 orderId;
        uint256 amount;
    }

    // State variables
    IERC20 public  baseCoin;
    IERC20 public  quoteCoin;
    
    Order[] public buyOrders;
    Order[] public sellOrders;
    Trade[] public trades;
    
    uint256 public nextOrderId = 1;
    uint256 public nextTradeId = 1;
    uint256 public totalVolume;
    
    // Escrow tracking
    mapping(uint256 => uint256) public baseEscrow; // orderId => amount
    mapping(uint256 => uint256) public quoteEscrow; // orderId => amount
    
    // Events
    event OrderPlaced(
        uint256 indexed orderId,
        address indexed trader,
        uint8 orderType,
        uint256 price,
        uint256 amount,
        uint256 timestamp
    );
    
    event OrderCancelled(
        uint256 indexed orderId,
        address indexed trader,
        uint256 timestamp
    );
    
    event TradeExecuted(
        uint256 indexed tradeId,
        uint256 indexed buyOrderId,
        uint256 indexed sellOrderId,
        address buyer,
        address seller,
        uint256 price,
        uint256 amount,
        uint256 timestamp
    );
    
    event OrderBookInitialized(
        address indexed admin,
        address baseCoin,
        address quoteCoin,
        uint256 timestamp
    );

    /**
     * @dev Constructor to initialize the orderbook
     */
    constructor(
    ) Ownable(msg.sender) {
       
    }

    function initialiseOrderbook(
        address _baseCoin,
        address _quoteCoin
    ) external onlyOwner {
         require(_baseCoin != address(0) && _quoteCoin != address(0), "Invalid token addresses");
        require(_baseCoin != _quoteCoin, "Base and quote tokens must be different");
        
        baseCoin = IERC20(_baseCoin);
        quoteCoin = IERC20(_quoteCoin);
        
        emit OrderBookInitialized(
            msg.sender,
            _baseCoin,
            _quoteCoin,
            block.timestamp
        );
    }

    /**
     * @dev Place a buy order
     * @param price Price per unit (scaled by PRICE_PRECISION)
     * @param amount Amount of base currency to buy
     */
    function placeBuyOrder(
        uint256 price,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        if (price == 0) revert InvalidPrice();
        if (amount < MIN_ORDER_AMOUNT) revert InvalidAmount();
        
        uint256 quoteAmountNeeded = (amount * price) / PRICE_PRECISION;
        
        // Transfer quote tokens to this contract
        quoteCoin.safeTransferFrom(msg.sender, address(this), quoteAmountNeeded);
        
        // Create order
        Order memory order = Order({
            id: nextOrderId,
            trader: msg.sender,
            orderType: ORDER_TYPE_BUY,
            price: price,
            amount: amount,
            remainingAmount: amount,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + MAX_ORDER_LIFETIME,
            isActive: true
        });
        
        // Add to escrow tracking
        quoteEscrow[nextOrderId] = quoteAmountNeeded;
        
        // Add to buy orders
        buyOrders.push(order);
        
        emit OrderPlaced(
            nextOrderId,
            msg.sender,
            ORDER_TYPE_BUY,
            price,
            amount,
            block.timestamp
        );
        
        nextOrderId++;
        
        // Attempt to match orders
        _matchOrders();
    }

    /**
     * @dev Place a sell order
     * @param price Price per unit (scaled by PRICE_PRECISION)
     * @param amount Amount of base currency to sell
     */
    function placeSellOrder(
        uint256 price,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        if (price == 0) revert InvalidPrice();
        if (amount < MIN_ORDER_AMOUNT) revert InvalidAmount();
        
        // Transfer base tokens to this contract
        baseCoin.safeTransferFrom(msg.sender, address(this), amount);
        
        // Create order
        Order memory order = Order({
            id: nextOrderId,
            trader: msg.sender,
            orderType: ORDER_TYPE_SELL,
            price: price,
            amount: amount,
            remainingAmount: amount,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + MAX_ORDER_LIFETIME,
            isActive: true
        });
        
        // Add to escrow tracking
        baseEscrow[nextOrderId] = amount;
        
        // Add to sell orders
        sellOrders.push(order);
        
        emit OrderPlaced(
            nextOrderId,
            msg.sender,
            ORDER_TYPE_SELL,
            price,
            amount,
            block.timestamp
        );
        
        nextOrderId++;
        
        // Attempt to match orders
        _matchOrders();
    }

    /**
     * @dev Cancel an order and return escrowed funds
     * @param orderId The ID of the order to cancel
     */
    function cancelOrder(uint256 orderId) external nonReentrant {
        (bool found, bool isBuyOrder, uint256 index) = _findOrder(orderId, msg.sender);
        
        if (!found) revert OrderNotFound();
        
        if (isBuyOrder) {
            // Cancel buy order
            buyOrders[index].isActive = false;
            
            // Return escrowed quote tokens
            uint256 escrowAmount = quoteEscrow[orderId];
            if (escrowAmount > 0) {
                quoteEscrow[orderId] = 0;
                quoteCoin.safeTransfer(msg.sender, escrowAmount);
            }
        } else {
            // Cancel sell order
            sellOrders[index].isActive = false;
            
            // Return escrowed base tokens
            uint256 escrowAmount = baseEscrow[orderId];
            if (escrowAmount > 0) {
                baseEscrow[orderId] = 0;
                baseCoin.safeTransfer(msg.sender, escrowAmount);
            }
        }
        
        emit OrderCancelled(orderId, msg.sender, block.timestamp);
    }

    /**
     * @dev Internal function to match orders
     */
    function _matchOrders() internal {
        // Sort orders by price (this is a simplified approach)
        _sortBuyOrders();
        _sortSellOrders();
        
        // Match orders
        for (uint256 i = 0; i < buyOrders.length; i++) {
            if (!buyOrders[i].isActive || buyOrders[i].expiresAt < block.timestamp) {
                continue;
            }
            
            for (uint256 j = 0; j < sellOrders.length; j++) {
                if (!sellOrders[j].isActive || sellOrders[j].expiresAt < block.timestamp) {
                    continue;
                }
                
                // Check if orders can be matched
                if (buyOrders[i].price >= sellOrders[j].price &&
                    buyOrders[i].trader != sellOrders[j].trader &&
                    buyOrders[i].remainingAmount > 0 &&
                    sellOrders[j].remainingAmount > 0) {
                    
                    _executeTrade(i, j);
                    
                    // If buy order is fully filled, move to next buy order
                    if (buyOrders[i].remainingAmount == 0) {
                        break;
                    }
                }
            }
        }
        
        // Clean up expired orders
        _cleanupExpiredOrders();
    }

    /**
     * @dev Execute a trade between matching orders
     * @param buyIndex Index of the buy order
     * @param sellIndex Index of the sell order
     */
    function _executeTrade(uint256 buyIndex, uint256 sellIndex) internal {
        Order storage buyOrder = buyOrders[buyIndex];
        Order storage sellOrder = sellOrders[sellIndex];
        
        // Determine trade parameters
        uint256 tradePrice = sellOrder.price; // Sell order price takes precedence
        uint256 tradeAmount = buyOrder.remainingAmount < sellOrder.remainingAmount 
            ? buyOrder.remainingAmount 
            : sellOrder.remainingAmount;
        
        // Create trade record
        Trade memory trade = Trade({
            id: nextTradeId,
            buyOrderId: buyOrder.id,
            sellOrderId: sellOrder.id,
            buyer: buyOrder.trader,
            seller: sellOrder.trader,
            price: tradePrice,
            amount: tradeAmount,
            timestamp: block.timestamp
        });
        
        // Update order amounts
        buyOrder.remainingAmount -= tradeAmount;
        sellOrder.remainingAmount -= tradeAmount;
        
        // Mark orders as inactive if fully filled
        if (buyOrder.remainingAmount == 0) {
            buyOrder.isActive = false;
        }
        if (sellOrder.remainingAmount == 0) {
            sellOrder.isActive = false;
        }
        
        // Transfer funds
        uint256 baseAmount = tradeAmount;
        uint256 quoteAmount = (tradeAmount * tradePrice) / PRICE_PRECISION;
        
        // Transfer base tokens from escrow to buyer
        baseCoin.safeTransfer(buyOrder.trader, baseAmount);
        baseEscrow[sellOrder.id] -= baseAmount;
        
        // Transfer quote tokens from escrow to seller
        quoteCoin.safeTransfer(sellOrder.trader, quoteAmount);
        quoteEscrow[buyOrder.id] -= quoteAmount;
        
        // Record trade
        trades.push(trade);
        totalVolume += tradeAmount;
        
        emit TradeExecuted(
            nextTradeId,
            buyOrder.id,
            sellOrder.id,
            buyOrder.trader,
            sellOrder.trader,
            tradePrice,
            tradeAmount,
            block.timestamp
        );
        
        nextTradeId++;
    }

    /**
     * @dev Find an order by ID and trader
     * @param orderId The order ID
     * @param trader The trader address
     * @return found Whether the order was found
     * @return isBuyOrder Whether it's a buy order
     * @return index The index in the array
     */
    function _findOrder(
        uint256 orderId,
        address trader
    ) internal view returns (bool found, bool isBuyOrder, uint256 index) {
        // Search in buy orders
        for (uint256 i = 0; i < buyOrders.length; i++) {
            if (buyOrders[i].id == orderId && 
                buyOrders[i].trader == trader && 
                buyOrders[i].isActive) {
                return (true, true, i);
            }
        }
        
        // Search in sell orders
        for (uint256 i = 0; i < sellOrders.length; i++) {
            if (sellOrders[i].id == orderId && 
                sellOrders[i].trader == trader && 
                sellOrders[i].isActive) {
                return (true, false, i);
            }
        }
        
        return (false, false, 0);
    }

    /**
     * @dev Sort buy orders by price (descending - highest price first)
     */
    function _sortBuyOrders() internal {
        if (buyOrders.length <= 1) return;
        
        // Simple bubble sort (for production, use a more efficient algorithm)
        for (uint256 i = 0; i < buyOrders.length - 1; i++) {
            for (uint256 j = 0; j < buyOrders.length - i - 1; j++) {
                if (buyOrders[j].price < buyOrders[j + 1].price) {
                    Order memory temp = buyOrders[j];
                    buyOrders[j] = buyOrders[j + 1];
                    buyOrders[j + 1] = temp;
                }
            }
        }
    }

    /**
     * @dev Sort sell orders by price (ascending - lowest price first)
     */
    function _sortSellOrders() internal {
        if (sellOrders.length <= 1) return;
        
        // Simple bubble sort
        for (uint256 i = 0; i < sellOrders.length - 1; i++) {
            for (uint256 j = 0; j < sellOrders.length - i - 1; j++) {
                if (sellOrders[j].price > sellOrders[j + 1].price) {
                    Order memory temp = sellOrders[j];
                    sellOrders[j] = sellOrders[j + 1];
                    sellOrders[j + 1] = temp;
                }
            }
        }
    }

    /**
     * @dev Clean up expired orders and return escrowed funds
     */
    function _cleanupExpiredOrders() internal {
        // Clean up buy orders
        for (uint256 i = 0; i < buyOrders.length; i++) {
            if (buyOrders[i].expiresAt < block.timestamp && buyOrders[i].isActive) {
                buyOrders[i].isActive = false;
                
                // Return escrowed quote tokens
                uint256 escrowAmount = quoteEscrow[buyOrders[i].id];
                if (escrowAmount > 0) {
                    quoteEscrow[buyOrders[i].id] = 0;
                    quoteCoin.safeTransfer(buyOrders[i].trader, escrowAmount);
                }
            }
        }
        
        // Clean up sell orders
        for (uint256 i = 0; i < sellOrders.length; i++) {
            if (sellOrders[i].expiresAt < block.timestamp && sellOrders[i].isActive) {
                sellOrders[i].isActive = false;
                
                // Return escrowed base tokens
                uint256 escrowAmount = baseEscrow[sellOrders[i].id];
                if (escrowAmount > 0) {
                    baseEscrow[sellOrders[i].id] = 0;
                    baseCoin.safeTransfer(sellOrders[i].trader, escrowAmount);
                }
            }
        }
    }

    // View functions
    
    /**
     * @dev Get all active buy orders
     * @return Array of active buy orders
     */
    function getActiveBuyOrders() external view returns (Order[] memory) {
        return _getActiveOrders(buyOrders);
    }

    /**
     * @dev Get all active sell orders
     * @return Array of active sell orders
     */
    function getActiveSellOrders() external view returns (Order[] memory) {
        return _getActiveOrders(sellOrders);
    }

    /**
     * @dev Get recent trades
     * @param limit Maximum number of trades to return
     * @return Array of recent trades
     */
    function getRecentTrades(uint256 limit) external view returns (Trade[] memory) {
        uint256 tradesLength = trades.length;
        uint256 startIndex = tradesLength > limit ? tradesLength - limit : 0;
        uint256 resultLength = tradesLength - startIndex;
        
        Trade[] memory result = new Trade[](resultLength);
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = trades[startIndex + i];
        }
        
        return result;
    }

    /**
     * @dev Get orderbook statistics
     * @return activeBuyOrders Number of active buy orders
     * @return activeSellOrders Number of active sell orders
     * @return totalTrades Total number of trades
     * @return volume Total trading volume
     */
    function getStatistics() external view returns (
        uint256 activeBuyOrders,
        uint256 activeSellOrders,
        uint256 totalTrades,
        uint256 volume
    ) {
        Order[] memory activeBuys = _getActiveOrders(buyOrders);
        Order[] memory activeSells = _getActiveOrders(sellOrders);
        
        return (
            activeBuys.length,
            activeSells.length,
            trades.length,
            totalVolume
        );
    }

    /**
     * @dev Filter active orders from an array
     * @param orders Array of orders to filter
     * @return Array of active orders
     */
    function _getActiveOrders(Order[] memory orders) internal view returns (Order[] memory) {
        uint256 activeCount = 0;
        
        // Count active orders
        for (uint256 i = 0; i < orders.length; i++) {
            if (orders[i].isActive && orders[i].expiresAt > block.timestamp) {
                activeCount++;
            }
        }
        
        // Create result array
        Order[] memory result = new Order[](activeCount);
        uint256 resultIndex = 0;
        
        for (uint256 i = 0; i < orders.length; i++) {
            if (orders[i].isActive && orders[i].expiresAt > block.timestamp) {
                result[resultIndex] = orders[i];
                resultIndex++;
            }
        }
        
        return result;
    }

    // Admin functions
    
    /**
     * @dev Pause the orderbook (owner only)
     */
    function pauseOrderbook() external onlyOwner {
        _pause();
    }

    /**
     * @dev Resume the orderbook (owner only)
     */
    function resumeOrderbook() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdrawal function (owner only)
     * @param token Token address to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }

    /**
     * @dev Get the number of buy orders
     * @return Number of buy orders
     */
    function getBuyOrdersCount() external view returns (uint256) {
        return buyOrders.length;
    }

    /**
     * @dev Get the number of sell orders
     * @return Number of sell orders
     */
    function getSellOrdersCount() external view returns (uint256) {
        return sellOrders.length;
    }

    /**
     * @dev Get a specific buy order
     * @param index Index of the buy order
     * @return The buy order
     */
    function getBuyOrder(uint256 index) external view returns (Order memory) {
        require(index < buyOrders.length, "Index out of bounds");
        return buyOrders[index];
    }

    /**
     * @dev Get a specific sell order
     * @param index Index of the sell order
     * @return The sell order
     */
    function getSellOrder(uint256 index) external view returns (Order memory) {
        require(index < sellOrders.length, "Index out of bounds");
        return sellOrders[index];
    }

    /**
     * @dev Get the total number of trades
     * @return Number of trades
     */
    function getTradesCount() external view returns (uint256) {
        return trades.length;
    }

    /**
     * @dev Get a specific trade
     * @param index Index of the trade
     * @return The trade
     */
    function getTrade(uint256 index) external view returns (Trade memory) {
        require(index < trades.length, "Index out of bounds");
        return trades[index];
    }
}