import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        include: ['src/**/*.{ts,vue}'],
        exclude: ['src/**/*.d.ts', 'src/**/__tests__/**', '**/*.test.ts', '**/*.spec.ts'],
        thresholds: {
          statements: 50,
          branches: 35,
          functions: 45,
          lines: 50,
          'src/engine/**/*.ts': {
            statements: 90,
            branches: 75,
            functions: 90,
            lines: 90,
          },
          'src/stores/**/*.ts': {
            statements: 70,
            branches: 40,
            functions: 60,
            lines: 75,
          },
        },
      },
    },
  }),
)
