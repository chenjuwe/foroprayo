# 測試策略與配置指南

## 📋 概述

本專案採用多層次測試策略，確保代碼品質、性能和用戶體驗。測試架構包括：

- **單元測試** - 測試個別組件和函數
- **集成測試** - 測試組件間的交互
- **端到端測試** - 測試完整用戶流程
- **性能測試** - 測試渲染性能和記憶體使用
- **視覺回歸測試** - 確保 UI 設計一致性

## 🛠 測試工具

### 核心測試框架
- **Vitest** - 單元測試和集成測試
- **Playwright** - 端到端測試和視覺回歸測試
- **@testing-library/react** - React 組件測試
- **@testing-library/user-event** - 用戶交互模擬

### 測試配置文件
- `vitest.config.ts` - Vitest 配置
- `playwright.config.ts` - Playwright 配置
- `src/setupTests.ts` - 測試環境設置

## 📁 測試文件結構

```
src/
├── components/
│   ├── Button.test.tsx
│   ├── SectionHeader.test.tsx
│   ├── PrayerHeader.test.tsx
│   ├── MessageCard.test.tsx
│   ├── UserInfo.test.tsx
│   └── PostActions.test.tsx
├── hooks/
│   ├── useFirebaseAvatar.test.tsx
│   ├── useUserDisplayName.test.ts
│   ├── use-mobile.test.tsx
│   ├── useIdlePrefetch.test.ts
│   ├── usePrayerAnswered.test.ts
│   └── useSocialFeatures.test.ts
├── services/
│   ├── auth/
│   │   ├── AuthService.test.ts
│   │   └── FirebaseUserService.test.ts
│   ├── background/
│   │   └── BackgroundService.test.ts
│   └── prayer/
│       └── PrayerAnsweredService.test.ts
├── pages/
│   └── Prayers.test.tsx
└── tests/
    └── performance/
        └── performance.test.tsx

e2e/
├── prayers.spec.ts
├── user-flow.spec.ts
└── visual-regression.spec.ts
```

## 🚀 測試命令

### 基本測試命令

```bash
# 運行所有單元測試
npm run test

# 運行測試並生成覆蓋率報告
npm run test:coverage

# 監控模式運行測試
npm run test:watch

# 測試 UI 介面
npm run test:ui
```

### 分類測試命令

```bash
# 組件測試
npm run test:component

# Hook 測試
npm run test:hook

# 服務層測試
npm run test:service

# 頁面測試
npm run test:page

# 性能測試
npm run test:performance:unit
```

### 端到端測試

```bash
# 運行所有端到端測試
npm run test:e2e

# 有頭模式運行 E2E 測試
npm run test:e2e:headed

# E2E 測試 UI 介面
npm run test:e2e:ui

# 除錯模式
npm run test:e2e:debug

# 查看測試報告
npm run test:e2e:report
```

### 視覺回歸測試

```bash
# 運行視覺回歸測試
npm run test:visual

# 更新視覺快照
npm run test:visual:update
```

### 綜合測試

```bash
# 運行所有測試
npm run test:all

# CI 環境測試
npm run test:ci

# 清理測試結果
npm run test:clean
```

## 📊 測試覆蓋率目標

| 測試類型 | 目標覆蓋率 | 當前狀態 |
|---------|-----------|----------|
| 函數覆蓋率 | > 80% | ✅ 已達成 |
| 分支覆蓋率 | > 70% | 🔄 改進中 |
| 行覆蓋率 | > 85% | ✅ 已達成 |
| 語句覆蓋率 | > 80% | ✅ 已達成 |

## 🎯 測試策略

### 1. 單元測試策略

**測試重點：**
- 組件渲染正確性
- 函數輸入輸出正確性
- 錯誤處理邏輯
- 邊界條件處理

**最佳實踐：**
- 使用 `describe` 和 `it` 進行測試分組
- 模擬外部依賴
- 測試名稱使用繁體中文，描述測試意圖
- 每個測試函數只測試一個功能點

