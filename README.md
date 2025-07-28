# PfoFire v0.1.6

這是一個使用 Firebase 認證和存儲的代禱應用程序。

## 功能

- Firebase 電子郵件/密碼身份驗證
- Firebase Storage 用於頭像存儲
- 代禱社群功能
- 個人資料管理
- 響應式設計，支持移動端和桌面端

## 技術棧

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Shadcn UI
- Firebase Authentication
- Firebase Storage
- React Router
- Zustand (狀態管理)
- React Query (數據獲取與緩存)

## 安裝與運行

```bash
# 安裝依賴
npm install

# 啟動開發服務器
npm run dev

# 構建生產版本
npm run build
```

## 目錄結構

- `/src` - 源代碼
  - `/components` - React 組件
  - `/hooks` - 自定義 React hooks
  - `/pages` - 頁面組件
  - `/services` - 服務層
  - `/stores` - Zustand 狀態存儲
  - `/contexts` - React 上下文
  - `/lib` - 工具函數和庫
  - `/integrations` - 第三方集成 (Firebase, Supabase)

## 許可證

MIT
