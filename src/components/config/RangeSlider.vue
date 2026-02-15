<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  modelValue: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  accentColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  step: 1,
  disabled: false,
  accentColor: 'blue',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const sliderRef = ref<HTMLDivElement>()
const isDragging = ref(false)
const localValue = ref(props.modelValue)

const getClientX = (event: MouseEvent | TouchEvent): number | null => {
  if ('touches' in event) {
    return event.touches[0]?.clientX ?? null
  }
  return event.clientX
}

const percentage = computed(() => {
  const range = props.max - props.min
  if (range <= 0) return 0
  return Math.min(100, Math.max(0, ((localValue.value - props.min) / range) * 100))
})

const updateValueFromClientX = (clientX: number) => {
  const slider = sliderRef.value
  if (!slider) return

  const rect = slider.getBoundingClientRect()
  const x = clientX - rect.left
  const width = rect.width
  if (width <= 0) return

  let pct = x / width
  pct = Math.max(0, Math.min(1, pct))

  const range = props.max - props.min
  const rawValue = props.min + pct * range

  // Snap to step
  const steppedValue = Math.round(rawValue / props.step) * props.step
  const clampedValue = Math.max(props.min, Math.min(props.max, steppedValue))

  localValue.value = clampedValue
  emit('update:modelValue', clampedValue)
}

const handleStart = (e: MouseEvent | TouchEvent) => {
  if (props.disabled) return
  isDragging.value = true
  const clientX = getClientX(e)
  if (clientX === null) return
  updateValueFromClientX(clientX)

  window.addEventListener('mousemove', handleMove)
  window.addEventListener('mouseup', handleEnd)
  window.addEventListener('touchmove', handleMove, { passive: false })
  window.addEventListener('touchend', handleEnd)
}

const handleMove = (e: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return
  e.preventDefault() // Prevent scrolling while dragging
  const clientX = getClientX(e)
  if (clientX === null) return
  updateValueFromClientX(clientX)
}

const handleEnd = () => {
  isDragging.value = false
  window.removeEventListener('mousemove', handleMove)
  window.removeEventListener('mouseup', handleEnd)
  window.removeEventListener('touchmove', handleMove)
  window.removeEventListener('touchend', handleEnd)
}

watch(
  () => props.modelValue,
  (newVal) => {
    if (!isDragging.value) {
      localValue.value = newVal
    }
  },
)
</script>

<template>
  <div
    ref="sliderRef"
    class="relative h-6 w-full cursor-pointer select-none touch-none flex items-center"
    :class="{ 'cursor-not-allowed opacity-50': disabled }"
    @mousedown="handleStart"
    @touchstart="handleStart"
  >
    <!-- Track Background -->
    <div class="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
      <!-- Fill -->
      <div
        class="h-full transition-all duration-75 ease-out"
        :class="[
          accentColor === 'blue'
            ? 'bg-blue-600 dark:bg-blue-500'
            : 'bg-emerald-600 dark:bg-emerald-500',
        ]"
        :style="{ width: `${percentage}%` }"
      ></div>
    </div>

    <!-- Thumb -->
    <div
      class="absolute h-4 w-4 -translate-x-1/2 rounded-full bg-white border-2 shadow-sm transition-transform duration-100 ease-out dark:bg-zinc-900"
      :class="[
        accentColor === 'blue'
          ? 'border-blue-600 dark:border-blue-500'
          : 'border-emerald-600 dark:border-emerald-500',
        isDragging ? 'scale-125' : 'scale-100',
      ]"
      :style="{ left: `${percentage}%` }"
    ></div>
  </div>
</template>
