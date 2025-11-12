// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.9;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "./MemeCoin.sol";
import "./BondingCurveV7.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract MemeCoinFactoryV7 is Ownable {
    uint256 public constant CREATION_FEE = 0.02 ether;
    uint256 private constant INITIAL_SUPPLY = 1_000_000_000 * 1e18;
    uint256 public TARGET_OKB_BALANCE;

    struct TokenInfo {
        string name;
        string symbol;
        address tokenAddress;
        address creator;
        uint256 totalSupply;
        // bool isListed;
        // uint256 tradingVolume;
        address payable bondingCurve;
    }
    mapping(address => TokenInfo) public tokens;
    mapping(bytes32 => bool) private usedSalts;
    mapping(string => bool) public usedSymbols;
    uint256 public accumulatedFees;

    event TokenCreated(
        address indexed tokenAddress,
        string name,
        string symbol,
        address indexed creator
    );
    event FeeCollected(uint256 amount, address indexed collector);
    event Buy(
        address indexed buyer,
        address indexed tokenAddress,
        uint256 tokenAmount,
        uint256 ethAmount,
        uint256 tokenPrice
    );
    event Sell(
        address indexed seller,
        address indexed tokenAddress,
        uint256 tokenAmount,
        uint256 ethAmount,
        uint256 tokenPrice
    );

    constructor() Ownable(msg.sender) {}

    function createToken(
        string memory name,
        string memory symbol
    ) external payable {
        require(msg.value >= CREATION_FEE, "Insufficient creation fee");
        require(bytes(name).length <= 32, "Name too long");
        require(bytes(symbol).length <= 10, "Symbol too long");
        bytes32 salt = keccak256(abi.encodePacked(symbol, msg.sender));
        require(!usedSalts[salt], "Salt already used");
        usedSalts[salt] = true;
        MemeCoin newToken = new MemeCoin{salt: salt}(
            name,
            symbol,
            address(this)
        );
        address tokenAddress = address(newToken);
        require(tokenAddress != address(0), "Token deployment failed");

        BondingCurveV7 bondingCurve = new BondingCurveV7(
            address(this),
            msg.sender
        );
        address bondingCurveAddress = address(bondingCurve);
        require(
            bondingCurveAddress != address(0),
            "Bonding curve deployment failed"
        );
        bool transferSuccess = newToken.transfer(
            bondingCurveAddress,
            INITIAL_SUPPLY
        );
        require(transferSuccess, "Initial supply transfer failed");
        bondingCurve.initialize(tokenAddress);

        tokens[address(newToken)] = TokenInfo({
            name: name,
            symbol: symbol,
            tokenAddress: address(newToken),
            creator: msg.sender,
            totalSupply: INITIAL_SUPPLY,
            bondingCurve: payable(address(bondingCurve))
        });

        usedSymbols[symbol] = true;
        accumulatedFees += CREATION_FEE;
        if (msg.value > CREATION_FEE) {
            payable(msg.sender).transfer(msg.value - CREATION_FEE);
        }

        payable(owner()).transfer(CREATION_FEE);
        emit TokenCreated(address(newToken), name, symbol, msg.sender);
    }

    function buyToken(
        address tokenAddress,
        uint256 minTokensExpected
    ) external payable {
        require(msg.value > 0, "Zero ETH");
        TokenInfo memory tokenInfo = tokens[tokenAddress];
        require(tokenInfo.tokenAddress != address(0), "Token not found");

        BondingCurveV7 bondingCurve = BondingCurveV7(tokenInfo.bondingCurve);
        uint256 tokensReceived = bondingCurve.executeBuy{value: msg.value}(
            msg.sender,
            msg.value
        );
        require(
            tokensReceived >= minTokensExpected,
            "Insufficient tokens received"
        );

        uint256 tokenPrice = bondingCurve.getCurrentPriceInUsd();
        emit Buy(
            msg.sender,
            tokenAddress,
            tokensReceived,
            msg.value,
            tokenPrice
        );
    }

    function sellToken(
        address tokenAddress,
        uint256 tokenAmount,
        uint256 minETHExpected
    ) external {
        require(tokenAmount > 0, "Zero tokens");
        TokenInfo memory tokenInfo = tokens[tokenAddress];
        require(tokenInfo.tokenAddress != address(0), "Token not found");

        BondingCurveV7 bondingCurve = BondingCurveV7(tokenInfo.bondingCurve);
        uint256 ethReceived = bondingCurve.executeSell(msg.sender, tokenAmount);
        require(ethReceived >= minETHExpected, "Insufficient ETH received");

        uint256 tokenPrice = bondingCurve.getCurrentPriceInUsd();

        emit Sell(
            msg.sender,
            tokenAddress,
            tokenAmount,
            ethReceived,
            tokenPrice
        );
    }

    function configBondingCurve(
        address bondingCurve,
        uint256 tradeFee
    ) external onlyOwner {
        IBondingCurve(bondingCurve).config(tradeFee);
    }

    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
        emit FeeCollected(address(this).balance, owner());
    }

    function getTokenInfo(
        address token
    ) external view returns (TokenInfo memory) {
        return tokens[token];
    }

    function isSymbolTaken(string memory symbol) public view returns (bool) {
        return usedSymbols[symbol];
    }

    function computeAddress(
        bytes32 salt,
        bytes32 bytecodeHash
    ) public view returns (address) {
        return
            address(
                uint160(
                    uint256(
                        keccak256(
                            abi.encodePacked(
                                bytes1(0xff),
                                address(this),
                                salt,
                                bytecodeHash
                            )
                        )
                    )
                )
            );
    }

    function predictTokenAddress(
        string calldata name,
        string calldata symbol,
        address creator
    ) public view returns (address) {
        bytes32 salt = keccak256(abi.encodePacked(symbol, creator));
        bytes memory bytecode = abi.encodePacked(
            type(MemeCoin).creationCode,
            abi.encode(name, symbol, address(this))
        );
        return computeAddress(salt, keccak256(bytecode));
    }

    receive() external payable {}
}
