<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

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
  'update:modelValue': [value: number]
}>()

const sliderRef = ref<HTMLDivElement>()
const isDragging = ref(false)
const currentValue = ref(props.modelValue)

const percentage = computed(() => {
  const range = props.max - props.min
  return ((currentValue.value - props.min) / range) * 100
})

const handleStart = (e: MouseEvent | TouchEvent) => {
  if (props.disabled) return
  e.preventDefault()
  isDragging.value = true
  updateValue(e)
}

const handleMove = (e: MouseEvent | TouchEvent) => {
  if (!isDragging.value || props.disabled) return
  e.preventDefault()
  updateValue(e)
}

const handleEnd = () => {
  isDragging.value = false
}

const updateValue = (e: MouseEvent | TouchEvent) => {
  const slider = sliderRef.value
  if (!slider) return

  const rect = slider.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX
  const x = clientX - rect.left
  const percentage = Math.max(0, Math.min(1, x / rect.width))
  const range = props.max - props.min
  const rawValue = props.min + percentage * range
  const steppedValue = Math.round(rawValue / props.step) * props.step
  const clampedValue = Math.max(props.min, Math.min(props.max, steppedValue))

  currentValue.value = clampedValue
  emit('update:modelValue', clampedValue)
}

onMounted(() => {
  currentValue.value = props.modelValue
  window.addEventListener('mousemove', handleMove)
  window.addEventListener('mouseup', handleEnd)
  window.addEventListener('touchmove', handleMove, { passive: false })
  window.addEventListener('touchend', handleEnd)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMove)
  window.removeEventListener('mouseup', handleEnd)
  window.removeEventListener('touchmove', handleMove)
  window.removeEventListener('touchend', handleEnd)
})

// 监听外部值变化
const updateFromProps = () => {
  if (!isDragging.value) {
    currentValue.value = props.modelValue
  }
}

watch(() => props.modelValue, updateFromProps)
</script>

<template>
  <div
    ref="sliderRef"
    class="relative h-6 w-full cursor-pointer select-none"
    :class="{ 'cursor-not-allowed opacity-50': disabled }"
    @mousedown="handleStart"
    @touchstart.prevent="handleStart"
  >
    <!-- 轨道 -->
    <div
      class="absolute top-1/2 h-2 w-full -translate-y-1/2 rounded-full bg-zinc-200 dark:bg-white/10"
    ></div>

    <!-- 填充轨道 -->
    <div
      class="absolute top-1/2 h-2 -translate-y-1/2 rounded-full transition-all"
      :class="{
        'bg-blue-500': accentColor === 'blue',
        'bg-emerald-500': accentColor === 'emerald',
      }"
      :style="{ width: `${percentage}%` }"
    ></div>

    <!-- 滑块 -->
    <div
      class="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-white shadow-md transition-all"
      :class="{
        'border-blue-500': accentColor === 'blue' && !disabled,
        'border-emerald-500': accentColor === 'emerald' && !disabled,
        'scale-110': isDragging,
      }"
      :style="{ left: `${percentage}%` }"
    ></div>
  </div>
</template>
