import hre from "hardhat";
import { expect } from "chai";
import { MyToken, TinyBank } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { parseUnits } from "ethers";
import { DECIMALS, MINTING_AMOUNT } from "./constant";
import { sign } from "node:crypto";

describe("TinyBank", () => {
  let signers: HardhatEthersSigner[];
  let myTokenC: MyToken;
  let tinyBankC: TinyBank;
  beforeEach(async () => {
    signers = await hre.ethers.getSigners();
    const managers = [
      signers[0].address,
      signers[1].address,
      signers[2].address,
      signers[3].address,
      signers[4].address,
    ];
    myTokenC = await hre.ethers.deployContract("MyToken", [
      managers,
      5,
      "MyToken",
      "MT",
      DECIMALS,
      MINTING_AMOUNT,
    ]);
    tinyBankC = await hre.ethers.deployContract("TinyBank", [
      await myTokenC.getAddress(),
      managers,
      5,
    ]);
  });

  describe("Initialized state check", () => {
    it("should return totalStaked 0", async () => {
      expect(await tinyBankC.totalStaked()).equal(0);
    });
    it("should return staked 0 amount of signer0", async () => {
      const signer0 = signers[0];
      expect(await tinyBankC.staked(signer0.address)).equal(0);
    });
  });

  describe("Staking", async () => {
    it("should return staked amount", async () => {
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);
      expect(await tinyBankC.staked(signer0.address)).equal(stakingAmount);
      expect(await tinyBankC.totalStaked()).equal(await stakingAmount);
      expect(await myTokenC.balanceOf(tinyBankC)).equal(
        await tinyBankC.totalStaked(),
      );
    });
  });

  describe("Wtihdraw", async () => {
    it("should return 0 staked after withdrawing total token", async () => {
      for (const signer of signers.slice(0, 5)) {
        await myTokenC.connect(signer).confirm();
      }
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);
      await tinyBankC.withdraw(stakingAmount);
      expect(await tinyBankC.staked(signer0.address)).equal(0);
    });
  });

  describe("Reward", () => {
    it("should reward 1MT every blocks", async () => {
      for (const signer of signers.slice(0, 5)) {
        await myTokenC.connect(signer).confirm();
      }
      const signer0 = signers[0];
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
      await myTokenC.approve(tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);

      const BLOCKS = 5n;
      const transferAmount = hre.ethers.parseUnits("1", DECIMALS);
      for (var i = 0; i < BLOCKS; i++) {
        await myTokenC.transfer(transferAmount, signer0.address);
      }

      await tinyBankC.withdraw(stakingAmount);
      expect(await myTokenC.balanceOf(signer0.address)).equal(
        hre.ethers.parseUnits((BLOCKS + MINTING_AMOUNT + 1n).toString()),
      );
    });

    it("should revert when changing rewardPerBlock by hacker", async () => {
      const hacker = signers[5];
      const rewardToChange = hre.ethers.parseUnits("10000", DECIMALS);
      await expect(
        tinyBankC.connect(hacker).setRewardPerBlock(rewardToChange),
      ).to.be.revertedWith("Not all managers confirmed yet");
    });
  });

  // Week 9 Assignmetment
  describe("All confirmed check", () => {
    it("should sent TX by manager", async () => {
      const stranger = signers[5];
      await expect(tinyBankC.connect(stranger).confirm()).to.be.revertedWith(
        "You are not one of managers",
      );
    });

    it("should assigned by all managers", async () => {
      for (const signer of signers.slice(0, 5)) {
        await tinyBankC.connect(signer).confirm();
      }
      const amount = 100n;

      await expect(tinyBankC.setRewardPerBlock(amount)).not.to.be.revertedWith(
        "Not all managers confirmed yet",
      );
    });
  });
});
