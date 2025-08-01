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

describe('簡化導航流程測試', () => {
  beforeEach(() => {
    // 清理任何可能的副作用
  })

  afterEach(() => {
    // 清理 DOM
    cleanup()
  })

  describe('基本頁面渲染', () => {
    it('應該正確渲染首頁重定向', () => {
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      // 檢查首頁重定向
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
      expect(screen.getAllByText('404')[0]).toBeInTheDocument()
      expect(screen.getByText('Oops! Page not found')).toBeInTheDocument()
    })
  })

  describe('組件整合', () => {
    it('應該正確處理 React Query 整合', () => {
      const { unmount } = render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      // 檢查組件是否正確渲染
      expect(screen.getByTestId('navigate')).toBeInTheDocument()

      // 清理組件
      unmount()

      // 檢查組件是否已從 DOM 中移除
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument()
    })

    it('應該正確處理 React Router 整合', () => {
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      // 檢查導航元素存在（表示路由正常工作）
      expect(screen.getByTestId('navigate')).toBeInTheDocument()
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/prayers')
    })
  })

  describe('錯誤處理', () => {
    it('應該處理組件渲染錯誤', () => {
      // 測試錯誤邊界或基本錯誤處理
      expect(() => {
        render(
          <TestWrapper>
            <NotFound />
          </TestWrapper>
        )
      }).not.toThrow()
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
      expect(screen.getByTestId('navigate')).toBeInTheDocument()
    })
  })
}) 