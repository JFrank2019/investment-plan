<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'
import { Sun, Moon } from 'lucide-vue-next'

// useDark 自动持久化到 localStorage，key 为 'vueuse-color-scheme'
// 首次访问时会跟随系统偏好，用户手动切换后会记住选择
const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  storageKey: 'theme-preference',
})

const toggleDark = useToggle(isDark)
</script>

<template>
  <button
    @click="toggleDark()"
    class="relative flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300 hover:bg-zinc-100 sm:h-9 sm:w-9 dark:hover:bg-white/10"
    :title="isDark ? '切换到亮色模式' : '切换到暗色模式'"
  >
    <Sun
      v-if="isDark"
      class="h-4 w-4 text-zinc-400 transition-colors hover:text-zinc-200 sm:h-5 sm:w-5"
    />
    <Moon
      v-else
      class="h-4 w-4 text-zinc-600 transition-colors hover:text-zinc-900 sm:h-5 sm:w-5"
    />
  </button>
</template>
