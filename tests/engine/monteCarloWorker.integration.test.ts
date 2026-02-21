import '@vitest/web-worker'
import { describe, expect, it } from 'vitest'
import { DEFAULT_PARAMS } from '@/engine/types'
import { runMonteCarloSimulationOffMainThread } from '@/engine/monteCarloWorkerClient'

describe('monteCarloWorkerClient 集成测试', () => {
  it('应通过真实 Worker 通信返回模拟结果', async () => {
    const progress: number[] = []
    const result = await runMonteCarloSimulationOffMainThread(
      {
        ...DEFAULT_PARAMS,
        simulationMonths: 6,
        monteCarloPathCount: 64,
      },
      {
        onProgress: (p) => progress.push(p),
      },
    )

    expect(result.paths).toHaveLength(64)
    expect(result.statistics.confidenceBands).toHaveLength(7)
    expect(progress.length).toBeGreaterThan(0)
    expect(progress[progress.length - 1]).toBe(1)
  })
})
