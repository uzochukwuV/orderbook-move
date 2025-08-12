// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenVault is Ownable {
    using SafeERC20 for IERC20;

    // token address => user address => balance
    mapping(address => mapping(address => uint256)) public balances;

    // Events
    event Deposit(address indexed token, address indexed user, uint256 amount);
    event Withdraw(address indexed token, address indexed user, uint256 amount);
    event InternalTransfer(address indexed token, address indexed from, address indexed to, uint256 amount);

    constructor() Ownable(msg.sender) {}

    function deposit(address token, uint256 amount) external {
        balances[token][msg.sender] += amount;
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit Deposit(token, msg.sender, amount);
    }

    function withdraw(address token, uint256 amount) external {
        require(balances[token][msg.sender] >= amount, "Insufficient balance");
        balances[token][msg.sender] -= amount;
        IERC20(token).safeTransfer(msg.sender, amount);
        emit Withdraw(token, msg.sender, amount);
    }

    function internalTransfer(address token, address from, address to, uint256 amount) external onlyOwner {
        require(balances[token][from] >= amount, "Insufficient balance");
        balances[token][from] -= amount;
        balances[token][to] += amount;
        emit InternalTransfer(token, from, to, amount);
    }
}
