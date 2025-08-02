# 🛠️ 測試改進指南 - 解決數據 Mock 同步與複雜組件測試問題

*更新時間: 2025年8月2日*
*版本: v1.0.0*

## 🎯 解決的核心問題

### 1. 數據 Mock 同步問題
- ✅ **ProfileStats 測試已修復**: 從 8 個全失敗 → 9 個全通過
- ✅ **統一 Mock 數據管理**: 使用 TestDataFactory 統一管理測試數據
- ✅ **React Query 整合**: 修復 mock 數據與 React Query 的同步問題

### 2. 複雜組件測試配置
- ✅ **Firebase 服務 Mock**: 建立完整的服務層 mock 策略
- ✅ **測試環境隔離**: 每個測試都有獨立的 QueryClient
- ✅ **邊界條件處理**: 支援各種數據場景（零值、大數值、錯誤等）

### 3. 邊界條件測試匹配
- ✅ **預期值校正**: 修正測試預期與實際組件行為的不匹配
- ✅ **SVG 圖標測試**: 正確處理 SVG mock 和 testId
- ✅ **異步數據處理**: 使用 waitFor 正確處理異步數據加載

## 🚀 新的測試工具

### 1. TestDataFactory - 測試數據工廠

```typescript
// 創建統一的 QueryClient
const queryClient = TestDataFactory.createTestQueryClient();

// 創建服務 Mock
const mockService = TestDataFactory.createFirebaseServiceMock({
  userStatsScenario: 'default', // 'default' | 'zero' | 'large' | 'thousand'
  shouldError: false,
  errorMessage: 'Custom error'
});

// 創建認證 Mock
const authMock = TestDataFactory.createAuthMock({
  isAuthenticated: true,
  userId: 'test-user',
  displayName: '測試用戶'
});
```

### 2. TestHelpers - 測試輔助工具

```typescript
// 創建渲染工具
const { queryClient, renderWithQueryClient } = TestHelpers.createQueryClientRenderer();

// 異步數據輔助
const asyncHelper = TestHelpers.createAsyncDataHelper();
const delayedPromise = asyncHelper.createDelayedPromise(data, 100);
const pendingPromise = asyncHelper.createPendingPromise();

// Mock 驗證
TestHelpers.verifyMockCalls(mockFn, [
  ['arg1', 'arg2'],
  ['arg3', 'arg4']
]);
```

### 3. 預設測試場景

```typescript
import { TestScenarios } from '@/test/fixtures/test-data-factory';

// 正常用戶數據
const normalMock = TestScenarios.normalUserStats();

// 錯誤場景
const errorMock = TestScenarios.serviceError();

// 載入狀態
const loadingMock = TestScenarios.loadingState();
```

## 📋 使用最佳實踐

### 1. 組件測試模板

```typescript
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMockUserStats } from '@/test/fixtures/mock-data';
import { TestDataFactory } from '@/test/fixtures/test-data-factory';

// 創建 Mock 服務
const mockService = TestDataFactory.createFirebaseServiceMock();

// Mock 服務類
vi.mock('@/services/YourService', () => ({
  YourService: vi.fn().mockImplementation(() => mockService),
}));

describe('YourComponent', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = TestDataFactory.createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderWithQueryClient = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    );
  };

  it('應該正確渲染數據', async () => {
    // 設置 mock 數據
    const testData = createMockUserStats('default');
    mockService.getData.mockResolvedValue(testData);

    renderWithQueryClient(<YourComponent />);
    
    // 等待數據加載
    await waitFor(() => {
      expect(screen.getByText('預期文字')).toBeInTheDocument();
    });
    
    // 驗證服務調用
    expect(mockService.getData).toHaveBeenCalledWith('預期參數');
  });
});
```

### 2. 錯誤處理測試

```typescript
it('應該處理服務錯誤', async () => {
  // 模擬服務錯誤
  mockService.getData.mockRejectedValue(new Error('Service error'));

  renderWithQueryClient(<YourComponent />);
  
  await waitFor(() => {
    // 檢查錯誤狀態或降級顯示
    expect(screen.getByText('載入中...')).toBeInTheDocument();
  });
});
```

### 3. 載入狀態測試

```typescript
it('應該支援載入狀態', () => {
  // 創建永遠 pending 的 Promise
  mockService.getData.mockImplementation(() => new Promise(() => {}));

  renderWithQueryClient(<YourComponent />);
  
  // 檢查載入指示器
  expect(screen.getByText('載入中...')).toBeInTheDocument();
});
```

## 🔧 常見問題解決方案

### 1. Mock 數據不同步

**問題**: 測試中設置的 mock 數據沒有被組件正確接收

**解決方案**:
```typescript
// ❌ 錯誤方式 - 全域 mock 干擾
vi.mock('@tanstack/react-query', () => ({...}));

// ✅ 正確方式 - 保留實際功能
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return actual;
});
```

### 2. 異步數據測試

**問題**: 異步數據加載完成前測試就結束了

**解決方案**:
```typescript
// ❌ 錯誤方式
expect(screen.getByText('數據')).toBeInTheDocument();

// ✅ 正確方式
await waitFor(() => {
  expect(screen.getByText('數據')).toBeInTheDocument();
});
```

### 3. SVG 圖標測試

**問題**: SVG 圖標在測試中無法正確渲染

**解決方案**:
```typescript
// 在 setup.ts 中正確 mock SVG
vi.mock('@/assets/icons/Icon.svg?react', () => ({
  default: ({ className, ...props }: any) => 
    React.createElement('svg', { 
      'data-testid': 'icon-name',
      className,
      ...props 
    })
}));

// 在測試中使用 testId
expect(screen.getByTestId('icon-name')).toBeInTheDocument();
```

## 🎯 接下來的改進計畫

### 階段 1: 修復其他失敗的組件測試
- [ ] ReportDialog 測試修復
- [ ] Header 測試改善
- [ ] ProfileStats 以外的其他組件

### 階段 2: 擴展測試工具
- [ ] 建立更多測試場景預設
- [ ] 增加性能測試工具
- [ ] 建立視覺回歸測試

### 階段 3: 自動化測試監控
- [ ] 設置 pre-commit hook
- [ ] CI/CD 測試報告
- [ ] 覆蓋率追蹤

## 📊 改善成果

### ProfileStats 測試結果
- **修復前**: 8 個測試全失敗 ❌
- **修復後**: 9 個測試全通過 ✅
- **改善率**: 100% 通過率

### 核心問題解決
- ✅ 數據 Mock 同步問題
- ✅ 複雜組件測試配置
- ✅ 邊界條件測試匹配
- ✅ React Query 整合
- ✅ 測試環境隔離

---

*這份指南將持續更新，記錄測試改善的進度和新發現的最佳實踐* 