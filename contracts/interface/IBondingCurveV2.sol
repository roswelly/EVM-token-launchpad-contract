// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.9;

interface IBondingCurveV2 {
    event Buy(address buyer, uint256 tokenAmount, uint256 okbAmount);
    event Sell(address seller, uint256 tokenAmount, uint256 okbAmount);
    event LiquidityAdded(address poolAddress, uint256 liquidity);

    function initialize(address token, uint256 initialPrice) external;

    function buy() external payable returns (uint256);

    function sell(uint256 tokenAmount) external returns (uint256);
}
