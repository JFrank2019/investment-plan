<script setup lang="ts">
import { computed } from 'vue'
import { useInvestmentStore } from '@/stores/investment'
import { formatMoney, formatPercent } from '@/engine'
import {
  TrendingUp,
  Target,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-vue-next'

const store = useInvestmentStore()

const stats = computed(() => {
  if (!store.deterministicSummary || !store.monteCarloSummary) {
    return null
  }

  const det = store.deterministicSummary
  const mc = store.monteCarloSummary
  const inf = store.inflationSummary

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

    // 通胀调整结果
    realFinalValue: inf?.realFinalValue,
    realProfit: inf?.realProfit,
    realProfitRate: inf?.realProfitRate,
    cumulativeInflation: inf?.cumulativeInflation,
    realMedian: inf?.realMedian,
    realP5: inf?.realP5,
    realP95: inf?.realP95,
    inflationRate: inf?.inflationRate,
  }
})

// 辅助函数：根据数值获取颜色
const getValueColor = (val: number, isGoodHigh = true) => {
  if (isGoodHigh) {
    return val > 0
      ? 'text-emerald-600 dark:text-emerald-500'
      : val < 0
        ? 'text-rose-600 dark:text-rose-500'
        : 'text-zinc-500'
  }
  return val < 0.1
    ? 'text-emerald-600 dark:text-emerald-500'
    : val < 0.3
      ? 'text-amber-600 dark:text-amber-500'
      : 'text-rose-600 dark:text-rose-500'
}
</script>

<template>
  <div v-if="stats" class="data-panel overflow-hidden">
    <!-- Header -->
    <div
      class="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/30"
    >
      <div class="flex items-center gap-2">
        <Target class="h-4 w-4 icon-base" />
        <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">核心指标</h3>
      </div>
      <span class="font-mono text-[10px] text-zinc-400 uppercase tracking-widest"
        >Performance Metrics</span
      >
    </div>

    <div
      class="grid grid-cols-1 divide-y divide-zinc-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-zinc-800"
    >
      <!-- Column 1: Core Value (核心资产) -->
      <div class="p-4 sm:p-6">
        <h4
          class="mb-3 sm:mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400"
        >
          <DollarSign class="h-3.5 w-3.5" />
          资产终值
        </h4>
        <div class="space-y-4 sm:space-y-6">
          <!-- Deterministic Final -->
          <div>
            <p class="text-xs font-medium text-zinc-500 dark:text-zinc-400">预期终值 (确定性)</p>
            <p
              class="money-text mt-1 text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white"
            >
              {{ formatMoney(stats.deterministicFinal) }}
            </p>
            <div class="mt-2 flex items-center gap-1.5">
              <span
                :class="[
                  'text-xs font-medium flex items-center gap-0.5',
                  getValueColor(stats.deterministicProfit),
                ]"
              >
                <ArrowUpRight v-if="stats.deterministicProfit > 0" class="h-3 w-3" />
                <ArrowDownRight v-else class="h-3 w-3" />
                {{ formatMoney(stats.deterministicProfit) }}
              </span>
              <span class="text-[10px] text-zinc-400">累计收益</span>
            </div>
          </div>

          <!-- Real Value -->
          <div
            v-if="stats.realFinalValue"
            class="pt-4 border-t border-dashed border-zinc-100 dark:border-zinc-800"
          >
            <div class="flex items-baseline justify-between">
              <span class="text-xs text-zinc-500 dark:text-zinc-400">实际购买力</span>
              <span class="money-text font-bold text-zinc-700 dark:text-zinc-300">
                {{ formatMoney(stats.realFinalValue) }}
              </span>
            </div>
            <p class="mt-1 text-[10px] text-zinc-400 text-right">
              扣除 {{ formatPercent(stats.inflationRate ?? 0) }} 通胀后
            </p>
          </div>
        </div>
      </div>

      <!-- Column 2: Returns (收益率) -->
      <div class="p-4 sm:p-6">
        <h4
          class="mb-3 sm:mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400"
        >
          <TrendingUp class="h-3.5 w-3.5" />
          收益表现
        </h4>
        <div class="space-y-4 sm:space-y-5">
          <!-- CAGR -->
          <div class="flex items-center justify-between">
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400">总收益率</span>
              <span class="text-[10px] text-zinc-400">确定性模型</span>
            </div>
            <span
              :class="['money-text text-lg font-bold', getValueColor(stats.deterministicReturn)]"
            >
              {{ formatPercent(stats.deterministicReturn) }}
            </span>
          </div>

          <!-- Median Return -->
          <div
            class="flex items-center justify-between border-t border-dashed border-zinc-100 pt-4 dark:border-zinc-800"
          >
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400">中位数收益率</span>
              <span class="text-[10px] text-zinc-400">蒙特卡洛模拟</span>
            </div>
            <span class="money-text text-base font-medium text-zinc-700 dark:text-zinc-300">
              {{ formatPercent(stats.medianReturn) }}
            </span>
          </div>

          <!-- Real Return -->
          <div
            v-if="stats.realProfitRate"
            class="flex items-center justify-between border-t border-dashed border-zinc-100 pt-4 dark:border-zinc-800"
          >
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400">实际收益率</span>
              <span class="text-[10px] text-zinc-400">扣除通胀</span>
            </div>
            <span
              :class="['money-text text-base font-medium', getValueColor(stats.realProfitRate)]"
            >
              {{ formatPercent(stats.realProfitRate) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Column 3: Range & Allocation (区间与配置) -->
      <div class="p-4 sm:p-6 bg-zinc-50/50 dark:bg-zinc-900/20">
        <h4
          class="mb-3 sm:mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400"
        >
          <BarChart3 class="h-3.5 w-3.5" />
          分布与配置
        </h4>
        <div class="space-y-4 sm:space-y-6">
          <!-- Confidence Interval -->
          <div>
            <p class="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              90% 置信区间 (终值)
            </p>
            <div class="flex items-center gap-2 text-xs">
              <span class="money-text font-medium text-zinc-600 dark:text-zinc-400">{{
                formatMoney(stats.p5Final)
              }}</span>
              <div class="h-1 flex-1 rounded-full bg-zinc-200 dark:bg-zinc-700 relative">
                <div
                  class="absolute left-1/4 right-1/4 h-full rounded-full bg-zinc-400 dark:bg-zinc-500 opacity-50"
                ></div>
              </div>
              <span class="money-text font-medium text-zinc-600 dark:text-zinc-400">{{
                formatMoney(stats.p95Final)
              }}</span>
            </div>
          </div>

          <!-- Allocation -->
          <div>
            <div class="mb-2 flex justify-between text-xs">
              <span class="font-medium text-zinc-600 dark:text-zinc-300">终值资产配置</span>
              <span class="font-mono text-zinc-500"
                >{{ formatPercent(stats.deterministicEquityRatio) }} 权益</span
              >
            </div>
            <div class="flex h-2 w-full overflow-hidden rounded-sm bg-zinc-200 dark:bg-zinc-700">
              <div
                class="h-full bg-zinc-800 dark:bg-zinc-200"
                :style="{ width: `${stats.deterministicEquityRatio * 100}%` }"
              ></div>
            </div>
            <div
              class="mt-1.5 flex justify-between text-[10px] text-zinc-400 uppercase tracking-wider"
            >
              <span>Equity</span>
              <span>Bond</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
