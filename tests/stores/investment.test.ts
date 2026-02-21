import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import type { MonteCarloResult, PortfolioPreset } from '@/engine/types'
import { DEFAULT_PARAMS } from '@/engine'
import { PORTFOLIO_PRESETS } from '@/engine/presets'

const runMonteCarloSimulationOffMainThreadMock = vi.fn()
const cancelMonteCarloSimulationMock = vi.fn()

vi.mock('@vueuse/core', () => ({
  useLocalStorage: <T>(_key: string, initialValue: T) => ref(structuredClone(initialValue)),
}))

vi.mock('@/engine/monteCarloWorkerClient', async () => {
  const actual =
    await vi.importActual<typeof import('@/engine/monteCarloWorkerClient')>(
      '@/engine/monteCarloWorkerClient',
    )
  return {
    ...actual,
    runMonteCarloSimulationOffMainThread: runMonteCarloSimulationOffMainThreadMock,
    cancelMonteCarloSimulation: cancelMonteCarloSimulationMock,
  }
})

function createMockMonteCarloResult(): MonteCarloResult {
  return {
    paths: [],
    statistics: {
      finalValueMean: 100,
      finalValueMedian: 100,
      finalValueP5: 80,
      finalValueP25: 90,
      finalValueP75: 110,
      finalValueP95: 120,
      finalValueMin: 70,
      finalValueMax: 130,
      returnMean: 0.1,
      returnMedian: 0.1,
      returnP5: -0.05,
      returnP95: 0.2,
      maxDrawdownMean: 0.1,
      maxDrawdownP95: 0.2,
      lossProbability: 0.1,
      riskMetrics: {
        maxDrawdownMean: 0.1,
        maxDrawdownP95: 0.2,
        lossProbability: 0.1,
        sharpeRatio: 1.2,
        sortinoRatio: 1.4,
        var95: 80,
        var95Percent: 0.2,
        cvar95: 75,
        maxDrawdownDuration: 4,
        avgDrawdownDuration: 2,
        recoveryProbability: 0.8,
      },
      confidenceBands: [
        {
          month: 0,
          median: 100,
          p5: 90,
          p25: 95,
          p75: 105,
          p95: 110,
          realMedian: 100,
          realP5: 90,
          realP95: 110,
        },
      ],
    },
  }
}

