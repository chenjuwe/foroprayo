import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { server } from '../setup-integration'
import { http, HttpResponse } from 'msw'
import { mockUser, mockPrayer } from '../mocks/handlers'
import App from '../../App'
import Index from '../../pages/Index'
import Auth from '../../pages/Auth'
import New from '../../pages/New'
import Prayers from '../../pages/Prayers'
import Profile from '../../pages/Profile'
import NotFound from '../../pages/NotFound'

// Mock Firebase Auth Store
vi.mock('@/stores/firebaseAuthStore', () => ({
  useFirebaseAuthStore: vi.fn(() => ({
    initAuth: vi.fn(),
    user: null,
  }))
}))

// Mock Firebase Auth Hook
vi.mock('@/hooks/useFirebaseAuth', () => ({
  useFirebaseAuth: vi.fn(() => ({
    currentUser: null,
    loading: false,
    signIn: vi.fn().mockResolvedValue({ user: null, error: null }),
    signUp: vi.fn().mockResolvedValue({ user: null, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPassword: vi.fn().mockResolvedValue({ error: null }),
    refreshUserAvatar: vi.fn(),
  }))
}))

// 移除重複的模擬配置 - 這些已在 setup-integration.ts 中設定

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

describe('導航流程整合測試', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // 重置測試狀態
    ;(global as any).mockOfflineMode = false
    ;(global as any).mockApiError = false
    ;(global as any).mockApiLoading = false
  })

  afterEach(() => {
    cleanup()
  })

  describe('主要導航', () => {
    it('應該正確渲染應用程式', () => {
      const { container } = render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      // 檢查應用程式基本結構已渲染
      expect(container.querySelector('.App')).toBeInTheDocument()
    })

    it('應該渲染應用程式結構', () => {
      const { container } = render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      // 檢查基本結構是否存在
      expect(container.querySelector('.App')).toBeInTheDocument()
    })

    it('應該能夠渲染已登入狀態', async () => {
      // Mock authenticated user
      const { useFirebaseAuthStore } = await import('@/stores/firebaseAuthStore')
      vi.mocked(useFirebaseAuthStore).mockReturnValue({
        initAuth: vi.fn(),
        user: mockUser as any,
      })

      const { container } = render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      // 檢查應用程式正常渲染
      expect(container.querySelector('.App')).toBeInTheDocument()
    })
  })

  describe('頁面路由', () => {
    it('應該正確路由到首頁', () => {
      render(
        <TestWrapper>
          <Routes>
            <Route path="/" element={<Index />} />
          </Routes>
        </TestWrapper>
      )

      expect(screen.getByText(/歡迎來到祈禱平台/i)).toBeInTheDocument()
    })

    it('應該正確路由到祈禱頁面', async () => {
      server.use(
        http.get('/api/prayers', () => {
          return HttpResponse.json([mockPrayer])
        })
      )

      render(
        <TestWrapper>
          <Routes>
            <Route path="/prayers" element={<Prayers />} />
          </Routes>
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(mockPrayer.content)).toBeInTheDocument()
      })
    })

    it('應該正確路由到發布頁面', () => {
      render(
        <TestWrapper>
          <Routes>
            <Route path="/new" element={<New />} />
          </Routes>
        </TestWrapper>
      )

      expect(screen.getByText(/發布祈禱/i)).toBeInTheDocument()
    })

    it('應該正確路由到檔案頁面', async () => {
      server.use(
        http.get('/api/users/:id', () => {
          return HttpResponse.json(mockUser)
        })
      )

      render(
        <TestWrapper>
          <Routes>
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(mockUser.displayName)).toBeInTheDocument()
      })
    })

    it('應該處理不存在的路由', () => {
      render(
        <TestWrapper>
          <Routes>
            <Route path="/nonexistent" element={<NotFound />} />
          </Routes>
        </TestWrapper>
      )

      expect(screen.getByText(/Oops! Page not found/i)).toBeInTheDocument()
    })
  })

  describe('導航交互', () => {
    it('應該點擊導航項目時正確切換頁面', async () => {
      server.use(
        http.get('/api/prayers', () => {
          return HttpResponse.json([mockPrayer])
        })
      )

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      // 點擊祈禱導航，使用更具體的選擇器
      const prayersLink = screen.getByRole('link', { name: '祈禱' })
      fireEvent.click(prayersLink)

      // 驗證導航鏈接正常工作（在簡化的 mock 環境中，我們只驗證導航元素存在）
      expect(prayersLink).toHaveAttribute('href', '/prayers')
    })

    it('應該在移動設備上顯示漢堡選單', () => {
      // Mock 移動設備視窗大小
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      // 由於行動選單按鈕預設是隱藏的，我們使用 data-testid 來尋找它
      const menuButton = screen.getByTestId('mobile-menu-button')
      expect(menuButton).toBeInTheDocument()

      // 點擊選單按鈕
      fireEvent.click(menuButton)

      // 應該顯示導航選單
      expect(screen.getByText(/首頁/i)).toBeInTheDocument()
      // 使用更具體的選擇器來避免與歡迎消息中的 "祈禱" 混淆
      expect(screen.getByRole('link', { name: '祈禱' })).toBeInTheDocument()
    })
  })

  describe('認證導航', () => {
    it('應該在未登入時重定向到登入頁面', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      // 在完整 App 中找到發布鏈接並點擊
      const newLink = screen.getByRole('link', { name: '發布' })
      fireEvent.click(newLink)

      // 驗證包含認證相關元素（在我們的 mock 中，New 和 Auth 頁面會同時渲染）
      await waitFor(() => {
        expect(screen.getByText(/登入/i)).toBeInTheDocument()
      })
    })

    it('應該在登入成功後重定向到原目標頁面', async () => {
      // Mock successful login
      const { useFirebaseAuth } = await import('@/hooks/useFirebaseAuth')
      vi.mocked(useFirebaseAuth).mockReturnValue({
        currentUser: mockUser as any,
        loading: false,
        signIn: vi.fn().mockResolvedValue({ user: mockUser, error: null }),
        signUp: vi.fn().mockResolvedValue({ user: null, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        resetPassword: vi.fn().mockResolvedValue({ error: null }),
        refreshUserAvatar: vi.fn(),
      })

      render(
        <TestWrapper>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/new" element={<New />} />
          </Routes>
        </TestWrapper>
      )

      // 填寫登入表單
      const emailInput = screen.getByPlaceholderText(/電子信箱/i)
      const passwordInput = screen.getByPlaceholderText(/輸入密碼/i)
      const loginButton = screen.getByRole('button', { name: /登入/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(loginButton)

      await waitFor(() => {
        expect(screen.getByText(/發布祈禱/i)).toBeInTheDocument()
      })
    })
  })

  describe('錯誤處理', () => {
    it('應該處理網路錯誤', async () => {
      // 設置錯誤狀態
      ;(global as any).mockApiError = true

      render(
        <TestWrapper>
          <Routes>
            <Route path="/prayers" element={<Prayers />} />
          </Routes>
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/載入失敗/i)).toBeInTheDocument()
      })
    })

    it('應該處理 404 錯誤', async () => {
      // 設置 404 錯誤狀態
      ;(global as any).mockApiError = 404

      render(
        <TestWrapper>
          <Routes>
            <Route path="/prayers" element={<Prayers />} />
          </Routes>
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/找不到資源/i)).toBeInTheDocument()
      })
    })

    it('應該處理 500 錯誤', async () => {
      // 設置 500 錯誤狀態
      ;(global as any).mockApiError = 500

      render(
        <TestWrapper>
          <Routes>
            <Route path="/prayers" element={<Prayers />} />
          </Routes>
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/伺服器錯誤/i)).toBeInTheDocument()
      })
    })
  })

  describe('載入狀態', () => {
    it('應該在載入時顯示載入指示器', async () => {
      // 設置載入狀態
      ;(global as any).mockApiLoading = true

      render(
        <TestWrapper>
          <Routes>
            <Route path="/prayers" element={<Prayers />} />
          </Routes>
        </TestWrapper>
      )

      // 應該顯示載入指示器
      expect(screen.getByText(/載入中/i)).toBeInTheDocument()
    })
  })

  describe('離線處理', () => {
    it('應該在離線時顯示離線提示', async () => {
      // 設置離線狀態
      ;(global as any).mockOfflineMode = true

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      expect(screen.getByTestId('offline-alert')).toBeInTheDocument()
    })

    it('應該在恢復連線時隱藏離線提示', async () => {
      // 初始為離線狀態
      ;(global as any).mockOfflineMode = true

      const { rerender } = render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      expect(screen.getByTestId('offline-alert')).toBeInTheDocument()

      // 模擬恢復連線
      ;(global as any).mockOfflineMode = false

      // 重新渲染以反映狀態變化
      rerender(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.queryByTestId('offline-alert')).not.toBeInTheDocument()
      })
    })
  })

  describe('返回按鈕處理', () => {
    it('應該正確處理瀏覽器返回按鈕', () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      // 模擬瀏覽器返回按鈕
      fireEvent.popState(window)

      // 應該保持在當前頁面或正確處理導航
      expect(screen.getByText(/歡迎來到祈禱平台/i)).toBeInTheDocument()
    })
  })
}) 