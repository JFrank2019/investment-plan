import type {
  SimulationParams,
  AssetState,
  SimulationPath,
  MonteCarloResult,
  ConfidenceBand,
} from './types'
import { weeklyToMonthlyInvestment, calculateMaxDrawdown } from './deterministic'
import { calculateStatistics, annualToMonthlyInflation } from './statistics'

export interface MonteCarloRunOptions {
  onProgress?: (completed: number, total: number) => void
}

export interface MonteCarloBatchedRunOptions extends MonteCarloRunOptions {
  chunkSize?: number
  yieldIntervalMs?: number
}

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

interface MonthlyAssetParams {
  monthlyReturn: number
  monthlyVolatility: number
}

interface MonteCarloPrecomputed {
  equityMonthly: MonthlyAssetParams
  bondMonthly: MonthlyAssetParams
  cumulativeInflationByMonth: number[]
}

/**
 * 执行单条蒙特卡洛模拟路径
 */
function simulateSinglePath(
  params: SimulationParams,
  precomputed: MonteCarloPrecomputed,
): SimulationPath {
  const monthlyInvestment = weeklyToMonthlyInvestment(params.weeklyInvestment)
  const monthlyEquityInvest = monthlyInvestment * params.investEquityRatio
  const monthlyBondInvest = monthlyInvestment * (1 - params.investEquityRatio)

  // 初始状态
  let equityAsset = params.initialCapital * params.initialEquityRatio
  let bondAsset = params.initialCapital * (1 - params.initialEquityRatio)
  let cumulativeInvestment = params.initialCapital
  let realCumulativeInvestment = params.initialCapital

  const states: AssetState[] = []

  // 记录初始状态
  states.push(
    createAssetState(
      0,
      equityAsset,
      bondAsset,
      cumulativeInvestment,
      precomputed.cumulativeInflationByMonth[0] ?? 0,
      realCumulativeInvestment,
    ),
  )

  // 逐月模拟
  for (let month = 1; month <= params.simulationMonths; month++) {
    // 生成随机月收益率
    const equityReturn = randomNormalWithParams(
      precomputed.equityMonthly.monthlyReturn,
      precomputed.equityMonthly.monthlyVolatility,
    )
    const bondReturn = randomNormalWithParams(
      precomputed.bondMonthly.monthlyReturn,
      precomputed.bondMonthly.monthlyVolatility,
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
    const contributionDeflator = 1 + (precomputed.cumulativeInflationByMonth[month] ?? 0)
    realCumulativeInvestment +=
      contributionDeflator > 0 ? monthlyInvestment / contributionDeflator : monthlyInvestment

    // 再平衡
    if (params.rebalancePeriod > 0 && month % params.rebalancePeriod === 0) {
      const total = equityAsset + bondAsset
      equityAsset = total * params.rebalanceTargetEquityRatio
      bondAsset = total * (1 - params.rebalanceTargetEquityRatio)
    }

    states.push(
      createAssetState(
        month,
        equityAsset,
        bondAsset,
        cumulativeInvestment,
        precomputed.cumulativeInflationByMonth[month] ?? 0,
        realCumulativeInvestment,
      ),
    )
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

/**
 * 执行蒙特卡洛模拟
 */
export function runMonteCarloSimulation(
  params: SimulationParams,
  riskFreeRate: number = 0.03,
  options: MonteCarloRunOptions = {},
): MonteCarloResult {
  const precomputed: MonteCarloPrecomputed = {
    equityMonthly: convertToMonthlyParams(params.equityReturn, params.equityVolatility),
    bondMonthly: convertToMonthlyParams(params.bondReturn, params.bondVolatility),
    cumulativeInflationByMonth: buildCumulativeInflationTable(
      params.inflationRate,
      params.simulationMonths,
    ),
  }
  const paths: SimulationPath[] = []
  const total = params.monteCarloPathCount
  const reportInterval = Math.max(1, Math.floor(total / 100))

  // 生成所有模拟路径
  for (let i = 0; i < total; i++) {
    paths.push(simulateSinglePath(params, precomputed))
    const completed = i + 1
    if (options.onProgress && (completed % reportInterval === 0 || completed === total)) {
      options.onProgress(completed, total)
    }
  }

  // 计算置信区间时间序列
  return buildMonteCarloResult(paths, params.simulationMonths, riskFreeRate)
}

/**
 * 批量执行蒙特卡洛模拟（用于 Worker 内分批让出执行权，避免进度卡死）
 */
export async function runMonteCarloSimulationBatched(
  params: SimulationParams,
  riskFreeRate: number = 0.03,
  options: MonteCarloBatchedRunOptions = {},
): Promise<MonteCarloResult> {
  const precomputed: MonteCarloPrecomputed = {
    equityMonthly: convertToMonthlyParams(params.equityReturn, params.equityVolatility),
    bondMonthly: convertToMonthlyParams(params.bondReturn, params.bondVolatility),
    cumulativeInflationByMonth: buildCumulativeInflationTable(
      params.inflationRate,
      params.simulationMonths,
    ),
  }
  const paths: SimulationPath[] = []
  const total = params.monteCarloPathCount
  const progressInterval = Math.max(1, Math.floor(total / 100))
  const checkInterval = Math.max(32, Math.min(total, options.chunkSize ?? 256))
  const yieldIntervalMs = Math.max(16, options.yieldIntervalMs ?? 48)
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())
  let lastYieldAt = now()
  let nextProgressAt = progressInterval

  for (let i = 0; i < total; i++) {
    paths.push(simulateSinglePath(params, precomputed))
    const completed = i + 1

    if (completed >= nextProgressAt || completed === total) {
      options.onProgress?.(completed, total)
      while (nextProgressAt <= completed) {
        nextProgressAt += progressInterval
      }
    }

    if (completed % checkInterval === 0 || completed === total) {
      const current = now()
      if (completed < total && current - lastYieldAt >= yieldIntervalMs) {
        await new Promise<void>((resolve) => setTimeout(resolve, 0))
        lastYieldAt = now()
      }
    }
  }

  return buildMonteCarloResult(paths, params.simulationMonths, riskFreeRate)
}

function buildMonteCarloResult(
  paths: SimulationPath[],
  simulationMonths: number,
  riskFreeRate: number,
): MonteCarloResult {
  // 计算置信区间时间序列
  const confidenceBands = calculateConfidenceBands(paths, simulationMonths)

  // 计算统计数据
  const statistics = calculateStatistics(paths, confidenceBands, riskFreeRate)

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
  const pathCount = paths.length

  for (let month = 0; month <= months; month++) {
    // 收集该月所有路径的总资产值
    const values = Array.from({ length: pathCount }, () => 0)
    // 收集该月所有路径的实际购买力值
    const realValues = Array.from({ length: pathCount }, () => 0)

    for (let i = 0; i < pathCount; i++) {
      const state = paths[i]?.states[month]
      values[i] = state?.totalAsset ?? 0
      realValues[i] = state?.realTotalAsset ?? 0
    }

    values.sort((a, b) => a - b)
    realValues.sort((a, b) => a - b)

    bands.push({
      month,
      median: percentile(values, 50),
      p5: percentile(values, 5),
      p25: percentile(values, 25),
      p75: percentile(values, 75),
      p95: percentile(values, 95),
      realMedian: percentile(realValues, 50),
      realP5: percentile(realValues, 5),
      realP95: percentile(realValues, 95),
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

function buildCumulativeInflationTable(annualInflationRate: number, months: number): number[] {
  const monthlyInflation = annualToMonthlyInflation(annualInflationRate)
  const table = Array.from({ length: months + 1 }, () => 0)
  let inflationFactor = 1

  for (let month = 1; month <= months; month++) {
    inflationFactor *= 1 + monthlyInflation
    table[month] = inflationFactor - 1
  }

  return table
}
