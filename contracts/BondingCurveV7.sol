// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.9;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interface/IWETH.sol";
import "./interface/IDODOV2Proxy01.sol";
import "./lib/Math.sol";
import "hardhat/console.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IBondingCurve {
    function config(uint256 tradeFee) external;
}

contract BondingCurveV7 is Ownable, ReentrancyGuard, IBondingCurve {
    using Math for uint256;
    using SafeERC20 for IERC20;

    uint256 private constant FEE_DENOMINATOR = 10000;
    uint256 public constant INITIAL_TOKEN_SUPPLY = 1_000_000_000 * 1e18;
    uint256 public constant INITIAL_VIRTUAL_ETH = 1 * 1e18;
    uint256 public constant INITIAL_VIRTUAL_TOKEN = 1_073_741_824 * 1e18;
    uint256 public constant K = INITIAL_VIRTUAL_ETH * INITIAL_VIRTUAL_TOKEN;
    uint256 public constant TARGET_USD_VALUE = 70_000 * 1e8;
    uint256 public constant UPDATE_INTERVAL = 300 seconds;

    address constant dodoV2Proxy = 0x6292e8f7647b3b9dDf5795b1Fb77D0187e30E0F9;
    address constant dodoAppove = 0x66c45FF040e86DC613F239123A5E21FFdC3A3fEC;
    address constant wethAddress = 0x7B07164ecFaF0F0D85DFC062Bc205a4674c75Aa0;

    IERC20 public token;
    address public MainOwner;
    address public Creator;
    bool public tradeDisabled;
    bool public isDex;
    uint256 public TARGET_ETH_BALANCE;
    uint256 public TRADING_FEE = 100;
    AggregatorV3Interface public priceFeed;
    uint256 public lastUpdate;
    uint256 public totalEthIn;
    uint256 public ethPrice;

    event Dex(address newVendingMachine, uint256 shares);

    constructor(address _owner, address _creator) Ownable(msg.sender) {
        MainOwner = _owner;
        Creator = _creator;
        priceFeed = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
        updateParameters();
    }

    function config(uint256 tradeFee) external onlyOwner {
        TRADING_FEE = tradeFee;
    }

    function initialize(address _token) external onlyOwner {
        require(address(token) == address(0), "Already initialized");
        token = IERC20(_token);
    }

    function updateParameters() public {
        (
            uint80 roundId,
            int256 price,
            ,
            ,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        require(price > 0, "bad price");
        require(answeredInRound >= roundId, "stale round");
        console.log("price", uint256(price));

        uint8 d = priceFeed.decimals();
        uint256 ethPrice1e18 = uint256(price) * (10 ** (18 - d));
        ethPrice = ethPrice1e18;
        console.log("ethPrice", ethPrice);

        uint256 targetUsd1e18 = TARGET_USD_VALUE * 1e10;
        uint256 targetMcEth = (targetUsd1e18 * 1e18) / ethPrice1e18;
        uint256 PRECISION = 1e36;
        uint256 scaledNumerator = K * targetMcEth;

        if (scaledNumerator > type(uint256).max / PRECISION) {
            scaledNumerator = scaledNumerator / 1e18;
            PRECISION = PRECISION / 1e18;
        }

        scaledNumerator = scaledNumerator * PRECISION;
        uint256 scaledValue = scaledNumerator / INITIAL_TOKEN_SUPPLY;
        uint256 scaledSqrt = Math.sqrt(scaledValue);

        uint256 finalVirtualEth = PRECISION == 1e36
            ? scaledSqrt / 1e18
            : scaledSqrt;

        if (finalVirtualEth <= INITIAL_VIRTUAL_ETH) {
            TARGET_ETH_BALANCE = 1 * 1e18;
        } else {
            TARGET_ETH_BALANCE = finalVirtualEth - INITIAL_VIRTUAL_ETH;
        }

        console.log("TARGET_ETH_BALANCE", TARGET_ETH_BALANCE);
        lastUpdate = block.timestamp;
    }

    function executeBuy(address buyer, uint256 ethAmount) external  payable onlyFactory nonReentrant returns (uint256) {
        require(!tradeDisabled, "Trade is disabled");
        require(ethAmount > 0, "Zero ETH");
        if (block.timestamp - lastUpdate > UPDATE_INTERVAL) {
            updateParameters();
        }
        uint256 currentBalance = totalEthIn;
        uint256 maxNetToAccept = TARGET_ETH_BALANCE - currentBalance;
        uint256 denominator = FEE_DENOMINATOR - TRADING_FEE;
        uint256 maxEthToAccept = maxNetToAccept == 0
            ? 0
            : (maxNetToAccept * FEE_DENOMINATOR) / denominator;
        uint256 ethToUse = ethAmount;
        uint256 ethToRefund = 0;

        if (currentBalance < TARGET_ETH_BALANCE && ethToUse > maxEthToAccept) {
            ethToUse = maxEthToAccept;
            ethToRefund = ethAmount - maxEthToAccept;
        }

        if (ethToRefund > 0) {
            (bool refundSuccess, ) = payable(buyer).call{value: ethToRefund}("");
            require(refundSuccess, "Refund failed");
        }

        uint256 fee = (ethToUse * TRADING_FEE) / FEE_DENOMINATOR;
        uint256 newValue = ethToUse - fee;
        uint256 tokensToReceive = calculateBuyAmount(newValue);

        require(tokensToReceive > 0, "Zero tokens");
        require(
            token.balanceOf(address(this)) >= tokensToReceive,
            "Insufficient token balance"
        );
        (bool success, ) = payable(MainOwner).call{value: fee}("");
        require(success, "Fee transfer failed");

        token.safeTransfer(buyer, tokensToReceive);
        totalEthIn += newValue;

        console.log('tokensToReceive', tokensToReceive);
        uint tokenPrice = getCurrentPriceInUsd();
        console.log("tokenPrice====", tokenPrice);
                if (totalEthIn >= TARGET_ETH_BALANCE) {
            tradeDisabled = true;
            triggerDEXListing();
        }

        return tokensToReceive;
    }

    function executeSell(address seller, uint256 tokenAmount) external onlyFactory nonReentrant returns (uint256) {
        require(!tradeDisabled, "Trade is disabled");
        require(tokenAmount > 0, "Zero tokens");
        require(tokenAmount >= 1e18, "Amount too small to sell");

        if (block.timestamp - lastUpdate > UPDATE_INTERVAL) {
            updateParameters();
        }

        uint256 ethToReceive = calculateSellAmount(tokenAmount);
        require(ethToReceive > 0, "Zero ETH");

        uint256 available = address(this).balance;
        ethToReceive = ethToReceive < totalEthIn ? ethToReceive : totalEthIn;
        ethToReceive = ethToReceive < available ? ethToReceive : available;

        uint256 fee = (ethToReceive * TRADING_FEE) / FEE_DENOMINATOR;
        uint256 netETH = ethToReceive - fee;
        token.safeTransferFrom(seller, address(this), tokenAmount);
        require(
            address(this).balance >= fee + netETH,
            "Insufficient ETH reserves"
        );
        (bool success, ) = payable(MainOwner).call{value: fee}("");
        require(success, "Fee transfer failed");
        (bool netETHSuccess, ) = payable(seller).call{value: netETH}("");
        require(netETHSuccess, "Payout failed");
        totalEthIn -= ethToReceive;

        console.log('tokensToReceive', ethToReceive);
        uint tokenPrice = getCurrentPriceInUsd();
        console.log("tokenPrice====", tokenPrice);
        return netETH;
    }

    function triggerDEXListing() private {
        IWETH weth = IWETH(wethAddress);
        uint256 quoteBal = address(this).balance > TARGET_ETH_BALANCE
            ? TARGET_ETH_BALANCE
            : address(this).balance;
        if (address(this).balance > TARGET_ETH_BALANCE) {
            (bool success, ) = payable(MainOwner).call{
                value: address(this).balance - TARGET_ETH_BALANCE
            }("");
            require(success, "get plus eth failed");
        }
        weth.deposit{value: quoteBal}();
        weth.approve(dodoAppove, type(uint256).max);
        IERC20(address(token)).approve(dodoAppove, type(uint256).max);

        try
            IDODOV2Proxy01(dodoV2Proxy).createDODOVendingMachine(
                address(token),
                wethAddress,
                token.balanceOf(address(this)),
                quoteBal,
                3 * 1e16,
                (quoteBal * 1e18) / token.balanceOf(address(this)),
                1 * 1e18,
                false,
                block.timestamp + 60 * 10
            )
        returns (address newVendingMachine, uint256 shares) {
            isDex = true;
            console.log('newVendingMachine', newVendingMachine);
            emit Dex(newVendingMachine, shares);
        } catch {
            IERC20(address(token)).approve(dodoAppove, 0);
            weth.approve(dodoAppove, 0);
            weth.withdraw(quoteBal);
            tradeDisabled = false;
        }
    }

    function calculateBuyAmount(uint256 ethAmount) public view returns (uint256) {
        uint256 currentVirtualEth = INITIAL_VIRTUAL_ETH + totalEthIn;
        uint256 newVirtualEth = currentVirtualEth + ethAmount;
        require(newVirtualEth > currentVirtualEth, "No change");
        uint256 currentVirtualToken = K / currentVirtualEth;
        uint256 newVirtualToken = K / newVirtualEth;
        require(currentVirtualToken > newVirtualToken, "No tokens to buy");
        return currentVirtualToken - newVirtualToken;
    }

    function calculateSellAmount(uint256 tokenAmount) public view returns (uint256) {
        uint256 currentVirtualEth = INITIAL_VIRTUAL_ETH + totalEthIn;
        uint256 currentVirtualToken = K / currentVirtualEth;
        uint256 newVirtualToken = currentVirtualToken + tokenAmount;
        require(newVirtualToken > currentVirtualToken, "No change");
        uint256 newVirtualEth = K / newVirtualToken;
        require(currentVirtualEth > newVirtualEth, "No ETH to sell");
        return currentVirtualEth - newVirtualEth;
    }

    function getCurrentPriceInEth() public view returns (uint256) {
        uint256 currentVirtualEth = INITIAL_VIRTUAL_ETH + totalEthIn;
        uint256 currentVirtualToken = K / currentVirtualEth;
        uint256 price = (currentVirtualEth * 1e18) / currentVirtualToken;
        return price;
    }

    function getCurrentPriceInUsd() public view returns (uint256) {
        uint256 priceInEth = getCurrentPriceInEth();
        return (priceInEth * ethPrice) / 1e18;
    }

    function getCurrentMarketCapInUsd() public view returns (uint256) {
        uint256 priceInUsd = getCurrentPriceInUsd();
        return priceInUsd * (INITIAL_TOKEN_SUPPLY / 1e18);
    }

    function getCurveProgress() public view returns (uint256) {
        if (TARGET_ETH_BALANCE == 0) return 0;
        return (totalEthIn * 10000) / TARGET_ETH_BALANCE;
    }

    modifier onlyFactory() {
        require(msg.sender == MainOwner, "Only factory can call this function");
        _;
    }

    receive() external payable {}
}