// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PayForwarder is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant BPS_DENOMINATOR = 10_000;

    mapping(address => bool) public allowedCallers;

    // ========== Errors ==========
    error InvalidMerchant();
    error InvalidTreasury();
    error InvalidAmount();
    error BpsTooHigh();
    error NoFunds();
    error NotAllowed();
    error TransferFailed();

    // ========== Events ==========
    event Settled(
        address indexed token,
        address indexed merchant,
        address indexed treasury,
        uint256 amount,
        uint256 feeAmount,
        uint256 reserveAmount,
        uint256 timestamp
    );

    event AllowedCallerUpdated(address indexed caller, bool allowed);

    // ========== Constructor ==========
    constructor(address owner_) Ownable(owner_) {
        if (owner_ == address(0)) revert InvalidTreasury();
        allowedCallers[owner_] = true;
    }

    // ========== Core Logic ==========
    function forward(
        address token,
        address merchant,
        address treasury,
        uint256 amount,
        uint256 feeBps,
        uint256 reserveBps
    ) external nonReentrant {
        if (!allowedCallers[msg.sender]) revert NotAllowed();
        if (merchant == address(0)) revert InvalidMerchant();
        if (treasury == address(0)) revert InvalidTreasury();
        if (amount == 0) revert InvalidAmount();
        if (feeBps + reserveBps > 5000) revert BpsTooHigh(); // max 50%

        uint256 balance = token == address(0)
            ? address(this).balance
            : IERC20(token).balanceOf(address(this));

        if (balance < amount) revert NoFunds();

        uint256 feeAmount = (amount * feeBps) / BPS_DENOMINATOR;
        uint256 reserveAmount = (amount * reserveBps) / BPS_DENOMINATOR;
        uint256 merchantAmount = amount - feeAmount - reserveAmount;

        if (token == address(0)) {
            (bool ok1, ) = merchant.call{value: merchantAmount}("");
            if (!ok1) revert TransferFailed();

            (bool ok2, ) = treasury.call{value: feeAmount + reserveAmount}("");
            if (!ok2) revert TransferFailed();
        } else {
            IERC20(token).safeTransfer(merchant, merchantAmount);
            IERC20(token).safeTransfer(treasury, feeAmount + reserveAmount);
        }

        emit Settled(
            token,
            merchant,
            treasury,
            amount,
            feeAmount,
            reserveAmount,
            block.timestamp
        );
    }

    // ========== Admin ==========
    function setAllowedCaller(address caller, bool allowed) external onlyOwner {
        allowedCallers[caller] = allowed;
        emit AllowedCallerUpdated(caller, allowed);
    }

    receive() external payable {}
}