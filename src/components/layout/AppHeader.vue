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
    <div class="glass-card rounded-none! border-x-0! border-t-0!">
      <div class="mx-auto flex h-12 max-w-7xl items-center justify-between px-3 sm:h-14 sm:px-6 lg:px-8">
        <!-- Logo -->
        <RouterLink to="/" class="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-blue-600 shadow-md shadow-blue-500/25 sm:h-9 sm:w-9"
          >
            <TrendingUp class="h-4 w-4 text-white sm:h-5 sm:w-5" />
          </div>
          <span class="hidden text-lg font-semibold text-zinc-900 sm:inline dark:text-white">投资模拟器</span>
        </RouterLink>

        <!-- Navigation -->
        <nav class="flex items-center gap-1">
          <RouterLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all duration-200 sm:gap-2 sm:px-4 sm:py-2"
            :class="[
              route.path === item.path || (item.path !== '/' && route.path.startsWith(item.path))
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                : 'text-zinc-600 hover:bg-blue-50 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-blue-500/10 dark:hover:text-blue-400',
            ]"
          >
            <component :is="item.icon" class="h-4 w-4" />
            <span class="hidden sm:inline">{{ item.label }}</span>
          </RouterLink>

          <div class="mx-1 h-5 w-px bg-zinc-200 sm:mx-2 sm:h-6 dark:bg-white/10" />

          <ThemeToggle />
        </nav>
      </div>
    </div>
  </header>
</template>
