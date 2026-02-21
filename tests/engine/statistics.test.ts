import { describe, it, expect } from 'vitest'
import {
  percentile,
  mean,
  median,
  standardDeviation,
  maxDrawdown,
  calculateStatistics,
  formatMoney,
  formatPercent,
  annualToMonthlyInflation,
  calculateCumulativeInflation,
  calculateRealValue,
  calculateRealReturn,
  sharpeRatio,
  sortinoRatio,
  valueAtRisk,
  conditionalVaR,
  calculateRiskMetrics,
} from '@/engine/statistics'
import type { SimulationPath } from '@/engine/types'

function buildPath(values: number[], initialInvestment: number = 100): SimulationPath {
  const states = values.map((value, index) => ({
    month: index,
    equityAsset: value,
    bondAsset: 0,
    totalAsset: value,
    equityRatio: value > 0 ? 1 : 0,
    cumulativeInvestment: initialInvestment,
    profit: value - initialInvestment,
    profitRate: initialInvestment > 0 ? (value - initialInvestment) / initialInvestment : 0,
    cumulativeInflation: 0,
    realTotalAsset: value,
    realProfit: value - initialInvestment,
    realProfitRate: initialInvestment > 0 ? (value - initialInvestment) / initialInvestment : 0,
  }))

  const finalState = states[states.length - 1]

  return {
    states,
    finalValue: finalState?.totalAsset ?? 0,
    maxDrawdown: maxDrawdown(values),
    totalReturn: finalState?.profitRate ?? 0,
  }
}

