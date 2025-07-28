/// <reference types="vitest" />
import { defineConfig, UserConfig } from 'vitest/config';
import viteConfig from './vite.config';

// https://vitest.dev/config/
const viteConfigResolved =
  typeof viteConfig === 'function'
    ? viteConfig({ mode: 'test', command: 'serve' })
    : viteConfig;

export default defineConfig({
  plugins: viteConfigResolved.plugins,
  resolve: viteConfigResolved.resolve,
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true,
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*'],
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        '**/*.d.ts',
        '**/*.config.*',
        'src/vite-env.d.ts',
        'src/main.tsx',
        'dist/',
        'ios/',
        '**/*.test.*',
        '**/*.spec.*',
      ],
      thresholds: {
        global: {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60,
        },
      },
    },
  },
}); 