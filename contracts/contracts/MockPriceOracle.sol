// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockPriceOracle {
    int256 public price;

    function setPrice(int256 _price) external {
        price = _price;
    }

    function getLatestPrice() external view returns (int256) {
        return price;
    }
}
