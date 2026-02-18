import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'
import SimulatorView from '@/views/SimulatorView.vue'
import { useInvestmentStore } from '@/stores/investment'

describe('SimulatorView 主题一致性', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('亮色模式运行模拟后不应自动切换为暗色', async () => {
    localStorage.setItem('theme-preference', 'light')
    localStorage.setItem('vueuse-color-scheme', 'dark')

    const pinia = createPinia()
    const store = useInvestmentStore(pinia)

    store.hasCalculated = true
    store.runSimulation = vi.fn(async () => true)

    const wrapper = mount(SimulatorView, {
      global: {
        plugins: [pinia],
        stubs: {
          ConfigPanel: { template: '<div data-test="config-panel-stub" />' },
          StatsCards: { template: '<div data-test="stats-cards-stub" />' },
          RiskMetricsCard: { template: '<div data-test="risk-card-stub" />' },
          AssetGrowthChart: { template: '<div data-test="asset-chart-stub" />' },
          DistributionChart: { template: '<div data-test="distribution-chart-stub" />' },
          AllocationChart: { template: '<div data-test="allocation-chart-stub" />' },
          ConfirmDialog: { template: '<div data-test="confirm-dialog-stub" />' },
        },
      },
    })

    const runButton = wrapper.findAll('button').find((button) => button.text().includes('运行模拟'))
    expect(runButton).toBeTruthy()
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    await runButton!.trigger('click')
    await flushPromises()
    await flushPromises()

    expect(store.runSimulation).toHaveBeenCalledTimes(1)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
