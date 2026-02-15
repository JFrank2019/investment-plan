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
  Info
} from 'lucide-vue-next'

const store = useInvestmentStore()

function formatRatio(value: number): string {
  if (!Number.isFinite(value)) return '∞'
  return value.toFixed(2)
}

const rm = computed(() => store.monteCarloResult?.statistics?.riskMetrics)

// 辅助函数：根据数值获取颜色类名
const getRatioColor = (val: number) => {
  if (val >= 1) return 'text-emerald-600 dark:text-emerald-500'
  if (val >= 0.5) return 'text-amber-600 dark:text-amber-500'
  return 'text-rose-600 dark:text-rose-500'
}

const getProbColor = (val: number, isGoodHigh = true) => {
  if (isGoodHigh) {
    return val >= 0.8 ? 'text-emerald-600 dark:text-emerald-500' : val >= 0.5 ? 'text-amber-600 dark:text-amber-500' : 'text-rose-600 dark:text-rose-500'
  }
  return val < 0.1 ? 'text-emerald-600 dark:text-emerald-500' : val < 0.3 ? 'text-amber-600 dark:text-amber-500' : 'text-rose-600 dark:text-rose-500'
}
</script>

<template>
  <div v-if="rm" class="data-panel overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/30">
      <div class="flex items-center gap-2">
        <Activity class="h-4 w-4 icon-base" />
        <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">风险概览</h3>
      </div>
      <span class="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">Risk Profile</span>
    </div>

    <!-- Data Grid -->
    <div class="grid grid-cols-1 divide-y divide-zinc-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-zinc-800">
      
      <!-- Column 1: Efficiency (回报效率) -->
      <div class="p-6">
        <h4 class="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          <Gauge class="h-3.5 w-3.5" />
          回报效率
        </h4>
        <div class="space-y-6">
          <!-- Sharpe -->
          <div class="group">
            <div class="flex items-baseline justify-between">
              <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">夏普比率</span>
              <span :class="['font-mono text-lg font-bold tracking-tight', getRatioColor(rm.sharpeRatio)]">
                {{ formatRatio(rm.sharpeRatio) }}
              </span>
            </div>
            <div class="mt-2 h-1 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div class="h-full rounded-full transition-all duration-500" 
                :class="rm.sharpeRatio >= 1 ? 'bg-emerald-500' : rm.sharpeRatio >= 0.5 ? 'bg-amber-500' : 'bg-rose-500'"
                :style="{ width: `${Math.min(Math.max(rm.sharpeRatio * 33, 5), 100)}%` }"
              ></div>
            </div>
            <p class="mt-1.5 text-[10px] text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100">每承担一单位风险获得的超额回报</p>
          </div>

          <!-- Sortino -->
          <div class="group pt-2">
            <div class="flex items-baseline justify-between">
              <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">索提诺比率</span>
              <span :class="['font-mono text-lg font-bold tracking-tight', getRatioColor(rm.sortinoRatio)]">
                {{ formatRatio(rm.sortinoRatio) }}
              </span>
            </div>
            <p class="mt-1.5 text-[10px] text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100">仅考虑下行风险的回报效率</p>
          </div>
        </div>
      </div>

      <!-- Column 2: Downside (下行风险) -->
      <div class="p-6">
        <h4 class="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          <ShieldAlert class="h-3.5 w-3.5" />
          下行风险
        </h4>
        <div class="space-y-5">
          <!-- Max Drawdown -->
          <div class="flex items-center justify-between">
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400">平均最大回撤</span>
              <span class="text-[10px] text-zinc-400">历史平均跌幅</span>
            </div>
            <span class="font-mono text-base font-bold text-rose-600 dark:text-rose-500">
              {{ formatPercent(rm.maxDrawdownMean) }}
            </span>
          </div>

          <!-- VaR -->
          <div class="flex items-center justify-between border-t border-dashed border-zinc-100 pt-4 dark:border-zinc-800">
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400">VaR (95%)</span>
              <span class="text-[10px] text-zinc-400">极端情况潜在亏损</span>
            </div>
            <span class="font-mono text-base font-bold text-amber-600 dark:text-amber-500">
              {{ formatPercent(rm.var95Percent) }}
            </span>
          </div>

          <!-- Duration -->
          <div class="flex items-center justify-between border-t border-dashed border-zinc-100 pt-4 dark:border-zinc-800">
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400">回撤持续期</span>
              <span class="text-[10px] text-zinc-400">最长恢复时间</span>
            </div>
            <span class="font-mono text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {{ rm.maxDrawdownDuration }} 个月
            </span>
          </div>
        </div>
      </div>

      <!-- Column 3: Probability (概率分布) -->
      <div class="p-6 bg-zinc-50/50 dark:bg-zinc-900/20">
        <h4 class="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          <RotateCcw class="h-3.5 w-3.5" />
          概率预测
        </h4>
        <div class="space-y-6">
          <!-- Recovery Prob -->
          <div>
            <div class="mb-2 flex justify-between text-xs">
              <span class="font-medium text-zinc-600 dark:text-zinc-300">本金恢复概率</span>
              <span :class="['font-mono font-bold', getProbColor(rm.recoveryProbability, true)]">
                {{ formatPercent(rm.recoveryProbability) }}
              </span>
            </div>
            <div class="flex h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div 
                class="h-full rounded-full transition-all duration-500"
                :class="getProbColor(rm.recoveryProbability, true).replace('text-', 'bg-').replace('600', '500')"
                :style="{ width: `${rm.recoveryProbability * 100}%` }"
              ></div>
            </div>
          </div>

          <!-- Loss Prob -->
          <div>
            <div class="mb-2 flex justify-between text-xs">
              <span class="font-medium text-zinc-600 dark:text-zinc-300">终值亏损概率</span>
              <span :class="['font-mono font-bold', getProbColor(rm.lossProbability, false)]">
                {{ formatPercent(rm.lossProbability) }}
              </span>
            </div>
            <div class="flex h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div 
                class="h-full rounded-full transition-all duration-500"
                :class="getProbColor(rm.lossProbability, false).replace('text-', 'bg-').replace('600', '500')"
                :style="{ width: `${rm.lossProbability * 100}%` }"
              ></div>
            </div>
          </div>
          
          <div class="mt-6 flex items-start gap-2 rounded bg-zinc-100 p-3 text-[10px] leading-relaxed text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
            <Info class="mt-0.5 h-3 w-3 shrink-0" />
            <p>基于 {{ store.params.monteCarloSimulations }} 次蒙特卡洛模拟结果统计。</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
