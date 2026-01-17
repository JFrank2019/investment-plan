import { describe, it, expect } from 'vitest'
import {
  percentile,
  mean,
  median,
  standardDeviation,
  maxDrawdown,
  formatMoney,
  formatPercent,
} from '@/engine/statistics'

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
})
