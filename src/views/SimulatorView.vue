<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue'
import { useInvestmentStore } from '@/stores/investment'
import { Play, RefreshCw, AlertTriangle, Square, Settings2, BarChart2 } from 'lucide-vue-next'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const ConfigPanel = defineAsyncComponent(() => import('@/components/config/ConfigPanel.vue'))
const StatsCards = defineAsyncComponent(() => import('@/components/stats/StatsCards.vue'))
const RiskMetricsCard = defineAsyncComponent(() => import('@/components/stats/RiskMetricsCard.vue'))
const AssetGrowthChart = defineAsyncComponent(() => import('@/components/charts/AssetGrowthChart.vue'))
const DistributionChart = defineAsyncComponent(() => import('@/components/charts/DistributionChart.vue'))
const AllocationChart = defineAsyncComponent(() => import('@/components/charts/AllocationChart.vue'))

const store = useInvestmentStore()
const activeTab = ref<'config' | 'results'>('config')
const showResetConfirm = ref(false)
const monteCarloProgressPercent = computed(() => {
  const rawProgress = store.monteCarloProgress
  if (!Number.isFinite(rawProgress)) {
    return 0
  }
  return Math.round(Math.min(1, Math.max(0, rawProgress)) * 100)
})

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
}

function handleCancelSimulation() {
  store.cancelSimulation()
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">投资收益模拟器</h1>
        <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          基于蒙特卡洛模拟的长期资产配置预测工具
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="handleResetClick"
          class="btn-secondary"
          title="重置参数"
        >
          <RefreshCw class="h-4 w-4" />
          <span class="hidden sm:inline">重置</span>
        </button>
        
        <button
          v-if="store.isCalculating"
          @click="handleCancelSimulation"
          class="btn-danger"
        >
          <Square class="h-3.5 w-3.5 fill-current" />
          <span>取消</span>
        </button>

        <button
          @click="handleRunSimulation"
          :disabled="store.isCalculating"
          class="btn-primary"
        >
          <RefreshCw v-if="store.isCalculating" class="h-4 w-4 animate-spin" />
          <Play v-else class="h-4 w-4 fill-current" />
          <span>{{ store.isCalculating ? '计算中...' : '运行模拟' }}</span>
        </button>
      </div>
    </div>

    <!-- Progress Bar -->
    <div
      v-if="store.isCalculating"
      class="mb-6 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
    >
      <div
        class="h-1 bg-zinc-900 transition-all duration-300 dark:bg-zinc-100"
        :style="{ width: `${monteCarloProgressPercent}%` }"
      ></div>
    </div>

    <!-- Warnings -->
    <div
      v-if="store.warnings.length > 0"
      class="mb-6 rounded-sm border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-900/10"
    >
      <div class="flex items-start gap-3">
        <AlertTriangle class="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
        <div>
          <h3 class="text-sm font-medium text-amber-900 dark:text-amber-200">参数提醒</h3>
          <ul class="mt-1 list-inside list-disc text-sm text-amber-800 dark:text-amber-300">
            <li v-for="(warning, index) in store.warnings" :key="`warning-${index}`">{{ warning }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Errors -->
    <div
      v-if="store.errors.length > 0"
      class="mb-6 rounded-sm border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-900/10"
    >
      <div class="flex items-start gap-3">
        <AlertTriangle class="h-5 w-5 shrink-0 text-red-600 dark:text-red-500" />
        <div>
          <h3 class="text-sm font-medium text-red-900 dark:text-red-200">参数错误</h3>
          <ul class="mt-1 list-inside list-disc text-sm text-red-800 dark:text-red-300">
            <li v-for="(error, index) in store.errors" :key="`error-${index}`">{{ error }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="mb-6 border-b border-zinc-200 dark:border-zinc-800">
      <nav class="-mb-px flex space-x-8" aria-label="Tabs">
        <button
          @click="activeTab = 'config'"
          :class="[
            activeTab === 'config'
              ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
              : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-300',
            'group flex items-center border-b-2 py-4 px-1 text-sm font-medium transition-colors'
          ]"
        >
          <Settings2 class="mr-2 h-4 w-4" />
          参数配置
        </button>
        <button
          @click="activeTab = 'results'"
          :disabled="!store.hasCalculated && !store.isCalculating"
          :class="[
            activeTab === 'results'
              ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
              : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-300',
            !store.hasCalculated && !store.isCalculating ? 'cursor-not-allowed opacity-50' : '',
            'group flex items-center border-b-2 py-4 px-1 text-sm font-medium transition-colors'
          ]"
        >
          <BarChart2 class="mr-2 h-4 w-4" />
          模拟结果
        </button>
      </nav>
    </div>

    <!-- Content -->
    <div v-if="activeTab === 'config'">
      <Suspense>
        <template #default>
          <ConfigPanel />
        </template>
        <template #fallback>
          <div class="space-y-6">
            <div class="h-24 animate-pulse bg-zinc-100 dark:bg-zinc-800"></div>
            <div class="grid gap-6 lg:grid-cols-2">
              <div class="h-72 animate-pulse bg-zinc-100 dark:bg-zinc-800"></div>
              <div class="h-72 animate-pulse bg-zinc-100 dark:bg-zinc-800"></div>
            </div>
          </div>
        </template>
      </Suspense>
    </div>

    <div v-else-if="activeTab === 'results' && store.isCalculating" class="space-y-8">
      <div class="rounded-sm border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p class="text-sm text-zinc-600 dark:text-zinc-400">正在计算最新模拟结果，请稍候...</p>
      </div>
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div v-for="idx in 8" :key="`loading-stats-${idx}`" class="h-28 animate-pulse bg-zinc-100 dark:bg-zinc-800"></div>
      </div>
      <div class="grid gap-8 lg:grid-cols-2">
        <div class="h-[400px] animate-pulse bg-zinc-100 dark:bg-zinc-800"></div>
        <div class="h-[400px] animate-pulse bg-zinc-100 dark:bg-zinc-800"></div>
      </div>
      <div class="h-[400px] animate-pulse bg-zinc-100 dark:bg-zinc-800"></div>
    </div>

    <div v-else-if="activeTab === 'results' && store.hasCalculated" class="space-y-8">
      <!-- Stats Cards -->
      <Suspense>
        <template #default>
          <StatsCards />
        </template>
        <template #fallback>
          <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div v-for="idx in 4" :key="idx" class="h-28 animate-pulse bg-zinc-100 dark:bg-zinc-800"></div>
          </div>
        </template>
      </Suspense>

      <!-- Risk Metrics Card -->
      <Suspense>
        <template #default>
          <RiskMetricsCard />
        </template>
        <template #fallback>
          <div class="h-64 animate-pulse bg-zinc-100 dark:bg-zinc-800"></div>
        </template>
      </Suspense>

      <!-- Charts -->
      <Suspense>
        <template #default>
          <div class="grid gap-8 lg:grid-cols-2">
            <div class="data-panel p-4">
              <AssetGrowthChart />
            </div>
            <div class="data-panel p-4">
              <DistributionChart />
            </div>
          </div>
        </template>
        <template #fallback>
          <div class="grid gap-8 lg:grid-cols-2">
            <div class="h-[400px] animate-pulse bg-zinc-100 dark:bg-zinc-800"></div>
            <div class="h-[400px] animate-pulse bg-zinc-100 dark:bg-zinc-800"></div>
          </div>
        </template>
      </Suspense>

      <Suspense>
        <template #default>
          <div class="data-panel p-4">
            <AllocationChart />
          </div>
        </template>
        <template #fallback>
          <div class="h-[400px] animate-pulse bg-zinc-100 dark:bg-zinc-800"></div>
        </template>
      </Suspense>
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
