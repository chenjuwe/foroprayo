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
  })

  afterEach(() => {
    cleanup()
  })

  describe('主要導航', () => {
    it('應該正確顯示導航選單', () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      // 檢查主要導航項目
      expect(screen.getByText(/首頁/i)).toBeInTheDocument()
      expect(screen.getByText(/祈禱/i)).toBeInTheDocument()
      expect(screen.getByText(/發布/i)).toBeInTheDocument()
      expect(screen.getByText(/檔案/i)).toBeInTheDocument()
    })

    it('應該在未登入時顯示登入按鈕', () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      expect(screen.getByText(/登入/i)).toBeInTheDocument()
      expect(screen.queryByText(/登出/i)).not.toBeInTheDocument()
    })

    it('應該在已登入時顯示用戶選單', async () => {
      // Mock authenticated user
      vi.mocked(require('@/stores/firebaseAuthStore').useFirebaseAuthStore).mockReturnValue({
        initAuth: vi.fn(),
        user: mockUser,
      })

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(mockUser.displayName)).toBeInTheDocument()
        expect(screen.getByText(/登出/i)).toBeInTheDocument()
      })
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

      // 點擊祈禱導航
      const prayersLink = screen.getByText(/祈禱/i)
      fireEvent.click(prayersLink)

      await waitFor(() => {
        expect(screen.getByText(mockPrayer.content)).toBeInTheDocument()
      })
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

      const menuButton = screen.getByRole('button', { name: /選單/i })
      expect(menuButton).toBeInTheDocument()

      // 點擊選單按鈕
      fireEvent.click(menuButton)

      // 應該顯示導航選單
      expect(screen.getByText(/首頁/i)).toBeInTheDocument()
      expect(screen.getByText(/祈禱/i)).toBeInTheDocument()
    })
  })

  describe('認證導航', () => {
    it('應該在未登入時重定向到登入頁面', async () => {
      render(
        <TestWrapper>
          <Routes>
            <Route path="/new" element={<New />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </TestWrapper>
      )

      // 嘗試訪問需要認證的頁面
      const newLink = screen.getByText(/發布/i)
      fireEvent.click(newLink)

      await waitFor(() => {
        expect(screen.getByText(/登入/i)).toBeInTheDocument()
      })
    })

    it('應該在登入成功後重定向到原目標頁面', async () => {
      // Mock successful login
      vi.mocked(require('@/hooks/useFirebaseAuth').useFirebaseAuth).mockReturnValue({
        signIn: vi.fn().mockResolvedValue({ user: mockUser, error: null }),
        signUp: vi.fn(),
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
      server.use(
        http.get('/api/prayers', () => {
          return HttpResponse.error()
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
        expect(screen.getByText(/載入失敗/i)).toBeInTheDocument()
      })
    })

    it('應該處理 404 錯誤', async () => {
      server.use(
        http.get('/api/prayers', () => {
          return HttpResponse.json(
            { error: 'Not found' },
            { status: 404 }
          )
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
        expect(screen.getByText(/找不到資源/i)).toBeInTheDocument()
      })
    })

    it('應該處理 500 錯誤', async () => {
      server.use(
        http.get('/api/prayers', () => {
          return HttpResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
          )
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
        expect(screen.getByText(/伺服器錯誤/i)).toBeInTheDocument()
      })
    })
  })

  describe('載入狀態', () => {
    it('應該在載入時顯示載入指示器', async () => {
      // 延遲響應以測試載入狀態
      server.use(
        http.get('/api/prayers', async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
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

      // 應該顯示載入指示器
      expect(screen.getByText(/載入中/i)).toBeInTheDocument()

      // 等待載入完成
      await waitFor(() => {
        expect(screen.getByText(mockPrayer.content)).toBeInTheDocument()
      })
    })
  })

  describe('離線處理', () => {
    it('應該在離線時顯示離線提示', async () => {
      // Mock 離線狀態
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      })

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      expect(screen.getByText(/您目前處於離線狀態/i)).toBeInTheDocument()
    })

    it('應該在恢復連線時隱藏離線提示', async () => {
      // 初始為離線狀態
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      })

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      expect(screen.getByText(/您目前處於離線狀態/i)).toBeInTheDocument()

      // 模擬恢復連線
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: true,
      })

      // 觸發 online 事件
      fireEvent(window, new Event('online'))

      await waitFor(() => {
        expect(screen.queryByText(/您目前處於離線狀態/i)).not.toBeInTheDocument()
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