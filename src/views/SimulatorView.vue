<script setup lang="ts">
import { ref } from 'vue'
import { useInvestmentStore } from '@/stores/investment'
import { Play, RefreshCw, AlertTriangle } from 'lucide-vue-next'
import ConfigPanel from '@/components/config/ConfigPanel.vue'
import StatsCards from '@/components/stats/StatsCards.vue'
import AssetGrowthChart from '@/components/charts/AssetGrowthChart.vue'
import DistributionChart from '@/components/charts/DistributionChart.vue'
import AllocationChart from '@/components/charts/AllocationChart.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const store = useInvestmentStore()
const activeTab = ref<'config' | 'results'>('config')
const showResetConfirm = ref(false)

async function handleRunSimulation() {
  const success = await store.runSimulation()
  if (success) {
    activeTab.value = 'results'
  }
}

function handleResetClick() {
  showResetConfirm.value = true
}

function handleResetConfirm() {
  store.resetParams()
  activeTab.value = 'config'
  showResetConfirm.value = false
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-3 py-3 sm:px-6 sm:py-6 lg:px-8">
    <!-- Header -->
    <div class="mb-3 sm:mb-6">
      <div class="flex items-center justify-between gap-2">
        <div class="min-w-0 flex-1">
          <h1 class="text-base font-bold text-zinc-900 sm:text-xl lg:text-2xl dark:text-white">投资收益模拟器</h1>
          <p class="mt-0.5 hidden text-sm text-zinc-600 sm:block dark:text-zinc-400">
            配置参数，运行模拟，查看投资收益预测
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="handleResetClick"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 sm:h-9 sm:w-auto sm:px-3 sm:py-2 sm:text-sm dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-200"
            title="重置"
          >
            <RefreshCw class="h-4 w-4" />
            <span class="hidden sm:ml-1.5 sm:inline">重置</span>
          </button>
          <button
            @click="handleRunSimulation"
            :disabled="store.isCalculating"
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white shadow-md shadow-blue-500/25 transition-all hover:bg-blue-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed sm:h-9 sm:w-auto sm:rounded-lg sm:bg-linear-to-r sm:from-blue-500 sm:to-blue-600 sm:px-4 sm:py-2 sm:text-sm sm:hover:from-blue-600 sm:hover:to-blue-700"
            :title="store.isCalculating ? '计算中...' : '运行模拟'"
          >
            <Play v-if="!store.isCalculating" class="h-4 w-4" />
            <RefreshCw v-else class="h-4 w-4 animate-spin" />
            <span class="hidden sm:ml-1.5 sm:inline">{{ store.isCalculating ? '计算中...' : '运行模拟' }}</span>
          </button>
        </div>
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
    <div class="mb-3 flex gap-1 rounded-xl bg-zinc-100 p-1 sm:mb-5 dark:bg-white/5">
      <button
        @click="activeTab = 'config'"
        class="flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all sm:px-4 sm:py-2.5 sm:text-sm"
        :class="[
          activeTab === 'config'
            ? 'bg-white text-blue-600 shadow-sm dark:bg-white/10 dark:text-blue-400'
            : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
        ]"
      >
        参数配置
      </button>
      <button
        @click="activeTab = 'results'"
        :disabled="!store.hasCalculated"
        class="flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all sm:px-4 sm:py-2.5 sm:text-sm"
        :class="[
          activeTab === 'results'
            ? 'bg-white text-blue-600 shadow-sm dark:bg-white/10 dark:text-blue-400'
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

    <!-- 确认对话框 -->
    <ConfirmDialog
      v-model:open="showResetConfirm"
      title="确认重置"
      message="重置后将恢复所有参数为默认值，此操作不可撤销。确定要继续吗？"
      confirm-text="确认重置"
      cancel-text="取消"
      @confirm="handleResetConfirm"
    />
  </div>
</template>
