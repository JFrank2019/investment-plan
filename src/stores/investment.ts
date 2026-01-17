import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import {
  type SimulationParams,
  type DeterministicResult,
  type MonteCarloResult,
  DEFAULT_PARAMS,
  validateParams,
  runDeterministicSimulation,
  runMonteCarloSimulation,
} from '@/engine'

export const useInvestmentStore = defineStore('investment', () => {
  // 参数配置 - 使用 localStorage 持久化
  const params = useLocalStorage<SimulationParams>('investment-params', { ...DEFAULT_PARAMS }, {
    mergeDefaults: true,
  })

  // 计算结果
  const deterministicResult = ref<DeterministicResult | null>(null)
  const monteCarloResult = ref<MonteCarloResult | null>(null)

  // 状态
  const isCalculating = ref(false)
  const errors = ref<string[]>([])
  const hasCalculated = ref(false)

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
    params.value = { ...params.value, ...newParams }
    // 参数变化后标记需要重新计算
    hasCalculated.value = false
  }

  // 重置参数
  function resetParams() {
    params.value = { ...DEFAULT_PARAMS }
    deterministicResult.value = null
    monteCarloResult.value = null
    hasCalculated.value = false
    errors.value = []
  }

  // 执行计算
  async function runSimulation() {
    // 验证参数
    errors.value = validateParams(params.value)
    if (errors.value.length > 0) {
      return false
    }

    isCalculating.value = true

    try {
      // 使用 setTimeout 让 UI 有机会更新
      await new Promise((resolve) => setTimeout(resolve, 10))

      // 运行确定性计算
      deterministicResult.value = runDeterministicSimulation(params.value)

      // 运行蒙特卡洛模拟（可能较慢）
      monteCarloResult.value = runMonteCarloSimulation(params.value)

      hasCalculated.value = true
      return true
    } catch (e) {
      errors.value = [(e as Error).message]
      return false
    } finally {
      isCalculating.value = false
    }
  }

  // 仅运行确定性计算（快速预览）
  function runDeterministicOnly() {
    errors.value = validateParams(params.value)
    if (errors.value.length > 0) {
      return false
    }

    deterministicResult.value = runDeterministicSimulation(params.value)
    return true
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

  return {
    // 状态
    params,
    deterministicResult,
    monteCarloResult,
    isCalculating,
    errors,
    warnings,
    hasCalculated,

    // 计算属性
    totalInvestment,
    deterministicSummary,
    monteCarloSummary,

    // 方法
    updateParams,
    resetParams,
    runSimulation,
    runDeterministicOnly,
  }
})
