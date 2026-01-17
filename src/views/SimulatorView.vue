<script setup lang="ts">
import { ref } from 'vue'
import { useInvestmentStore } from '@/stores/investment'
import { Play, RefreshCw, AlertTriangle } from 'lucide-vue-next'
import ConfigPanel from '@/components/config/ConfigPanel.vue'
import StatsCards from '@/components/stats/StatsCards.vue'
import AssetGrowthChart from '@/components/charts/AssetGrowthChart.vue'
import DistributionChart from '@/components/charts/DistributionChart.vue'
import AllocationChart from '@/components/charts/AllocationChart.vue'

const store = useInvestmentStore()
const activeTab = ref<'config' | 'results'>('config')

async function handleRunSimulation() {
  const success = await store.runSimulation()
  if (success) {
    activeTab.value = 'results'
  }
}

function handleReset() {
  store.resetParams()
  activeTab.value = 'config'
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
    <!-- Header -->
    <div class="mb-4 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div>
        <h1 class="text-xl font-bold text-zinc-900 sm:text-2xl dark:text-white">投资收益模拟器</h1>
        <p class="mt-0.5 text-xs text-zinc-600 sm:mt-1 sm:text-sm dark:text-zinc-400">
          配置参数，运行模拟，查看投资收益预测
        </p>
      </div>

      <div class="flex items-center gap-2 sm:gap-3">
        <button
          @click="handleReset"
          class="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm dark:text-zinc-400 dark:hover:bg-white/10"
        >
          <RefreshCw class="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          重置
        </button>
        <button
          @click="handleRunSimulation"
          :disabled="store.isCalculating"
          class="btn-primary inline-flex items-center gap-1.5 !px-4 !py-2 text-xs sm:gap-2 sm:!px-6 sm:!py-2.5 sm:text-sm"
        >
          <Play v-if="!store.isCalculating" class="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <RefreshCw v-else class="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" />
          {{ store.isCalculating ? '计算中...' : '运行模拟' }}
        </button>
      </div>
    </div>

    <!-- Warnings -->
    <div
      v-if="store.warnings.length > 0"
      class="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10"
    >
      <div class="flex items-start gap-3">
        <AlertTriangle class="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <h3 class="text-sm font-medium text-amber-800 dark:text-amber-200">参数提醒</h3>
          <ul class="mt-1 list-inside list-disc text-sm text-amber-700 dark:text-amber-300">
            <li v-for="warning in store.warnings" :key="warning">{{ warning }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Errors -->
    <div
      v-if="store.errors.length > 0"
      class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10"
    >
      <div class="flex items-start gap-3">
        <AlertTriangle class="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
        <div>
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">参数错误</h3>
          <ul class="mt-1 list-inside list-disc text-sm text-red-700 dark:text-red-300">
            <li v-for="error in store.errors" :key="error">{{ error }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="mb-4 flex gap-1 rounded-lg bg-zinc-100 p-1 sm:mb-6 dark:bg-white/5">
      <button
        @click="activeTab = 'config'"
        class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all"
        :class="[
          activeTab === 'config'
            ? 'bg-white text-zinc-900 shadow-sm dark:bg-white/10 dark:text-white'
            : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
        ]"
      >
        参数配置
      </button>
      <button
        @click="activeTab = 'results'"
        :disabled="!store.hasCalculated"
        class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all"
        :class="[
          activeTab === 'results'
            ? 'bg-white text-zinc-900 shadow-sm dark:bg-white/10 dark:text-white'
            : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
          !store.hasCalculated && 'cursor-not-allowed opacity-50',
        ]"
      >
        模拟结果
      </button>
    </div>

    <!-- Content -->
    <div v-if="activeTab === 'config'">
      <ConfigPanel />
    </div>

    <div v-else-if="activeTab === 'results' && store.hasCalculated" class="space-y-6">
      <!-- Stats Cards -->
      <StatsCards />

      <!-- Charts -->
      <div class="grid gap-6 lg:grid-cols-2">
        <AssetGrowthChart />
        <DistributionChart />
      </div>

      <AllocationChart />
    </div>
  </div>
</template>
