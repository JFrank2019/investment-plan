<script setup lang="ts">
interface Props {
  open: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
}

withDefaults(defineProps<Props>(), {
  title: '确认操作',
  message: '确定要执行此操作吗？',
  confirmText: '确认',
  cancelText: '取消',
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
  cancel: []
}>()

function handleConfirm() {
  emit('update:open', false)
  emit('confirm')
}

function handleCancel() {
  emit('update:open', false)
  emit('cancel')
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    handleCancel()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click="handleBackdropClick"
      >
        <Transition
          enter-active-class="transition-all duration-200"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-200"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-2"
        >
          <div
            v-if="open"
            class="glass-card w-full max-w-sm p-6 shadow-xl"
            @click.stop
          >
            <h3 class="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
              {{ title }}
            </h3>
            <p class="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
              {{ message }}
            </p>
            <div class="flex gap-3">
              <button
                @click="handleCancel"
                class="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-all hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
              >
                {{ cancelText }}
              </button>
              <button
                @click="handleConfirm"
                class="btn-primary flex-1 rounded-lg! px-4! py-2.5! text-sm"
              >
                {{ confirmText }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
