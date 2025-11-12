const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("MemeCoinFactoryV5 and BondingCurveV5 Integration", function () {
  let MemeCoinFactory;
  let factory;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // 部署 MemeCoinFactoryV5 合约
    const MemeCoinFactoryFactory = await ethers.getContractFactory("MemeCoinFactoryV7");
    factory = await MemeCoinFactoryFactory.deploy();
    await factory.waitForDeployment();
  });

  describe("代币创建流程", function () {
    it("应该能够创建新的代币和绑定曲线", async function () {
      const creationFee = await factory.CREATION_FEE();

      // 使用用户1创建代币
      const tx = await factory.connect(user1).createToken("New Token", "NEW", {
        value: creationFee
      });

      // 等待交易确认
      const receipt = await tx.wait();

      // 检查事件是否发出
      await expect(tx)
        .to.emit(factory, "TokenCreated")
        .withArgs(anyValue, "New Token", "NEW", user1.address);

      // 获取创建的代币地址
      const tokenAddress = await factory.predictTokenAddress("New Token", "NEW", user1.address);

      // 获取代币信息
      const tokenInfo = await factory.getTokenInfo(tokenAddress);

      // 验证代币信息
      expect(tokenInfo.name).to.equal("New Token");
      expect(tokenInfo.symbol).to.equal("NEW");
      expect(tokenInfo.creator).to.equal(user1.address);
      expect(tokenInfo.bondingCurve).to.be.properAddress;

      // 验证代币合约
      const MemeCoin = await ethers.getContractFactory("MemeCoin");
      const token = MemeCoin.attach(tokenAddress);

      expect(await token.name()).to.equal("New Token");
      expect(await token.symbol()).to.equal("NEW");

      // 验证绑定曲线合约
      const BondingCurve = await ethers.getContractFactory("BondingCurveV5");
      const bondingCurve = BondingCurve.attach(tokenInfo.bondingCurve);

      expect(await bondingCurve.MainOwner()).to.equal(await factory.getAddress());
      expect(await bondingCurve.Creator()).to.equal(user1.address);

      // 验证代币已转移到绑定曲线
      const initialSupply = ethers.parseEther("1000000000"); // 10亿代币
      expect(await token.balanceOf(tokenInfo.bondingCurve)).to.equal(initialSupply);
    });

    it("应该拒绝重复的代币符号", async function () {
      const creationFee = await factory.CREATION_FEE();

      // 第一次创建应该成功
      await factory.connect(user1).createToken("New Token", "NEW", {
        value: creationFee
      });

      // 第二次使用相同符号应该失败
      await expect(factory.connect(user1).createToken("Another Token", "NEW", {
        value: creationFee
      })).to.be.revertedWith("Salt already used");
    });

    it("应该拒绝不足的创建费用", async function () {
      const creationFee = await factory.CREATION_FEE();

      await expect(factory.connect(user1).createToken("New Token", "NEW", {
        value: creationFee - ethers.parseEther("0.001")
      })).to.be.revertedWith("Insufficient creation fee");
    });
  });

  describe("代币买卖流程", function () {
    let tokenAddress;
    let bondingCurveAddress;
    let token;
    let bondingCurve;

    beforeEach(async function () {
      const creationFee = await factory.CREATION_FEE();

      // 创建新代币
      await factory.connect(user1).createToken("Test Token", "TEST", {
        value: creationFee
      });

      // 获取代币地址和信息
      tokenAddress = await factory.predictTokenAddress("Test Token", "TEST", user1.address);
      const tokenInfo = await factory.getTokenInfo(tokenAddress);
      bondingCurveAddress = tokenInfo.bondingCurve;

      // 获取合约实例
      const MemeCoin = await ethers.getContractFactory("MemeCoin");
      const BondingCurve = await ethers.getContractFactory("BondingCurveV5");

      token = MemeCoin.attach(tokenAddress);
      bondingCurve = BondingCurve.attach(bondingCurveAddress);
    });

    it("应该能够通过工厂购买代币", async function () {
      const buyAmount = ethers.parseEther("1.0");

      // 购买代币
      await expect(factory.connect(user2).buyToken(tokenAddress, 0, {
        value: buyAmount
      }))
        .to.emit(factory, "Buy")
        .withArgs(user2.address, tokenAddress, anyValue, buyAmount, anyValue);

      // 检查用户余额
      const userBalance = await token.balanceOf(user2.address);
      expect(userBalance).to.be.gt(0);

      // 检查绑定曲线中的ETH余额
      const bondingCurveBalance = await ethers.provider.getBalance(bondingCurveAddress);
      expect(bondingCurveBalance).to.be.gt(0);
    });

    it("应该能够通过工厂出售代币", async function () {
      const buyAmount = ethers.parseEther("1.0");

      // 先购买代币
      await factory.connect(user2).buyToken(tokenAddress, 0, {
        value: buyAmount
      });

      // 获取代币余额
      const tokenBalance = await token.balanceOf(user2.address);

      // 批准代币转移

      await token.connect(user2).approve(bondingCurveAddress, tokenBalance);
      // 出售代币
      apAmount = await token.allowance(user2.address, bondingCurveAddress);

      await expect(factory.connect(user2).sellToken(tokenAddress, tokenBalance, 0))
        .to.emit(factory, "Sell")
        .withArgs(user2.address, tokenAddress, tokenBalance, anyValue, anyValue);

      // 检查用户代币余额减少
      const finalTokenBalance = await token.balanceOf(user2.address);
      expect(finalTokenBalance).to.equal(0);

      // 检查用户ETH余额增加
      // const userBalanceBefore = await ethers.provider.getBalance(user2.address);
      // const gasCost = receipt.gasUsed * receipt.gasPrice;
      // const userBalanceAfter = await ethers.provider.getBalance(user2.address);

      // // 用户余额应该增加（减去gas费用）
      // expect(userBalanceAfter).to.be.gt(userBalanceBefore - gasCost);
    });

    it("应该拒绝购买零金额", async function () {
      await expect(factory.connect(user2).buyToken(tokenAddress, 0, {
        value: 0
      })).to.be.revertedWith("Zero ETH");
    });

    it("应该拒绝出售零金额", async function () {
      await expect(factory.connect(user2).sellToken(tokenAddress, 0, 0))
        .to.be.revertedWith("Zero tokens");
    });

    it("转dex", async function () {
      allIn = ethers.parseEther("20.0");
      await factory.connect(user2).buyToken(tokenAddress, 0, {
        value: allIn
      });
      mcp = await bondingCurve.getCurrentMarketCapInUsd();
      console.log('mcp===', mcp);
    });

  });

  // describe("价格计算功能", function () {
  //   let tokenAddress;
  //   let bondingCurveAddress;
  //   let bondingCurve;

  //   beforeEach(async function () {
  //     const creationFee = await factory.CREATION_FEE();

  //     // 创建新代币
  //     await factory.connect(user1).createToken("Test Token", "TEST", {
  //       value: creationFee
  //     });

  //     // 获取代币信息
  //     tokenAddress = await factory.predictTokenAddress("Test Token", "TEST", user1.address);
  //     const tokenInfo = await factory.getTokenInfo(tokenAddress);
  //     bondingCurveAddress = tokenInfo.bondingCurve;

  //     // 获取绑定曲线实例
  //     const BondingCurve = await ethers.getContractFactory("BondingCurveV5");
  //     bondingCurve = BondingCurve.attach(bondingCurveAddress);
  //   });

  //   it("应该能够计算购买量", async function () {
  //     const ethAmount = ethers.parseEther("1.0");

  //     const tokensToReceive = await bondingCurve.calculateBuyAmount(ethAmount);
  //     expect(tokensToReceive).to.be.gt(0);
  //   });

  //   it("应该能够计算出售量", async function () {
  //     const tokenAmount = ethers.parseEther("1000.0");

  //     const ethToReceive = await bondingCurve.calculateSellAmount(tokenAmount);
  //     expect(ethToReceive).to.be.gt(0);
  //   });

  //   it("应该能够获取当前价格", async function () {
  //     const priceInEth = await bondingCurve.getCurrentPriceInEth();
  //     expect(priceInEth).to.be.gt(0);

  //     const priceInUsd = await bondingCurve.getCurrentPriceInUsd();
  //     expect(priceInUsd).to.be.gt(0);
  //   });
  // });

  // describe("费用管理", function () {
  //   it("所有者应该能够提取费用", async function () {
  //     const creationFee = await factory.CREATION_FEE();

  //     // 创建代币以积累费用
  //     await factory.connect(user1).createToken("Test Token", "TEST", {
  //       value: creationFee
  //     });

  //     // 检查费用余额
  //     const initialBalance = await ethers.provider.getBalance(await factory.getAddress());
  //     console.log('initialBalance', initialBalance);

  //     // expect(initialBalance).to.be.gt(0);

  //     // 提取费用
  //     await expect(factory.connect(owner).withdrawFees())
  //       .to.emit(factory, "FeeCollected")
  //       .withArgs(initialBalance, owner.address);

  //     // 检查费用是否已提取
  //     const finalBalance = await ethers.provider.getBalance(await factory.getAddress());
  //     expect(finalBalance).to.equal(0);
  //   });

  //   // it("非所有者不应该能够提取费用", async function () {
  //   //   await expect(factory.connect(user1).withdrawFees())
  //   //     .to.be.r;
  //   // });
  // });

  // describe("配置交易费用", function () {
  //   let bondingCurveAddress;

  //   beforeEach(async function () {
  //     const creationFee = await factory.CREATION_FEE();

  //     // 创建新代币
  //     await factory.connect(user1).createToken("Test Token", "TEST", {
  //       value: creationFee
  //     });

  //     // 获取代币信息
  //     const tokenAddress = await factory.predictTokenAddress("Test Token", "TEST", user1.address);
  //     const tokenInfo = await factory.getTokenInfo(tokenAddress);
  //     bondingCurveAddress = tokenInfo.bondingCurve;
  //   });

  //   it("所有者应该能够配置交易费用", async function () {
  //     const BondingCurve = await ethers.getContractFactory("BondingCurveV5");
  //     const bondingCurve = BondingCurve.attach(bondingCurveAddress);

  //     const initialFee = await bondingCurve.TRADING_FEE();
  //     const newFee = 200; // 2%

  //     await factory.connect(owner).configBondingCurve(bondingCurveAddress, newFee);

  //     const currentFee = await bondingCurve.TRADING_FEE();
  //     expect(currentFee).to.equal(newFee);
  //     expect(currentFee).to.not.equal(initialFee);
  //   });

  //   // it("非所有者不应该能够配置交易费用", async function () {
  //   //   await expect(factory.connect(user1).configBondingCurve(bondingCurveAddress, 200))
  //   //     .to.be.revertedWith("Ownable: caller is not the owner");
  //   // });
  // });

  // 辅助函数，用于匹配任何值
  function anyValue() {
    return true;
  }
});