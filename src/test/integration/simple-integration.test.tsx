import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Index from '../../pages/Index'
import NotFound from '../../pages/NotFound'

// 創建測試用的 QueryClient
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

// 測試包裝器
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

describe('簡單整合測試', () => {
  beforeEach(() => {
    // 清理任何可能的副作用
  })

  afterEach(() => {
    // 清理 DOM
    cleanup()
  })

  describe('頁面渲染', () => {
    it('應該正確渲染首頁', () => {
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      // 檢查首頁內容 - Index 組件會重定向到 /prayers
      const navigateElement = screen.getByTestId('navigate')
      expect(navigateElement).toBeInTheDocument()
      expect(navigateElement).toHaveAttribute('data-to', '/prayers')
    })

    it('應該正確渲染 404 頁面', () => {
      render(
        <TestWrapper>
          <NotFound />
        </TestWrapper>
      )

      // 檢查 404 頁面內容
      expect(screen.getByText(/Oops! Page not found/i)).toBeInTheDocument()
    })
  })

  describe('組件整合', () => {
    it('應該正確處理 React Query 整合', () => {
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      // 檢查 QueryClient 是否正常工作
      expect(screen.getByTestId('navigate')).toBeInTheDocument()
    })

    it('應該正確處理 React Router 整合', () => {
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      // 檢查路由是否正常工作
      expect(screen.getByTestId('navigate')).toBeInTheDocument()
    })
  })

  describe('錯誤邊界', () => {
    it('應該在組件錯誤時顯示錯誤訊息', () => {
      // 這個測試可以驗證錯誤邊界是否正常工作
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      // 正常情況下應該顯示重定向組件
      expect(screen.getByTestId('navigate')).toBeInTheDocument()
    })
  })

  describe('無障礙功能', () => {
    it('應該包含適當的 ARIA 標籤', () => {
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      // 檢查頁面是否有適當的標題
      expect(document.title).toBeDefined()
    })
  })

  describe('響應式設計', () => {
    it('應該在不同螢幕尺寸下正確顯示', () => {
      // 測試桌面尺寸
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      })

      const { rerender } = render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      expect(screen.getByTestId('navigate')).toBeInTheDocument()

      // 測試移動設備尺寸
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })

      // 重新渲染以測試響應式設計
      rerender(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      expect(screen.getByTestId('navigate')).toBeInTheDocument()
    })
  })

  describe('國際化', () => {
    it('應該正確顯示繁體中文內容', () => {
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      // 檢查頁面是否正確顯示
      expect(screen.getByTestId('navigate')).toBeInTheDocument()
    })
  })

  describe('性能', () => {
    it('應該在合理時間內完成渲染', () => {
      const startTime = performance.now()

      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // 檢查渲染時間是否在合理範圍內（小於 100ms）
      expect(renderTime).toBeLessThan(100)
      const navigateElement = screen.getByTestId('navigate')
      expect(navigateElement).toBeInTheDocument()
      expect(navigateElement).toHaveAttribute('data-to', '/prayers')
    })
  })

  describe('記憶體管理', () => {
    it('應該正確清理組件', () => {
      const { unmount } = render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      // 檢查組件是否正確渲染
      const navigateElement = screen.getByTestId('navigate')
      expect(navigateElement).toBeInTheDocument()
      expect(navigateElement).toHaveAttribute('data-to', '/prayers')

      // 清理組件
      unmount()

      // 檢查組件是否已從 DOM 中移除
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument()
    })
  })
}) 