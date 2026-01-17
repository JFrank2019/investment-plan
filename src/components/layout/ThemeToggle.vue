<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'
import { Sun, Moon } from 'lucide-vue-next'

const isDark = useDark()
const toggleDark = useToggle(isDark)
</script>

<template>
  <button
    @click="toggleDark()"
    class="relative flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-300 hover:bg-zinc-100 dark:hover:bg-white/10"
    :title="isDark ? '切换到亮色模式' : '切换到暗色模式'"
  >
    <Sun
      v-if="isDark"
      class="h-5 w-5 text-zinc-400 transition-colors hover:text-zinc-200"
    />
    <Moon
      v-else
      class="h-5 w-5 text-zinc-600 transition-colors hover:text-zinc-900"
    />
  </button>
</template>
