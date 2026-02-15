import { describe, it, expect } from 'vitest'
import {
  PORTFOLIO_PRESETS,
  getPresetById,
  getPresetsByRiskLevel,
  getRiskLevelLabel,
  getRiskLevelColor,
} from '@/engine/presets'

describe('预设模板', () => {
  describe('PORTFOLIO_PRESETS', () => {
    it('应该包含5个预设模板', () => {
      expect(PORTFOLIO_PRESETS).toHaveLength(5)
    })

    it('每个预设应该包含所有必需字段', () => {
      PORTFOLIO_PRESETS.forEach((preset) => {
        expect(preset.id).toBeDefined()
        expect(preset.name).toBeDefined()
        expect(preset.description).toBeDefined()
        expect(preset.riskLevel).toBeDefined()
        expect(preset.initialEquityRatio).toBeGreaterThanOrEqual(0)
        expect(preset.initialEquityRatio).toBeLessThanOrEqual(1)
        expect(preset.equityReturn).toBeGreaterThan(-1)
        expect(preset.equityVolatility).toBeGreaterThanOrEqual(0)
      })
    })

    it('每个预设的ID应该唯一', () => {
      const ids = PORTFOLIO_PRESETS.map((p) => p.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })
  })

  describe('getPresetById', () => {
    it('应该根据ID返回正确的预设', () => {
      const preset = getPresetById('60-40-balanced')
      expect(preset).toBeDefined()
      expect(preset?.name).toBe('60/40 平衡组合')
    })

    it('应该返回三巨头组合预设', () => {
      const preset = getPresetById('three-fund')
      expect(preset).toBeDefined()
      expect(preset?.name).toBe('三巨头组合')
      expect(preset?.riskLevel).toBe('balanced')
    })

    it('不存在的ID应该返回undefined', () => {
      expect(getPresetById('non-existent')).toBeUndefined()
    })

    it('空字符串ID应该返回undefined', () => {
      expect(getPresetById('')).toBeUndefined()
    })
  })

  describe('getPresetsByRiskLevel', () => {
    it('应该返回指定风险等级的预设', () => {
      const conservative = getPresetsByRiskLevel('conservative')
      expect(conservative.length).toBeGreaterThan(0)
      conservative.forEach((p) => {
        expect(p.riskLevel).toBe('conservative')
      })
    })

    it('balanced风险等级应该有预设', () => {
      const balanced = getPresetsByRiskLevel('balanced')
      expect(balanced.length).toBeGreaterThanOrEqual(2)
    })

    it('aggressive风险等级应该有预设', () => {
      const aggressive = getPresetsByRiskLevel('aggressive')
      expect(aggressive.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('getRiskLevelLabel', () => {
    it('应该返回正确的中文标签', () => {
      expect(getRiskLevelLabel('conservative')).toBe('保守')
      expect(getRiskLevelLabel('balanced')).toBe('平衡')
      expect(getRiskLevelLabel('aggressive')).toBe('激进')
    })
  })

  describe('getRiskLevelColor', () => {
    it('应该返回保守等级的颜色类名', () => {
      const colors = getRiskLevelColor('conservative')
      expect(colors.bg).toContain('emerald')
      expect(colors.text).toContain('emerald')
    })

    it('应该返回平衡等级的颜色类名', () => {
      const colors = getRiskLevelColor('balanced')
      expect(colors.bg).toContain('blue')
      expect(colors.text).toContain('blue')
    })

    it('应该返回激进等级的颜色类名', () => {
      const colors = getRiskLevelColor('aggressive')
      expect(colors.bg).toContain('red')
      expect(colors.text).toContain('red')
    })
  })
})
