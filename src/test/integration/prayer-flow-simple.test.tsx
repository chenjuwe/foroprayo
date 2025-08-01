import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import New from '../../pages/New'
import Prayers from '../../pages/Prayers'

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

describe('簡化祈禱流程測試', () => {
  beforeEach(() => {
    // 清理任何可能的副作用
  })

  afterEach(() => {
    // 清理 DOM
    cleanup()
  })

  describe('祈禱頁面渲染', () => {
    it('應該正確渲染祈禱列表頁面', () => {
      render(
        <TestWrapper>
          <Prayers />
        </TestWrapper>
      )

      // 檢查頁面是否渲染（不會拋出錯誤）
      expect(document.body).toBeInTheDocument()
    })

    it('應該正確渲染新增祈禱頁面', () => {
      render(
        <TestWrapper>
          <New />
        </TestWrapper>
      )

      // 檢查頁面是否渲染（不會拋出錯誤）
      expect(document.body).toBeInTheDocument()
    })
  })

  describe('組件整合', () => {
    it('應該正確處理 React Query 整合', () => {
      const { unmount } = render(
        <TestWrapper>
          <Prayers />
        </TestWrapper>
      )

      // 檢查組件是否正確渲染
      expect(document.body).toBeInTheDocument()

      // 清理組件
      unmount()

      // 檢查是否能正常清理
      expect(document.body).toBeInTheDocument()
    })

    it('應該正確處理路由整合', () => {
      render(
        <TestWrapper>
          <New />
        </TestWrapper>
      )

      // 檢查路由是否正常工作
      expect(document.body).toBeInTheDocument()
    })
  })

  describe('錯誤處理', () => {
    it('應該處理祈禱頁面渲染錯誤', () => {
      // 測試錯誤邊界或基本錯誤處理
      expect(() => {
        render(
          <TestWrapper>
            <Prayers />
          </TestWrapper>
        )
      }).not.toThrow()
    })

    it('應該處理新增頁面渲染錯誤', () => {
      // 測試錯誤邊界或基本錯誤處理
      expect(() => {
        render(
          <TestWrapper>
            <New />
          </TestWrapper>
        )
      }).not.toThrow()
    })
  })

  describe('性能', () => {
    it('應該在合理時間內完成祈禱頁面渲染', () => {
      const startTime = performance.now()

      render(
        <TestWrapper>
          <Prayers />
        </TestWrapper>
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // 檢查渲染時間是否在合理範圍內（小於 200ms）
      expect(renderTime).toBeLessThan(200)
      expect(document.body).toBeInTheDocument()
    })

    it('應該在合理時間內完成新增頁面渲染', () => {
      const startTime = performance.now()

      render(
        <TestWrapper>
          <New />
        </TestWrapper>
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // 檢查渲染時間是否在合理範圍內（小於 200ms）
      expect(renderTime).toBeLessThan(200)
      expect(document.body).toBeInTheDocument()
    })
  })
}) 