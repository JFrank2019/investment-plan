/**
 * 模拟参数配置
 */
export interface SimulationParams {
  // 初始资金配置
  initialCapital: number // 初始资金总额（元）
  initialEquityRatio: number // 初始偏股比例 (0-1)

  // 定投配置
  weeklyInvestment: number // 每周定投金额（元）
  investEquityRatio: number // 定投偏股比例 (0-1)

  // 收益率配置（年化）
  equityReturn: number // 偏股类年化收益率 (0.1 = 10%)
  bondReturn: number // 偏债类年化收益率
  equityVolatility: number // 偏股类波动率（标准差）
  bondVolatility: number // 偏债类波动率（标准差）

  // 再平衡配置
  rebalancePeriod: number // 再平衡周期（月），0表示不再平衡
  rebalanceTargetEquityRatio: number // 再平衡目标偏股比例

  // 模拟配置
  simulationMonths: number // 模拟时长（月）
  monteCarloPathCount: number // 蒙特卡洛模拟路径数量
}

/**
 * 单期资产状态
 */
export interface AssetState {
  month: number // 第几个月（0开始）
  equityAsset: number // 偏股类资产
  bondAsset: number // 偏债类资产
  totalAsset: number // 总资产
  equityRatio: number // 偏股占比
  cumulativeInvestment: number // 累计投入本金
  profit: number // 收益额
  profitRate: number // 收益率
}

/**
 * 单条模拟路径结果
 */
export interface SimulationPath {
  states: AssetState[] // 每月资产状态
  finalValue: number // 最终总资产
  maxDrawdown: number // 最大回撤
  totalReturn: number // 总收益率
}

/**
 * 确定性计算结果
 */
export interface DeterministicResult {
  path: SimulationPath
  quarterlyData: AssetState[] // 季度数据（用于表格展示）
}

/**
 * 蒙特卡洛模拟结果
 */
export interface MonteCarloResult {
  paths: SimulationPath[] // 所有模拟路径
  statistics: SimulationStatistics // 统计数据
}

/**
 * 模拟统计数据
 */
export interface SimulationStatistics {
  // 终值分布
  finalValueMean: number // 终值均值
  finalValueMedian: number // 终值中位数
  finalValueP5: number // 终值 5% 分位数
  finalValueP25: number // 终值 25% 分位数
  finalValueP75: number // 终值 75% 分位数
  finalValueP95: number // 终值 95% 分位数
  finalValueMin: number // 终值最小值
  finalValueMax: number // 终值最大值

  // 收益率分布
  returnMean: number // 收益率均值
  returnMedian: number // 收益率中位数
  returnP5: number // 收益率 5% 分位数
  returnP95: number // 收益率 95% 分位数

  // 风险指标
  maxDrawdownMean: number // 平均最大回撤
  maxDrawdownP95: number // 95% 分位最大回撤
  lossProbability: number // 亏损概率（终值 < 本金）

  // 置信区间时间序列（用于图表）
  confidenceBands: ConfidenceBand[]
}

/**
 * 置信区间数据点
 */
export interface ConfidenceBand {
  month: number
  median: number
  p5: number
  p25: number
  p75: number
  p95: number
}

/**
 * 图表数据格式
 */
export interface ChartDataPoint {
  month: number
  label: string // 如 "2026-01"
  value: number
  [key: string]: string | number // 允许扩展字段
}

/**
 * 默认参数
 */
export const DEFAULT_PARAMS: SimulationParams = {
  initialCapital: 300000,                 // 初始资金（元）
  initialEquityRatio: 0.3,                // 初始偏股比例（0-1，0.3 即30%）
  weeklyInvestment: 1000,                 // 每周定投金额（元）
  investEquityRatio: 0.3,                 // 定投偏股比例（0-1，0.7 即70%）
  equityReturn: 0.1,                      // 偏股年化收益率（如0.1为10%，现实预期）
  bondReturn: 0.04,                       // 偏债年化收益率（如0.04为4%）
  equityVolatility: 0.2,                  // 偏股年化波动率（如0.2为20%）
  bondVolatility: 0.03,                   // 偏债年化波动率（如0.03为3%）
  rebalancePeriod: 6,                     // 再平衡周期（月，6即每6个月再平衡一次）
  rebalanceTargetEquityRatio: 0.3,        // 再平衡目标偏股比例（0-1，0.5即50%）
  simulationMonths: 12,                   // 模拟时长（月）
  monteCarloPathCount: 1000,              // 蒙特卡洛模拟路径数
}

/**
 * 参数验证
 */
export function validateParams(params: SimulationParams): string[] {
  const errors: string[] = []

  if (params.initialCapital <= 0) {
    errors.push('初始资金必须大于0')
  }
  if (params.initialEquityRatio < 0 || params.initialEquityRatio > 1) {
    errors.push('初始偏股比例必须在0-1之间')
  }
  if (params.weeklyInvestment < 0) {
    errors.push('每周定投金额不能为负')
  }
  if (params.investEquityRatio < 0 || params.investEquityRatio > 1) {
    errors.push('定投偏股比例必须在0-1之间')
  }
  if (params.equityReturn < -1) {
    errors.push('偏股年化收益率不能低于-100%')
  }
  if (params.equityReturn > 0.5) {
    errors.push('警告：偏股年化收益率超过50%，请确认是否合理')
  }
  if (params.bondReturn < -0.5 || params.bondReturn > 0.3) {
    errors.push('偏债年化收益率应在-50%到30%之间')
  }
  if (params.equityVolatility < 0 || params.equityVolatility > 1) {
    errors.push('偏股波动率必须在0-100%之间')
  }
  if (params.bondVolatility < 0 || params.bondVolatility > 0.5) {
    errors.push('偏债波动率必须在0-50%之间')
  }
  if (params.simulationMonths <= 0 || params.simulationMonths > 600) {
    errors.push('模拟时长必须在1-600个月之间')
  }
  if (params.monteCarloPathCount < 100 || params.monteCarloPathCount > 10000) {
    errors.push('蒙特卡洛路径数必须在100-10000之间')
  }

  return errors
}
