import type { SimulationPath, SimulationStatistics, ConfidenceBand, RiskMetrics } from './types'

function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0) return 0
  return numerator / denominator
}

/**
 * 将年化通胀率转换为月通胀率（复利）
 */
export function annualToMonthlyInflation(annualInflation: number): number {
  return Math.pow(1 + annualInflation, 1 / 12) - 1
}

/**
 * 计算累计通胀率
 * @param annualInflation 年化通胀率
 * @param months 月数
 */
export function calculateCumulativeInflation(annualInflation: number, months: number): number {
  const monthlyInflation = annualToMonthlyInflation(annualInflation)
  return Math.pow(1 + monthlyInflation, months) - 1
}

/**
 * 计算实际购买力（名义值扣除通胀）
 * @param nominalValue 名义值
 * @param cumulativeInflation 累计通胀率
 */
export function calculateRealValue(nominalValue: number, cumulativeInflation: number): number {
  return nominalValue / (1 + cumulativeInflation)
}

/**
 * 计算实际收益率
 * @param nominalReturn 名义收益率
 * @param inflation 通胀率
 */
export function calculateRealReturn(nominalReturn: number, inflation: number): number {
  // 实际收益率 = (1 + 名义收益率) / (1 + 通胀率) - 1
  return (1 + nominalReturn) / (1 + inflation) - 1
}

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
  riskFreeRate: number = 0.03, // 无风险利率，默认3%
): SimulationStatistics {
  if (paths.length === 0) {
    return {
      finalValueMean: 0,
      finalValueMedian: 0,
      finalValueP5: 0,
      finalValueP25: 0,
      finalValueP75: 0,
      finalValueP95: 0,
      finalValueMin: 0,
      finalValueMax: 0,
      returnMean: 0,
      returnMedian: 0,
      returnP5: 0,
      returnP95: 0,
      maxDrawdownMean: 0,
      maxDrawdownP95: 0,
      lossProbability: 0,
      riskMetrics: calculateRiskMetrics([], riskFreeRate),
      confidenceBands,
    }
  }

  // 提取终值和收益率
  const finalValues = paths.map((p) => p.finalValue)
  const returns = paths.map((p) => p.totalReturn)
  const maxDrawdowns = paths.map((p) => p.maxDrawdown)

  // 计算亏损概率（终值 < 累计投入）
  const lossPaths = paths.filter((p) => {
    const finalState = p.states[p.states.length - 1]
    return finalState && finalState.totalAsset < finalState.cumulativeInvestment
  })
  const lossProbability = safeDivide(lossPaths.length, paths.length)

  // 计算风险指标
  const riskMetrics = calculateRiskMetrics(paths, riskFreeRate)

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
    riskMetrics,

    // 置信区间
    confidenceBands,
  }
}

/**
 * 计算夏普比率
 * @param returns 收益率数组
 * @param riskFreeRate 无风险利率（年化）
 * @param periodsPerYear 每年期数（月度数据为12）
 */
export function sharpeRatio(returns: number[], riskFreeRate: number, periodsPerYear: number = 12): number {
  if (returns.length === 0) return 0

  const avgReturn = mean(returns)
  const stdReturn = standardDeviation(returns)

  // 将无风险利率转换为每期
  const periodRiskFreeRate = Math.pow(1 + riskFreeRate, 1 / periodsPerYear) - 1

  if (stdReturn === 0) return 0

  // 夏普比率 = (预期收益 - 无风险收益) / 标准差
  return (avgReturn - periodRiskFreeRate) / stdReturn
}

/**
 * 计算索提诺比率
 * @param returns 收益率数组
 * @param riskFreeRate 无风险利率（年化）
 * @param periodsPerYear 每年期数
 */
export function sortinoRatio(returns: number[], riskFreeRate: number, periodsPerYear: number = 12): number {
  if (returns.length === 0) return 0

  const avgReturn = mean(returns)
  const periodRiskFreeRate = Math.pow(1 + riskFreeRate, 1 / periodsPerYear) - 1

  // 计算下行波动率（只考虑负收益）
  const negativeReturns = returns.filter((r) => r < periodRiskFreeRate)
  if (negativeReturns.length === 0) return avgReturn > periodRiskFreeRate ? Infinity : 0

  const downsideDeviation = Math.sqrt(
    negativeReturns.reduce((sum, r) => sum + Math.pow(r - periodRiskFreeRate, 2), 0) /
      negativeReturns.length,
  )

  if (downsideDeviation === 0) return avgReturn > periodRiskFreeRate ? Infinity : 0

  return (avgReturn - periodRiskFreeRate) / downsideDeviation
}

/**
 * 计算在险价值 (Value at Risk)
 * @param values 数值数组
 * @param confidence 置信水平（默认95%）
 */
export function valueAtRisk(values: number[], confidence: number = 95): number {
  if (values.length === 0) return 0
  // VaR 是损失的分位数
  const lossPercentile = 100 - confidence
  return percentile(values, lossPercentile)
}

/**
 * 计算条件在险价值 (Conditional VaR / Expected Shortfall)
 * @param values 数值数组
 * @param confidence 置信水平
 */
