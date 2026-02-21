import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_PARAMS, type MonteCarloResult } from '@/engine/types'

const mockResult: MonteCarloResult = {
  paths: [],
  statistics: {
    finalValueMean: 0,
    finalValueMedian: 0,
    finalValueP5: 0,
    finalValueP25: 0,
    finalValueP75: 0,
    finalValueP95: 0,
    finalValueMin: 0,
    finalValueMax: 0,
    returnMean: 0,
    returnMedian: 0,
    returnP5: 0,
    returnP95: 0,
    maxDrawdownMean: 0,
    maxDrawdownP95: 0,
    lossProbability: 0,
    riskMetrics: {
      maxDrawdownMean: 0,
      maxDrawdownP95: 0,
      lossProbability: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      var95: 0,
      var95Percent: 0,
      cvar95: 0,
      maxDrawdownDuration: 0,
      avgDrawdownDuration: 0,
      recoveryProbability: 0,
    },
    confidenceBands: [],
  },
}

function setGlobalWorker(workerCtor: unknown) {
  Object.defineProperty(globalThis, 'Worker', {
    value: workerCtor,
    writable: true,
    configurable: true,
  })
}

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  vi.resetModules()
  vi.doUnmock('@/engine/monteCarlo')
  Reflect.deleteProperty(globalThis, 'Worker')
})

describe('monteCarloWorkerClient', () => {
  it('Worker 不可用时应回退到主线程执行并上报进度', async () => {
    const runMonteCarloSimulation = vi.fn().mockImplementation((_params, _rf, options) => {
      options?.onProgress?.(5, 10)
      return Promise.resolve(mockResult)
    })
    vi.doMock('@/engine/monteCarlo', () => ({ runMonteCarloSimulation }))

    const { runMonteCarloSimulationOffMainThread } = await import('@/engine/monteCarloWorkerClient')
    const onProgress = vi.fn()
    const result = await runMonteCarloSimulationOffMainThread(DEFAULT_PARAMS, { onProgress })

    expect(runMonteCarloSimulation).toHaveBeenCalledTimes(1)
    expect(onProgress).toHaveBeenCalledWith(0.5)
    expect(result).toEqual(mockResult)
  })

  it('应导出可识别的取消错误类型', async () => {
    const { MonteCarloCancelledError } = await import('@/engine/monteCarloWorkerClient')
    const error = new MonteCarloCancelledError()

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('MonteCarloCancelledError')
    expect(error.message).toBe('蒙特卡洛计算已取消')
  })

  it('应在 Worker 模式下处理 progress 和 success 消息', async () => {
    const runMonteCarloSimulation = vi.fn()
    vi.doMock('@/engine/monteCarlo', () => ({ runMonteCarloSimulation }))

    class MockWorker {
      static instances: MockWorker[] = []
      onmessage: ((event: MessageEvent) => void) | null = null
      onerror: ((event: ErrorEvent) => void) | null = null
      postMessage = vi.fn()
      terminate = vi.fn()
      constructor() {
        MockWorker.instances.push(this)
      }
    }
    setGlobalWorker(MockWorker)

    const { runMonteCarloSimulationOffMainThread } = await import('@/engine/monteCarloWorkerClient')
    const onProgress = vi.fn()

    const pending = runMonteCarloSimulationOffMainThread(DEFAULT_PARAMS, { onProgress })
    const worker = MockWorker.instances[0]
    expect(worker).toBeDefined()
    if (!worker) {
      throw new Error('worker instance should be created')
    }

    worker.onmessage?.({
      data: { type: 'progress', id: 1, completed: 1, total: 4 },
    } as MessageEvent)
    worker.onmessage?.({
      data: { type: 'success', id: 1, result: mockResult },
    } as MessageEvent)

    await expect(pending).resolves.toEqual(mockResult)
    expect(onProgress).toHaveBeenCalledWith(0.25)
    expect(runMonteCarloSimulation).not.toHaveBeenCalled()
  })

  it('应在 Worker 返回 error 消息时 reject', async () => {
    vi.doMock('@/engine/monteCarlo', () => ({ runMonteCarloSimulation: vi.fn() }))

    class MockWorker {
      static instances: MockWorker[] = []
      onmessage: ((event: MessageEvent) => void) | null = null
      onerror: ((event: ErrorEvent) => void) | null = null
      postMessage = vi.fn()
      terminate = vi.fn()
      constructor() {
        MockWorker.instances.push(this)
      }
    }
    setGlobalWorker(MockWorker)

    const { runMonteCarloSimulationOffMainThread } = await import('@/engine/monteCarloWorkerClient')
    const pending = runMonteCarloSimulationOffMainThread(DEFAULT_PARAMS)
    const worker = MockWorker.instances[0]
    if (!worker) {
      throw new Error('worker instance should be created')
    }

    worker.onmessage?.({
      data: { type: 'error', id: 1, error: 'boom' },
    } as MessageEvent)

    await expect(pending).rejects.toThrow('boom')
  })

  it('取消计算时应终止 Worker 并返回取消错误', async () => {
    vi.doMock('@/engine/monteCarlo', () => ({ runMonteCarloSimulation: vi.fn() }))

    class MockWorker {
      static instances: MockWorker[] = []
      onmessage: ((event: MessageEvent) => void) | null = null
      onerror: ((event: ErrorEvent) => void) | null = null
      postMessage = vi.fn()
      terminate = vi.fn()
      constructor() {
        MockWorker.instances.push(this)
      }
    }
    setGlobalWorker(MockWorker)

    const { runMonteCarloSimulationOffMainThread, cancelMonteCarloSimulation, MonteCarloCancelledError } =
      await import('@/engine/monteCarloWorkerClient')

    const pending = runMonteCarloSimulationOffMainThread(DEFAULT_PARAMS)
    const worker = MockWorker.instances[0]
    if (!worker) {
      throw new Error('worker instance should be created')
    }
    cancelMonteCarloSimulation()

    await expect(pending).rejects.toBeInstanceOf(MonteCarloCancelledError)
    expect(worker.terminate).toHaveBeenCalledTimes(1)
  })

  it('Worker 创建失败时应抛出错误', async () => {
    vi.doMock('@/engine/monteCarlo', () => ({ runMonteCarloSimulation: vi.fn() }))

    class BrokenWorker {
      constructor() {
        throw new Error('init failed')
      }
    }
    setGlobalWorker(BrokenWorker)

    const { runMonteCarloSimulationOffMainThread } = await import('@/engine/monteCarloWorkerClient')

    await expect(runMonteCarloSimulationOffMainThread(DEFAULT_PARAMS)).rejects.toThrow('init failed')
  })
})
