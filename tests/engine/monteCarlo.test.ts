import { describe, it, expect } from 'vitest'
import {
  convertToMonthlyParams,
  randomNormal,
  randomNormalWithParams,
  runMonteCarloSimulation,
  runMonteCarloSimulationBatched,
} from '@/engine/monteCarlo'
import { DEFAULT_PARAMS } from '@/engine/types'
import { mean, standardDeviation } from '@/engine/statistics'

describe('蒙特卡洛模拟引擎', () => {
  describe('randomNormal', () => {
    it('应生成近似标准正态分布的随机数', () => {
      const samples: number[] = []
      for (let i = 0; i < 10000; i++) {
        samples.push(randomNormal())
      }

      // 均值应接近0
      expect(mean(samples)).toBeCloseTo(0, 1)
      // 标准差应接近1
      expect(standardDeviation(samples)).toBeCloseTo(1, 1)
    })
  })

  describe('参数转换与随机分布工具', () => {
    it('convertToMonthlyParams 应正确换算月度参数', () => {
      const annualReturn = 0.12
      const annualVolatility = 0.24
      const monthly = convertToMonthlyParams(annualReturn, annualVolatility)

      expect(monthly.monthlyReturn).toBeCloseTo(0.01, 8)
      expect(monthly.monthlyVolatility).toBeCloseTo(0.24 / Math.sqrt(12), 8)
    })

    it('randomNormalWithParams 应生成接近目标均值和标准差的样本', () => {
      const samples: number[] = []
      const targetMean = 0.02
      const targetStd = 0.05

      for (let i = 0; i < 8000; i++) {
        samples.push(randomNormalWithParams(targetMean, targetStd))
      }

      expect(mean(samples)).toBeCloseTo(targetMean, 2)
      expect(standardDeviation(samples)).toBeCloseTo(targetStd, 2)
    })
  })

  describe('runMonteCarloSimulation', () => {
    it('应生成指定数量的模拟路径', () => {
      const params = { ...DEFAULT_PARAMS, monteCarloPathCount: 100 }
      const result = runMonteCarloSimulation(params)

      expect(result.paths.length).toBe(100)
    })

    it('每条路径应有正确数量的状态', () => {
      const params = { ...DEFAULT_PARAMS, monteCarloPathCount: 10 }
      const result = runMonteCarloSimulation(params)

      for (const path of result.paths) {
        expect(path.states.length).toBe(params.simulationMonths + 1)
      }
    })

    it('统计数据应完整', () => {
      const params = { ...DEFAULT_PARAMS, monteCarloPathCount: 100 }
      const result = runMonteCarloSimulation(params)

      expect(result.statistics.finalValueMean).toBeGreaterThan(0)
      expect(result.statistics.finalValueMedian).toBeGreaterThan(0)
      expect(result.statistics.finalValueP5).toBeLessThanOrEqual(result.statistics.finalValueP95)
      expect(result.statistics.lossProbability).toBeGreaterThanOrEqual(0)
      expect(result.statistics.lossProbability).toBeLessThanOrEqual(1)
    })

    it('置信区间应有正确数量的数据点', () => {
      const params = { ...DEFAULT_PARAMS, monteCarloPathCount: 100 }
      const result = runMonteCarloSimulation(params)

      expect(result.statistics.confidenceBands.length).toBe(params.simulationMonths + 1)
    })

    it('中位数应在5%和95%分位数之间', () => {
      const params = { ...DEFAULT_PARAMS, monteCarloPathCount: 500 }
      const result = runMonteCarloSimulation(params)

      expect(result.statistics.finalValueMedian).toBeGreaterThanOrEqual(
        result.statistics.finalValueP5,
      )
      expect(result.statistics.finalValueMedian).toBeLessThanOrEqual(
        result.statistics.finalValueP95,
      )
    })

    it('大量模拟时均值应接近确定性结果', () => {
      // 使用0波动率使蒙特卡洛退化为确定性
      const params = {
        ...DEFAULT_PARAMS,
        equityVolatility: 0,
        bondVolatility: 0,
        monteCarloPathCount: 10,
      }
      const result = runMonteCarloSimulation(params)

      // 所有路径的终值应该相同
      const finalValues = result.paths.map((p) => p.finalValue)
      const variance =
        finalValues.reduce((sum, v) => sum + Math.pow(v - finalValues[0]!, 2), 0) /
        finalValues.length
      expect(variance).toBeLessThan(1) // 几乎为0
    })
  })

  describe('风险指标计算', () => {
    it('应该计算完整的风险指标', () => {
      const params = {
        ...DEFAULT_PARAMS,
        monteCarloPathCount: 100,
        simulationMonths: 12,
      }
      const result = runMonteCarloSimulation(params)
      const rm = result.statistics.riskMetrics

      expect(rm).toBeDefined()
      expect(rm.sharpeRatio).toBeDefined()
      expect(rm.sortinoRatio).toBeDefined()
      expect(rm.var95).toBeDefined()
      expect(rm.var95Percent).toBeDefined()
      expect(rm.maxDrawdownDuration).toBeGreaterThanOrEqual(0)
      expect(rm.recoveryProbability).toBeGreaterThanOrEqual(0)
      expect(rm.recoveryProbability).toBeLessThanOrEqual(1)
    })

    it('亏损概率应该在0到1之间', () => {
      const params = { ...DEFAULT_PARAMS, monteCarloPathCount: 100 }
      const result = runMonteCarloSimulation(params)

      expect(result.statistics.riskMetrics.lossProbability).toBeGreaterThanOrEqual(0)
      expect(result.statistics.riskMetrics.lossProbability).toBeLessThanOrEqual(1)
    })

    it('最大回撤平均值应该在0到1之间', () => {
      const params = { ...DEFAULT_PARAMS, monteCarloPathCount: 100 }
      const result = runMonteCarloSimulation(params)

      expect(result.statistics.riskMetrics.maxDrawdownMean).toBeGreaterThanOrEqual(0)
      expect(result.statistics.riskMetrics.maxDrawdownMean).toBeLessThanOrEqual(1)
    })

    it('高波动率应该导致更低的夏普比率', () => {
      const lowVolParams = {
        ...DEFAULT_PARAMS,
        equityVolatility: 0.1,
        monteCarloPathCount: 200,
      }
      const highVolParams = {
        ...DEFAULT_PARAMS,
        equityVolatility: 0.3,
        monteCarloPathCount: 200,
      }

      const lowVolResult = runMonteCarloSimulation(lowVolParams)
      const highVolResult = runMonteCarloSimulation(highVolParams)

      expect(lowVolResult.statistics.riskMetrics.sharpeRatio).toBeGreaterThan(
        highVolResult.statistics.riskMetrics.sharpeRatio,
      )
    })
  })

  describe('runMonteCarloSimulationBatched', () => {
    it('应生成指定数量路径并正确上报进度', async () => {
      const params = { ...DEFAULT_PARAMS, monteCarloPathCount: 64, simulationMonths: 3 }
      const progressEvents: Array<{ completed: number; total: number }> = []

      const result = await runMonteCarloSimulationBatched(params, 0.03, {
        chunkSize: 8,
        yieldIntervalMs: 16,
        onProgress: (completed, total) => progressEvents.push({ completed, total }),
      })

      expect(result.paths.length).toBe(params.monteCarloPathCount)
      expect(progressEvents.length).toBeGreaterThan(0)
      expect(progressEvents[progressEvents.length - 1]!).toEqual({
        completed: params.monteCarloPathCount,
        total: params.monteCarloPathCount,
      })
    })

    it('零波动率下 batched 结果应与同步版本一致', async () => {
      const params = {
        ...DEFAULT_PARAMS,
        monteCarloPathCount: 12,
        simulationMonths: 6,
        equityVolatility: 0,
        bondVolatility: 0,
      }

      const sync = runMonteCarloSimulation(params)
      const batched = await runMonteCarloSimulationBatched(params)

      expect(batched.paths.map((p) => p.finalValue)).toEqual(sync.paths.map((p) => p.finalValue))
      expect(batched.statistics.finalValueMedian).toBeCloseTo(sync.statistics.finalValueMedian, 10)
    })
  })

  describe('极端参数场景', () => {
    it('初始资金与定投都为0时应稳定返回非负资产', () => {
      const params = {
        ...DEFAULT_PARAMS,
        simulationMonths: 1,
        initialCapital: 0,
        weeklyInvestment: 0,
        monteCarloPathCount: 5,
      }
      const result = runMonteCarloSimulation(params)

      expect(result.paths).toHaveLength(5)
      result.paths.forEach((path) => {
        expect(path.states).toHaveLength(2)
        expect(path.finalValue).toBeGreaterThanOrEqual(0)
        expect(path.states[1]?.cumulativeInvestment).toBe(0)
      })
    })

    it('每月再平衡时应回归目标仓位', () => {
      const params = {
        ...DEFAULT_PARAMS,
        simulationMonths: 4,
        monteCarloPathCount: 3,
        equityVolatility: 0,
        bondVolatility: 0,
        rebalancePeriod: 1,
        rebalanceTargetEquityRatio: 0.4,
      }
      const result = runMonteCarloSimulation(params)

      result.paths.forEach((path) => {
        for (let month = 1; month <= params.simulationMonths; month++) {
          expect(path.states[month]?.equityRatio).toBeCloseTo(0.4, 8)
        }
      })
    })
  })

  describe('通胀调整', () => {
    it('应该计算实际购买力的置信区间', () => {
      const params = {
        ...DEFAULT_PARAMS,
        monteCarloPathCount: 100,
        simulationMonths: 12,
        inflationRate: 0.025,
      }
      const result = runMonteCarloSimulation(params)

      // 检查置信区间包含实际购买力数据
      const finalBand = result.statistics.confidenceBands[params.simulationMonths]!
      expect(finalBand.realMedian).toBeDefined()
      expect(finalBand.realP5).toBeDefined()
      expect(finalBand.realP95).toBeDefined()

      // 实际中位数应该在P5和P95之间
      expect(finalBand.realMedian).toBeGreaterThanOrEqual(finalBand.realP5!)
      expect(finalBand.realMedian).toBeLessThanOrEqual(finalBand.realP95!)
    })

    it('实际购买力应该小于名义值', () => {
      const params = {
        ...DEFAULT_PARAMS,
        monteCarloPathCount: 100,
        simulationMonths: 24,
        inflationRate: 0.03,
      }
      const result = runMonteCarloSimulation(params)

      const finalBand = result.statistics.confidenceBands[params.simulationMonths]!
      expect(finalBand.realMedian).toBeLessThan(finalBand.median)
    })

    it('零通胀时实际值等于名义值', () => {
      const params = {
        ...DEFAULT_PARAMS,
        monteCarloPathCount: 100,
        simulationMonths: 12,
        inflationRate: 0,
      }
      const result = runMonteCarloSimulation(params)

      const finalBand = result.statistics.confidenceBands[params.simulationMonths]!
      expect(finalBand.realMedian).toBeCloseTo(finalBand.median, 0)
    })
  })
})
