<script setup lang="ts">
import { computed } from 'vue'
import { useInvestmentStore } from '@/stores/investment'
import { formatMoney, type SimulationParams } from '@/engine'
import { Wallet, PiggyBank, TrendingUp, RefreshCw } from 'lucide-vue-next'
import RangeSlider from './RangeSlider.vue'
import PresetSelector from './PresetSelector.vue'

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

function getNumericValue(event: Event): number {
  const target = event.target
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
    return 0
  }
  return Number(target.value) || 0
}

function updateNumberParam<K extends keyof SimulationParams>(key: K, value: number) {
  store.updateParams({ [key]: value } as Pick<SimulationParams, K>)
}

function updateCurrencyParam<K extends keyof SimulationParams>(key: K, event: Event) {
  updateNumberParam(key, getNumericValue(event))
}

function updatePercentParam<K extends keyof SimulationParams>(key: K, event: Event) {
  updateNumberParam(key, getNumericValue(event) / 100)
}

function handleInitialCapitalChange(event: Event) {
  updateCurrencyParam('initialCapital', event)
}

function handleWeeklyInvestmentChange(event: Event) {
  updateCurrencyParam('weeklyInvestment', event)
}

function handleEquityReturnChange(event: Event) {
  updatePercentParam('equityReturn', event)
}

function handleEquityVolatilityChange(event: Event) {
  updatePercentParam('equityVolatility', event)
}

function handleBondReturnChange(event: Event) {
  updatePercentParam('bondReturn', event)
}

function handleBondVolatilityChange(event: Event) {
  updatePercentParam('bondVolatility', event)
}

function handleRebalancePeriodChange(event: Event) {
  updateNumberParam('rebalancePeriod', getNumericValue(event))
}

function handleSimulationMonthsChange(event: Event) {
  updateNumberParam('simulationMonths', getNumericValue(event))
}

function handleMonteCarloPathCountChange(event: Event) {
  updateNumberParam('monteCarloPathCount', getNumericValue(event))
}

function handleInflationRateChange(event: Event) {
  updatePercentParam('inflationRate', event)
}
</script>

