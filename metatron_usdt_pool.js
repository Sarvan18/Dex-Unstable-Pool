const {
  expectEvent, // Assertions for emitted events
  time,
  expectRevert,
} = require("@openzeppelin/test-helpers");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");
var chai = require("chai");
const { artifacts } = require("hardhat");
var expect = chai.expect;
const WMETA_Contract = artifacts.require("WMETA");
const BEP20USDT_Contract = artifacts.require("BEP20USDT");
const metatrondexFactory_Contract = artifacts.require("metatrondexFactory");
const metatrondexRouter_Contract = artifacts.require("metatrondexRouter");
const pairContract = artifacts.require("metatrondexPair");
const intermediate_Contract = artifacts.require("metatronRouter02");

contract(" ", async (accounts) => {
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const owner = accounts[0];
  const daxOwner = accounts[1];
  function testAccount(value) {
    return accounts[value + 1];
  }

  before(async function () {
    WMETA_Instance = await WMETA_Contract.new();
    BEP20USDT_Instance = await BEP20USDT_Contract.new();
    metatrondexFactory_Instance = await metatrondexFactory_Contract.new(
      owner,
      zeroAddress,
      BEP20USDT_Instance.address,
      0
    );

    intermediate_Instance = await intermediate_Contract.new(owner, owner);

    metatrondexRouter_Instance = await metatrondexRouter_Contract.new(
      metatrondexFactory_Instance.address,
      WMETA_Instance.address,
      owner,
      intermediate_Instance.address
    );
  });

  function Num(_num) {
    return Number(_num);
  }

  function Str(_data) {
    return String(_data);
  }

  describe("***************** Metatron USDT Pool Testing *****************", function () {
    const PK =
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    it("", async () => {
      async function approveToken(
        _tokenInstance,
        _spendorAddress,
        _amount,
        _userAddress
      ) {
        await _tokenInstance.approve(_spendorAddress, _amount, {
          from: _userAddress,
        });
      }
      async function ownerTransfer(_tokenInstance, _spendorAddress, _amount) {
        await _tokenInstance.transfer(_spendorAddress, _amount, {
          from: owner,
        });
      }
      async function deadlineTime() {
        return Str(Num(await time.latest()) + Num(time.duration.minutes(10)));
      }

      async function userBalance(_tokenInstance, _userAddress) {
        return Str(await _tokenInstance.balanceOf(_userAddress));
      }
      function ethAmount(amount) {
        return Str(web3.utils.toWei(Str(amount), "ether"));
      }
      describe("[Testcase 1 : check if the smart contract of All has been created as set in the variables]", function () {
        it("Check Liquidity", async () => {
          console.log(
            "HEX : ",
            Str(await metatrondexFactory_Instance.INIT_CODE_PAIR_HASH())
          );
          const user = testAccount(1);
          const amountToken = ethAmount("10");
          const amountEth = ethAmount("0.1");
          const deadline = await deadlineTime();

          await BEP20USDT_Instance.transfer(user, Str(amountToken), {
            from: owner,
          });
          await BEP20USDT_Instance.approve(
            intermediate_Instance.address,
            amountToken,
            { from: user }
          );

          const hash = await intermediate_Instance.prepareMessageHash(
            metatrondexRouter_Instance.address,
            amountToken,
            "0",
            WMETA_Instance.address,
            BEP20USDT_Instance.address,
            user,
            deadline
          );

          const signature = web3.eth.accounts.sign(hash, PK);
          await intermediate_Instance.addLiquidityETH(
            [
              metatrondexRouter_Instance.address,
              BEP20USDT_Instance.address,
              WMETA_Instance.address,
              amountToken,
              "0",
              "0",
              user,
              deadline,
              signature.signature,
            ],
            { from: user, value: amountEth }
          );

          //EXPECTING
          const hashStatus = await intermediate_Instance.isExpired(hash);
          expect(true).equal(hashStatus);

          const LiquidityData = await intermediate_Instance.GetLiquidityData(
            user
          );
          const pairAddress = await metatrondexFactory_Instance.getPair(
            WMETA_Instance.address,
            BEP20USDT_Instance.address
          );
          const pairInstance = await pairContract.at(pairAddress);

          const lpBalanceRecieved = await pairInstance.balanceOf(user);
          const getReserves = await pairInstance.getReserves();
          expect(Str(LiquidityData[0])).equal(Str(WMETA_Instance.address));
          expect(Str(LiquidityData[1])).equal(Str(BEP20USDT_Instance.address));
          expect(Str(LiquidityData[2])).equal(Str(amountEth));
          expect(Str(LiquidityData[3])).equal(Str(amountToken));
          expect(Str(LiquidityData[4])).equal(Str(lpBalanceRecieved));
          expect(Str(LiquidityData[4])).equal(Str(lpBalanceRecieved));
          expect(Str(getReserves[0])).equal(Str(amountEth));
          expect(Str(getReserves[1])).equal(Str(amountToken));

          //USER 1 Another Time Adding Liquidity
          const amountToken1 = ethAmount("10");
          const amountEth1 = ethAmount("5");
          const deadline1 = await deadlineTime();

          await BEP20USDT_Instance.transfer(user, Str(amountToken1), {
            from: owner,
          });
          await BEP20USDT_Instance.approve(
            intermediate_Instance.address,
            amountToken1,
            { from: user }
          );

          const hash1 = await intermediate_Instance.prepareMessageHash(
            metatrondexRouter_Instance.address,
            amountToken1,
            "0",
            WMETA_Instance.address,
            BEP20USDT_Instance.address,
            user,
            deadline1
          );

          const signature1 = web3.eth.accounts.sign(hash1, PK);
          await intermediate_Instance.addLiquidityETH(
            [
              metatrondexRouter_Instance.address,
              BEP20USDT_Instance.address,
              WMETA_Instance.address,
              amountToken1,
              "0",
              "0",
              user,
              deadline1,
              signature1.signature,
            ],
            { from: user, value: amountEth1 }
          );

          //EXPECTING
          const hashStatus1 = await intermediate_Instance.isExpired(hash);
          expect(true).equal(hashStatus1);

          const LiquidityData1 = await intermediate_Instance.GetLiquidityData(
            user
          );
          const pairAddress1 = await metatrondexFactory_Instance.getPair(
            WMETA_Instance.address,
            BEP20USDT_Instance.address
          );
          const pairInstance1 = await pairContract.at(pairAddress);

          const lpBalanceRecieved1 = await pairInstance1.balanceOf(user);
          const getReserves1 = await pairInstance1.getReserves();
          expect(Str(LiquidityData[0])).equal(Str(WMETA_Instance.address));
          expect(Str(LiquidityData[1])).equal(Str(BEP20USDT_Instance.address));
          expect(Str(Num(LiquidityData1[2]) - Num(LiquidityData[2]))).equal(
            Str(amountEth1)
          );
          expect(Str(Num(LiquidityData1[3]) - Num(LiquidityData[3]))).equal(
            Str(amountToken1)
          );

          expect(Str(Num(LiquidityData1[4]))).equal(Str(lpBalanceRecieved1));

          expect(Str(Num(getReserves1[0]) - Num(getReserves[0]))).equal(
            Str(amountEth1)
          );
          expect(Str(Num(getReserves1[1]) - Num(getReserves[1]))).equal(
            Str(amountToken1)
          );
          //REMOVE LIQUIDITY
          const _router = metatrondexRouter_Instance.address;
          const _factory = metatrondexFactory_Instance.address;
          const token = BEP20USDT_Instance.address;
          const weth = WMETA_Instance.address;
          const liquidity = Str(
            Num(await pairInstance1.balanceOf(user)) / Num(2)
          );
          const amountTokenMin = "0";
          const amountEthMin = "0";
          const to = user;
          const deadline2 = await deadlineTime();

          await pairInstance1.approve(
            metatrondexRouter_Instance.address,
            liquidity,
            { from: user }
          );

          const hash3 = await intermediate_Instance.prepareMessageHash(
            _router,
            liquidity,
            amountTokenMin,
            weth,
            token,
            to,
            deadline2
          );

          const signature2 = web3.eth.accounts.sign(hash3, PK);
          const userBeforeTokenBalance = await BEP20USDT_Instance.balanceOf(
            user
          );
          const userBeforeWETHBalance = await web3.eth.getBalance(user);
          await intermediate_Instance.removeLiquidityOnETH(
            [
              _router,
              _factory,
              token,
              weth,
              liquidity,
              amountTokenMin,
              amountEthMin,
              to,
              deadline2,
              signature2.signature,
            ],
            { from: user }
          );
          const calcOnRemove = await intermediate_Instance.calcOnRemove(
            liquidity,
            Str(getReserves1[1]),
            Str(getReserves1[0]),
            user
          );
          const userAfterTOkenBalance = await BEP20USDT_Instance.balanceOf(
            user
          );
          const userAfterWETHBalance = await web3.eth.getBalance(user);
          const LiquidityData2 = await intermediate_Instance.GetLiquidityData(
            user
          );
          expect(
            Str(
              (
                (Num(userAfterWETHBalance) - Num(userBeforeWETHBalance)) /
                1e18
              ).toFixed()
            )
          ).equal(Str((calcOnRemove[0] / 1e18).toFixed()));
          expect(
            Str(
              (
                (Num(userAfterTOkenBalance) - Num(userBeforeTokenBalance)) /
                1e18
              ).toFixed()
            )
          ).equal(Str((calcOnRemove[1] / 1e18).toFixed()));
          expect(Str(LiquidityData2[2])).equal(
            Str(Num(Num(amountEth) + Num(amountEth1)) / Num(2))
          );
          expect(Str(LiquidityData2[3])).equal(
            Str(Num(Num(amountToken) + Num(amountToken1)) / Num(2))
          );
          expect(Str((LiquidityData[4] / 1e18).toFixed())).equal(
            Str((liquidity / 1e18).toFixed())
          );
        });
      });
    });
  });
});
