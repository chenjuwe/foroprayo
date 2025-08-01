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
    setupFiles: [process.env.VITEST_SETUP_FILE || './src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
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
      ],
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
    // 並行測試配置
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // 環境變數
    env: {
      NODE_ENV: 'test',
    },
    // 測試報告
    reporters: [
      'default',
      'html',
      'json',
    ],
    // 輸出目錄
    outputFile: {
      html: './test-results/index.html',
      json: './test-results/results.json',
    },
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