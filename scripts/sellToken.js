// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers, upgrades } = require("hardhat");

async function main() {
  //MemeCoinFactory: 0x0Eb991Ab784f6d39e5D02Dd82754252cA3e58305
  creator = "0xd7DE703e157014D48dcf7Caf0B165C1bE4d827B9";
  FactoryAddr = "0x044Af13817CdE80627Eb9bF1DEea2a3b402cD6CA";
  tokenAddr = "0x9c119c0008eC26688894BC2e08F246Ea86c8b55F";
  sellAmount = ethers.parseEther('1');
  MemeCoinFactory = await ethers.getContractAt('MemeCoinFactoryV7', FactoryAddr);
  token = await ethers.getContractAt('MemeCoin', tokenAddr);

  // await MemeCoinFactory.createToken('zsc', 'z',{value: ethers.parseUnits("0.02",18)});
  const nonce = await ethers.provider.getTransactionCount(creator, 'latest');
  console.log('Current Nonce:', nonce);

  getTokenInfo = await MemeCoinFactory.getTokenInfo("0x9c119c0008eC26688894BC2e08F246Ea86c8b55F");
  console.log('getTokenInfo', getTokenInfo);

  bondingCureAddr = getTokenInfo[5];

  let ap = await token.approve(bondingCureAddr, sellAmount);
  await ap.wait();
  // 发送带明确 nonce 的交易
  const tx = await MemeCoinFactory.sellToken(tokenAddr, sellAmount, 0
  );
  console.log('tx', tx.hash);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
