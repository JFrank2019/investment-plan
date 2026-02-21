import type { AssetState } from './types'

/**
 * 计算最大回撤
 */
export function calculateMaxDrawdown(values: number[]): number {
  if (values.length === 0) return 0

  let maxDrawdown = 0
  let peak = values[0] ?? 0

  for (const value of values) {
    if (value > peak) {
      peak = value
    }
    const drawdown = peak > 0 ? (peak - value) / peak : 0
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
    }
  }

  return maxDrawdown
}

/**
 * 基于已排序数组计算分位数（线性插值）
 */
export function percentileFromSorted(sortedArr: number[], p: number): number {
  if (sortedArr.length === 0) return 0
  const index = (p / 100) * (sortedArr.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const lowerVal = sortedArr[lower] ?? 0
  const upperVal = sortedArr[upper] ?? 0
  if (lower === upper) return lowerVal
  return lowerVal * (upper - index) + upperVal * (index - lower)
}

/**
 * 预计算累计通胀率序列（按月）
 */
export function buildCumulativeInflationTable(annualInflationRate: number, months: number): number[] {
  const monthlyInflation = Math.pow(1 + annualInflationRate, 1 / 12) - 1
  const table = Array.from({ length: months + 1 }, () => 0)
  let inflationFactor = 1

  for (let month = 1; month <= months; month++) {
    inflationFactor *= 1 + monthlyInflation
    table[month] = inflationFactor - 1
  }

  return table
}

/**
 * 创建资产状态对象
 */
export function createAssetState(
  month: number,
  equityAsset: number,
  bondAsset: number,
  cumulativeInvestment: number,
  cumulativeInflation: number,
  realCumulativeInvestment: number,
): AssetState {
  const totalAsset = equityAsset + bondAsset
  const profit = totalAsset - cumulativeInvestment
  const profitRate = cumulativeInvestment > 0 ? profit / cumulativeInvestment : 0

  // 使用预计算的通胀值，避免在热路径重复指数运算
  const realTotalAsset = totalAsset / (1 + cumulativeInflation)
  const realProfit = realTotalAsset - realCumulativeInvestment
  const realProfitRate = realCumulativeInvestment > 0 ? realProfit / realCumulativeInvestment : 0

  return {
    month,
    equityAsset,
    bondAsset,
    totalAsset,
    equityRatio: totalAsset > 0 ? equityAsset / totalAsset : 0,
    cumulativeInvestment,
    profit,
    profitRate,
    cumulativeInflation,
    realTotalAsset,
    realProfit,
    realProfitRate,
  }
}
