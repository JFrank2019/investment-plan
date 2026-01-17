import type { SimulationParams, AssetState, DeterministicResult, SimulationPath } from './types'

/**
 * 将年化收益率转换为月收益率（复利）
 */
export function annualToMonthlyReturn(annualReturn: number): number {
  return Math.pow(1 + annualReturn, 1 / 12) - 1
}

/**
 * 计算每月定投金额（每周定投 × 约4.33周/月）
 */
export function weeklyToMonthlyInvestment(weeklyAmount: number): number {
  return weeklyAmount * (52 / 12) // 52周/年 ÷ 12月/年 ≈ 4.33
}

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
 * 执行确定性模拟计算
 *
 * 算法逻辑：
 * 1. 每月初应用上月收益
 * 2. 每月进行定投
 * 3. 按设定周期检查并执行再平衡
 */
export function runDeterministicSimulation(params: SimulationParams): DeterministicResult {
  const monthlyEquityReturn = annualToMonthlyReturn(params.equityReturn)
  const monthlyBondReturn = annualToMonthlyReturn(params.bondReturn)
  const monthlyInvestment = weeklyToMonthlyInvestment(params.weeklyInvestment)
  const monthlyEquityInvest = monthlyInvestment * params.investEquityRatio
  const monthlyBondInvest = monthlyInvestment * (1 - params.investEquityRatio)

  // 初始状态
  let equityAsset = params.initialCapital * params.initialEquityRatio
  let bondAsset = params.initialCapital * (1 - params.initialEquityRatio)
  let cumulativeInvestment = params.initialCapital

  const states: AssetState[] = []

  // 记录初始状态（第0月）
  states.push(createAssetState(0, equityAsset, bondAsset, cumulativeInvestment))

  // 逐月迭代
  for (let month = 1; month <= params.simulationMonths; month++) {
    // 1. 应用月收益（月初资产 × 月收益率）
    equityAsset *= 1 + monthlyEquityReturn
    bondAsset *= 1 + monthlyBondReturn

    // 2. 定投（假设月中投入，简化处理）
    // 实际上定投在月内分散，这里用月末一次性投入近似
    // 更精确的做法是定投金额 × (1 + r/2)，但影响较小
    equityAsset += monthlyEquityInvest
    bondAsset += monthlyBondInvest
    cumulativeInvestment += monthlyInvestment

    // 3. 检查是否需要再平衡
    if (params.rebalancePeriod > 0 && month % params.rebalancePeriod === 0) {
      const total = equityAsset + bondAsset
      equityAsset = total * params.rebalanceTargetEquityRatio
      bondAsset = total * (1 - params.rebalanceTargetEquityRatio)
    }

    // 记录状态
    states.push(createAssetState(month, equityAsset, bondAsset, cumulativeInvestment))
  }

  // 构建路径结果
  const totalValues = states.map((s) => s.totalAsset)
  const finalState = states[states.length - 1]
  const path: SimulationPath = {
    states,
    finalValue: finalState?.totalAsset ?? 0,
    maxDrawdown: calculateMaxDrawdown(totalValues),
    totalReturn: finalState?.profitRate ?? 0,
  }

  // 提取季度数据（每3个月）
  const quarterlyData = states.filter((s) => s.month % 3 === 0)

  return {
    path,
    quarterlyData,
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
 * 格式化月份为日期标签
 */
export function formatMonthLabel(month: number, startDate: Date = new Date()): string {
  const date = new Date(startDate)
  date.setMonth(date.getMonth() + month)
  const year = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${m}`
}

/**
 * 计算季度收益率（从年化收益率）
 */
export function annualToQuarterlyReturn(annualReturn: number): number {
  return Math.pow(1 + annualReturn, 0.25) - 1
}
