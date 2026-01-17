<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { TrendingUp, BarChart3 } from 'lucide-vue-next'
import ThemeToggle from './ThemeToggle.vue'

const route = useRoute()

const navItems = [
  // { path: '/', label: '首页', icon: TrendingUp },
  { path: '/simulator', label: '模拟器', icon: BarChart3 },
]
</script>

<template>
  <header class="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-white/10">
    <div class="glass-card !rounded-none !border-x-0 !border-t-0">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <!-- Logo -->
        <RouterLink to="/" class="flex items-center gap-2">
          <div
            class="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 dark:bg-white"
          >
            <TrendingUp class="h-5 w-5 text-white dark:text-zinc-900" />
          </div>
          <span class="text-lg font-semibold text-zinc-900 dark:text-white">投资模拟器</span>
        </RouterLink>

        <!-- Navigation -->
        <nav class="flex items-center gap-1">
          <RouterLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200"
            :class="[
              route.path === item.path || (item.path !== '/' && route.path.startsWith(item.path))
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white',
            ]"
          >
            <component :is="item.icon" class="h-4 w-4" />
            {{ item.label }}
          </RouterLink>

          <div class="mx-2 h-6 w-px bg-zinc-200 dark:bg-white/10" />

          <ThemeToggle />
        </nav>
      </div>
    </div>
  </header>
</template>