describe('investment store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    runMonteCarloSimulationOffMainThreadMock.mockReset()
    cancelMonteCarloSimulationMock.mockReset()
    runMonteCarloSimulationOffMainThreadMock.mockResolvedValue(createMockMonteCarloResult())
  })

  it('updateParams 应归一化参数并重置 hasCalculated', async () => {
    const { useInvestmentStore } = await import('@/stores/investment')
    const store = useInvestmentStore()
    store.hasCalculated = true

    store.updateParams({
      initialEquityRatio: 2,
      simulationMonths: 0,
    })

    expect(store.params.initialEquityRatio).toBe(1)
    expect(store.params.simulationMonths).toBe(1)
    expect(store.hasCalculated).toBe(false)
  })

  it('resetParams 应恢复默认参数并清空结果与错误', async () => {
    const { useInvestmentStore } = await import('@/stores/investment')
    const store = useInvestmentStore()
    store.updateParams({ initialCapital: 500000 })
    store.errors = ['some error']
    store.hasCalculated = true
    store.monteCarloProgress = 0.6

    store.resetParams()

    expect(store.params).toEqual(DEFAULT_PARAMS)
    expect(store.deterministicResult).toBeNull()
    expect(store.monteCarloResult).toBeNull()
    expect(store.errors).toEqual([])
    expect(store.hasCalculated).toBe(false)
    expect(store.monteCarloProgress).toBe(0)
  })

  it('applyPreset 应覆盖预设字段并保留非预设字段', async () => {
    const { useInvestmentStore } = await import('@/stores/investment')
    const store = useInvestmentStore()
    const preset: PortfolioPreset = PORTFOLIO_PRESETS[0]!
    store.updateParams({ initialCapital: 888888 })

    store.applyPreset(preset)

    expect(store.params.initialCapital).toBe(888888)
    expect(store.params.initialEquityRatio).toBe(preset.initialEquityRatio)
    expect(store.params.equityReturn).toBe(preset.equityReturn)
    expect(store.hasCalculated).toBe(false)
  })

  it('runSimulation 参数非法时应返回 false 且不调用蒙特卡洛', async () => {
    const { useInvestmentStore } = await import('@/stores/investment')
    const store = useInvestmentStore()
    store.updateParams({ initialCapital: 0 })

    const ok = await store.runSimulation()

    expect(ok).toBe(false)
    expect(store.errors).toContain('初始资金必须大于0')
    expect(runMonteCarloSimulationOffMainThreadMock).not.toHaveBeenCalled()
  })

  it('runSimulation 正常完成后应写入结果并更新状态', async () => {
    const { useInvestmentStore } = await import('@/stores/investment')
    const store = useInvestmentStore()

    const ok = await store.runSimulation()

    expect(ok).toBe(true)
    expect(store.hasCalculated).toBe(true)
    expect(store.isCalculating).toBe(false)
    expect(store.monteCarloProgress).toBe(1)
    expect(store.deterministicResult).not.toBeNull()
    expect(store.monteCarloResult).toEqual(createMockMonteCarloResult())
  })

  it('计算进行中重复调用 runSimulation 应立即返回 false', async () => {
    const { useInvestmentStore } = await import('@/stores/investment')
    const store = useInvestmentStore()
    let resolvePending: ((value: MonteCarloResult) => void) | undefined
    const pending = new Promise<MonteCarloResult>((resolve) => {
      resolvePending = resolve
    })
    runMonteCarloSimulationOffMainThreadMock.mockReturnValueOnce(pending)

    const firstCall = store.runSimulation()
    const secondCallResult = await store.runSimulation()
    resolvePending?.(createMockMonteCarloResult())
    await firstCall

    expect(secondCallResult).toBe(false)
  })

  it('cancelSimulation 应调用取消函数并重置运行状态', async () => {
    const { useInvestmentStore } = await import('@/stores/investment')
    const store = useInvestmentStore()
    let resolvePending: ((value: MonteCarloResult) => void) | undefined
    const pending = new Promise<MonteCarloResult>((resolve) => {
      resolvePending = resolve
    })
    runMonteCarloSimulationOffMainThreadMock.mockReturnValueOnce(pending)

    const running = store.runSimulation()
    store.cancelSimulation()
    resolvePending?.(createMockMonteCarloResult())
    await running

    expect(cancelMonteCarloSimulationMock).toHaveBeenCalledTimes(1)
    expect(store.isCalculating).toBe(false)
    expect(store.monteCarloProgress).toBe(0)
  })

  it('蒙特卡洛取消错误应返回 false 且不写入 errors', async () => {
    const { useInvestmentStore } = await import('@/stores/investment')
    const { MonteCarloCancelledError } = await import('@/engine/monteCarloWorkerClient')
    const store = useInvestmentStore()
    runMonteCarloSimulationOffMainThreadMock.mockRejectedValueOnce(new MonteCarloCancelledError())

    const ok = await store.runSimulation()

    expect(ok).toBe(false)
    expect(store.errors).toEqual([])
    expect(store.monteCarloProgress).toBe(0)
  })

  it('warnings 应在高收益假设下返回分级警告', async () => {
    const { useInvestmentStore } = await import('@/stores/investment')
    const store = useInvestmentStore()

    store.updateParams({ equityReturn: 0.25 })
    expect(store.warnings.length).toBe(1)

    store.updateParams({ equityReturn: 0.31 })
    expect(store.warnings.length).toBe(2)
  })
})
