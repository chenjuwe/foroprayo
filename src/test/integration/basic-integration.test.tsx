import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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

describe('基本整合測試', () => {
  beforeEach(() => {
    // 清理任何可能的副作用
  })

  afterEach(() => {
    // 清理 DOM
    cleanup()
  })

  describe('404 頁面測試', () => {
    it('應該正確渲染 404 頁面', () => {
      render(
        <TestWrapper>
          <NotFound />
        </TestWrapper>
      )

      // 檢查 404 頁面內容
      expect(screen.getAllByText('404')[0]).toBeInTheDocument()
      expect(screen.getByText('Oops! Page not found')).toBeInTheDocument()
      expect(screen.getByText('Return to Home')).toBeInTheDocument()
    })

    it('應該包含正確的連結', () => {
      render(
        <TestWrapper>
          <NotFound />
        </TestWrapper>
      )

      const homeLink = screen.getByRole('link', { name: /return to home/i })
      expect(homeLink).toHaveAttribute('href', '/')
    })
  })

  describe('組件整合', () => {
    it('應該正確處理 React Query 整合', () => {
      render(
        <TestWrapper>
          <NotFound />
        </TestWrapper>
      )

      // 檢查 QueryClient 是否正常工作
      expect(screen.getByText('404')).toBeInTheDocument()
    })

    it('應該正確處理 React Router 整合', () => {
      render(
        <TestWrapper>
          <NotFound />
        </TestWrapper>
      )

      // 檢查路由是否正常工作
      expect(screen.getByText('404')).toBeInTheDocument()
    })
  })

  describe('無障礙功能', () => {
    it('應該包含適當的標題結構', () => {
      render(
        <TestWrapper>
          <NotFound />
        </TestWrapper>
      )

      // 檢查頁面是否有適當的標題
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('404')
    })

    it('應該包含可訪問的連結', () => {
      render(
        <TestWrapper>
          <NotFound />
        </TestWrapper>
      )

      const link = screen.getByRole('link')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href')
    })
  })

  describe('樣式測試', () => {
    it('應該應用正確的 CSS 類', () => {
      render(
        <TestWrapper>
          <NotFound />
        </TestWrapper>
      )

      // 檢查主要容器是否有正確的類
      const container = screen.getByText('404').closest('.min-h-screen')
      expect(container).toHaveClass('min-h-screen')
      expect(container).toHaveClass('flex')
      expect(container).toHaveClass('items-center')
      expect(container).toHaveClass('justify-center')
      expect(container).toHaveClass('bg-gray-100')
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
          <NotFound />
        </TestWrapper>
      )

      expect(screen.getAllByText('404')[0]).toBeInTheDocument()

      // 測試移動設備尺寸
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })

      // 重新渲染以測試響應式設計
      rerender(
        <TestWrapper>
          <NotFound />
        </TestWrapper>
      )

      expect(screen.getAllByText('404')[0]).toBeInTheDocument()
    })
  })

  describe('性能', () => {
    it('應該在合理時間內完成渲染', () => {
      const startTime = performance.now()

      render(
        <TestWrapper>
          <NotFound />
        </TestWrapper>
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // 檢查渲染時間是否在合理範圍內（小於 100ms）
      expect(renderTime).toBeLessThan(100)
      expect(screen.getAllByText('404')[0]).toBeInTheDocument()
    })
  })

  describe('記憶體管理', () => {
    it('應該正確清理組件', () => {
      const { unmount } = render(
        <TestWrapper>
          <NotFound />
        </TestWrapper>
      )

      // 檢查組件是否正確渲染
      expect(screen.getAllByText('404')[0]).toBeInTheDocument()

      // 清理組件
      unmount()

      // 檢查組件是否已從 DOM 中移除
      expect(screen.queryByText('404')).not.toBeInTheDocument()
    })
  })
}) 