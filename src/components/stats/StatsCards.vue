<script setup lang="ts">
import { computed } from 'vue'
import { useInvestmentStore } from '@/stores/investment'
import { formatMoney, formatPercent } from '@/engine'
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  DollarSign,
  BarChart3,
  Shield,
  Percent,
} from 'lucide-vue-next'

const store = useInvestmentStore()

const stats = computed(() => {
  if (!store.deterministicSummary || !store.monteCarloSummary) {
    return null
  }

  const det = store.deterministicSummary
  const mc = store.monteCarloSummary

  return {
    // 确定性结果
    deterministicFinal: det.finalValue,
    deterministicProfit: det.profit,
    deterministicReturn: det.profitRate,
    deterministicEquityRatio: det.equityRatio,

    // 蒙特卡洛结果
    medianFinal: mc.medianFinalValue,
    p5Final: mc.p5FinalValue,
    p95Final: mc.p95FinalValue,
    medianReturn: mc.medianReturn,
    lossProbability: mc.lossProbability,
    avgMaxDrawdown: mc.avgMaxDrawdown,
  }
})

const cards = computed(() => {
  if (!stats.value) return []

  return [
    {
      // 主要数据 - 蓝色
      title: '预期终值（确定性）',
      value: formatMoney(stats.value.deterministicFinal),
      subValue: `收益 ${formatMoney(stats.value.deterministicProfit)}`,
      icon: Target,
      bgColor: 'bg-blue-100 dark:bg-blue-500/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      // 正向/负向指标 - 绿色/红色
      title: '预期收益率',
      value: formatPercent(stats.value.deterministicReturn),
      subValue: stats.value.deterministicReturn >= 0 ? '正收益' : '负收益',
      icon: stats.value.deterministicReturn >= 0 ? TrendingUp : TrendingDown,
      bgColor:
        stats.value.deterministicReturn >= 0
          ? 'bg-emerald-100 dark:bg-emerald-500/20'
          : 'bg-red-100 dark:bg-red-500/20',
      iconColor:
        stats.value.deterministicReturn >= 0
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-red-600 dark:text-red-400',
    },
    {
      // 主要数据 - 蓝色
      title: '蒙特卡洛中位数',
      value: formatMoney(stats.value.medianFinal),
      subValue: `收益率 ${formatPercent(stats.value.medianReturn)}`,
      icon: BarChart3,
      bgColor: 'bg-blue-100 dark:bg-blue-500/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      // 主要数据 - 蓝色
      title: '终值偏股占比',
      value: formatPercent(stats.value.deterministicEquityRatio),
      subValue: `偏债 ${formatPercent(1 - stats.value.deterministicEquityRatio)}`,
      icon: Percent,
      bgColor: 'bg-blue-100 dark:bg-blue-500/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      // 主要数据 - 蓝色（置信区间拆分显示）
      title: '90%置信区间',
      value: formatMoney(stats.value.p5Final),
      subValue: `至 ${formatMoney(stats.value.p95Final)}`,
      icon: Shield,
      bgColor: 'bg-blue-100 dark:bg-blue-500/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      // 风险指标 - 绿色/红色
      title: '亏损概率',
      value: formatPercent(stats.value.lossProbability),
      subValue: stats.value.lossProbability < 0.1 ? '风险较低' : '请注意风险',
      icon: AlertTriangle,
      bgColor:
        stats.value.lossProbability < 0.1
          ? 'bg-emerald-100 dark:bg-emerald-500/20'
          : 'bg-red-100 dark:bg-red-500/20',
      iconColor:
        stats.value.lossProbability < 0.1
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-red-600 dark:text-red-400',
    },
    {
      // 风险指标 - 橙色
      title: '平均最大回撤',
      value: formatPercent(stats.value.avgMaxDrawdown),
      subValue: '蒙特卡洛平均',
      icon: TrendingDown,
      bgColor: 'bg-orange-100 dark:bg-orange-500/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      // 中性信息 - 灰色
      title: '累计投入',
      value: formatMoney(store.totalInvestment),
      subValue: `初始 ${formatMoney(store.params.initialCapital)}`,
      icon: DollarSign,
      bgColor: 'bg-zinc-100 dark:bg-white/10',
      iconColor: 'text-zinc-600 dark:text-zinc-400',
    },
  ]
})
</script>

<template>
  <div v-if="stats" class="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
    <div
      v-for="card in cards"
      :key="card.title"
      class="glass-card glass-card--interactive p-3 transition-all duration-300 sm:p-4 lg:p-5 lg:hover:scale-[1.02]"
    >
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0 flex-1">
          <p class="text-xs font-medium text-zinc-500 sm:text-sm dark:text-zinc-400">{{ card.title }}</p>
          <p class="money-text mt-1 truncate text-base font-bold text-zinc-900 sm:mt-2 sm:text-xl lg:text-2xl dark:text-white">{{ card.value }}</p>
          <p class="money-text mt-0.5 text-[10px] text-zinc-500 sm:mt-1 sm:text-xs dark:text-zinc-400">{{ card.subValue }}</p>
        </div>
        <div :class="['flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 sm:rounded-xl lg:h-10 lg:w-10', card.bgColor]">
          <component :is="card.icon" :class="['h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5', card.iconColor]" />
        </div>
      </div>
    </div>
  </div>
</template>
