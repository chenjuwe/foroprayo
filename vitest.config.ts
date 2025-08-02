/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    // 修復React 18並發模式問題的額外配置
    pool: 'forks',
    maxConcurrency: 1,
    setupFiles: [process.env.VITEST_SETUP_FILE || './src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: [
        'text',
        'text-summary',
        'json',
        'json-summary',
        'html',
        'lcov',
        'cobertura'
      ],
      exclude: [
        'node_modules/',
        'src/test/',
        'e2e/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/dist/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
        '**/test-results/**',
        '**/playwright-report/**',
        '**/*.test.{js,ts,jsx,tsx}',
        '**/*.spec.{js,ts,jsx,tsx}',
        '**/setupTests.ts',
        '**/test-utils.tsx',
        '**/test-helpers.ts',
        '**/test-constants.ts',
        '**/test-exports.ts',
      ],
      // 覆蓋率閾值設定
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        // 關鍵模組的更高覆蓋率要求
        './src/components/': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        './src/hooks/': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        './src/services/': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
      // 覆蓋率報告配置
      reportsDirectory: './coverage',
      // 包含未覆蓋的檔案
      all: true,
    },
    // 新增測試類型配置
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    // 排除 E2E 測試（由 Playwright 處理）
    exclude: [
      'e2e/**/*',
      'node_modules/**/*',
      'dist/**/*',
      '**/*.d.ts',
    ],
    // 性能測試配置
    testTimeout: 30000, // 30 秒超時
    hookTimeout: 30000,
    // 並行測試配置 - 修復React 18並發模式問題
    // 環境變數
    env: {
      NODE_ENV: 'test',
    },
    // 測試報告
    reporters: [
      'default',
      'html',
      'json',
      'junit',
    ],
    // 輸出目錄
    outputFile: {
      html: './test-results/index.html',
      json: './test-results/results.json',
      junit: './test-results/junit.xml',
    },
    // 測試執行順序
    sequence: {
      shuffle: false,
    },
    // 測試隔離
    isolate: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // 開發伺服器配置
  server: {
    port: 3000,
    host: true,
  },
  // 建置配置
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
  },
  // 預覽配置
  preview: {
    port: 4173,
    host: true,
  },
}) 