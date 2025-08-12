// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./TokenVault.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

interface IPriceOracle {
    function getLatestPrice() external view returns (int256);
}

contract PerpetualSwaps is Ownable {
    using SafeMath for uint256;

    struct Position {
        uint256 collateral;
        uint256 size;
        int256 entryPrice;
        bool isLong;
        uint256 lastFundingTime;
    }

    TokenVault public tokenVault;
    IPriceOracle public priceOracle;
    address public collateralToken;

    mapping(address => Position) public positions;

    uint256 public maintenanceMarginRatio = 500; // 5%
    uint256 public liquidationFee = 100; // 1%

    int256 public markPrice;
    int256 public fundingRate;
    uint256 public lastFundingTime;
    uint256 public fundingPeriod = 8 hours;

    event PositionOpened(address indexed trader, uint256 size, int256 entryPrice, bool isLong);
    event PositionClosed(address indexed trader, uint256 size, int256 exitPrice, int256 pnl);
    event PositionLiquidated(address indexed trader, uint256 size, int256 price, uint256 fee);
    event FundingRateUpdated(int256 fundingRate, uint256 timestamp);
    event FundingApplied(address indexed trader, int256 fundingPayment);

    constructor(address _tokenVault, address _priceOracle, address _collateralToken) Ownable(msg.sender) {
        tokenVault = TokenVault(_tokenVault);
        priceOracle = IPriceOracle(_priceOracle);
        collateralToken = _collateralToken;
        lastFundingTime = block.timestamp;
    }

    function setMarkPrice(int256 _markPrice) external onlyOwner {
        markPrice = _markPrice;
    }

    function updateFundingRate() external onlyOwner {
        require(block.timestamp >= lastFundingTime + fundingPeriod, "Funding period not over");

        int256 indexPrice = priceOracle.getLatestPrice();
        fundingRate = (markPrice - indexPrice) * 1e18 / indexPrice / int256(fundingPeriod);
        lastFundingTime = block.timestamp;

        emit FundingRateUpdated(fundingRate, block.timestamp);
    }

    function applyFunding(address trader) internal {
        Position storage position = positions[trader];
        if (position.size == 0) return;

        uint256 timeSinceLastFunding = block.timestamp - position.lastFundingTime;
        if (timeSinceLastFunding == 0) return;

        int256 fundingPayment = int256(position.size) * fundingRate * int256(timeSinceLastFunding) / 1e18;

        if (position.isLong) {
            position.collateral -= uint256(fundingPayment);
        } else {
            position.collateral += uint256(fundingPayment);
        }

        position.lastFundingTime = block.timestamp;

        emit FundingApplied(trader, fundingPayment);
    }

    function openPosition(address trader, uint256 size, int256 price, bool isLong, uint256 initialCollateral) external onlyOwner {
        applyFunding(trader);

        tokenVault.internalTransfer(collateralToken, trader, address(this), initialCollateral);

        positions[trader] = Position({
            collateral: initialCollateral,
            size: size,
            entryPrice: price,
            isLong: isLong,
            lastFundingTime: block.timestamp
        });

        emit PositionOpened(trader, size, price, isLong);
    }

    function closePosition(address trader, int256 exitPrice) external onlyOwner {
        applyFunding(trader);

        Position storage position = positions[trader];
        require(position.size > 0, "No open position");

        int256 pnl = _calculatePnl(position, exitPrice);

        if (pnl > 0) {
            tokenVault.internalTransfer(collateralToken, address(this), trader, uint256(pnl));
        } else {
            tokenVault.internalTransfer(collateralToken, trader, address(this), uint256(-pnl));
        }

        emit PositionClosed(trader, position.size, exitPrice, pnl);

        delete positions[trader];
    }

    function liquidatePosition(address liquidator, address trader) external {
        applyFunding(trader);

        Position storage position = positions[trader];
        require(position.size > 0, "No open position");

        int256 currentPrice = priceOracle.getLatestPrice();

        require(_isLiquidatable(position, currentPrice), "Position not liquidatable");

        uint256 fee = position.size * uint256(currentPrice) * liquidationFee / 10000;

        tokenVault.internalTransfer(collateralToken, trader, liquidator, fee);

        emit PositionLiquidated(trader, position.size, currentPrice, fee);

        delete positions[trader];
    }

    function _calculatePnl(Position memory position, int256 exitPrice) internal pure returns (int256) {
        if (position.isLong) {
            return (exitPrice - position.entryPrice) * int256(position.size);
        } else {
            return (position.entryPrice - exitPrice) * int256(position.size);
        }
    }

    function _isLiquidatable(Position memory position, int256 currentPrice) internal view returns (bool) {
        int256 pnl = _calculatePnl(position, currentPrice);

        if (int256(position.collateral) + pnl < 0) {
            return true;
        }

        return false;
    }
}
