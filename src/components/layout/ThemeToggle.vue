<script setup lang="ts">
import { useToggle } from '@vueuse/core'
import { Sun, Moon } from 'lucide-vue-next'
import { useThemeMode } from '@/composables/useThemeMode'

// 主题状态统一由 useThemeMode 管理，避免多个组件各自维护造成冲突
const isDark = useThemeMode()

const toggleDark = useToggle(isDark)
</script>

<template>
  <button
    @click="toggleDark()"
    class="relative flex h-8 w-8 items-center justify-center rounded-sm transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-white/10"
    :title="isDark ? '切换到亮色模式' : '切换到暗色模式'"
  >
    <Sun v-if="isDark" class="h-4 w-4 text-zinc-400 transition-colors hover:text-zinc-200" />
    <Moon v-else class="h-4 w-4 text-zinc-600 transition-colors hover:text-zinc-900" />
  </button>
</template>
