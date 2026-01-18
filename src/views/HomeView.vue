<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ArrowRight, TrendingUp, BarChart3, Shield, Calculator } from 'lucide-vue-next'

const features = [
  {
    icon: Calculator,
    title: '参数化配置',
    description: '自定义初始资金、定投金额、股债比例、收益率预期等所有关键参数',
  },
  {
    icon: TrendingUp,
    title: '确定性计算',
    description: '基于复利公式精确计算理想情况下的资产增长轨迹',
  },
  {
    icon: BarChart3,
    title: '蒙特卡洛模拟',
    description: '引入收益率波动，模拟上千条可能的投资路径，展示概率分布',
  },
  {
    icon: Shield,
    title: '风险评估',
    description: '计算最大回撤、亏损概率等风险指标，帮助理性决策',
  },
]
</script>

<template>
  <div class="flex flex-col">
    <!-- Hero Section -->
    <section class="relative overflow-hidden py-20 sm:py-32">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-3xl text-center">
          <h1
            class="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl lg:text-6xl"
          >
            <span class="gradient-text">智能投资</span>
            <br />
            收益模拟器
          </h1>
          <p class="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            基于蒙特卡洛模拟的专业投资分析工具，帮助你理解复利效应、规划资金配置、评估投资风险。
          </p>
          <div class="mt-10 flex items-center justify-center gap-4">
            <RouterLink to="/simulator" class="btn-primary inline-flex items-center gap-2">
              开始模拟
              <ArrowRight class="h-4 w-4" />
            </RouterLink>
            <a
              href="#features"
              class="rounded-md px-6 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
            >
              了解更多
            </a>
          </div>
        </div>
      </div>

      <!-- Background Decoration -->
      <div
        class="absolute -top-40 right-0 -z-10 h-[600px] w-[600px] rounded-full bg-blue-500/20 blur-3xl dark:bg-blue-500/10"
      />
      <div
        class="absolute -bottom-40 left-0 -z-10 h-[400px] w-[400px] rounded-full bg-blue-600/15 blur-3xl dark:bg-blue-600/10"
      />
    </section>

    <!-- Features Section -->
    <section id="features" class="py-20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <h2 class="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">核心功能</h2>
          <p class="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            专业的投资分析工具，助你做出更明智的投资决策
          </p>
        </div>

        <div class="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="glass-card glass-card--interactive p-6 transition-all duration-300 hover:scale-[1.02]"
          >
            <div
              class="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25"
            >
              <component :is="feature.icon" class="h-6 w-6 text-white" />
            </div>
            <h3 class="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
              {{ feature.title }}
            </h3>
            <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {{ feature.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="glass-card overflow-hidden">
          <div
            class="relative px-6 py-16 sm:px-16 sm:py-24"
            style="
              background: linear-gradient(
                135deg,
                rgba(59, 130, 246, 0.1) 0%,
                rgba(37, 99, 235, 0.1) 100%
              );
            "
          >
            <div class="mx-auto max-w-2xl text-center">
              <h2 class="text-2xl font-bold text-zinc-900 dark:text-white sm:text-3xl">
                开始规划你的投资之旅
              </h2>
              <p class="mt-4 text-zinc-600 dark:text-zinc-400">
                输入你的投资参数，查看未来可能的资产变化轨迹
              </p>
              <RouterLink to="/simulator" class="btn-primary mt-8 inline-flex items-center gap-2">
                立即体验
                <ArrowRight class="h-4 w-4" />
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
