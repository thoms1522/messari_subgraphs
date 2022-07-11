import { BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../../../configurations/configure";
import { MasterChefSpookyswap } from "../../../../../generated/MasterChef/MasterChefSpookyswap";
import { LiquidityPool, _HelperStore } from "../../../../../generated/schema";
import {
  BIGINT_ZERO,
  INT_ZERO,
  RECENT_BLOCK_THRESHOLD,
  UsageType,
  ZERO_ADDRESS,
} from "../../../../../src/common/constants";
import { getOrCreateToken } from "../../../../../src/common/getters";
import { getRewardsPerDay } from "../../../../../src/common/rewards";

export function handleReward(
  event: ethereum.Event,
  pid: BigInt,
  amount: BigInt,
  usageType: string
): void {
  let masterChefPool = _HelperStore.load(pid.toString());
  let poolContract = MasterChefSpookyswap.bind(event.address);

  // Create entity to track masterchef pool mappings
  if (!masterChefPool) {
    masterChefPool = new _HelperStore(pid.toString());
    let poolInfo = poolContract.try_poolInfo(pid);
    let lpTokenAddress = ZERO_ADDRESS;
    if (!poolInfo.reverted) {
      lpTokenAddress = poolInfo.value.value1.toHexString();
    }
    masterChefPool.valueString = lpTokenAddress;
    masterChefPool.valueBigInt = event.block.number;
    masterChefPool.save();
  }

  // Return if pool does not exist - Banana tokens?
  let pool = LiquidityPool.load(masterChefPool.valueString!);
  if (!pool) {
    return;
  }

  // Update staked amounts
  if (usageType == UsageType.DEPOSIT) {
    pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.plus(amount);
  } else {
    pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.minus(amount);
  }

  // Return if you have calculated rewards recently
  if (
    event.block.number
      .minus(masterChefPool.valueBigInt!)
      .lt(RECENT_BLOCK_THRESHOLD)
  ) {
    pool.save();
    return;
  }

  // Get necessary values from the master chef contract to calculate rewards
  let getPoolInfo = poolContract.try_poolInfo(pid);
  let poolAllocPoint: BigInt = BIGINT_ZERO;
  let lastRewardBlock: BigInt = BIGINT_ZERO;
  if (!getPoolInfo.reverted) {
    let poolInfo = getPoolInfo.value;
    poolAllocPoint = poolInfo.value1;
    lastRewardBlock = poolInfo.value2;
  }

  let getRewardTokenPerSecond = poolContract.try_booPerSecond();
  let rewardTokenPerSecond: BigInt = BIGINT_ZERO;
  if (!getRewardTokenPerSecond.reverted) {
    rewardTokenPerSecond = getRewardTokenPerSecond.value;
  }

  let getTotalAllocPoint = poolContract.try_totalAllocPoint();
  let totalAllocPoint: BigInt = BIGINT_ZERO;
  if (!getTotalAllocPoint.reverted) {
    totalAllocPoint = getTotalAllocPoint.value;
  }

  log.warning("rewardTokenPerSecond: " + rewardTokenPerSecond.toString(), []);
  log.warning("poolAllocPoint: " + poolAllocPoint.toString(), []);
  log.warning("totalAllocPoint: " + totalAllocPoint.toString(), []);

  // Calculate Reward Emission per Block
  let rewardTokenRate = rewardTokenPerSecond
    .times(poolAllocPoint)
    .div(totalAllocPoint);

  let rewardTokenRateBigDecimal = BigDecimal.fromString(
    rewardTokenRate.toString()
  );
  let rewardTokenPerDay = getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    rewardTokenRateBigDecimal,
    NetworkConfigs.getRewardIntervalType()
  );

  let nativeToken = getOrCreateToken(NetworkConfigs.getReferenceToken());
  let rewardToken = getOrCreateToken(pool.rewardTokens![INT_ZERO]);

  pool.rewardTokenEmissionsAmount = [
    BigInt.fromString(rewardTokenPerDay.toString()),
  ];
  pool.rewardTokenEmissionsUSD = [
    rewardTokenPerDay.times(rewardToken.lastPriceUSD!),
  ];

  masterChefPool.valueBigInt = event.block.number;

  masterChefPool.save();
  rewardToken.save();
  nativeToken.save();
  pool.save();
}
