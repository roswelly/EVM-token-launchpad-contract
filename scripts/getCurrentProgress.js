// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers, upgrades } = require("hardhat");

async function main() {
//first, using token addr get bondingCurce addr in MemeCoinFactoryV7
  FactoryAddr = "0x044Af13817CdE80627Eb9bF1DEea2a3b402cD6CA";
  tokenAddr = "0x8bD3972c1Da8173E52815EAFBBF7E4F9f615C9a6";
  MemeCoinFactory = await ethers.getContractAt('MemeCoinFactoryV7', FactoryAddr);
  getTokenInfo = await MemeCoinFactory.getTokenInfo("0x8bD3972c1Da8173E52815EAFBBF7E4F9f615C9a6");
  console.log('getTokenInfo', getTokenInfo);
  bondingCureAddr = getTokenInfo[5];

  //second, get migrate progress in BondingCurve
  bondingCurve = await ethers.getContractAt('BondingCurveV7', bondingCureAddr);
  progress = await bondingCurve.getCurveProgress();
  console.log(parseFloat(String(progress))/100 + "%");
  


}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
