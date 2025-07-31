/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// Import PWA plugin
import { VitePWA } from 'vite-plugin-pwa';
import svgr from 'vite-plugin-svgr';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    // 允許所有網路介面連線
    host: true,
    port: 5173, 
    strictPort: false,
    // 明確配置 HMR
    hmr: {
      port: 5173,
      host: 'localhost',
      protocol: 'ws'
    },
    // 移除 hmr 設定，讓 Vite 自動處理
    headers:
      mode === 'development'
        ? {
            'Cache-Control': 'no-store',
            'Access-Control-Allow-Origin': '*',
          }
        : undefined,
  },
  css: {
    devSourcemap: true,
  },
  plugins: [
    react(),
    svgr(),
    // Enable PWA plugin
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
              name: 'Prayforo',
      short_name: 'Prayforo',
        description: '使用 Firebase 的代禱應用程序',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
    {
      name: 'fix-css-invalid-rules',
      transform(code, id) {
        if (id.endsWith('.css') && code.includes('-:.')) {
          return {
            code: code.replace(/\.\[-\\?:\.\]\s*\{-:\s*\.\}/g, '.\\[-\\?:.\\.\\] {display: inline;}'),
            map: null
          };
        }
      },
      generateBundle(options, bundle) {
        // 檢查所有的 CSS 資源並修復 -:. 語法問題
        Object.keys(bundle).forEach(key => {
          const asset = bundle[key];
          if (key.endsWith('.css') && asset.type === 'asset' && asset.source) {
            // 將 CSS 中的問題語法替換為有效的語法
            const fixedSource = asset.source.toString().replace(/\.\[-\\?:\.\]\s*\{-:\s*\.\}/g, '.\\[-\\?:.\\.\\] {display: inline;}');
            asset.source = fixedSource;
          }
        });
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 2000, // 提高警告限制，避免提示大塊問題
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // 分離主要框架
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') || 
              id.includes('node_modules/react-router-dom/')) {
            return 'react-vendor';
          }
          
          // 進一步拆分 Firebase 相關包
          if (id.includes('node_modules/firebase/auth') || 
              id.includes('node_modules/@firebase/auth')) {
            return 'firebase-auth-vendor';
          }
          
          if (id.includes('node_modules/firebase/firestore') || 
              id.includes('node_modules/@firebase/firestore')) {
            return 'firebase-firestore-vendor';
          }
          
          if (id.includes('node_modules/firebase/storage') || 
              id.includes('node_modules/@firebase/storage')) {
            return 'firebase-storage-vendor';
          }
          
          if (id.includes('node_modules/firebase/') || 
              id.includes('node_modules/@firebase/')) {
            return 'firebase-core-vendor';
          }
          
          // 分離 UI 組件庫
          if (id.includes('node_modules/@radix-ui/') || 
              id.includes('node_modules/class-variance-authority/')) {
            return 'ui-vendor';
          }
          
          // 分離 TailwindCSS 相關庫
          if (id.includes('node_modules/tailwind') ||
              id.includes('node_modules/postcss')) {
            return 'tailwind-vendor';
          }
          
          // 分離數據管理相關庫
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'react-query-vendor';
          }
          
          if (id.includes('node_modules/zustand/')) {
            return 'zustand-vendor';
          }
          
          // 其他第三方庫
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },
        // 確保 CSS 正確分割
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info.at(-1);
          if (ext === 'css') {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      },
    },
    sourcemap: true,
  },
}));
