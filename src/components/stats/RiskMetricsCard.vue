<script setup lang="ts">
import { computed } from 'vue'
import { useInvestmentStore } from '@/stores/investment'
import { formatPercent } from '@/engine'
import {
  ShieldAlert,
  TrendingDown,
  Gauge,
  ArrowDownCircle,
  Clock,
  RotateCcw,
  Activity,
} from 'lucide-vue-next'

const store = useInvestmentStore()

const riskMetrics = computed(() => {
  if (!store.monteCarloResult?.statistics?.riskMetrics) return null
  return store.monteCarloResult.statistics.riskMetrics
})

const metrics = computed(() => {
  if (!riskMetrics.value) return []

  const rm = riskMetrics.value

  return [
    {
      title: '夏普比率',
      value: rm.sharpeRatio.toFixed(2),
      description: '风险调整后收益',
      icon: Gauge,
      color: rm.sharpeRatio >= 1 ? 'text-emerald-600 dark:text-emerald-400' : rm.sharpeRatio >= 0.5 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400',
      bgColor: rm.sharpeRatio >= 1 ? 'bg-emerald-100 dark:bg-emerald-500/20' : rm.sharpeRatio >= 0.5 ? 'bg-amber-100 dark:bg-amber-500/20' : 'bg-red-100 dark:bg-red-500/20',
      hint: rm.sharpeRatio >= 1 ? '优秀' : rm.sharpeRatio >= 0.5 ? '一般' : '较差',
    },
    {
      title: '索提诺比率',
      value: rm.sortinoRatio.toFixed(2),
      description: '下行风险调整后收益',
      icon: TrendingDown,
      color: rm.sortinoRatio >= 1 ? 'text-emerald-600 dark:text-emerald-400' : rm.sortinoRatio >= 0.5 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400',
      bgColor: rm.sortinoRatio >= 1 ? 'bg-emerald-100 dark:bg-emerald-500/20' : rm.sortinoRatio >= 0.5 ? 'bg-amber-100 dark:bg-amber-500/20' : 'bg-red-100 dark:bg-red-500/20',
      hint: rm.sortinoRatio >= 1 ? '优秀' : rm.sortinoRatio >= 0.5 ? '一般' : '较差',
    },
    {
      title: 'VaR (95%)',
      value: formatPercent(rm.var95Percent),
      description: '95%置信下相对累计投入的潜在亏损',
      icon: ShieldAlert,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-500/20',
      hint: '风险边界',
    },
    {
      title: '平均最大回撤',
      value: formatPercent(rm.maxDrawdownMean),
      description: '历史平均最大跌幅',
      icon: ArrowDownCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-500/20',
      hint: '回撤风险',
    },
    {
      title: '最大回撤持续期',
      value: `${rm.maxDrawdownDuration}月`,
      description: '最长回撤恢复时间',
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-500/20',
      hint: '时间成本',
    },
    {
      title: '恢复概率',
      value: formatPercent(rm.recoveryProbability),
      description: '在模拟期内恢复的概率',
      icon: RotateCcw,
      color: rm.recoveryProbability >= 0.8 ? 'text-emerald-600 dark:text-emerald-400' : rm.recoveryProbability >= 0.5 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400',
      bgColor: rm.recoveryProbability >= 0.8 ? 'bg-emerald-100 dark:bg-emerald-500/20' : rm.recoveryProbability >= 0.5 ? 'bg-amber-100 dark:bg-amber-500/20' : 'bg-red-100 dark:bg-red-500/20',
      hint: '恢复能力',
    },
    {
      title: '亏损概率',
      value: formatPercent(rm.lossProbability),
      description: '终值低于本金的概率',
      icon: Activity,
      color: rm.lossProbability < 0.1 ? 'text-emerald-600 dark:text-emerald-400' : rm.lossProbability < 0.3 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400',
      bgColor: rm.lossProbability < 0.1 ? 'bg-emerald-100 dark:bg-emerald-500/20' : rm.lossProbability < 0.3 ? 'bg-amber-100 dark:bg-amber-500/20' : 'bg-red-100 dark:bg-red-500/20',
      hint: rm.lossProbability < 0.1 ? '低风险' : rm.lossProbability < 0.3 ? '中等风险' : '高风险',
    },
  ]
})
</script>

<template>
  <div v-if="riskMetrics" class="glass-card p-4 sm:p-6">
    <div class="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
      <div
        class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 sm:h-10 sm:w-10 dark:bg-indigo-500/20"
      >
        <ShieldAlert class="h-4 w-4 text-indigo-600 sm:h-5 sm:w-5 dark:text-indigo-400" />
      </div>
      <div>
        <h3 class="text-base font-semibold text-zinc-900 sm:text-lg dark:text-white">风险指标</h3>
        <p class="text-xs text-zinc-500 dark:text-zinc-400">全面评估投资组合的风险水平</p>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      <div
        v-for="metric in metrics"
        :key="metric.title"
        class="rounded-lg border border-zinc-100 p-3 transition-all hover:border-zinc-200 dark:border-zinc-700 dark:hover:border-zinc-600"
      >
        <div class="flex items-start justify-between gap-1">
          <div class="min-w-0 flex-1">
            <p class="text-[10px] font-medium text-zinc-500 sm:text-xs dark:text-zinc-400">
              {{ metric.title }}
            </p>
            <p
              :class="[
                'mt-0.5 text-sm font-bold sm:text-base lg:text-lg',
                metric.color,
              ]"
            >
              {{ metric.value }}
            </p>
          </div>
          <div :class="['flex h-6 w-6 shrink-0 items-center justify-center rounded-md sm:h-7 sm:w-7', metric.bgColor]">
            <component :is="metric.icon" :class="['h-3 w-3 sm:h-3.5 sm:w-3.5', metric.color]" />
          </div>
        </div>
        <p class="mt-1 text-[10px] text-zinc-400 sm:text-xs dark:text-zinc-500">
          {{ metric.description }}
        </p>
        <span
          :class="[
            'mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium',
            metric.bgColor,
            metric.color,
          ]"
        >
          {{ metric.hint }}
        </span>
      </div>
    </div>
  </div>
</template>