describe('统计函数', () => {
  describe('percentile', () => {
    it('应正确计算分位数', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

      expect(percentile(data, 0)).toBe(1)
      expect(percentile(data, 100)).toBe(10)
      expect(percentile(data, 50)).toBeCloseTo(5.5, 4)
      expect(percentile(data, 25)).toBeCloseTo(3.25, 4)
      expect(percentile(data, 75)).toBeCloseTo(7.75, 4)
    })

    it('应正确处理未排序数组', () => {
      const data = [5, 1, 9, 3, 7, 2, 8, 4, 6, 10]
      expect(percentile(data, 50)).toBeCloseTo(5.5, 4)
    })

    it('空数组返回0', () => {
      expect(percentile([], 50)).toBe(0)
    })

    it('单元素数组', () => {
      expect(percentile([100], 50)).toBe(100)
      expect(percentile([100], 0)).toBe(100)
      expect(percentile([100], 100)).toBe(100)
    })
  })

  describe('mean', () => {
    it('应正确计算均值', () => {
      expect(mean([1, 2, 3, 4, 5])).toBe(3)
      expect(mean([10, 20, 30])).toBe(20)
    })

    it('空数组返回0', () => {
      expect(mean([])).toBe(0)
    })

    it('单元素数组', () => {
      expect(mean([42])).toBe(42)
    })
  })

  describe('median', () => {
    it('应正确计算中位数（奇数个元素）', () => {
      expect(median([1, 2, 3, 4, 5])).toBe(3)
    })

    it('应正确计算中位数（偶数个元素）', () => {
      expect(median([1, 2, 3, 4])).toBeCloseTo(2.5, 4)
    })
  })

  describe('standardDeviation', () => {
    it('应正确计算标准差', () => {
      // [2, 4, 4, 4, 5, 5, 7, 9] 的标准差约为 2
      const data = [2, 4, 4, 4, 5, 5, 7, 9]
      expect(standardDeviation(data)).toBeCloseTo(2, 0)
    })

    it('相同值的标准差为0', () => {
      expect(standardDeviation([5, 5, 5, 5])).toBe(0)
    })

    it('空数组返回0', () => {
      expect(standardDeviation([])).toBe(0)
    })
  })

  describe('maxDrawdown', () => {
    it('应正确计算最大回撤', () => {
      const values = [100, 120, 90, 110, 80, 100]
      // 从120跌到80，回撤 (120-80)/120 = 33.33%
      expect(maxDrawdown(values)).toBeCloseTo(0.3333, 3)
    })

    it('单调上涨时回撤为0', () => {
      expect(maxDrawdown([100, 110, 120, 130])).toBe(0)
    })

    it('单调下跌时回撤从初始值计算', () => {
      const values = [100, 90, 80, 70]
      // 从100跌到70，回撤30%
      expect(maxDrawdown(values)).toBeCloseTo(0.3, 4)
    })
  })

  describe('formatMoney', () => {
    it('应正确格式化金额', () => {
      expect(formatMoney(1000)).toBe('1000元')
      expect(formatMoney(10000)).toBe('1.00万')
      expect(formatMoney(123456)).toBe('12.35万')
      expect(formatMoney(280000)).toBe('28.00万')
    })
  })

  describe('formatPercent', () => {
    it('应正确格式化百分比', () => {
      expect(formatPercent(0.1)).toBe('10.00%')
      expect(formatPercent(0.1234)).toBe('12.34%')
      expect(formatPercent(0.1234, 1)).toBe('12.3%')
      expect(formatPercent(-0.05)).toBe('-5.00%')
    })
  })

  describe('通胀计算函数', () => {
    describe('annualToMonthlyInflation', () => {
      it('应该正确将年化通胀率转换为月通胀率', () => {
        const monthly = annualToMonthlyInflation(0.03) // 3% 年化
        expect(monthly).toBeCloseTo(0.002466, 6)
      })

      it('零通胀率应该返回0', () => {
        expect(annualToMonthlyInflation(0)).toBe(0)
      })

      it('负通胀率应该返回负值', () => {
        const monthly = annualToMonthlyInflation(-0.02) // -2% 年化
        expect(monthly).toBeLessThan(0)
      })
    })

    describe('calculateCumulativeInflation', () => {
      it('12个月后的累计通胀应该接近年化通胀率', () => {
        const cumulative = calculateCumulativeInflation(0.025, 12)
        expect(cumulative).toBeCloseTo(0.025, 3)
      })

      it('0个月应该返回0', () => {
        expect(calculateCumulativeInflation(0.03, 0)).toBe(0)
      })

      it('24个月后的累计通胀应该约为年化的平方', () => {
        const cumulative = calculateCumulativeInflation(0.025, 24)
        const expected = Math.pow(1.025, 2) - 1 // (1+r)^2 - 1
        expect(cumulative).toBeCloseTo(expected, 4)
      })

      it('60个月（5年）后的累计通胀应该正确', () => {
        const cumulative = calculateCumulativeInflation(0.02, 60)
        const expected = Math.pow(1.02, 5) - 1
        expect(cumulative).toBeCloseTo(expected, 4)
      })
    })

    describe('calculateRealValue', () => {
      it('应该正确计算实际购买力', () => {
        const nominal = 110000 // 名义值
        const cumulativeInflation = 0.1 // 10% 累计通胀
        const real = calculateRealValue(nominal, cumulativeInflation)
        expect(real).toBeCloseTo(100000, 0)
      })

      it('零通胀时实际值等于名义值', () => {
        expect(calculateRealValue(100000, 0)).toBe(100000)
      })

      it('高通胀时实际值应该远小于名义值', () => {
        const real = calculateRealValue(100000, 0.5) // 50% 累计通胀
        expect(real).toBeCloseTo(66666.67, 0)
      })
    })

    describe('calculateRealReturn', () => {
      it('应该正确计算实际收益率', () => {
        const nominalReturn = 0.1 // 10% 名义收益
        const inflation = 0.03 // 3% 通胀
        const realReturn = calculateRealReturn(nominalReturn, inflation)
        // 实际收益率 = (1 + 0.1) / (1 + 0.03) - 1 ≈ 0.068
        expect(realReturn).toBeCloseTo(0.068, 3)
      })

      it('名义收益率等于通胀率时实际收益率为0', () => {
        expect(calculateRealReturn(0.03, 0.03)).toBeCloseTo(0, 6)
      })

      it('负通胀（通缩）时实际收益率应该更高', () => {
        const realReturn = calculateRealReturn(0.05, -0.02)
        expect(realReturn).toBeGreaterThan(0.05)
      })
    })
  })

  describe('风险指标函数', () => {
    describe('sharpeRatio', () => {
      it('应该正确计算夏普比率', () => {
        // 使用有变化的收益率数组
        const returns = [0.06, 0.04, 0.05, 0.07, 0.03]
        const sr = sharpeRatio(returns, 0.02, 12)
        // 平均收益 5%，标准差 > 0，无风险利率 2%
        expect(sr).toBeDefined()
        expect(typeof sr).toBe('number')
      })

      it('空数组应该返回0', () => {
        expect(sharpeRatio([], 0.03)).toBe(0)
      })

      it('应按公式精确计算（年期=1、无风险利率=0）', () => {
        const returns = [0.1, 0.2, 0.3]
        const sr = sharpeRatio(returns, 0, 1)
        expect(sr).toBeCloseTo(2.449489743, 6)
      })

      it('高波动率应该导致较低夏普比率', () => {
        // 低波动率：收益在4%-6%之间
        const lowVolReturns = [0.05, 0.06, 0.04, 0.05, 0.05]
        // 高波动率：收益在-5%到25%之间
        const highVolReturns = [0.15, -0.05, 0.25, -0.15, 0.05]

        const srLow = sharpeRatio(lowVolReturns, 0.03, 12)
        const srHigh = sharpeRatio(highVolReturns, 0.03, 12)

        expect(srLow).toBeGreaterThan(srHigh)
      })
    })

    describe('sortinoRatio', () => {
      it('只有正收益时索提诺比率应该很高', () => {
        const returns = [0.05, 0.06, 0.04, 0.07, 0.05]
        const sr = sortinoRatio(returns, 0.03, 12)
        expect(sr).toBeGreaterThan(0)
      })

      it('空数组应该返回0', () => {
        expect(sortinoRatio([], 0.03)).toBe(0)
      })

      it('应按下行偏差公式精确计算（年期=1、无风险利率=0）', () => {
        const returns = [-0.1, 0.1, 0.2]
        const sr = sortinoRatio(returns, 0, 1)
        expect(sr).toBeCloseTo(2 / 3, 6)
      })

      it('有负收益时应该降低索提诺比率', () => {
        const allPositive = [0.05, 0.06, 0.04, 0.07, 0.05]
        const withNegative = [0.05, -0.02, 0.04, -0.01, 0.05]

        const srPositive = sortinoRatio(allPositive, 0.02, 12)
        const srNegative = sortinoRatio(withNegative, 0.02, 12)

        expect(srPositive).toBeGreaterThan(srNegative)
      })

      it('当所有收益都高于无风险收益时应返回 Infinity', () => {
        const returns = [0.05, 0.06, 0.07]
        expect(sortinoRatio(returns, 0.01, 1)).toBe(Infinity)
      })
    })

    describe('valueAtRisk', () => {
      it('应该正确计算95% VaR', () => {
        // 100个从1到100的值
        const values = Array.from({ length: 100 }, (_, i) => i + 1)
        const var95 = valueAtRisk(values, 95)
        // 5%分位数应该在5-6之间（插值）
        expect(var95).toBeGreaterThanOrEqual(5)
        expect(var95).toBeLessThanOrEqual(6)
      })

      it('空数组应该返回0', () => {
        expect(valueAtRisk([], 95)).toBe(0)
      })

      it('VaR应该小于等于最大值', () => {
        const values = [100, 200, 300, 400, 500]
        const var95 = valueAtRisk(values, 95)
        expect(var95).toBeLessThanOrEqual(500)
      })
    })

    describe('conditionalVaR', () => {
      it('CVaR应该小于等于VaR', () => {
        const values = Array.from({ length: 100 }, (_, i) => i + 1)
        const var95 = valueAtRisk(values, 95)
        const cvar95 = conditionalVaR(values, 95)
        expect(cvar95).toBeLessThanOrEqual(var95)
      })

      it('空数组应该返回0', () => {
        expect(conditionalVaR([], 95)).toBe(0)
      })

      it('CVaR应该是尾部损失的平均值', () => {
        // 5%尾部（最小5个值）的平均值
        const values = Array.from({ length: 100 }, (_, i) => i + 1)
        const cvar95 = conditionalVaR(values, 95)
        // 1+2+3+4+5 / 5 = 3
        expect(cvar95).toBeCloseTo(3, 0)
      })

      it('当尾部样本数量为0时应返回最小值', () => {
        const values = [10, 20, 30]
        expect(conditionalVaR(values, 99)).toBe(10)
      })
    })

    describe('calculateStatistics', () => {
      it('空路径应返回全零统计并保留置信区间', () => {
        const confidenceBands = [
          {
            month: 0,
            median: 100,
            p5: 80,
            p25: 90,
            p75: 110,
            p95: 120,
            realMedian: 100,
            realP5: 80,
            realP95: 120,
          },
        ]

        const stats = calculateStatistics([], confidenceBands, 0.03)

        expect(stats.finalValueMean).toBe(0)
        expect(stats.returnMean).toBe(0)
        expect(stats.lossProbability).toBe(0)
        expect(stats.riskMetrics.maxDrawdownDuration).toBe(0)
        expect(stats.confidenceBands).toEqual(confidenceBands)
      })

      it('单路径应返回与路径一致的关键统计值', () => {
        const path = buildPath([100, 110, 121], 100)
        const stats = calculateStatistics([path], [], 0.03)

        expect(stats.finalValueMean).toBe(121)
        expect(stats.finalValueMedian).toBe(121)
        expect(stats.finalValueMin).toBe(121)
        expect(stats.finalValueMax).toBe(121)
        expect(stats.returnMean).toBeCloseTo(0.21, 8)
      })
    })

    describe('calculateRiskMetrics', () => {
      it('VaR 百分比应相对期末累计投入计算且不为负', () => {
        const paths: SimulationPath[] = [
          {
            states: [
              {
                month: 0,
                equityAsset: 100,
                bondAsset: 0,
                totalAsset: 100,
                equityRatio: 1,
                cumulativeInvestment: 100,
                profit: 0,
                profitRate: 0,
                cumulativeInflation: 0,
                realTotalAsset: 100,
                realProfit: 0,
                realProfitRate: 0,
              },
              {
                month: 1,
                equityAsset: 130,
                bondAsset: 0,
                totalAsset: 130,
                equityRatio: 1,
                cumulativeInvestment: 200,
                profit: -70,
                profitRate: -0.35,
                cumulativeInflation: 0,
                realTotalAsset: 130,
                realProfit: -70,
                realProfitRate: -0.35,
              },
            ],
            finalValue: 130,
            maxDrawdown: 0,
            totalReturn: -0.35,
          },
          {
            states: [
              {
                month: 0,
                equityAsset: 100,
                bondAsset: 0,
                totalAsset: 100,
                equityRatio: 1,
                cumulativeInvestment: 100,
                profit: 0,
                profitRate: 0,
                cumulativeInflation: 0,
                realTotalAsset: 100,
                realProfit: 0,
                realProfitRate: 0,
              },
              {
                month: 1,
                equityAsset: 150,
                bondAsset: 0,
                totalAsset: 150,
                equityRatio: 1,
                cumulativeInvestment: 200,
                profit: -50,
                profitRate: -0.25,
                cumulativeInflation: 0,
                realTotalAsset: 150,
                realProfit: -50,
                realProfitRate: -0.25,
              },
            ],
            finalValue: 150,
            maxDrawdown: 0,
            totalReturn: -0.25,
          },
          {
            states: [
              {
                month: 0,
                equityAsset: 100,
                bondAsset: 0,
                totalAsset: 100,
                equityRatio: 1,
                cumulativeInvestment: 100,
                profit: 0,
                profitRate: 0,
                cumulativeInflation: 0,
                realTotalAsset: 100,
                realProfit: 0,
                realProfitRate: 0,
              },
              {
                month: 1,
                equityAsset: 90,
                bondAsset: 0,
                totalAsset: 90,
                equityRatio: 1,
                cumulativeInvestment: 200,
                profit: -110,
                profitRate: -0.55,
                cumulativeInflation: 0,
                realTotalAsset: 90,
                realProfit: -110,
                realProfitRate: -0.55,
              },
            ],
            finalValue: 90,
            maxDrawdown: 0.1,
            totalReturn: -0.55,
          },
        ]

        const metrics = calculateRiskMetrics(paths, 0)
        expect(metrics.var95).toBeCloseTo(94, 6)
        expect(metrics.var95Percent).toBeCloseTo(0.53, 6)
        expect(metrics.var95Percent).toBeGreaterThanOrEqual(0)
      })

      it('应正确统计回撤持续期和恢复概率', () => {
        const recoveredPath = buildPath([100, 120, 90, 130], 100)
        const unrecoveredPath = buildPath([100, 95, 90, 85], 100)

        const metrics = calculateRiskMetrics([recoveredPath, unrecoveredPath], 0.03)

        expect(metrics.maxDrawdownDuration).toBe(3)
        expect(metrics.avgDrawdownDuration).toBeCloseTo(2, 8)
        expect(metrics.recoveryProbability).toBeCloseTo(0.5, 8)
      })
    })
  })
})
