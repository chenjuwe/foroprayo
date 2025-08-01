# 測試系統優化指南

## 概述

本文檔詳細說明瞭 Prayforo 專案的測試系統優化，包括路徑別名修復、測試數據管理、CI/CD 集成、測試報告優化以及性能基準監控。

## 🛠️ 路徑別名問題修復

### 問題描述
TypeScript 配置中的 `@/` 路徑別名在測試環境中無法正確解析。

### 解決方案

#### 1. 新增測試專用 TypeScript 配置
創建了 `tsconfig.test.json` 文件：

```json
{
  "extends": "./tsconfig.app.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": ["vitest/globals", "@testing-library/jest-dom", "node"]
  },
  "include": [
    "src/**/*",
    "src/**/*.test.ts",
    "src/**/*.test.tsx",
    "src/**/*.spec.ts",
    "src/**/*.spec.tsx",
    "src/test/**/*",
    "e2e/**/*",
    "vitest.config.ts",
    "playwright.config.ts"
  ]
}
```

#### 2. 更新主配置
在 `tsconfig.json` 中添加測試配置引用：

```json
{
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.test.json" }
  ]
}
```

#### 3. Vitest 配置優化
在 `vitest.config.ts` 中確保路徑別名正確配置：

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

## 📊 測試數據管理

### 測試數據工廠

#### 1. 動態數據生成
使用 `@faker-js/faker` 創建動態測試數據：

```typescript
import { faker } from '@faker-js/faker'
import { TestDataFactory } from '@/test/fixtures/test-data-factory'

// 創建用戶數據
const user = TestDataFactory.createUser({
  displayName: '測試用戶',
  email: 'test@example.com'
})

// 創建禱告數據
const prayer = TestDataFactory.createPrayer({
  content: '請為我的健康禱告',
  isAnonymous: false
})
```

#### 2. 靜態 Mock 數據
提供固定的測試數據用於特定場景：

```typescript
import { mockUsers, mockPrayers } from '@/test/fixtures/mock-data'

// 使用預定義的測試數據
const testUser = mockUsers.regular
const testPrayer = mockPrayers.simple
```

#### 3. 測試場景數據
創建完整的測試場景：

```typescript
// 創建關聯數據
const { user, prayers } = TestDataFactory.createUserWithPrayers(
  { displayName: '測試用戶' },
  5
)

// 創建禱告與回應
const { prayer, responses } = TestDataFactory.createPrayerWithResponses(
  { title: '測試禱告' },
  3
)
```

### 使用方式

```typescript
import { TestDataFactory, testUsers, mockPrayers } from '@/test/fixtures'

describe('禱告功能測試', () => {
  it('應該能創建新禱告', () => {
    const prayer = TestDataFactory.createPrayer({
      content: '請為我的家庭禱告'
    })
    
    expect(prayer.content).toBe('請為我的家庭禱告')
    expect(prayer.isAnonymous).toBe(false)
  })

  it('應該能處理匿名禱告', () => {
    const anonymousPrayer = TestDataFactory.createAnonymousPrayer()
    
    expect(anonymousPrayer.isAnonymous).toBe(true)
  })
})
```

## 🔄 CI/CD 集成

### GitHub Actions 工作流程

創建了完整的 CI/CD 流程，包括：

#### 1. 依賴檢查
```yaml
check-dependencies:
  name: 檢查依賴
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
    - run: npm ci
    - run: npm run check-deps
```

#### 2. 程式碼品質檢查
```yaml
lint:
  name: 程式碼品質檢查
  runs-on: ubuntu-latest
  steps:
    - run: npm run lint
    - run: npm run build
```

#### 3. 多環境測試
```yaml
unit-tests:
  strategy:
    matrix:
      node-version: [16, 18, 20]
  steps:
    - run: npm run test:unit
```

#### 4. 測試報告整合
```yaml
test-summary:
  needs: [unit-tests, integration-tests, performance-tests, security-tests, e2e-tests]
  if: always()
  steps:
    - name: 生成測試摘要
      run: |
        echo "## 測試結果摘要" >> $GITHUB_STEP_SUMMARY
        echo "### 單元測試: ${{ needs.unit-tests.result }}" >> $GITHUB_STEP_SUMMARY
```

### 觸發條件
- Push 到 `main` 和 `develop` 分支
- Pull Request 到 `main` 和 `develop` 分支

## 📈 測試報告優化

### 覆蓋率配置

#### 1. 多格式報告
```typescript
coverage: {
  reporter: [
    'text',
    'text-summary',
    'json',
    'json-summary',
    'html',
    'lcov',
    'cobertura'
  ],
}
```

#### 2. 覆蓋率閾值
```typescript
thresholds: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
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
}
```

#### 3. 排除規則
```typescript
exclude: [
  'node_modules/',
  'src/test/',
  'e2e/',
  '**/*.d.ts',
  '**/*.config.*',
  '**/coverage/**',
  '**/dist/**',
  '**/*.test.{js,ts,jsx,tsx}',
  '**/*.spec.{js,ts,jsx,tsx}',
]
```

### 測試報告類型

#### 1. HTML 報告
```bash
npm run test:coverage:html
```

#### 2. LCOV 報告
```bash
npm run test:coverage:lcov
```

#### 3. JUnit 報告
```bash
npm run test:coverage:junit
```

## ⚡ 性能基準持續監控

### 性能基準測試工具

#### 1. 基準測試運行器
```typescript
import { performanceBenchmark } from '@/test/performance/performance-benchmark'

// 執行基準測試
const benchmark = await performanceBenchmark.runBenchmark(
  '組件渲染測試',
  async () => {
    // 測試邏輯
    await renderComponent()
  },
  20, // 運行次數
  100 // 閾值 (ms)
)
```

