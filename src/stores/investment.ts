import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import {
  type SimulationParams,
  type DeterministicResult,
  type MonteCarloResult,
  type PortfolioPreset,
  DEFAULT_PARAMS,
  validateParams,
  sanitizeSimulationParams,
  runDeterministicSimulation,
} from '@/engine'
import {
  runMonteCarloSimulationOffMainThread,
  cancelMonteCarloSimulation,
  MonteCarloCancelledError,
} from '@/engine/monteCarloWorkerClient'

export const useInvestmentStore = defineStore('investment', () => {
  // 参数配置 - 使用 localStorage 持久化
  const params = useLocalStorage<SimulationParams>(
    'investment-params',
    { ...DEFAULT_PARAMS },
    {
      mergeDefaults: true,
    },
  )

  // 计算结果
  const deterministicResult = ref<DeterministicResult | null>(null)
  const monteCarloResult = ref<MonteCarloResult | null>(null)

  // 状态
  const isCalculating = ref(false)
  const errors = ref<string[]>([])
  const hasCalculated = ref(false)
  const monteCarloProgress = ref(0)
  const currentRunToken = ref(0)

  // 首次加载时对持久化参数做兜底归一化，避免 localStorage 脏数据污染计算链路
  params.value = sanitizeSimulationParams(params.value)

  // 参数验证警告
  const warnings = computed(() => {
    const warns: string[] = []
    if (params.value.equityReturn > 0.2) {
      warns.push(`偏股年化收益率 ${(params.value.equityReturn * 100).toFixed(0)}% 过于乐观`)
    }
    if (params.value.equityReturn > 0.3) {
      warns.push('警告：超过30%的年化收益极难持续，请谨慎评估')
    }
    return warns
  })

  // 更新参数
  function updateParams(newParams: Partial<SimulationParams>) {
    params.value = sanitizeSimulationParams({ ...params.value, ...newParams })
    // 参数变化后标记需要重新计算
    hasCalculated.value = false
  }

  function clearSimulationResults() {
    deterministicResult.value = null
    monteCarloResult.value = null
    hasCalculated.value = false
    monteCarloProgress.value = 0
  }

  // 重置参数
  function resetParams() {
    params.value = sanitizeSimulationParams({ ...DEFAULT_PARAMS })
    clearSimulationResults()
    errors.value = []
  }

  // 应用预设模板
  function applyPreset(preset: PortfolioPreset) {
    params.value = sanitizeSimulationParams({
      ...params.value,
      initialEquityRatio: preset.initialEquityRatio,
      investEquityRatio: preset.investEquityRatio,
      equityReturn: preset.equityReturn,
      bondReturn: preset.bondReturn,
      equityVolatility: preset.equityVolatility,
      bondVolatility: preset.bondVolatility,
      rebalancePeriod: preset.rebalancePeriod,
      rebalanceTargetEquityRatio: preset.rebalanceTargetEquityRatio,
    })
    hasCalculated.value = false
  }

  // 执行计算
  async function runSimulation() {
    if (isCalculating.value) {
      return false
    }

    const safeParams = sanitizeSimulationParams(params.value)
    params.value = safeParams

    // 新一轮计算开始时立即清空旧结果，避免界面展示历史数据
    clearSimulationResults()

    // 验证参数
    errors.value = validateParams(safeParams)
    if (errors.value.length > 0) {
      monteCarloProgress.value = 0
      return false
    }

    const runToken = currentRunToken.value + 1
    currentRunToken.value = runToken
    isCalculating.value = true
    monteCarloProgress.value = 0

    try {
      // 使用 setTimeout 让 UI 有机会更新
      await new Promise((resolve) => setTimeout(resolve, 10))

      // 运行确定性计算
      const deterministic = runDeterministicSimulation(safeParams)

      // 运行蒙特卡洛模拟（可能较慢）
      const monteCarlo = await runMonteCarloSimulationOffMainThread(safeParams, {
        onProgress: (progress) => {
          if (runToken === currentRunToken.value) {
            monteCarloProgress.value = Number.isFinite(progress)
              ? Math.min(1, Math.max(0, progress))
              : 0
          }
        },
      })

      if (runToken !== currentRunToken.value) {
        return false
      }

      deterministicResult.value = deterministic
      monteCarloResult.value = monteCarlo

      hasCalculated.value = true
      monteCarloProgress.value = 1
      return true
    } catch (e) {
      if (e instanceof MonteCarloCancelledError) {
        errors.value = []
        monteCarloProgress.value = 0
        return false
      }
      errors.value = [(e as Error).message]
      monteCarloProgress.value = 0
      return false
    } finally {
      if (runToken === currentRunToken.value) {
        isCalculating.value = false
      }
    }
  }

  function cancelSimulation() {
    if (!isCalculating.value) return
    currentRunToken.value++
    cancelMonteCarloSimulation()
    isCalculating.value = false
    monteCarloProgress.value = 0
  }

  // 计算总投入本金
  const totalInvestment = computed(() => {
    const monthlyInvestment = params.value.weeklyInvestment * (52 / 12)
    return params.value.initialCapital + monthlyInvestment * params.value.simulationMonths
  })

  // 确定性结果摘要
  const deterministicSummary = computed(() => {
    if (!deterministicResult.value) return null

    const final = deterministicResult.value.path.states.slice(-1)[0]
    if (!final) return null

    return {
      finalValue: final.totalAsset,
      profit: final.profit,
      profitRate: final.profitRate,
      equityRatio: final.equityRatio,
      maxDrawdown: deterministicResult.value.path.maxDrawdown,
    }
  })

  // 蒙特卡洛结果摘要
  const monteCarloSummary = computed(() => {
    if (!monteCarloResult.value) return null

    const stats = monteCarloResult.value.statistics
    return {
      medianFinalValue: stats.finalValueMedian,
      p5FinalValue: stats.finalValueP5,
      p95FinalValue: stats.finalValueP95,
      medianReturn: stats.returnMedian,
      lossProbability: stats.lossProbability,
      avgMaxDrawdown: stats.maxDrawdownMean,
    }
  })

  // 通胀调整结果摘要
  const inflationSummary = computed(() => {
    if (!deterministicResult.value || !monteCarloResult.value) return null

    const finalState = deterministicResult.value.path.states.slice(-1)[0]
    if (!finalState) return null

    const bands = monteCarloResult.value.statistics.confidenceBands
    const finalBand = bands[bands.length - 1]

    return {
      // 确定性结果的通胀数据
      realFinalValue: finalState.realTotalAsset,
      realProfit: finalState.realProfit,
      realProfitRate: finalState.realProfitRate,
      cumulativeInflation: finalState.cumulativeInflation,
      // 蒙特卡洛的实际购买力置信区间
      realMedian: finalBand?.realMedian,
      realP5: finalBand?.realP5,
      realP95: finalBand?.realP95,
      // 通胀率
      inflationRate: params.value.inflationRate,
    }
  })

  return {
    // 状态
    params,
    deterministicResult,
    monteCarloResult,
    isCalculating,
    monteCarloProgress,
    errors,
    warnings,
    hasCalculated,

    // 计算属性
    totalInvestment,
    deterministicSummary,
    monteCarloSummary,
    inflationSummary,

    // 方法
    updateParams,
    resetParams,
    applyPreset,
    runSimulation,
    cancelSimulation,
  }
})
