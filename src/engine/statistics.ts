import type { SimulationPath, SimulationStatistics, ConfidenceBand } from './types'

/**
 * 计算分位数
 * @param arr 数组（无需排序）
 * @param p 分位数 (0-100)
 */
export function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const index = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const lowerVal = sorted[lower] ?? 0
  const upperVal = sorted[upper] ?? 0
  if (lower === upper) return lowerVal
  return lowerVal * (upper - index) + upperVal * (index - lower)
}

/**
 * 计算均值
 */
export function mean(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((sum, val) => sum + val, 0) / arr.length
}

/**
 * 计算中位数
 */
export function median(arr: number[]): number {
  return percentile(arr, 50)
}

/**
 * 计算标准差
 */
export function standardDeviation(arr: number[]): number {
  if (arr.length === 0) return 0
  const avg = mean(arr)
  const squaredDiffs = arr.map((val) => Math.pow(val - avg, 2))
  return Math.sqrt(mean(squaredDiffs))
}

/**
 * 计算最大回撤
 */
export function maxDrawdown(values: number[]): number {
  if (values.length === 0) return 0

  let maxDD = 0
  let peak = values[0] ?? 0

  for (const value of values) {
    if (value > peak) {
      peak = value
    }
    const dd = peak > 0 ? (peak - value) / peak : 0
    if (dd > maxDD) {
      maxDD = dd
    }
  }

  return maxDD
}

/**
 * 从模拟路径计算完整统计数据
 */
export function calculateStatistics(
  paths: SimulationPath[],
  confidenceBands: ConfidenceBand[],
): SimulationStatistics {
  // 提取终值和收益率
  const finalValues = paths.map((p) => p.finalValue)
  const returns = paths.map((p) => p.totalReturn)
  const maxDrawdowns = paths.map((p) => p.maxDrawdown)

  // 计算亏损概率（终值 < 累计投入）
  const lossPaths = paths.filter((p) => {
    const finalState = p.states[p.states.length - 1]
    return finalState && finalState.totalAsset < finalState.cumulativeInvestment
  })
  const lossProbability = lossPaths.length / paths.length

  return {
    // 终值分布
    finalValueMean: mean(finalValues),
    finalValueMedian: median(finalValues),
    finalValueP5: percentile(finalValues, 5),
    finalValueP25: percentile(finalValues, 25),
    finalValueP75: percentile(finalValues, 75),
    finalValueP95: percentile(finalValues, 95),
    finalValueMin: Math.min(...finalValues),
    finalValueMax: Math.max(...finalValues),

    // 收益率分布
    returnMean: mean(returns),
    returnMedian: median(returns),
    returnP5: percentile(returns, 5),
    returnP95: percentile(returns, 95),

    // 风险指标
    maxDrawdownMean: mean(maxDrawdowns),
    maxDrawdownP95: percentile(maxDrawdowns, 95),
    lossProbability,

    // 置信区间
    confidenceBands,
  }
}

/**
 * 格式化金额（万元）
 */
export function formatMoney(value: number): string {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(2)}万`
  }
  return `${value.toFixed(0)}元`
}

/**
 * 格式化百分比
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * 格式化金额（完整格式，带千分位）
 */
export function formatMoneyFull(value: number): string {
  return value.toLocaleString('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}
