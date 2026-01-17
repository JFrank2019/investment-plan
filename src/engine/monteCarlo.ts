import type {
  SimulationParams,
  AssetState,
  SimulationPath,
  MonteCarloResult,
  ConfidenceBand,
} from './types'
import {
  annualToMonthlyReturn,
  weeklyToMonthlyInvestment,
  calculateMaxDrawdown,
} from './deterministic'
import { calculateStatistics } from './statistics'

/**
 * Box-Muller 变换生成标准正态分布随机数
 */
export function randomNormal(): number {
  let u = 0,
    v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

/**
 * 生成指定均值和标准差的正态分布随机数
 */
export function randomNormalWithParams(mean: number, std: number): number {
  return mean + std * randomNormal()
}

/**
 * 将年化收益率和波动率转换为月度参数
 */
export function convertToMonthlyParams(annualReturn: number, annualVolatility: number) {
  // 月收益率均值（对数收益）
  const monthlyReturn = annualReturn / 12
  // 月波动率（按时间平方根缩放）
  const monthlyVolatility = annualVolatility / Math.sqrt(12)
  return { monthlyReturn, monthlyVolatility }
}

/**
 * 执行单条蒙特卡洛模拟路径
 */
function simulateSinglePath(params: SimulationParams): SimulationPath {
  const equityMonthly = convertToMonthlyParams(params.equityReturn, params.equityVolatility)
  const bondMonthly = convertToMonthlyParams(params.bondReturn, params.bondVolatility)
  const monthlyInvestment = weeklyToMonthlyInvestment(params.weeklyInvestment)
  const monthlyEquityInvest = monthlyInvestment * params.investEquityRatio
  const monthlyBondInvest = monthlyInvestment * (1 - params.investEquityRatio)

  // 初始状态
  let equityAsset = params.initialCapital * params.initialEquityRatio
  let bondAsset = params.initialCapital * (1 - params.initialEquityRatio)
  let cumulativeInvestment = params.initialCapital

  const states: AssetState[] = []

  // 记录初始状态
  states.push(createAssetState(0, equityAsset, bondAsset, cumulativeInvestment))

  // 逐月模拟
  for (let month = 1; month <= params.simulationMonths; month++) {
    // 生成随机月收益率
    const equityReturn = randomNormalWithParams(
      equityMonthly.monthlyReturn,
      equityMonthly.monthlyVolatility,
    )
    const bondReturn = randomNormalWithParams(
      bondMonthly.monthlyReturn,
      bondMonthly.monthlyVolatility,
    )

    // 应用收益（使用对数收益转换）
    equityAsset *= Math.exp(equityReturn)
    bondAsset *= Math.exp(bondReturn)

    // 确保资产不为负（极端情况保护）
    equityAsset = Math.max(0, equityAsset)
    bondAsset = Math.max(0, bondAsset)

    // 定投
    equityAsset += monthlyEquityInvest
    bondAsset += monthlyBondInvest
    cumulativeInvestment += monthlyInvestment

    // 再平衡
    if (params.rebalancePeriod > 0 && month % params.rebalancePeriod === 0) {
      const total = equityAsset + bondAsset
      equityAsset = total * params.rebalanceTargetEquityRatio
      bondAsset = total * (1 - params.rebalanceTargetEquityRatio)
    }

    states.push(createAssetState(month, equityAsset, bondAsset, cumulativeInvestment))
  }

  const totalValues = states.map((s) => s.totalAsset)
  const finalState = states[states.length - 1]

  return {
    states,
    finalValue: finalState?.totalAsset ?? 0,
    maxDrawdown: calculateMaxDrawdown(totalValues),
    totalReturn: finalState?.profitRate ?? 0,
  }
}

/**
 * 创建资产状态对象
 */
function createAssetState(
  month: number,
  equityAsset: number,
  bondAsset: number,
  cumulativeInvestment: number,
): AssetState {
  const totalAsset = equityAsset + bondAsset
  const profit = totalAsset - cumulativeInvestment
  const profitRate = cumulativeInvestment > 0 ? profit / cumulativeInvestment : 0

  return {
    month,
    equityAsset,
    bondAsset,
    totalAsset,
    equityRatio: totalAsset > 0 ? equityAsset / totalAsset : 0,
    cumulativeInvestment,
    profit,
    profitRate,
  }
}

/**
 * 执行蒙特卡洛模拟
 */
export function runMonteCarloSimulation(params: SimulationParams): MonteCarloResult {
  const paths: SimulationPath[] = []

  // 生成所有模拟路径
  for (let i = 0; i < params.monteCarloPathCount; i++) {
    paths.push(simulateSinglePath(params))
  }

  // 计算置信区间时间序列
  const confidenceBands = calculateConfidenceBands(paths, params.simulationMonths)

  // 计算统计数据
  const statistics = calculateStatistics(paths, confidenceBands)

  return {
    paths,
    statistics,
  }
}

/**
 * 计算每月的置信区间
 */
function calculateConfidenceBands(paths: SimulationPath[], months: number): ConfidenceBand[] {
  const bands: ConfidenceBand[] = []

  for (let month = 0; month <= months; month++) {
    // 收集该月所有路径的总资产值
    const values = paths.map((p) => p.states[month]?.totalAsset ?? 0).sort((a, b) => a - b)

    bands.push({
      month,
      median: percentile(values, 50),
      p5: percentile(values, 5),
      p25: percentile(values, 25),
      p75: percentile(values, 75),
      p95: percentile(values, 95),
    })
  }

  return bands
}

/**
 * 计算分位数
 */
function percentile(sortedArr: number[], p: number): number {
  if (sortedArr.length === 0) return 0
  const index = (p / 100) * (sortedArr.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const lowerVal = sortedArr[lower] ?? 0
  const upperVal = sortedArr[upper] ?? 0
  if (lower === upper) return lowerVal
  return lowerVal * (upper - index) + upperVal * (index - lower)
}