### 2. 集成測試策略

**測試重點：**
- 組件間交互
- API 調用流程
- 狀態管理邏輯
- 路由導航

**覆蓋範圍：**
- React Query 數據流
- Firebase 服務集成
- 狀態管理 (Zustand)
- 路由系統

### 3. 端到端測試策略

**測試重點：**
- 完整用戶流程
- 跨瀏覽器相容性
- 響應式設計
- 性能表現

**測試場景：**
- 訪客模式瀏覽
- 用戶註冊登入
- 禱告創建與互動
- 個人資料管理

### 4. 性能測試策略

**測試指標：**
- 組件渲染時間 < 50ms
- 大量數據渲染 < 500ms
- 記憶體洩漏檢測
- Bundle 大小優化

**監控項目：**
- React 渲染性能
- 記憶體使用量
- 網路請求性能
- 頁面載入時間

### 5. 視覺回歸測試策略

**測試覆蓋：**
- 主要頁面快照
- 組件庫視覺測試
- 響應式設計驗證
- 主題和色彩一致性

**快照管理：**
- 定期更新基準快照
- 檢查視覺變更差異
- 多設備視覺驗證

## 🔧 Mock 策略

### 外部服務 Mock

```typescript
// Firebase 服務
vi.mock('@/integrations/firebase/client', () => ({
  db: vi.fn(),
  auth: vi.fn()
}));

// API 請求
vi.mock('@/lib/api', () => ({
  request: vi.fn()
}));
```

### 組件 Mock

```typescript
// 複雜組件 Mock
vi.mock('@/components/ComplexComponent', () => ({
  ComplexComponent: ({ children }: any) => <div data-testid="mock-component">{children}</div>
}));
```

### Hook Mock

```typescript
// 自定義 Hook Mock
vi.mock('@/hooks/useCustomHook', () => ({
  useCustomHook: vi.fn(() => ({
    data: mockData,
    isLoading: false,
    error: null
  }))
}));
```

## 🐛 測試除錯

### 常見問題解決

1. **模塊路徑錯誤**
   ```bash
   # 檢查 tsconfig.json 中的路徑別名配置
   # 確認 vite.config.ts 中的別名設置
   ```

2. **異步測試超時**
   ```typescript
   // 使用 waitFor 等待異步操作
   await waitFor(() => {
     expect(screen.getByText('載入完成')).toBeInTheDocument();
   });
   ```

3. **React Query 測試**
   ```typescript
   // 提供 QueryClient 包裝器
   const createWrapper = () => {
     const queryClient = new QueryClient({
       defaultOptions: { queries: { retry: false } }
     });
     return ({ children }) => (
       <QueryClientProvider client={queryClient}>
         {children}
       </QueryClientProvider>
     );
   };
   ```

### 測試除錯工具

```bash
# 詳細測試報告
npm run test:debug

# 更新失敗的快照
npm run test:fix

# 檢查測試覆蓋率
npm run test:report
```

## 📈 持續改進

### 定期檢查項目
- [ ] 測試覆蓋率達標
- [ ] 無破損測試
- [ ] 測試執行時間合理
- [ ] 視覺快照更新

### 新功能測試檢查清單
- [ ] 單元測試覆蓋新功能
- [ ] 集成測試驗證交互
- [ ] E2E 測試涵蓋用戶流程
- [ ] 性能測試檢查影響
- [ ] 視覺測試確保 UI 一致

## 🚦 CI/CD 集成

### GitHub Actions 配置
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm run test:ci
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### 測試門檻設定
- 所有測試必須通過
- 代碼覆蓋率不得低於 80%
- E2E 測試不得失敗
- 性能測試不得超過基準

---

## 📚 參考資源

- [Vitest 官方文檔](https://vitest.dev/)
- [Playwright 官方文檔](https://playwright.dev/)
- [Testing Library 官方文檔](https://testing-library.com/)
- [React Testing 最佳實踐](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**最後更新：** 2024年1月
**維護者：** 開發團隊 