import type { MonteCarloResult, SimulationParams } from './types'
import { runMonteCarloSimulation } from './monteCarlo'

interface MonteCarloWorkerRunRequest {
  type: 'run'
  id: number
  params: SimulationParams
  riskFreeRate?: number
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

type MonteCarloWorkerResponse =
  | MonteCarloWorkerSuccessResponse
  | MonteCarloWorkerErrorResponse
  | MonteCarloWorkerProgressResponse

interface PendingRequest {
  resolve: (result: MonteCarloResult) => void
  reject: (reason?: unknown) => void
  onProgress?: (progress: number) => void
}

let workerInstance: Worker | null = null
let requestId = 0
const pendingRequests = new Map<number, PendingRequest>()
let activeRequestId: number | null = null

export interface MonteCarloExecutionOptions {
  riskFreeRate?: number
  onProgress?: (progress: number) => void
}

export class MonteCarloCancelledError extends Error {
  constructor(message: string = '蒙特卡洛计算已取消') {
    super(message)
    this.name = 'MonteCarloCancelledError'
  }
}

function rejectAllPending(reason: unknown) {
  pendingRequests.forEach(({ reject }) => reject(reason))
  pendingRequests.clear()
  activeRequestId = null
}

function terminateWorker(reason: unknown) {
  if (workerInstance) {
    workerInstance.terminate()
    workerInstance = null
  }
  rejectAllPending(reason)
}

function createWorker(): Worker | null {
  if (typeof Worker === 'undefined') {
    return null
  }

  const worker = new Worker(new URL('./monteCarlo.worker.ts', import.meta.url), {
    type: 'module',
  })

  worker.onmessage = (event: MessageEvent<MonteCarloWorkerResponse>) => {
    const payload = event.data
    if (payload.type === 'progress') {
      const pending = pendingRequests.get(payload.id)
      if (!pending?.onProgress) return
      const progress = payload.total > 0 ? payload.completed / payload.total : 0
      const safeProgress = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0
      pending.onProgress(safeProgress)
      return
    }

    const pending = pendingRequests.get(payload.id)
    if (!pending) return

    pendingRequests.delete(payload.id)
    if (activeRequestId === payload.id) {
      activeRequestId = null
    }

    if (payload.type === 'error') {
      pending.reject(new Error(payload.error))
      return
    }
    pending.resolve(payload.result)
  }

  worker.onerror = (event) => {
    terminateWorker(new Error(event.message || '蒙特卡洛 Worker 执行失败'))
  }

  return worker
}

function getWorker(): Worker | null {
  if (workerInstance) {
    return workerInstance
  }
  workerInstance = createWorker()
  return workerInstance
}

export async function runMonteCarloSimulationOffMainThread(
  params: SimulationParams,
  options: MonteCarloExecutionOptions = {},
): Promise<MonteCarloResult> {
  const worker = getWorker()
  if (!worker) {
    return runMonteCarloSimulation(params, options.riskFreeRate, {
      onProgress: (completed, total) => {
        if (!options.onProgress) return
        const progress = total > 0 ? completed / total : 0
        options.onProgress(Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0)
      },
    })
  }

  return new Promise<MonteCarloResult>((resolve, reject) => {
    const id = ++requestId
    activeRequestId = id
    pendingRequests.set(id, { resolve, reject, onProgress: options.onProgress })
    const payload: MonteCarloWorkerRunRequest = {
      type: 'run',
      id,
      params,
      riskFreeRate: options.riskFreeRate,
    }
    worker.postMessage(payload)
  })
}

export function cancelMonteCarloSimulation(): void {
  if (activeRequestId === null) return
  terminateWorker(new MonteCarloCancelledError())
}
