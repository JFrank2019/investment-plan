<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { TrendingUp, BarChart3 } from 'lucide-vue-next'
import ThemeToggle from './ThemeToggle.vue'

const route = useRoute()

const navItems = [
  { path: '/simulator', label: '模拟器', icon: BarChart3 },
]
</script>

<template>
  <header class="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
    <div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <!-- Logo -->
      <RouterLink to="/" class="flex items-center gap-2.5 group">
        <div
          class="flex h-8 w-8 items-center justify-center rounded bg-zinc-900 text-white transition-transform group-hover:scale-105 dark:bg-white dark:text-zinc-900"
        >
          <TrendingUp class="h-4 w-4" />
        </div>
        <span class="font-mono text-sm font-bold tracking-tight text-zinc-900 dark:text-white">INVEST.PLAN</span>
      </RouterLink>

      <!-- Navigation -->
      <nav class="flex items-center gap-4">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-2 text-sm font-medium transition-colors hover:text-zinc-900 dark:hover:text-white"
          :class="[
            route.path.startsWith(item.path)
              ? 'text-zinc-900 dark:text-white'
              : 'text-zinc-500 dark:text-zinc-400',
          ]"
        >
          <component :is="item.icon" class="h-4 w-4" />
          <span class="hidden sm:inline">{{ item.label }}</span>
        </RouterLink>

        <div class="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

        <ThemeToggle />
      </nav>
    </div>
  </header>
</template>
