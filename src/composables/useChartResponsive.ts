import { computed } from 'vue'
import { useWindowSize } from '@vueuse/core'

export function useChartResponsive() {
  const { width } = useWindowSize()
  const isMobile = computed(() => width.value < 640)
  const isTablet = computed(() => width.value >= 640 && width.value < 1024)

  return {
    isMobile,
    isTablet,
  }
}
