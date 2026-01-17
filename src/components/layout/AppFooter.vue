<script setup lang="ts">
import { Github } from 'lucide-vue-next'
</script>

<template>
  <footer class="mt-auto border-t border-zinc-200 dark:border-white/10">
    <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p class="text-sm text-zinc-500 dark:text-zinc-400">
          投资有风险，入市需谨慎。本工具仅供参考，不构成投资建议。
        </p>
        <div class="flex items-center gap-4">
          <a
            href="#"
            class="text-sm text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            关于
          </a>
          <a
            href="#"
            class="flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <Github class="h-4 w-4" />
            GitHub
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>
