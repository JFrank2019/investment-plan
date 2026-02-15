<script setup lang="ts">
import { computed } from 'vue'
import { useInvestmentStore } from '@/stores/investment'
import {
  PORTFOLIO_PRESETS,
  getRiskLevelLabel,
  getRiskLevelColor,
  type PortfolioPreset,
} from '@/engine'
import { LayoutGrid, Shield, Scale, TrendingUp } from 'lucide-vue-next'

const store = useInvestmentStore()

// 获取当前选中的预设（根据参数匹配）
const currentPresetId = computed(() => {
  const preset = PORTFOLIO_PRESETS.find(
    (p) =>
      p.initialEquityRatio === store.params.initialEquityRatio &&
      p.investEquityRatio === store.params.investEquityRatio &&
      p.equityReturn === store.params.equityReturn &&
      p.bondReturn === store.params.bondReturn &&
      p.equityVolatility === store.params.equityVolatility &&
      p.bondVolatility === store.params.bondVolatility,
  )
  return preset?.id ?? null
})

// 获取预设图标
function getPresetIcon(id: string) {
  const iconMap: Record<string, typeof Shield> = {
    '60-40-balanced': Scale,
    'three-fund': LayoutGrid,
    'all-weather': Shield,
    'aggressive-growth': TrendingUp,
    'conservative-defense': Shield,
  }
  return iconMap[id] ?? Scale
}

// 应用预设
function handleApplyPreset(preset: PortfolioPreset) {
  store.applyPreset(preset)
}
</script>

<template>
  <div class="glass-card p-4 sm:p-6">
    <div class="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
      <div
        class="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 sm:h-10 sm:w-10 dark:bg-purple-500/20"
      >
        <LayoutGrid class="h-4 w-4 text-purple-600 sm:h-5 sm:w-5 dark:text-purple-400" />
      </div>
      <h3 class="text-base font-semibold text-zinc-900 sm:text-lg dark:text-white">预设模板</h3>
    </div>

    <p class="mb-3 text-xs text-zinc-500 sm:mb-4 sm:text-sm dark:text-zinc-400">
      选择预设投资组合模板，快速配置参数
    </p>

    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
      <button
        v-for="preset in PORTFOLIO_PRESETS"
        :key="preset.id"
        @click="handleApplyPreset(preset)"
        :class="[
          'group rounded-lg border p-3 text-left transition-all sm:p-4',
          currentPresetId === preset.id
            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20 dark:border-blue-400 dark:bg-blue-500/10 dark:ring-blue-400/20'
            : 'border-zinc-200 bg-white hover:border-blue-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:border-blue-400 dark:hover:bg-zinc-800',
        ]"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <component
                :is="getPresetIcon(preset.id)"
                :class="[
                  'h-3.5 w-3.5 sm:h-4 sm:w-4',
                  currentPresetId === preset.id
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-zinc-500 group-hover:text-blue-500 dark:text-zinc-400',
                ]"
              />
              <h4
                :class="[
                  'truncate text-xs font-semibold sm:text-sm',
                  currentPresetId === preset.id
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-zinc-900 dark:text-white',
                ]"
              >
                {{ preset.name }}
              </h4>
            </div>
            <p
              class="mt-0.5 line-clamp-2 text-[10px] text-zinc-500 sm:mt-1 sm:text-xs dark:text-zinc-400"
            >
              {{ preset.description }}
            </p>
          </div>
          <span
            :class="[
              'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium sm:px-2 sm:text-xs',
              getRiskLevelColor(preset.riskLevel).bg,
              getRiskLevelColor(preset.riskLevel).text,
            ]"
          >
            {{ getRiskLevelLabel(preset.riskLevel) }}
          </span>
        </div>

        <div class="mt-2 grid grid-cols-3 gap-1 border-t border-zinc-100 pt-2 text-[10px] sm:mt-3 sm:gap-2 sm:border-zinc-200 sm:pt-3 sm:text-xs dark:border-zinc-700">
          <div>
            <span class="text-zinc-400 dark:text-zinc-500">偏股</span>
            <p class="font-medium text-zinc-700 dark:text-zinc-300">
              {{ (preset.initialEquityRatio * 100).toFixed(0) }}%
            </p>
          </div>
          <div>
            <span class="text-zinc-400 dark:text-zinc-500">收益</span>
            <p class="font-medium text-zinc-700 dark:text-zinc-300">
              {{ (preset.equityReturn * 100).toFixed(0) }}%
            </p>
          </div>
          <div>
            <span class="text-zinc-400 dark:text-zinc-500">波动</span>
            <p class="font-medium text-zinc-700 dark:text-zinc-300">
              {{ (preset.equityVolatility * 100).toFixed(0) }}%
            </p>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>