<template>
  <div class="space-y-6">
    <!-- 预设模板 -->
    <PresetSelector />

    <!-- 配置面板 -->
    <div class="data-panel p-6">
      <!-- 1. 初始资金 -->
      <div class="mb-8">
        <h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
          <Wallet class="h-4 w-4 icon-base" />
          初始资金
        </h3>
        <div class="grid gap-6 sm:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              资金总额
            </label>
            <div class="relative">
              <input
                type="number"
                :value="store.params.initialCapital"
                @input="handleInitialCapitalChange"
                class="input-field pr-10"
                min="0"
                step="10000"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">CNY</span>
            </div>
            <p class="mt-1 font-mono text-xs text-zinc-400">
              {{ formatMoney(store.params.initialCapital) }}
            </p>
          </div>

          <div>
            <label class="mb-1.5 flex justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span>偏股比例</span>
              <span class="font-mono">{{ (store.params.initialEquityRatio * 100).toFixed(0) }}%</span>
            </label>
            <RangeSlider
              :model-value="store.params.initialEquityRatio * 100"
              @update:model-value="updateEquityRatio"
              :min="0"
              :max="100"
              :step="5"
            />
          </div>
        </div>
      </div>

      <div class="section-divider"></div>

      <!-- 2. 定投计划 -->
      <div class="mb-8">
        <h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
          <PiggyBank class="h-4 w-4 icon-base" />
          定投计划
        </h3>
        <div class="grid gap-6 sm:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              每周定投
            </label>
            <div class="relative">
              <input
                type="number"
                :value="store.params.weeklyInvestment"
                @input="handleWeeklyInvestmentChange"
                class="input-field pr-12"
                min="0"
                step="100"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">CNY/W</span>
            </div>
            <p class="mt-1 font-mono text-xs text-zinc-400">
              ≈ {{ formatMoney(monthlyInvestment) }} / Mo
            </p>
          </div>

          <div>
            <label class="mb-1.5 flex justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span>定投偏股比例</span>
              <span class="font-mono">{{ (store.params.investEquityRatio * 100).toFixed(0) }}%</span>
            </label>
            <RangeSlider
              :model-value="store.params.investEquityRatio * 100"
              @update:model-value="updateInvestEquityRatio"
              :min="0"
              :max="100"
              :step="5"
            />
          </div>
        </div>
      </div>

      <div class="section-divider"></div>

      <!-- 3. 市场预期 -->
      <div class="mb-8">
        <h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
          <TrendingUp class="h-4 w-4 icon-base" />
          市场预期 (年化)
        </h3>
        <div class="grid gap-6 sm:grid-cols-2">
          <!-- 权益类 -->
          <div class="space-y-4">
            <h4 class="text-xs font-medium text-zinc-900 dark:text-zinc-100">权益类资产 (Equity)</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-1 block text-[10px] text-zinc-400">收益率</label>
                <div class="relative">
                  <input
                    type="number"
                    :value="(store.params.equityReturn * 100).toFixed(1)"
                    @input="handleEquityReturnChange"
                    class="input-field pr-6"
                    step="0.5"
                  />
                  <span class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">%</span>
                </div>
              </div>
              <div>
                <label class="mb-1 block text-[10px] text-zinc-400">波动率</label>
                <div class="relative">
                  <input
                    type="number"
                    :value="(store.params.equityVolatility * 100).toFixed(1)"
                    @input="handleEquityVolatilityChange"
                    class="input-field pr-6"
                    step="1"
                  />
                  <span class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 固收类 -->
          <div class="space-y-4">
            <h4 class="text-xs font-medium text-zinc-900 dark:text-zinc-100">固收类资产 (Bond)</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-1 block text-[10px] text-zinc-400">收益率</label>
                <div class="relative">
                  <input
                    type="number"
                    :value="(store.params.bondReturn * 100).toFixed(1)"
                    @input="handleBondReturnChange"
                    class="input-field pr-6"
                    step="0.5"
                  />
                  <span class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">%</span>
                </div>
              </div>
              <div>
                <label class="mb-1 block text-[10px] text-zinc-400">波动率</label>
                <div class="relative">
                  <input
                    type="number"
                    :value="(store.params.bondVolatility * 100).toFixed(1)"
                    @input="handleBondVolatilityChange"
                    class="input-field pr-6"
                    step="0.5"
                  />
                  <span class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="section-divider"></div>

      <!-- 4. 模拟参数 -->
      <div>
        <h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
          <RefreshCw class="h-4 w-4 icon-base" />
          模拟参数
        </h3>
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label class="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              模拟时长
            </label>
            <select
              :value="store.params.simulationMonths"
              @change="handleSimulationMonthsChange"
              class="input-field"
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
            <label class="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              再平衡周期
            </label>
            <select
              :value="store.params.rebalancePeriod"
              @change="handleRebalancePeriodChange"
              class="input-field"
            >
              <option :value="0">不平衡</option>
              <option :value="3">每季度</option>
              <option :value="6">每半年</option>
              <option :value="12">每年</option>
            </select>
          </div>

          <div>
            <label class="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              模拟路径
            </label>
            <select
              :value="store.params.monteCarloPathCount"
              @change="handleMonteCarloPathCountChange"
              class="input-field"
            >
              <option :value="100">100 (Fast)</option>
              <option :value="500">500</option>
              <option :value="1000">1000 (Rec)</option>
              <option :value="5000">5000 (Slow)</option>
            </select>
          </div>

          <div>
            <label class="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              通胀率
            </label>
            <div class="relative">
              <input
                type="number"
                :value="(store.params.inflationRate * 100).toFixed(1)"
                @input="handleInflationRateChange"
                class="input-field pr-6"
                step="0.1"
              />
              <span class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 投入汇总面板 -->
    <div class="data-panel p-4 bg-zinc-50 dark:bg-zinc-900/50">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div>
            <p class="text-[10px] uppercase tracking-wider text-zinc-500">Total Invested</p>
            <p class="font-mono text-lg font-bold text-zinc-900 dark:text-white">
              {{ formatMoney(totalInvestment) }}
            </p>
          </div>
          <div class="h-8 w-px bg-zinc-200 dark:bg-zinc-800"></div>
          <div>
            <p class="text-[10px] uppercase tracking-wider text-zinc-500">Initial</p>
            <p class="font-mono text-sm text-zinc-700 dark:text-zinc-300">
              {{ formatMoney(store.params.initialCapital) }}
            </p>
          </div>
          <div>
            <p class="text-[10px] uppercase tracking-wider text-zinc-500">Weekly</p>
            <p class="font-mono text-sm text-zinc-700 dark:text-zinc-300">
              {{ formatMoney(store.params.weeklyInvestment) }}
            </p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-[10px] uppercase tracking-wider text-zinc-500">Duration</p>
          <p class="font-mono text-sm font-medium text-zinc-900 dark:text-white">
            {{ store.params.simulationMonths }} Months
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
