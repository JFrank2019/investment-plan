<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ArrowRight, TrendingUp, BarChart3, Shield, Calculator, Zap } from 'lucide-vue-next'

const features = [
  {
    icon: Calculator,
    title: '参数化配置',
    description: '自定义初始资金、定投金额、股债比例、收益率预期等所有关键参数',
    tag: 'Config',
  },
  {
    icon: TrendingUp,
    title: '确定性计算',
    description: '基于复利公式精确计算理想情况下的资产增长轨迹',
    tag: 'Deterministic',
  },
  {
    icon: BarChart3,
    title: '蒙特卡洛模拟',
    description: '引入收益率波动，模拟上千条可能的投资路径，展示概率分布',
    tag: 'Monte Carlo',
  },
  {
    icon: Shield,
    title: '风险评估',
    description: '计算最大回撤、亏损概率等风险指标，帮助理性决策',
    tag: 'Risk',
  },
]

const metrics = [
  { label: '模拟路径', value: '5,000+', suffix: 'paths' },
  { label: '风险指标', value: '6', suffix: 'metrics' },
  { label: '置信区间', value: '90%', suffix: 'CI' },
]
</script>

<template>
  <div class="flex flex-col">
    <!-- Hero Section -->
    <section class="relative overflow-hidden py-20 sm:py-28 lg:py-36">
      <div class="dark:bg-grid-pattern absolute inset-0" />

      <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-3xl text-center">
          <div
            class="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-3 py-1 text-xs font-medium text-zinc-600 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400"
          >
            <Zap class="h-3 w-3 text-emerald-500" />
            <span>Monte Carlo Simulation Engine</span>
            <span class="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </div>

          <h1
            class="animate-fade-up text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
            style="animation-delay: 80ms"
          >
            <span class="gradient-text">智能投资</span>
            <br />
            <span class="text-zinc-900 dark:text-white">收益模拟器</span>
          </h1>

          <p
            class="animate-fade-up mx-auto mt-6 max-w-xl text-base leading-relaxed text-zinc-500 dark:text-zinc-400 sm:text-lg"
            style="animation-delay: 160ms"
          >
            基于蒙特卡洛模拟的专业投资分析工具，帮助你理解复利效应、规划资金配置、评估投资风险。
          </p>

          <div
            class="animate-fade-up mt-10 flex items-center justify-center gap-4"
            style="animation-delay: 240ms"
          >
            <RouterLink to="/simulator" class="btn-primary inline-flex items-center gap-2 px-6 py-3">
              开始模拟
              <ArrowRight class="h-4 w-4" />
            </RouterLink>
            <a
              href="#features"
              class="btn-secondary inline-flex items-center gap-2 px-6 py-3"
            >
              了解更多
            </a>
          </div>

          <!-- Mini Metrics Row -->
          <div
            class="animate-fade-up mx-auto mt-14 flex max-w-md items-center justify-center gap-8 sm:gap-12"
            style="animation-delay: 320ms"
          >
            <div v-for="metric in metrics" :key="metric.label" class="text-center">
              <p class="money-text text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">
                {{ metric.value }}
              </p>
              <p class="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-400">
                {{ metric.label }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <h2 class="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
            核心功能
          </h2>
          <p class="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            专业的投资分析工具，助你做出更明智的投资决策
          </p>
        </div>

        <div class="stagger-children mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="glass-card glass-card--interactive group p-5"
          >
            <div class="mb-4 flex items-center justify-between">
              <div
                class="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-100 text-zinc-600 transition-colors group-hover:bg-zinc-900 group-hover:text-white dark:bg-zinc-800 dark:text-zinc-400 dark:group-hover:bg-white dark:group-hover:text-zinc-900"
              >
                <component :is="feature.icon" class="h-4 w-4" />
              </div>
              <span
                class="money-text text-[10px] uppercase tracking-widest text-zinc-300 dark:text-zinc-700"
              >
                {{ feature.tag }}
              </span>
            </div>
            <h3 class="text-sm font-semibold text-zinc-900 dark:text-white">
              {{ feature.title }}
            </h3>
            <p class="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              {{ feature.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          class="glass-card relative overflow-hidden px-6 py-14 sm:px-16 sm:py-20"
        >
          <div class="dark:bg-grid-pattern absolute inset-0 opacity-50" />
          <div class="relative mx-auto max-w-xl text-center">
            <h2 class="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">
              开始规划你的投资之旅
            </h2>
            <p class="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              输入你的投资参数，查看未来可能的资产变化轨迹
            </p>
            <RouterLink
              to="/simulator"
              class="btn-primary mt-8 inline-flex items-center gap-2 px-6 py-3"
            >
              立即体验
              <ArrowRight class="h-4 w-4" />
            </RouterLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
