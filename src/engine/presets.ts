import type { PortfolioPreset, RiskLevel } from './types'

/**
 * 预设投资组合模板列表
 */
export const PORTFOLIO_PRESETS: PortfolioPreset[] = [
  {
    id: '60-40-balanced',
    name: '60/40 平衡组合',
    description: '经典的股债平衡配置，兼顾增长与稳健',
    riskLevel: 'balanced',
    initialEquityRatio: 0.6,
    investEquityRatio: 0.6,
    equityReturn: 0.08,
    bondReturn: 0.04,
    equityVolatility: 0.18,
    bondVolatility: 0.03,
    rebalancePeriod: 6,
    rebalanceTargetEquityRatio: 0.6,
  },
  {
    id: 'three-fund',
    name: '三巨头组合',
    description: '本土股票+全球股票+债券，分散投资',
    riskLevel: 'balanced',
    initialEquityRatio: 0.6,
    investEquityRatio: 0.6,
    equityReturn: 0.085,
    bondReturn: 0.04,
    equityVolatility: 0.2,
    bondVolatility: 0.03,
    rebalancePeriod: 6,
    rebalanceTargetEquityRatio: 0.6,
  },
  {
    id: 'all-weather',
    name: '全天候组合',
    description: '达里奥全天候策略，适应各种经济环境',
    riskLevel: 'conservative',
    initialEquityRatio: 0.3,
    investEquityRatio: 0.3,
    equityReturn: 0.06,
    bondReturn: 0.035,
    equityVolatility: 0.15,
    bondVolatility: 0.05,
    rebalancePeriod: 12,
    rebalanceTargetEquityRatio: 0.3,
  },
  {
    id: 'aggressive-growth',
    name: '激进成长组合',
    description: '高偏股配置，追求长期资本增值',
    riskLevel: 'aggressive',
    initialEquityRatio: 0.85,
    investEquityRatio: 0.85,
    equityReturn: 0.1,
    bondReturn: 0.04,
    equityVolatility: 0.25,
    bondVolatility: 0.03,
    rebalancePeriod: 6,
    rebalanceTargetEquityRatio: 0.85,
  },
  {
    id: 'conservative-defense',
    name: '保守防御组合',
    description: '以债券为主，追求稳定收益与资本保护',
    riskLevel: 'conservative',
    initialEquityRatio: 0.2,
    investEquityRatio: 0.2,
    equityReturn: 0.06,
    bondReturn: 0.035,
    equityVolatility: 0.12,
    bondVolatility: 0.03,
    rebalancePeriod: 6,
    rebalanceTargetEquityRatio: 0.2,
  },
]

/**
 * 根据 ID 获取预设模板
 */
export function getPresetById(id: string): PortfolioPreset | undefined {
  return PORTFOLIO_PRESETS.find((p) => p.id === id)
}

/**
 * 根据风险等级筛选预设模板
 */
export function getPresetsByRiskLevel(level: RiskLevel): PortfolioPreset[] {
  return PORTFOLIO_PRESETS.filter((p) => p.riskLevel === level)
}

/**
 * 获取风险等级的显示名称
 */
export function getRiskLevelLabel(level: RiskLevel): string {
  const labels: Record<RiskLevel, string> = {
    conservative: '保守',
    balanced: '平衡',
    aggressive: '激进',
  }
  return labels[level]
}

/**
 * 获取风险等级的颜色类名
 */
export function getRiskLevelColor(level: RiskLevel): {
  bg: string
  text: string
} {
  const colors: Record<RiskLevel, { bg: string; text: string }> = {
    conservative: {
      bg: 'bg-emerald-100 dark:bg-emerald-500/20',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
    balanced: {
      bg: 'bg-blue-100 dark:bg-blue-500/20',
      text: 'text-blue-600 dark:text-blue-400',
    },
    aggressive: {
      bg: 'bg-red-100 dark:bg-red-500/20',
      text: 'text-red-600 dark:text-red-400',
    },
  }
  return colors[level]
}
