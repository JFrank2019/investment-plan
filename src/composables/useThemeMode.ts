import { useDark } from '@vueuse/core'

export const THEME_STORAGE_KEY = 'theme-preference'

export function useThemeMode() {
  return useDark({
    selector: 'html',
    attribute: 'class',
    storageKey: THEME_STORAGE_KEY,
  })
}
