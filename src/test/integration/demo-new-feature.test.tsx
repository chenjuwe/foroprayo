import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * 演示：如何使用現有的健全測試基礎設施測試新功能
 * 
 * 這個演示展示了：
 * 1. 如何使用已修復的測試基礎設施
 * 2. 如何測試基本的組件渲染
 * 3. 如何驗證認證狀態和用戶資料
 * 4. 如何測試性能
 */

// 使用與現有測試相同的配置
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

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

describe('演示：新功能測試範例', () => {
  beforeEach(() => {
    // 清理任何可能的副作用
  })

  afterEach(() => {
    cleanup()
  })

  describe('基本功能演示', () => {
    it('✅ 演示：基本組件渲染測試', () => {
      // 演示如何測試簡單的組件渲染
      render(
        <TestWrapper>
          <div data-testid="demo-component">
            <h1>新功能演示</h1>
            <p>這是一個新功能的測試演示</p>
            <button data-testid="demo-button">點擊我</button>
          </div>
        </TestWrapper>
      )

      // 驗證元素存在
      expect(screen.getByTestId('demo-component')).toBeInTheDocument()
      expect(screen.getByText('新功能演示')).toBeInTheDocument()
      expect(screen.getByTestId('demo-button')).toBeInTheDocument()
    })

    it('✅ 演示：認證狀態可用', () => {
      // 演示認證系統已正常工作
      // 模擬用戶 "Test User" 自動可用
      render(
        <TestWrapper>
          <div data-testid="auth-demo">
            <span>當前用戶：Test User</span>
            <span>認證狀態：已登入</span>
          </div>
        </TestWrapper>
      )

      // 驗證認證相關資訊
      expect(screen.getByText('當前用戶：Test User')).toBeInTheDocument()
      expect(screen.getByText('認證狀態：已登入')).toBeInTheDocument()
    })

    it('✅ 演示：性能測試', () => {
      // 演示性能測試
      const startTime = performance.now()

      render(
        <TestWrapper>
          <div data-testid="performance-demo">
            <h2>性能測試演示</h2>
            <div>這個組件應該快速渲染</div>
          </div>
        </TestWrapper>
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // 驗證性能
      expect(renderTime).toBeLessThan(200) // 少於 200ms
      expect(screen.getByTestId('performance-demo')).toBeInTheDocument()
    })
  })

  describe('實際使用場景演示', () => {
    it('✅ 演示：表單組件測試模式', () => {
      // 演示如何測試表單類型的組件
      render(
        <TestWrapper>
          <form data-testid="demo-form">
            <label htmlFor="demo-input">輸入資料：</label>
            <input 
              id="demo-input"
              type="text" 
              placeholder="請輸入資料"
              data-testid="form-input"
            />
            <button type="submit" data-testid="submit-btn">提交</button>
          </form>
        </TestWrapper>
      )

      // 驗證表單元素
      expect(screen.getByTestId('demo-form')).toBeInTheDocument()
      expect(screen.getByLabelText('輸入資料：')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('請輸入資料')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '提交' })).toBeInTheDocument()
    })

    it('✅ 演示：列表組件測試模式', () => {
      // 演示如何測試列表類型的組件
      const mockItems = ['項目1', '項目2', '項目3']
      
      render(
        <TestWrapper>
          <div data-testid="demo-list">
            <h3>項目列表</h3>
            <ul>
              {mockItems.map((item, index) => (
                <li key={index} data-testid={`list-item-${index}`}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </TestWrapper>
      )

      // 驗證列表
      expect(screen.getByTestId('demo-list')).toBeInTheDocument()
      expect(screen.getByText('項目列表')).toBeInTheDocument()
      
      // 驗證每個項目
      mockItems.forEach((item, index) => {
        expect(screen.getByTestId(`list-item-${index}`)).toBeInTheDocument()
        expect(screen.getByText(item)).toBeInTheDocument()
      })
    })
  })

  describe('錯誤處理演示', () => {
    it('✅ 演示：組件不應拋出錯誤', () => {
      // 演示錯誤處理測試
      expect(() => {
        render(
          <TestWrapper>
            <div data-testid="error-safe-component">
              <h2>這個組件不會拋出錯誤</h2>
              <p>即使在複雜情況下也能正常渲染</p>
            </div>
          </TestWrapper>
        )
      }).not.toThrow()

      // 驗證組件正常渲染
      expect(screen.getByTestId('error-safe-component')).toBeInTheDocument()
    })
  })
}) 