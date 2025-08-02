# 測試標準指南

## 目錄
1. [命名與結構](#命名與結構)
2. [測試範圍](#測試範圍)
3. [最佳實踐](#最佳實踐)
4. [效能優化](#效能優化)
5. [資料管理](#資料管理)
6. [整合測試](#整合測試)
7. [端對端測試](#端對端測試)

## 命名與結構

### 測試文件命名
- 單元測試文件應使用與被測試文件相同的名稱，加上 `.test` 後綴
  - 例如：`Component.tsx` → `Component.test.tsx`
- 整合測試應放在 `test/integration` 目錄下，並使用 `.integration.test.tsx` 後綴
  - 例如：`auth-flow.integration.test.tsx`
- 效能測試應放在 `test/performance` 目錄下
  - 例如：`performance-benchmark.test.ts`

### 測試套件結構
測試套件應使用描述性的名稱，並按照功能層級進行分組：

```typescript
describe('元件名稱', () => {
  describe('功能1', () => {
    it('應該...', () => {
      // 測試程式碼
    });
  });

  describe('功能2', () => {
    it('在特定條件下應該...', () => {
      // 測試程式碼
    });
  });
});
```

### 測試案例命名
測試案例名稱應清楚說明被測試的行為和預期結果：
- 使用 "應該..." (`should...`) 開頭
- 包含動詞描述行為
- 提及預期結果
- 必要時提及前置條件

範例：
- `應該在使用者登入後顯示歡迎訊息`
- `應該在輸入無效時顯示錯誤訊息`
- `應該在網路錯誤時優雅地處理失敗`

## 測試範圍

### 單元測試
- 測試單一功能單元（函數、元件、類別）
- 模擬所有外部依賴
- 專注於測試功能邏輯，而非實現細節
- 覆蓋率目標：80%+

### 整合測試
- 測試多個單元如何協同工作
- 可能會使用真實或模擬的外部依賴
- 專注於測試元件和服務之間的互動
- 覆蓋率目標：50%+

### 端對端測試
- 測試完整的使用者流程
- 使用真實的外部依賴（或非常接近真實的模擬）
- 專注於測試使用者體驗和系統整體行為
- 覆蓋率：主要使用者流程

## 最佳實踐

### 通用原則
1. **獨立性**：每個測試應該獨立於其他測試
2. **可預測性**：測試應該產生一致的結果
3. **可讀性**：測試應該易於理解和維護
4. **速度**：測試應該快速執行

### 設置和清理
- 使用 `beforeEach` 和 `afterEach` 進行設置和清理
- 確保每個測試都有乾淨的初始狀態
- 使用 `vi.resetAllMocks()` 重置所有模擬

```typescript
beforeEach(() => {
  // 設置測試環境
  vi.resetAllMocks();
});

afterEach(() => {
  // 清理測試環境
});
```

### 斷言
- 使用明確的斷言，清楚表達預期結果
- 避免過度斷言：每個測試專注於一個行為
- 使用正確的匹配器，增加可讀性

```typescript
// 好的斷言示例
expect(user.name).toBe('測試用戶');
expect(errors).toHaveLength(0);
expect(button).toBeDisabled();

// 避免這樣的抽象斷言
expect(result).toBeTruthy();
```

### 模擬外部依賴
- 使用 `vi.mock()` 模擬外部模組
- 使用 `vi.fn()` 模擬個別函數
- 使用 `MockDatabase` 模擬數據庫操作

```typescript
vi.mock('@/services/authService', () => ({
  login: vi.fn().mockResolvedValue({ success: true }),
  logout: vi.fn().mockResolvedValue({ success: true }),
}));
```

## 效能優化

### 測試運行時間
- 單元測試應在 50ms 內完成
- 整合測試應在 200ms 內完成
- 避免不必要的等待和延遲

### 優化測試效能
- 使用 `testPerformanceOptimizer` 工具監測測試效能
- 針對慢測試進行優化
- 考慮使用並行測試提高效能

```typescript
// 使用效能監控
await testPerformanceOptimizer.measureExecutionTime(
  async () => {
    // 測試程式碼
  },
  '測試描述'
);
```

### 減少重複工作
- 使用 `beforeAll` 進行一次性設置
- 使用 `testPerformanceOptimizer.cache` 緩存昂貴的計算結果
- 共用測試數據和設置

## 資料管理

### 測試數據建立
- 使用 `TestDataFactory` 創建測試數據
- 為常見數據模式創建專用工廠函數
- 確保測試數據足以測試目標功能，但不要過度複雜

```typescript
// 創建測試用戶
const user = TestDataFactory.createUser({
  displayName: '測試用戶',
});

// 創建測試代禱
const prayer = TestDataFactory.createPrayer({
  content: '測試代禱內容',
  user_id: user.uid,
});
```

### 模擬數據庫
- 使用 `MockDatabase` 模擬 Firestore 操作
- 預先填充數據庫以測試查詢和過濾
- 測試關聯數據和複雜查詢

```typescript
// 設置測試數據庫
const db = MockDatabase.getInstance();
db.addCollection('users');
db.addDocument('users', 'user-1', { name: '測試用戶' });
```

## 整合測試

### 測試元件整合
- 使用 `renderWithProviders` 渲染帶有所有必要上下文的元件
- 測試元件之間的交互
- 驗證數據流和狀態更新

```typescript
// 渲染帶有所有必要上下文的元件
const { getByText } = renderWithProviders(<MyComponent />);
```

### 測試 API 整合
- 模擬 API 響應以測試不同情況
- 測試錯誤處理和重試邏輯
- 確保正確處理異步操作

```typescript
// 模擬 API 回應
vi.mock('@/api/userApi', () => ({
  getUser: vi.fn().mockResolvedValue({ id: '1', name: '測試用戶' }),
}));
```

## 端對端測試

### 設置
- 使用 Playwright 進行端對端測試
- 設置測試環境，包括模擬 API 和數據
- 創建重用的測試流程

### 測試主要使用者流程
- 測試關鍵使用者流程，如註冊、登入、發布代禱
- 驗證 UI 元素和交互
- 確保端到端的數據流

```typescript
// Playwright 測試範例
test('用戶可以登入並查看儀表板', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

### 視覺回歸測試
- 使用 Playwright 的截圖比較功能
- 維護基準截圖以檢測視覺變更
- 關注關鍵 UI 元素和佈局

```typescript
// 視覺回歸測試範例
test('代禱卡片外觀一致性', async ({ page }) => {
  await page.goto('/prayers');
  await expect(page.locator('.prayer-card')).toHaveScreenshot('prayer-card.png');
});
```

## 使用新的測試工具

### 測試效能工具
- 使用 `testPerformanceOptimizer` 監測測試效能
- 使用緩存機制避免重複工作
- 批量處理相似測試以提高效率

### 優化的測試套件
- 使用 `createOptimizedTestSuite` 創建高效的測試套件
- 自動測量和報告測試執行時間
- 統一測試設置和清理

### 模擬數據庫增強功能
- 利用索引加速查詢測試
- 創建和測試數據關係
- 使用事務確保測試數據一致性 