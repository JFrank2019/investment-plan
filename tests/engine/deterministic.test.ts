import { describe, it, expect } from 'vitest'
import {
  annualToMonthlyReturn,
  annualToQuarterlyReturn,
  weeklyToMonthlyInvestment,
  calculateMaxDrawdown,
  runDeterministicSimulation,
} from '@/engine/deterministic'
import { DEFAULT_PARAMS } from '@/engine/types'

describe('确定性计算引擎', () => {
  describe('annualToMonthlyReturn', () => {
    it('应正确将年化收益率转换为月收益率', () => {
      // 10% 年化 → 约 0.797% 月收益率
      const monthlyReturn = annualToMonthlyReturn(0.1)
      expect(monthlyReturn).toBeCloseTo(0.00797, 4)

      // 验证：月复利12次后应等于年化
      const annualFromMonthly = Math.pow(1 + monthlyReturn, 12) - 1
      expect(annualFromMonthly).toBeCloseTo(0.1, 6)
    })

    it('处理0收益率', () => {
      expect(annualToMonthlyReturn(0)).toBe(0)
    })

    it('处理负收益率', () => {
      const monthlyReturn = annualToMonthlyReturn(-0.1)
      const annualFromMonthly = Math.pow(1 + monthlyReturn, 12) - 1
      expect(annualFromMonthly).toBeCloseTo(-0.1, 6)
    })
  })

  describe('annualToQuarterlyReturn', () => {
    it('应正确将年化收益率转换为季度收益率', () => {
      // 10% 年化 → 约 2.41% 季度收益率
      const quarterlyReturn = annualToQuarterlyReturn(0.1)
      expect(quarterlyReturn).toBeCloseTo(0.0241, 3)

      // 验证：季复利4次后应等于年化
      const annualFromQuarterly = Math.pow(1 + quarterlyReturn, 4) - 1
      expect(annualFromQuarterly).toBeCloseTo(0.1, 6)
    })
  })

  describe('weeklyToMonthlyInvestment', () => {
    it('应正确计算每月定投金额', () => {
      // 每周2000元 → 每月约8666.67元 (2000 * 52/12)
      const monthly = weeklyToMonthlyInvestment(2000)
      expect(monthly).toBeCloseTo(8666.67, 0)
    })

    it('处理0定投', () => {
      expect(weeklyToMonthlyInvestment(0)).toBe(0)
    })
  })

  describe('calculateMaxDrawdown', () => {
    it('应正确计算最大回撤', () => {
      // 从120跌到80，最大回撤 = (120-80)/120 = 33.33%
      const values = [100, 120, 90, 110, 80, 100]
      expect(calculateMaxDrawdown(values)).toBeCloseTo(0.3333, 3)
    })

    it('单调上涨时最大回撤为0', () => {
      const values = [100, 110, 120, 130, 140]
      expect(calculateMaxDrawdown(values)).toBe(0)
    })

    it('空数组返回0', () => {
      expect(calculateMaxDrawdown([])).toBe(0)
    })

    it('处理单一高峰后持续下跌', () => {
      const values = [100, 200, 150, 100, 50]
      // 从200跌到50，回撤75%
      expect(calculateMaxDrawdown(values)).toBeCloseTo(0.75, 4)
    })
  })

  describe('runDeterministicSimulation', () => {
    it('应正确计算初始状态', () => {
      const result = runDeterministicSimulation(DEFAULT_PARAMS)

      // 初始状态（第0月）
      const initialState = result.path.states[0]
      expect(initialState.month).toBe(0)
      expect(initialState.totalAsset).toBe(DEFAULT_PARAMS.initialCapital)
      expect(initialState.equityRatio).toBeCloseTo(DEFAULT_PARAMS.initialEquityRatio, 4)
      expect(initialState.cumulativeInvestment).toBe(DEFAULT_PARAMS.initialCapital)
      expect(initialState.profit).toBe(0)
      expect(initialState.profitRate).toBe(0)
    })

    it('应生成正确数量的状态', () => {
      const result = runDeterministicSimulation(DEFAULT_PARAMS)
      // 0到12月，共13个状态
      expect(result.path.states.length).toBe(DEFAULT_PARAMS.simulationMonths + 1)
    })

    it('累计投资应正确累加', () => {
      const result = runDeterministicSimulation(DEFAULT_PARAMS)
      const finalState = result.path.states[result.path.states.length - 1]

      const monthlyInvestment = weeklyToMonthlyInvestment(DEFAULT_PARAMS.weeklyInvestment)
      const expectedCumulative =
        DEFAULT_PARAMS.initialCapital + monthlyInvestment * DEFAULT_PARAMS.simulationMonths

      expect(finalState.cumulativeInvestment).toBeCloseTo(expectedCumulative, 0)
    })

    it('无定投时资产应按复利增长', () => {
      const params = {
        ...DEFAULT_PARAMS,
        weeklyInvestment: 0,
        rebalancePeriod: 0, // 禁用再平衡
      }
      const result = runDeterministicSimulation(params)
      const finalState = result.path.states[result.path.states.length - 1]

      // 计算预期值
      const equityGrowth = Math.pow(1 + annualToMonthlyReturn(params.equityReturn), 12)
      const bondGrowth = Math.pow(1 + annualToMonthlyReturn(params.bondReturn), 12)
      const expectedEquity = params.initialCapital * params.initialEquityRatio * equityGrowth
      const expectedBond = params.initialCapital * (1 - params.initialEquityRatio) * bondGrowth
      const expectedTotal = expectedEquity + expectedBond

      expect(finalState.totalAsset).toBeCloseTo(expectedTotal, 0)
    })

    it('季度数据应正确提取', () => {
      const result = runDeterministicSimulation(DEFAULT_PARAMS)
      // 12个月：0, 3, 6, 9, 12 共5个季度点
      expect(result.quarterlyData.length).toBe(5)
      expect(result.quarterlyData.map((d) => d.month)).toEqual([0, 3, 6, 9, 12])
    })

    it('再平衡后股债比例应回归目标', () => {
      const params = {
        ...DEFAULT_PARAMS,
        rebalancePeriod: 6,
        rebalanceTargetEquityRatio: 0.5,
      }
      const result = runDeterministicSimulation(params)

      // 第6月后应该被再平衡
      const month6State = result.path.states[6]
      expect(month6State.equityRatio).toBeCloseTo(0.5, 4)

      // 第12月后也应该被再平衡
      const month12State = result.path.states[12]
      expect(month12State.equityRatio).toBeCloseTo(0.5, 4)
    })
  })
})
