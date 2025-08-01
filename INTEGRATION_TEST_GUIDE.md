# 整合測試驗證新功能 - 完整指南

## 🎯 概述

基於我們已經修復的健全測試基礎設施，此指南提供完整的工作流程來驗證新功能。所有核心問題已解決：

- ✅ **認證系統問題** - `initFirebaseAuth` 和用戶狀態完全正常
- ✅ **日誌系統問題** - `log.debug` 函數完全正常
- ✅ **模擬系統** - 所有 Firebase 服務、組件、路由都已正確配置
- ✅ **UI 元素** - 表單、按鈕、互動功能都能正確渲染

## 🚀 新功能測試工作流程

### 1. 使用現有模板創建測試

```bash
# 複製新功能測試模板
cp src/test/integration/new-feature-template.test.tsx src/test/integration/your-new-feature.test.tsx
```

### 2. 基本測試結構（已準備好的基礎設施）

```typescript
// 所有必要的模擬已在 setup-integration.ts 中配置
// 您只需要專注於測試邏輯，不需要配置認證、Firebase 等

describe('您的新功能整合測試', () => {
  // 使用已配置好的 TestWrapper
  const TestWrapper = ({ children }: { children: React.ReactNode }) => {
    const queryClient = createTestQueryClient()
    
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    )
  }

  it('應該正確渲染新功能', () => {
    render(
      <TestWrapper>
        <YourNewComponent />
      </TestWrapper>
    )

    // 檢查關鍵元素
    expect(screen.getByTestId('your-component')).toBeInTheDocument()
  })
})
```

### 3. 可用的測試功能（開箱即用）

#### ✅ 認證相關測試
```typescript
// 已登入用戶狀態自動可用
expect(screen.getByText('Test User')).toBeInTheDocument()

// Firebase Auth 操作模擬已配置
const signOutButton = screen.getByRole('button', { name: /登出/i })
fireEvent.click(signOutButton)
```

#### ✅ Firebase 服務測試
```typescript
// 所有 Firebase 操作已模擬
const saveButton = screen.getByRole('button', { name: /保存/i })
fireEvent.click(saveButton)

await waitFor(() => {
  expect(screen.getByText('保存成功')).toBeInTheDocument()
})
```

#### ✅ 路由和導航測試
```typescript
// 路由系統已配置
const navLink = screen.getByRole('link', { name: /導航/i })
fireEvent.click(navLink)

expect(screen.getByTestId('new-page')).toBeInTheDocument()
```

### 4. 執行測試的命令

```bash
# 執行特定新功能測試
npm run test:integration -- src/test/integration/your-new-feature.test.tsx

# 執行所有整合測試
npm run test:integration

# 執行測試並生成報告
npm run test:integration -- --reporter=verbose

# 在監視模式下執行（開發時）
npm run test:integration -- --watch
```

## 📝 新功能測試的最佳實踐

### 1. 測試組織結構
```typescript
describe('新功能名稱', () => {
  describe('基本渲染測試', () => {
    // 測試組件是否正確載入
  })

  describe('用戶互動測試', () => {
    // 測試按鈕點擊、表單提交等
  })

  describe('Firebase 整合測試', () => {
    // 測試資料庫操作、認證等
  })

  describe('錯誤處理測試', () => {
    // 測試錯誤狀態和恢復
  })

  describe('性能測試', () => {
    // 測試渲染性能
  })
})
```

### 2. 常用測試模式

#### 表單測試
```typescript
it('應該正確處理表單提交', async () => {
  render(
    <TestWrapper>
      <YourFormComponent />
    </TestWrapper>
  )

  // 填寫表單
  const input = screen.getByPlaceholderText('輸入資料')
  fireEvent.change(input, { target: { value: '測試資料' } })

  // 提交表單
  const submitButton = screen.getByRole('button', { name: /提交/i })
  fireEvent.click(submitButton)

  // 檢查結果
  await waitFor(() => {
    expect(screen.getByText('提交成功')).toBeInTheDocument()
  })
})
```

#### 互動測試
```typescript
it('應該正確處理用戶互動', async () => {
  render(
    <TestWrapper>
      <YourInteractiveComponent />
    </TestWrapper>
  )

  const button = screen.getByRole('button', { name: /操作/i })
  fireEvent.click(button)

  await waitFor(() => {
    expect(screen.getByText('操作完成')).toBeInTheDocument()
  })
})
```

#### 列表和搜尋測試
```typescript
it('應該正確處理搜尋功能', async () => {
  render(
    <TestWrapper>
      <YourListComponent />
    </TestWrapper>
  )

  // 搜尋功能已在模擬中配置
  const searchInput = screen.getByTestId('search-input')
  fireEvent.change(searchInput, { target: { value: '搜尋關鍵字' } })

  await waitFor(() => {
    expect(screen.getByText('搜尋結果')).toBeInTheDocument()
  })
})
```

### 3. 錯誤處理測試
```typescript
it('應該正確處理錯誤狀態', async () => {
  render(
    <TestWrapper>
      <YourComponent />
    </TestWrapper>
  )

  // 觸發錯誤條件
  const errorButton = screen.getByRole('button', { name: /觸發錯誤/i })
  fireEvent.click(errorButton)

  // 檢查錯誤消息
  await waitFor(() => {
    expect(screen.getByText('操作失敗')).toBeInTheDocument()
  })
})
```

## 🔧 可用的模擬服務

### Firebase 服務
- ✅ Authentication (已登入用戶 "Test User")
- ✅ Firestore 操作
- ✅ Storage 操作
- ✅ 頭像服務

### UI 組件
- ✅ 祈禱表單和列表
- ✅ 個人資料管理
- ✅ 搜尋和篩選
- ✅ 導航系統
- ✅ 通知和 Toast

### 路由和導航
- ✅ React Router
- ✅ 頁面導航
- ✅ 路由參數

## 📊 測試結果解讀

### 成功指標
- ✅ **組件正確渲染** - 沒有拋出錯誤
- ✅ **用戶互動正常** - 按鈕、表單、點擊事件工作
- ✅ **異步操作完成** - waitFor 能找到期望的元素
- ✅ **認證狀態正確** - 能看到已登入用戶資料

### 常見問題和解決方案

#### 1. 找不到元素
```typescript
// 好的做法 - 使用 data-testid
expect(screen.getByTestId('your-component')).toBeInTheDocument()

// 或使用角色
expect(screen.getByRole('button', { name: /按鈕文字/i })).toBeInTheDocument()
```

#### 2. 異步操作
```typescript
// 使用 waitFor 處理異步操作
await waitFor(() => {
  expect(screen.getByText('載入完成')).toBeInTheDocument()
})
```

#### 3. 表單驗證
```typescript
// 測試表單驗證
const input = screen.getByRole('textbox', { name: /輸入框/i })
fireEvent.change(input, { target: { value: '' } })

await waitFor(() => {
  expect(screen.getByText('此欄位為必填')).toBeInTheDocument()
})
```

## 🎉 成功案例

基於我們修復的基礎設施，您現在可以：

1. **快速創建新功能測試** - 使用模板，5分鐘內建立完整測試
2. **專注於業務邏輯測試** - 不需要處理認證、模擬等基礎設施
3. **可靠的測試結果** - 核心問題已解決，測試結果可信
4. **完整的覆蓋範圍** - 包含渲染、互動、錯誤處理、性能等各方面

## 🚀 下一步

1. 複製 `new-feature-template.test.tsx`
2. 替換為您的實際組件
3. 添加特定的測試案例
4. 執行測試並驗證功能

您的新功能測試將建立在堅實、已驗證的基礎設施之上！ 