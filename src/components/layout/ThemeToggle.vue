<script setup lang="ts">
import { useDark, useToggle, usePreferredDark } from '@vueuse/core'
import { watch } from 'vue'
import { Sun, Moon } from 'lucide-vue-next'

const preferredDark = usePreferredDark()
const isDark = useDark({
  selector: 'html',
  attribute: 'class',
})

// 跟随系统主题变化
watch(preferredDark, (value) => {
  isDark.value = value
}, { immediate: true })

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