#### 2. 性能監控 Hook
```typescript
import { usePerformanceMonitor } from '@/test/performance/performance-benchmark'

function MyComponent() {
  const monitor = usePerformanceMonitor('MyComponent')
  
  useEffect(() => {
    // 組件邏輯
    const metric = monitor.end({ props: props })
    console.log(`組件渲染時間: ${metric.duration}ms`)
  }, [])
}
```

#### 3. 性能裝飾器
```typescript
import { benchmark } from '@/test/performance/performance-benchmark'

class PrayerService {
  @benchmark('創建禱告', 50)
  async createPrayer(data: CreatePrayerRequest) {
    // 創建禱告邏輯
  }
}
```

### 性能回歸檢測

#### 1. 基準數據管理
```typescript
import { performanceRegressionDetector } from '@/test/performance/performance-regression'

// 載入基準數據
await performanceRegressionDetector.loadBaseline()

// 檢測回歸
const regressions = performanceRegressionDetector.detectRegressions(benchmarks)
```

#### 2. 自動化測試流程
```typescript
import { automatedPerformanceTest } from '@/test/performance/performance-regression'

const result = await automatedPerformanceTest(
  performanceBenchmark,
  [
    {
      name: '組件渲染測試',
      fn: async () => renderComponent(),
      runs: 20,
      threshold: 100,
    }
  ],
  '1.0.0',
  'abc123'
)
```

### 腳本工具

#### 1. 更新基準數據
```bash
npm run test:baseline:update
```

#### 2. 檢查性能回歸
```bash
npm run test:baseline:check
```

## 📋 新增的 npm 腳本

### 測試相關
```json
{
  "test:benchmark": "vitest --run src/test/performance/performance-benchmark.test.ts",
  "test:regression": "vitest --run src/test/performance/performance-regression.test.ts",
  "test:baseline:update": "node scripts/update-performance-baseline.js",
  "test:baseline:check": "node scripts/check-performance-baseline.js",
  "test:coverage:detailed": "vitest --coverage --reporter=verbose",
  "test:coverage:html": "vitest --coverage --reporter=html",
  "test:coverage:lcov": "vitest --coverage --reporter=lcov",
  "test:coverage:junit": "vitest --coverage --reporter=junit",
  "test:report:all": "npm run test:coverage && npm run test:performance:report && npm run test:security:report",
  "test:validate:all": "npm run lint && npm run test:unit && npm run test:integration"
}
```

## 🚀 使用指南

### 1. 開始使用

```bash
# 安裝依賴
npm install

# 運行所有測試
npm run test:all

# 檢查程式碼品質
npm run test:validate:all

# 生成完整報告
npm run test:report:all
```

### 2. 性能測試

```bash
# 建立性能基準
npm run test:baseline:update

# 檢查性能回歸
npm run test:baseline:check

# 運行性能測試
npm run test:performance
```

### 3. 覆蓋率報告

```bash
# 生成詳細覆蓋率報告
npm run test:coverage:detailed

# 生成 HTML 報告
npm run test:coverage:html

# 生成 LCOV 報告 (用於 CI/CD)
npm run test:coverage:lcov
```

## 📁 文件結構

```
src/
├── test/
│   ├── fixtures/
│   │   ├── test-data-factory.ts    # 動態測試數據工廠
│   │   ├── mock-data.ts            # 靜態 Mock 數據
│   │   └── index.ts                # 統一導出
│   ├── performance/
│   │   ├── performance-benchmark.ts    # 性能基準測試工具
│   │   └── performance-regression.ts   # 性能回歸檢測
│   └── ...
├── types/
│   └── index.ts                    # 統一類型導出
└── ...

scripts/
├── update-performance-baseline.js  # 基準更新腳本
└── check-performance-baseline.js   # 基準檢查腳本

.github/
└── workflows/
    └── test.yml                    # CI/CD 工作流程
```

## 🔧 配置說明

### TypeScript 配置
- `tsconfig.json`: 主配置，包含路徑別名
- `tsconfig.app.json`: 應用程式配置
- `tsconfig.test.json`: 測試專用配置

### Vitest 配置
- 支援路徑別名解析
- 多格式覆蓋率報告
- 覆蓋率閾值設定
- 測試隔離和並行執行

### 性能監控配置
- 基準數據儲存位置: `./test-results/performance-baseline.json`
- 回歸閾值: 10% (可調整)
- 報告輸出目錄: `./test-results/`

## 🎯 最佳實踐

### 1. 測試數據管理
- 使用工廠模式創建測試數據
- 區分動態和靜態測試數據
- 建立可重用的測試場景

### 2. 性能測試
- 定期更新基準數據
- 在 CI/CD 中檢查性能回歸
- 設定合理的閾值

### 3. 覆蓋率管理
- 設定不同模組的覆蓋率要求
- 定期檢查覆蓋率報告
- 持續改善測試覆蓋率

### 4. CI/CD 流程
- 自動化所有測試類型
- 提供詳細的測試報告
- 在發現問題時及時通知

## 🔍 故障排除

### 路徑別名問題
如果遇到 `@/` 路徑無法解析：

1. 檢查 `tsconfig.test.json` 配置
2. 確認 `vitest.config.ts` 中的 alias 設定
3. 重新啟動測試服務器

### 性能測試問題
如果性能測試失敗：

1. 檢查基準數據是否存在
2. 確認測試環境的一致性
3. 調整回歸閾值

### 覆蓋率問題
如果覆蓋率不正確：

1. 檢查排除規則設定
2. 確認測試文件命名規範
3. 檢查閾值設定

## 📞 支援

如有問題或建議，請：

1. 檢查本文檔
2. 查看測試日誌
3. 提交 Issue 或 Pull Request

---

*最後更新: 2024年1月* 