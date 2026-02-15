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
  <div class="data-panel p-6">
    <div class="mb-4 flex items-center gap-2">
      <LayoutGrid class="h-4 w-4 icon-base" />
      <h3 class="text-sm font-semibold text-zinc-900 dark:text-white">预设模板</h3>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <button
        v-for="preset in PORTFOLIO_PRESETS"
        :key="preset.id"
        @click="handleApplyPreset(preset)"
        :class="[
          'group relative rounded-sm border p-4 text-left transition-all',
          currentPresetId === preset.id
            ? 'border-zinc-900 bg-zinc-50 dark:border-white dark:bg-white/5'
            : 'border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600',
        ]"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <component
                :is="getPresetIcon(preset.id)"
                :class="[
                  'h-4 w-4',
                  currentPresetId === preset.id
                    ? 'text-zinc-900 dark:text-white'
                    : 'text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300',
                ]"
              />
              <h4
                :class="[
                  'truncate text-sm font-semibold',
                  currentPresetId === preset.id
                    ? 'text-zinc-900 dark:text-white'
                    : 'text-zinc-700 dark:text-zinc-300',
                ]"
              >
                {{ preset.name }}
              </h4>
            </div>
            <p class="mt-1 line-clamp-2 text-[10px] text-zinc-500 dark:text-zinc-400">
              {{ preset.description }}
            </p>
          </div>

          <!-- Risk Badge -->
          <span
            :class="[
              'shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-medium',
              getRiskLevelColor(preset.riskLevel).bg,
              getRiskLevelColor(preset.riskLevel).text,
            ]"
          >
            {{ getRiskLevelLabel(preset.riskLevel) }}
          </span>
        </div>

        <!-- Mini Stats -->
        <div
          class="mt-3 grid grid-cols-3 gap-2 border-t border-zinc-100 pt-3 text-[10px] dark:border-zinc-800/50"
        >
          <div>
            <span class="text-zinc-400">Equity</span>
            <p class="font-mono font-medium text-zinc-700 dark:text-zinc-300">
              {{ (preset.initialEquityRatio * 100).toFixed(0) }}%
            </p>
          </div>
          <div>
            <span class="text-zinc-400">Return</span>
            <p class="font-mono font-medium text-zinc-700 dark:text-zinc-300">
              {{ (preset.equityReturn * 100).toFixed(0) }}%
            </p>
          </div>
          <div>
            <span class="text-zinc-400">Vol</span>
            <p class="font-mono font-medium text-zinc-700 dark:text-zinc-300">
              {{ (preset.equityVolatility * 100).toFixed(0) }}%
            </p>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>
