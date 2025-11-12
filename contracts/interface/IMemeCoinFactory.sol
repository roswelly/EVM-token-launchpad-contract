// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.9;

interface IMemeCoinFactory {
    event TokenCreated(
        address token,
        string name,
        string symbol,
        address creator
    );
    event FeeCollected(uint256 amount, address collector);

    struct TokenInfo {
        string name;
        string symbol;
        address tokenAddress;
        address creator;
        uint256 totalSupply;
        // bool isListed;
        // uint256 tradingVolume;
        address bondingCurve;
    }

    function createToken(
        string memory name,
        string memory symbol
    ) external payable;

    // function triggerDEXListing(address token) external;
    function withdrawFees() external;

    // function setSlippage(address token, uint256 buySlippage, uint256 sellSlippage) external;
    function getTokenInfo(
        address token
    ) external view returns (TokenInfo memory);

    function isSymbolTaken(string memory symbol) external view returns (bool);

    function predictTokenAddress(
        string calldata name, // 添加 name 参数
        string calldata symbol,
        address creator
    ) external view returns (address);

    

}
