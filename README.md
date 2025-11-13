# EVM Token Launchpad Contract

A EVM token launchpad that uses bonding curve mechanics for price discovery and automatically lists tokens on DEX when they reach a target market cap.

## Overview

This project implements a factory-based token launchpad where users can create new tokens with a bonding curve pricing mechanism. Tokens automatically graduate to a DEX (DODO) when they reach a target market capitalization of $70,000 USD.

## Features

- **Easy Token Creation**: Create new tokens with just a name, symbol, and 0.02 ETH fee
- **Bonding Curve Pricing**: Automated market maker (AMM) style pricing using constant product formula
- **Automatic DEX Listing**: Tokens automatically list on DODO DEX when reaching $70k USD market cap
- **Dynamic Price Discovery**: Real-time price updates based on Chainlink ETH/USD oracle
- **Security First**: Built with OpenZeppelin contracts, reentrancy guards, and access controls
- **Multi-Chain Support**: Configured for multiple EVM networks

## Architecture

### Core Contracts

#### `MemeCoinFactoryV7.sol`
The main factory contract that:
- Creates new token instances
- Manages token registry
- Handles buy/sell operations through bonding curves
- Collects creation fees

#### `BondingCurveV7.sol`
Implements the bonding curve mechanism:
- Constant product formula: `x * y = k`
- Initial virtual reserves: 1 ETH and 1,073,741,824 tokens
- Target market cap: $70,000 USD
- Automatic DEX listing when target is reached
- Trading fee: 1% (configurable)

#### `MemeCoin.sol`
Standard ERC20 token contract:
- Fixed initial supply: 1 billion tokens
- Mint and burn functionality
- Owned by factory contract

## Bonding Curve Mechanics

The bonding curve uses a constant product formula where:

```
Virtual ETH = INITIAL_VIRTUAL_ETH + totalEthIn
Virtual Token = K / Virtual ETH
Price = Virtual ETH / Virtual Token
```

### Buy Calculation
When buying tokens with ETH:
1. Calculate new virtual ETH after adding ETH amount
2. Calculate new virtual token amount
3. Tokens received = current virtual tokens - new virtual tokens

### Sell Calculation
When selling tokens for ETH:
1. Calculate new virtual token amount after adding tokens
2. Calculate new virtual ETH amount
3. ETH received = current virtual ETH - new virtual ETH

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Hardhat

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd EVM-token-launchpad-contract
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory:
```env
PRIVATEKEY=your_private_key
SEPOLIA_NETWORK=https://sepolia.infura.io/v3/your_key
SEPOLIA_PRIVATEKEY=your_private_key
GOERLI_NETWORK=https://goerli.infura.io/v3/your_key
XLAYER_NETWORK=https://xlayer-rpc.okx.com
XLAYER_PRIVATEKEY=your_private_key
XLAYER_TEST_NETWORK=https://x1testrpc.okx.com
OWNER_PRIVATE=your_private_key
ZIRCUIT_NETWORK=https://zircuit1.p2pify.com
BASE_PRIVATEKEY=your_private_key
Arb_Mainnet=https://arb1.arbitrum.io/rpc
ArbMainnet_PRIVATEKEY=your_private_key
Coinmarketcap=your_coinmarketcap_api_key
```

## Usage

### Compile Contracts

```bash
npx hardhat compile
```

### Run Tests

```bash
npx hardhat test
```

### Deploy Factory Contract

```bash
npx hardhat run scripts/deployMemeCoinFactory.js --network <network-name>
```

### Create a Token

```bash
npx hardhat run scripts/createToken.js --network <network-name>
```

### Buy Tokens

```bash
npx hardhat run scripts/buyToken.js --network <network-name>
```

### Sell Tokens

```bash
npx hardhat run scripts/sellToken.js --network <network-name>
```

### Check Progress

```bash
npx hardhat run scripts/getCurrentProgress.js --network <network-name>
```

## Network Configuration

The project is configured to support the following networks:

- **Sepolia** (Testnet) - Chain ID: 11155111
- **Goerli** (Testnet) - Chain ID: 5
- **Base** (Mainnet) - Chain ID: 8453
- **Arbitrum** (Mainnet) - Chain ID: 42161
- **XLayer** (Mainnet) - Chain ID: 196
- **XLayer Testnet** - Chain ID: 195
- **Zircuit** - Chain ID: 48899


## Contract Details

### Token Creation

- **Creation Fee**: 0.02 ETH
- **Initial Supply**: 1,000,000,000 tokens (1 billion)
- **Name Length Limit**: 32 characters
- **Symbol Length Limit**: 10 characters
- **Symbol Uniqueness**: Enforced per creator

### Bonding Curve Parameters

- **Initial Virtual ETH**: 1 ETH
- **Initial Virtual Token**: 1,073,741,824 tokens
- **Constant K**: 1,073,741,824 (INITIAL_VIRTUAL_ETH × INITIAL_VIRTUAL_TOKEN)
- **Target Market Cap**: $70,000 USD
- **Trading Fee**: 1% (100 basis points, configurable)
- **Price Update Interval**: 5 minutes

### Automatic DEX Listing

When a token reaches the target market cap:
1. Trading on bonding curve is disabled
2. Excess ETH is sent to factory owner
3. Remaining ETH is converted to WETH
4. DODO Vending Machine pool is created
5. Token becomes tradeable on DEX

## Security Considerations

- Reentrancy protection using `ReentrancyGuard`
- Access control with OpenZeppelin `Ownable`
- Safe token transfers with `SafeERC20`
- Factory-only execution modifiers
- Input validation on all public functions
- Overflow protection (Solidity 0.8.x)

## Development

### Project Structure

```
.
├── contracts/
│   ├── BondingCurveV7.sol      # Bonding curve implementation
│   ├── MemeCoin.sol            # ERC20 token contract
│   ├── MemeCoinFactoryV7.sol   # Factory contract
│   ├── interface/              # Contract interfaces
│   └── lib/                    # Math library
├── scripts/                    # Deployment and interaction scripts
├── test/                       # Test files
├── hardhat.config.js          # Hardhat configuration
└── package.json               # Dependencies
```

### Testing

Run the test suite:
```bash
npx hardhat test
```

Run tests with gas reporting:
```bash
GAS_REPORT=true npx hardhat test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

See LICENSE file for details.

## Disclaimer

This software is provided "as is" without warranty of any kind. Use at your own risk. Always conduct thorough security audits before deploying to mainnet.

## Support

For issues and questions, please open an issue on the repository.

---

**Note**: This project is in active development. Always test thoroughly on testnets before deploying to mainnet.
