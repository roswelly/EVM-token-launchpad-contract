// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.9;

import "./interface/IMemeCoin.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";


contract MemeCoin is IMemeCoin, ERC20, Ownable {
    uint256 private constant INITIAL_SUPPLY = 1_000_000_000 * 1e18;

    constructor(
        string memory name,
        string memory symbol,
        address factory
    ) ERC20(name, symbol) Ownable(factory) {
        _mint(factory, INITIAL_SUPPLY);
    }

    function mint(address to, uint256 amount) external override onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) external override { 
        _burn(msg.sender, amount);
    }

    function transferOwnership(address newOwner) public override(IMemeCoin, Ownable) onlyOwner {
        super.transferOwnership(newOwner);
    }
}