export function conditionalVaR(values: number[], confidence: number = 95): number {
  if (values.length === 0) return 0

  const sortedValues = [...values].sort((a, b) => a - b)
  const cutoffIndex = Math.floor((sortedValues.length * (100 - confidence)) / 100)

  if (cutoffIndex === 0) return sortedValues[0] ?? 0

  // 计算最差情况下的平均值
  const tailValues = sortedValues.slice(0, cutoffIndex)
  return mean(tailValues)
}

/**
 * 计算回撤持续期统计
 * @param path 单条模拟路径
 * @returns 最大持续期、平均持续期、是否恢复
 */
function calculateDrawdownDurations(path: SimulationPath): {
  maxDuration: number
  avgDuration: number
  recovered: boolean
} {
  const values = path.states.map((s) => s.totalAsset)
  if (values.length === 0) return { maxDuration: 0, avgDuration: 0, recovered: true }

  let peak = values[0] ?? 0
  let inDrawdown = false
  let currentDuration = 0
  const durations: number[] = []
  let maxDuration = 0

  for (const value of values) {
    if (value > peak) {
      if (inDrawdown && currentDuration > 0) {
        durations.push(currentDuration)
        maxDuration = Math.max(maxDuration, currentDuration)
      }
      peak = value
      inDrawdown = false
      currentDuration = 0
    } else if (value < peak) {
      inDrawdown = true
      currentDuration++
    }
  }

  // 检查最后是否仍在回撤中
  const finalValue = values[values.length - 1] ?? 0
  const recovered = finalValue >= peak || !inDrawdown

  // 如果最后还在回撤中，也要计入
  if (inDrawdown && currentDuration > 0) {
    durations.push(currentDuration)
    maxDuration = Math.max(maxDuration, currentDuration)
  }

  const avgDuration = durations.length > 0 ? mean(durations) : 0

  return { maxDuration, avgDuration, recovered }
}

/**
 * 计算完整风险指标
 */
export function calculateRiskMetrics(
  paths: SimulationPath[],
  riskFreeRate: number = 0.03,
): RiskMetrics {
  if (paths.length === 0) {
    return {
      maxDrawdownMean: 0,
      maxDrawdownP95: 0,
      lossProbability: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      var95: 0,
      var95Percent: 0,
      cvar95: 0,
      maxDrawdownDuration: 0,
      avgDrawdownDuration: 0,
      recoveryProbability: 0,
    }
  }

  const monthlyReturns = paths.flatMap(extractMonthlyTimeWeightedReturns)
  const finalValues = paths.map((p) => p.finalValue)
  const maxDrawdowns = paths.map((p) => p.maxDrawdown)

  // 计算亏损概率
  const lossPaths = paths.filter((p) => {
    const finalState = p.states[p.states.length - 1]
    return finalState && finalState.totalAsset < finalState.cumulativeInvestment
  })
  const lossProbability = safeDivide(lossPaths.length, paths.length)

  // 计算回撤持续期统计
  const drawdownStats = paths.map(calculateDrawdownDurations)
  const maxDrawdownDurations = drawdownStats.map((d) => d.maxDuration)
  const avgDrawdownDurations = drawdownStats.map((d) => d.avgDuration)
  const recoveredCount = drawdownStats.filter((d) => d.recovered).length
  const recoveryProbability = safeDivide(recoveredCount, paths.length)

  // 计算 VaR
  const var95 = valueAtRisk(finalValues, 95)
  const finalInvestments = paths.map((p) => p.states[p.states.length - 1]?.cumulativeInvestment ?? 0)
  const avgFinalInvestment = mean(finalInvestments)
  const var95Shortfall = Math.max(0, avgFinalInvestment - var95)
  const var95Percent = avgFinalInvestment > 0 ? var95Shortfall / avgFinalInvestment : 0

  return {
    maxDrawdownMean: mean(maxDrawdowns),
    maxDrawdownP95: percentile(maxDrawdowns, 95),
    lossProbability,
    sharpeRatio: sharpeRatio(monthlyReturns, riskFreeRate),
    sortinoRatio: sortinoRatio(monthlyReturns, riskFreeRate),
    var95,
    var95Percent,
    cvar95: conditionalVaR(finalValues, 95),
    maxDrawdownDuration: max(maxDrawdownDurations),
    avgDrawdownDuration: mean(avgDrawdownDurations),
    recoveryProbability,
  }
}

/**
 * 提取路径的月度时间加权收益率序列（剔除当月现金流影响）
 */
function extractMonthlyTimeWeightedReturns(path: SimulationPath): number[] {
  const returns: number[] = []

  for (let i = 1; i < path.states.length; i++) {
    const prev = path.states[i - 1]
    const curr = path.states[i]
    if (!prev || !curr || prev.totalAsset <= 0) continue

    const monthlyCashFlow = curr.cumulativeInvestment - prev.cumulativeInvestment
    const valueBeforeCashFlow = curr.totalAsset - monthlyCashFlow
    returns.push((valueBeforeCashFlow - prev.totalAsset) / prev.totalAsset)
  }

  return returns
}

/**
 * 计算最大值
 */
function max(arr: number[]): number {
  if (arr.length === 0) return 0
  return Math.max(...arr)
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

