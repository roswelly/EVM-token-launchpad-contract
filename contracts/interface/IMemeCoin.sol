// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


interface IMemeCoin is IERC20 {
    
    function mint(address to, uint256 amount) external;
    function burn(uint256 amount) external;
    function transferOwnership(address newOwner) external;
}