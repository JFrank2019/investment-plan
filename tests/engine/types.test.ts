import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PARAMS,
  sanitizeSimulationParams,
  validateParams,
  type SimulationParams,
} from '@/engine/types'

describe('参数归一化与校验', () => {
  describe('sanitizeSimulationParams', () => {
    it('应在输入为 null/undefined/空对象时回退到默认参数', () => {
      expect(sanitizeSimulationParams(null)).toEqual(DEFAULT_PARAMS)
      expect(sanitizeSimulationParams(undefined)).toEqual(DEFAULT_PARAMS)
      expect(sanitizeSimulationParams({})).toEqual(DEFAULT_PARAMS)
    })

    it('应保留传入的合法字段并为缺失字段填充默认值', () => {
      const sanitized = sanitizeSimulationParams({
        initialCapital: 500000,
        simulationMonths: 36,
      })

      expect(sanitized.initialCapital).toBe(500000)
      expect(sanitized.simulationMonths).toBe(36)
      expect(sanitized.weeklyInvestment).toBe(DEFAULT_PARAMS.weeklyInvestment)
      expect(sanitized.bondReturn).toBe(DEFAULT_PARAMS.bondReturn)
    })

    it('应将 NaN 和 Infinity 等无效数值回退为默认值', () => {
      const sanitized = sanitizeSimulationParams({
        initialCapital: Number.NaN,
        initialEquityRatio: Number.POSITIVE_INFINITY,
        weeklyInvestment: Number.NEGATIVE_INFINITY,
      })

      expect(sanitized.initialCapital).toBe(DEFAULT_PARAMS.initialCapital)
      expect(sanitized.initialEquityRatio).toBe(DEFAULT_PARAMS.initialEquityRatio)
      expect(sanitized.weeklyInvestment).toBe(DEFAULT_PARAMS.weeklyInvestment)
    })

    it('应将数值裁剪到合法范围并处理整数字段', () => {
      const sanitized = sanitizeSimulationParams({
        initialCapital: -1,
        initialEquityRatio: 2,
        investEquityRatio: -0.1,
        equityReturn: 2,
        bondReturn: -2,
        equityVolatility: 2,
        bondVolatility: -1,
        rebalancePeriod: 5.7,
        rebalanceTargetEquityRatio: -1,
        simulationMonths: 0,
        monteCarloPathCount: 50,
        inflationRate: 2,
      })

      expect(sanitized.initialCapital).toBe(0)
      expect(sanitized.initialEquityRatio).toBe(1)
      expect(sanitized.investEquityRatio).toBe(0)
      expect(sanitized.equityReturn).toBe(0.5)
      expect(sanitized.bondReturn).toBe(-0.5)
      expect(sanitized.equityVolatility).toBe(1)
      expect(sanitized.bondVolatility).toBe(0)
      expect(sanitized.rebalancePeriod).toBe(6)
      expect(sanitized.rebalanceTargetEquityRatio).toBe(0)
      expect(sanitized.simulationMonths).toBe(1)
      expect(sanitized.monteCarloPathCount).toBe(100)
      expect(sanitized.inflationRate).toBe(0.5)
    })

    it('应在传入非法类型时回退到默认值', () => {
      const sanitized = sanitizeSimulationParams({
        initialCapital: 'abc' as unknown as number,
        simulationMonths: true as unknown as number,
      })

      expect(sanitized.initialCapital).toBe(DEFAULT_PARAMS.initialCapital)
      expect(sanitized.simulationMonths).toBe(DEFAULT_PARAMS.simulationMonths)
    })
  })

  describe('validateParams', () => {
    it('合法参数应返回空错误数组', () => {
      expect(validateParams(DEFAULT_PARAMS)).toEqual([])
    })

    it('边界值参数应通过校验', () => {
      const params: SimulationParams = {
        ...DEFAULT_PARAMS,
        initialCapital: 1,
        initialEquityRatio: 0,
        weeklyInvestment: 0,
        investEquityRatio: 1,
        equityReturn: -1,
        bondReturn: -0.5,
        equityVolatility: 1,
        bondVolatility: 0.5,
        rebalancePeriod: 120,
        rebalanceTargetEquityRatio: 1,
        simulationMonths: 600,
        monteCarloPathCount: 10000,
        inflationRate: -0.5,
      }

      expect(validateParams(params)).toEqual([])
    })

    it('超出边界时应返回对应错误消息', () => {
      const errors = validateParams({
        ...DEFAULT_PARAMS,
        initialCapital: 0,
      })

      expect(errors).toContain('初始资金必须大于0')
    })

    it('多个字段非法时应返回多条错误', () => {
      const errors = validateParams({
        ...DEFAULT_PARAMS,
        initialCapital: -1,
        initialEquityRatio: -0.1,
        weeklyInvestment: -100,
      })

      expect(errors.length).toBeGreaterThanOrEqual(3)
      expect(errors).toContain('初始资金必须大于0')
      expect(errors).toContain('初始偏股比例必须在0-1之间')
      expect(errors).toContain('每周定投金额不能为负')
    })

    it('rebalancePeriod 非整数时应报错', () => {
      const errors = validateParams({
        ...DEFAULT_PARAMS,
        rebalancePeriod: 2.5,
      })

      expect(errors).toContain('再平衡周期必须为0-120的整数（月）')
    })
  })
})
