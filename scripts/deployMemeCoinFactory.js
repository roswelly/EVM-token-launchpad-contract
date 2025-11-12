// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const {ethers, upgrades} = require("hardhat");

async function main() {
    MemeCoinFactory = await ethers.getContractFactory('MemeCoinFactoryV7');
    MemeCoinFactory = await MemeCoinFactory.deploy();
    console.log('MemeCoinFactory:', await MemeCoinFactory.getAddress());
    // MemeCoinFactory: 0x55F6F8Feb82538B38CE523Dfef96Cbf550B918F9
    //0xb174C721828296cfc13Bf43564e6793A9516c695 0x55F6F8Feb82538B38CE523Dfef96Cbf550B918F9
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
