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
      title: '预期终值（确定性）',
      value: formatMoney(stats.value.deterministicFinal),
      subValue: `收益 ${formatMoney(stats.value.deterministicProfit)}`,
      icon: Target,
      color: 'primary',
      bgColor: 'bg-primary/10 dark:bg-primary/20',
      iconColor: 'text-primary',
    },
    {
      title: '预期收益率',
      value: formatPercent(stats.value.deterministicReturn),
      subValue: stats.value.deterministicReturn >= 0 ? '正收益' : '负收益',
      icon: stats.value.deterministicReturn >= 0 ? TrendingUp : TrendingDown,
      color: stats.value.deterministicReturn >= 0 ? 'emerald' : 'red',
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
      title: '蒙特卡洛中位数',
      value: formatMoney(stats.value.medianFinal),
      subValue: `收益率 ${formatPercent(stats.value.medianReturn)}`,
      icon: BarChart3,
      color: 'blue',
      bgColor: 'bg-blue-100 dark:bg-blue-500/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: '终值偏股占比',
      value: formatPercent(stats.value.deterministicEquityRatio),
      subValue: `偏债 ${formatPercent(1 - stats.value.deterministicEquityRatio)}`,
      icon: Percent,
      color: 'violet',
      bgColor: 'bg-violet-100 dark:bg-violet-500/20',
      iconColor: 'text-violet-600 dark:text-violet-400',
    },
    {
      title: '90%置信区间',
      value: `${formatMoney(stats.value.p5Final)} - ${formatMoney(stats.value.p95Final)}`,
      subValue: '5% ~ 95% 分位',
      icon: Shield,
      color: 'amber',
      bgColor: 'bg-amber-100 dark:bg-amber-500/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      title: '亏损概率',
      value: formatPercent(stats.value.lossProbability),
      subValue: stats.value.lossProbability < 0.1 ? '风险较低' : '请注意风险',
      icon: AlertTriangle,
      color: stats.value.lossProbability < 0.1 ? 'emerald' : 'red',
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
      title: '平均最大回撤',
      value: formatPercent(stats.value.avgMaxDrawdown),
      subValue: '蒙特卡洛平均',
      icon: TrendingDown,
      color: 'orange',
      bgColor: 'bg-orange-100 dark:bg-orange-500/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      title: '累计投入',
      value: formatMoney(store.totalInvestment),
      subValue: `初始 ${formatMoney(store.params.initialCapital)}`,
      icon: DollarSign,
      color: 'zinc',
      bgColor: 'bg-zinc-100 dark:bg-white/10',
      iconColor: 'text-zinc-600 dark:text-zinc-400',
    },
  ]
})
</script>

<template>
  <div v-if="stats" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <div
      v-for="card in cards"
      :key="card.title"
      class="glass-card p-5 transition-all duration-300 hover:scale-[1.02]"
    >
      <div class="flex items-start justify-between">
        <div>
          <p class="text-sm font-medium text-zinc-500 dark:text-zinc-400">{{ card.title }}</p>
          <p class="money-text mt-2 text-2xl font-bold text-zinc-900 dark:text-white">{{ card.value }}</p>
          <p class="money-text mt-1 text-xs text-zinc-500 dark:text-zinc-400">{{ card.subValue }}</p>
        </div>
        <div :class="['flex h-10 w-10 items-center justify-center rounded-lg', card.bgColor]">
          <component :is="card.icon" :class="['h-5 w-5', card.iconColor]" />
        </div>
      </div>
    </div>
  </div>
</template>
