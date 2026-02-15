/// <reference lib="webworker" />

import { runMonteCarloSimulationBatched } from './monteCarlo'
import type { MonteCarloResult, SimulationParams } from './types'

interface MonteCarloWorkerRunRequest {
  type: 'run'
  id: number
  params: SimulationParams
  riskFreeRate?: number
}

interface MonteCarloWorkerCancelRequest {
  type: 'cancel'
  id: number
}

interface MonteCarloWorkerSuccessResponse {
  type: 'success'
  id: number
  result: MonteCarloResult
}

interface MonteCarloWorkerErrorResponse {
  type: 'error'
  id: number
  error: string
}

interface MonteCarloWorkerProgressResponse {
  type: 'progress'
  id: number
  completed: number
  total: number
}

type MonteCarloWorkerRequest = MonteCarloWorkerRunRequest | MonteCarloWorkerCancelRequest

const workerScope: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope

workerScope.onmessage = async (event: MessageEvent<MonteCarloWorkerRequest>) => {
  const payload = event.data
  if (payload.type !== 'run') {
    return
  }

  const { id, params, riskFreeRate } = payload

  try {
    const result = await runMonteCarloSimulationBatched(params, riskFreeRate, {
      chunkSize: 512,
      yieldIntervalMs: 48,
      onProgress: (completed, total) => {
        const progressPayload: MonteCarloWorkerProgressResponse = {
          type: 'progress',
          id,
          completed,
          total,
        }
        workerScope.postMessage(progressPayload)
      },
    })
    const response: MonteCarloWorkerSuccessResponse = { type: 'success', id, result }
    workerScope.postMessage(response)
  } catch (error) {
    const response: MonteCarloWorkerErrorResponse = {
      type: 'error',
      id,
      error: error instanceof Error ? error.message : '蒙特卡洛计算失败',
    }
    workerScope.postMessage(response)
  }
}
