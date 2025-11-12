require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');
// require('hardhat-test-utils');
require('dotenv').config();
// require("@nomicfoundation/hardhat-verify");

// require("hardhat-generate-function-selectors");
// require('@nomicfoundation/hardhat-network-helpers');
// require('@openzeppelin/hardhat-upgrades');
// require("@nomiclabs/hardhat-solhint");
// require('@openzeppelin/hardhat-upgrades');
// require("@nomicfoundation/hardhat-chai-matchers")
// npm warn deprecated @nomiclabs/hardhat-etherscan@3.1.8: 
// The @nomiclabs/hardhat-etherscan package is deprecated, please use @nomicfoundation/hardhat-verify instead

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    networks: {
      hardhat: {
        // forking: {
        //   url: `${process.env.XLAYER_NETWORK}`,
        //   blockNumber:
        //     31792431,
        //   timeout: 6000000000
        // }
        forking: {
          url: `${process.env.SEPOLIA_NETWORK}`,
          blockNumber:
            9131177,
          timeout: 6000000000
        }
      },
      goerli: {
        url: `${process.env.GOERLI_NETWORK}`,
        chainId: 5,
        gasPrice: 'auto',
        accounts: [`${process.env.PRIVATEKEY}`],
      },
      xtest: {
        url: `${process.env.XLAYER_TEST_NETWORK}`,
        chainId: 195,
        gasPrice: 'auto',
        accounts: [`${process.env.XLAYER_PRIVATEKEY}`],
      },
      xlayer: {
        url: `${process.env.XLAYER_NETWORK}`,
        chainId: 196,
        gasPrice: 'auto',
        accounts: [`${process.env.OWNER_PRIVATE}`],
      },
      zircuit: {
        url: `${process.env.ZIRCUIT_NETWORK}`,
        chainId: 48899,
        gasPrice: 'auto',
        accounts: [`${process.env.SEPOLIA_PRIVATEKEY}`],
      },
      sepolia: {
        url: `${process.env.SEPOLIA_NETWORK}`,
        chainId: 11155111,
        gasPrice: 'auto',
        timeout: 400000,
        accounts: [`${process.env.SEPOLIA_PRIVATEKEY}`],
      },
      base: {
        url: "https://base-mainnet.g.alchemy.com/v2/oKM2aK-v5Qi70m11KPoDaWaGhKtpO2Iz",
        accounts: [`${process.env.BASE_PRIVATEKEY}`],
        gas: 10000000
      },
      arb: {
        url: `${process.env.Arb_Mainnet}`,
        chainId: 42161,
        gasPrice: 150959546,
        accounts: [`${process.env.ArbMainnet_PRIVATEKEY}`],
      },
    },
  solidity: {
    compilers: [
      {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 20,
            details: {
              yul: true,
              yulDetails: {
                stackAllocation: true,
                optimizerSteps: "dhfoDgvulfnTUtnIf"
              }
            }
          }
        }
      },
      {
        version: "0.8.9",
        settings: {
          optimizer: {
            enabled: true,
            runs: 20,
            details: {
              yul: true,
              yulDetails: {
                stackAllocation: true,
                optimizerSteps: "dhfoDgvulfnTUtnIf"
              }
            }
          }
        }
      },
      {
        version: "0.8.22",
        settings: {
          optimizer: {
            enabled: true,
            runs: 20,
            details: {
              yul: true,
              yulDetails: {
                stackAllocation: true,
                optimizerSteps: "dhfoDgvulfnTUtnIf"
              }
            }
          }
        },
        allowUnlimitedContractSize: true,
      },
      {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 20,
            details: {
              yul: true,
              yulDetails: {
                stackAllocation: true,
                optimizerSteps: "dhfoDgvulfnTUtnIf"
              }
            }
          }
        },
        allowUnlimitedContractSize: true,
      },
      {
        version: "0.8.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 20,
            details: {
              yul: true,
              yulDetails: {
                stackAllocation: true,
                optimizerSteps: "dhfoDgvulfnTUtnIf"
              }
            }
          }
        }
      },
      {
        version: "0.7.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 20,
            details: {
              yul: true,
              yulDetails: {
                stackAllocation: true,
                optimizerSteps: "dhfoDgvulfnTUtnIf"
              }
            }
          }
        }
      },
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 20,
            details: {
              yul: true,
              yulDetails: {
                stackAllocation: true,
                optimizerSteps: "dhfoDgvulfnTUtnIf"
              }
            }
          }
        }
      },
      {
        version: "0.5.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 20,
            details: {
              yul: true,
              yulDetails: {
                stackAllocation: true,
                optimizerSteps: "dhfoDgvulfnTUtnIf"
              }
            }
          }
        }
      },
      {
        version: "0.4.22",
        settings: {
          optimizer: {
            enabled: true,
            runs: 20,
            details: {
              yul: true,
              yulDetails: {
                stackAllocation: true,
                optimizerSteps: "dhfoDgvulfnTUtnIf"
              }
            }
          }
        }
      },
      {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 20,
            details: {
              yul: true,
              yulDetails: {
                stackAllocation: true,
                optimizerSteps: "dhfoDgvulfnTUtnIf"
              }
            }
          }
        }
      },
    ],

  }
  ,
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000000000
  },
  functionSelectors: {
    separateContractSelectors: true, //separate by contract
    orderedByValue: true, //order function selectors by hex value, least to greatest
  },
  etherscan: {
    apiKey: {
      base: "65HX6UXNT99BNIXCWAHES2ABZKJPU65Z5U",
      goerli: "A48XAKRNP77QC8P4HUUICBEA5BRRSQ1M9V",
      sepolia: "A48XAKRNP77QC8P4HUUICBEA5BRRSQ1M9V",
      arbitrumOne: "MKCWEHQ5HAHHZDHP71GQJ3QBZWGIRVE6KN"
    },
    customChains: [
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org"
        }
      }
    ]
  },
  sourcify: {
  enabled: true
},
  gasReporter: {
    enabled: false,
    currency: 'USD',
    coinmarketcap: `${process.env.Coinmarketcap}`,
    // gasPriceApi: `${process.env.BASE_GASPRICE}`
  }
};
