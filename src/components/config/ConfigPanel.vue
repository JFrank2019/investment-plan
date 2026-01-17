<script setup lang="ts">
import { computed } from 'vue'
import { useInvestmentStore } from '@/stores/investment'
import { formatMoney } from '@/engine'
import { Wallet, PiggyBank, TrendingUp, RefreshCw, Clock, Shuffle } from 'lucide-vue-next'

const store = useInvestmentStore()

// 每月定投金额（显示用）
const monthlyInvestment = computed(() => store.params.weeklyInvestment * (52 / 12))

// 总投入本金
const totalInvestment = computed(() => store.totalInvestment)

// 更新偏股比例时同步更新偏债比例
function updateEquityRatio(value: number) {
  store.updateParams({ initialEquityRatio: value / 100 })
}

function updateInvestEquityRatio(value: number) {
  store.updateParams({ investEquityRatio: value / 100 })
}

function updateRebalanceRatio(value: number) {
  store.updateParams({ rebalanceTargetEquityRatio: value / 100 })
}
</script>

<template>
  <div class="grid gap-3 sm:gap-6 lg:grid-cols-2">
    <!-- 初始资金配置 -->
    <div class="glass-card p-4 sm:p-6">
      <div class="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 sm:h-10 sm:w-10 dark:bg-blue-500/20"
        >
          <Wallet class="h-4 w-4 text-blue-600 sm:h-5 sm:w-5 dark:text-blue-400" />
        </div>
        <h3 class="text-base font-semibold text-zinc-900 sm:text-lg dark:text-white">初始资金</h3>
      </div>

      <div class="space-y-3 sm:space-y-4">
        <div>
          <label class="mb-1 block text-xs font-medium text-zinc-700 sm:mb-1.5 sm:text-sm dark:text-zinc-300">
            初始资金总额
          </label>
          <div class="relative">
            <input
              type="number"
              :value="store.params.initialCapital"
              @change="store.updateParams({ initialCapital: Number(($event.target as HTMLInputElement).value) || 0 })"
              class="input-field pr-10 text-sm sm:pr-12"
              min="0"
              step="10000"
            />
            <span
              class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 sm:right-4 sm:text-sm dark:text-zinc-400"
            >
              元
            </span>
          </div>
          <p class="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {{ formatMoney(store.params.initialCapital) }}
          </p>
        </div>

        <div>
          <label class="mb-1 block text-xs font-medium text-zinc-700 sm:mb-1.5 sm:text-sm dark:text-zinc-300">
            初始偏股比例：{{ (store.params.initialEquityRatio * 100).toFixed(0) }}%
          </label>
          <input
            type="range"
            :value="store.params.initialEquityRatio * 100"
            @input="updateEquityRatio(Number(($event.target as HTMLInputElement).value))"
            min="0"
            max="100"
            step="5"
            class="w-full accent-blue-500"
          />
          <div class="mt-0.5 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>偏股 {{ (store.params.initialEquityRatio * 100).toFixed(0) }}%</span>
            <span>偏债 {{ ((1 - store.params.initialEquityRatio) * 100).toFixed(0) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 定投配置 -->
    <div class="glass-card p-4 sm:p-6">
      <div class="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 sm:h-10 sm:w-10 dark:bg-emerald-500/20"
        >
          <PiggyBank class="h-4 w-4 text-emerald-600 sm:h-5 sm:w-5 dark:text-emerald-400" />
        </div>
        <h3 class="text-base font-semibold text-zinc-900 sm:text-lg dark:text-white">定投计划</h3>
      </div>

      <div class="space-y-3 sm:space-y-4">
        <div>
          <label class="mb-1 block text-xs font-medium text-zinc-700 sm:mb-1.5 sm:text-sm dark:text-zinc-300">
            每周定投金额
          </label>
          <div class="relative">
            <input
              type="number"
              :value="store.params.weeklyInvestment"
              @change="store.updateParams({ weeklyInvestment: Number(($event.target as HTMLInputElement).value) || 0 })"
              class="input-field pr-12 text-sm"
              min="0"
              step="100"
            />
            <span
              class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 sm:right-4 sm:text-sm dark:text-zinc-400"
            >
              元/周
            </span>
          </div>
          <p class="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            约 {{ formatMoney(monthlyInvestment) }}/月
          </p>
        </div>

        <div>
          <label class="mb-1 block text-xs font-medium text-zinc-700 sm:mb-1.5 sm:text-sm dark:text-zinc-300">
            定投偏股比例：{{ (store.params.investEquityRatio * 100).toFixed(0) }}%
          </label>
          <input
            type="range"
            :value="store.params.investEquityRatio * 100"
            @input="updateInvestEquityRatio(Number(($event.target as HTMLInputElement).value))"
            min="0"
            max="100"
            step="5"
            class="w-full accent-emerald-500"
          />
          <div class="mt-0.5 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>偏股 {{ (store.params.investEquityRatio * 100).toFixed(0) }}%</span>
            <span>偏债 {{ ((1 - store.params.investEquityRatio) * 100).toFixed(0) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 收益率配置 -->
    <div class="glass-card p-4 sm:p-6">
      <div class="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 sm:h-10 sm:w-10 dark:bg-blue-500/20"
        >
          <TrendingUp class="h-4 w-4 text-blue-600 sm:h-5 sm:w-5 dark:text-blue-400" />
        </div>
        <h3 class="text-base font-semibold text-zinc-900 sm:text-lg dark:text-white">收益率预期</h3>
      </div>

      <div class="space-y-3 sm:space-y-4">
        <div class="grid grid-cols-2 gap-2 sm:gap-4">
          <div>
            <label class="mb-1 block text-xs font-medium text-zinc-700 sm:mb-1.5 sm:text-sm dark:text-zinc-300">
              偏股年化收益率
            </label>
            <div class="relative">
              <input
                type="number"
                :value="(store.params.equityReturn * 100).toFixed(1)"
                @change="store.updateParams({ equityReturn: (Number(($event.target as HTMLInputElement).value) || 0) / 100 })"
                class="input-field pr-6 text-sm sm:pr-8"
                step="0.5"
              />
              <span
                class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-500 sm:right-3 sm:text-sm dark:text-zinc-400"
              >
                %
              </span>
            </div>
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-zinc-700 sm:mb-1.5 sm:text-sm dark:text-zinc-300">
              偏股波动率
            </label>
            <div class="relative">
              <input
                type="number"
                :value="(store.params.equityVolatility * 100).toFixed(1)"
                @change="store.updateParams({ equityVolatility: (Number(($event.target as HTMLInputElement).value) || 0) / 100 })"
                class="input-field pr-6 text-sm sm:pr-8"
                step="1"
              />
              <span
                class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-500 sm:right-3 sm:text-sm dark:text-zinc-400"
              >
                %
              </span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 sm:gap-4">
          <div>
            <label class="mb-1 block text-xs font-medium text-zinc-700 sm:mb-1.5 sm:text-sm dark:text-zinc-300">
              偏债年化收益率
            </label>
            <div class="relative">
              <input
                type="number"
                :value="(store.params.bondReturn * 100).toFixed(1)"
                @change="store.updateParams({ bondReturn: (Number(($event.target as HTMLInputElement).value) || 0) / 100 })"
                class="input-field pr-6 text-sm sm:pr-8"
                step="0.5"
              />
              <span
                class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-500 sm:right-3 sm:text-sm dark:text-zinc-400"
              >
                %
              </span>
            </div>
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-zinc-700 sm:mb-1.5 sm:text-sm dark:text-zinc-300">
              偏债波动率
            </label>
            <div class="relative">
              <input
                type="number"
                :value="(store.params.bondVolatility * 100).toFixed(1)"
                @change="store.updateParams({ bondVolatility: (Number(($event.target as HTMLInputElement).value) || 0) / 100 })"
                class="input-field pr-6 text-sm sm:pr-8"
                step="0.5"
              />
              <span
                class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-500 sm:right-3 sm:text-sm dark:text-zinc-400"
              >
                %
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 再平衡与模拟配置 -->
    <div class="glass-card p-4 sm:p-6">
      <div class="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 sm:h-10 sm:w-10 dark:bg-amber-500/20"
        >
          <RefreshCw class="h-4 w-4 text-amber-600 sm:h-5 sm:w-5 dark:text-amber-400" />
        </div>
        <h3 class="text-base font-semibold text-zinc-900 sm:text-lg dark:text-white">再平衡与模拟</h3>
      </div>

      <div class="space-y-3 sm:space-y-4">
        <div class="grid grid-cols-2 gap-2 sm:gap-4">
          <div>
            <label class="mb-1 block text-xs font-medium text-zinc-700 sm:mb-1.5 sm:text-sm dark:text-zinc-300">
              再平衡周期
            </label>
            <select
              :value="store.params.rebalancePeriod"
              @change="store.updateParams({ rebalancePeriod: Number(($event.target as HTMLSelectElement).value) })"
              class="input-field text-sm"
            >
              <option :value="0">不再平衡</option>
              <option :value="3">每季度</option>
              <option :value="6">每半年</option>
              <option :value="12">每年</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-zinc-700 sm:mb-1.5 sm:text-sm dark:text-zinc-300">
              目标偏股比例
            </label>
            <div class="relative">
              <input
                type="number"
                :value="(store.params.rebalanceTargetEquityRatio * 100).toFixed(0)"
                @change="updateRebalanceRatio(Number(($event.target as HTMLInputElement).value) || 0)"
                class="input-field pr-6 text-sm sm:pr-8"
                min="0"
                max="100"
                step="5"
                :disabled="store.params.rebalancePeriod === 0"
              />
              <span
                class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-500 sm:right-3 sm:text-sm dark:text-zinc-400"
              >
                %
              </span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 sm:gap-4">
          <div>
            <label class="mb-1 block text-xs font-medium text-zinc-700 sm:mb-1.5 sm:text-sm dark:text-zinc-300">
              模拟时长
            </label>
            <select
              :value="store.params.simulationMonths"
              @change="store.updateParams({ simulationMonths: Number(($event.target as HTMLSelectElement).value) })"
              class="input-field text-sm"
            >
              <option :value="6">6个月</option>
              <option :value="12">1年</option>
              <option :value="24">2年</option>
              <option :value="36">3年</option>
              <option :value="60">5年</option>
              <option :value="120">10年</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-zinc-700 sm:mb-1.5 sm:text-sm dark:text-zinc-300">
              模拟路径数
            </label>
            <select
              :value="store.params.monteCarloPathCount"
              @change="store.updateParams({ monteCarloPathCount: Number(($event.target as HTMLSelectElement).value) })"
              class="input-field text-sm"
            >
              <option :value="100">100条（快速）</option>
              <option :value="500">500条</option>
              <option :value="1000">1000条（推荐）</option>
              <option :value="5000">5000条（精确）</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- 投入汇总 -->
    <div class="glass-card col-span-full p-4 sm:p-6">
      <div class="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 sm:h-10 sm:w-10 dark:bg-white/10"
        >
          <Clock class="h-4 w-4 text-zinc-600 sm:h-5 sm:w-5 dark:text-zinc-400" />
        </div>
        <h3 class="text-base font-semibold text-zinc-900 sm:text-lg dark:text-white">投入汇总</h3>
      </div>

      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
        <div class="rounded-md bg-zinc-50 p-3 sm:p-4 dark:bg-white/5">
          <p class="text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">初始本金</p>
          <p class="mt-0.5 text-base font-semibold text-zinc-900 sm:mt-1 sm:text-xl dark:text-white">
            {{ formatMoney(store.params.initialCapital) }}
          </p>
        </div>
        <div class="rounded-md bg-zinc-50 p-3 sm:p-4 dark:bg-white/5">
          <p class="text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">定投总额</p>
          <p class="mt-0.5 text-base font-semibold text-zinc-900 sm:mt-1 sm:text-xl dark:text-white">
            {{ formatMoney(totalInvestment - store.params.initialCapital) }}
          </p>
        </div>
        <div class="rounded-md bg-zinc-50 p-3 sm:p-4 dark:bg-white/5">
          <p class="text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">累计投入</p>
          <p class="mt-0.5 text-base font-semibold text-blue-600 sm:mt-1 sm:text-xl dark:text-blue-400">
            {{ formatMoney(totalInvestment) }}
          </p>
        </div>
        <div class="rounded-md bg-zinc-50 p-3 sm:p-4 dark:bg-white/5">
          <p class="text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">模拟时长</p>
          <p class="mt-0.5 text-base font-semibold text-zinc-900 sm:mt-1 sm:text-xl dark:text-white">
            {{ store.params.simulationMonths }}个月
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
