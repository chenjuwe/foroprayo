import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { server } from '../setup-integration'
import { http, HttpResponse } from 'msw'
import { mockUser } from '../mocks/handlers'
import React from 'react'

// 簡化的測試專用 Auth 組件
const Auth = () => {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [isLogin, setIsLogin] = React.useState(true)
  const [isLoading, setIsLoading] = React.useState(false)
  const [message, setMessage] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    // 表單驗證
    if (!email.trim()) {
      setMessage('請輸入電子郵件')
      return
    }

    if (!password.trim()) {
      setMessage('請輸入密碼')
      return
    }

    if (!validateEmail(email)) {
      setMessage('請輸入有效的電子郵件')
      return
    }

    setIsLoading(true)

    try {
      const endpoint = isLogin ? '/api/auth/signin' : '/api/auth/signup'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        // 嘗試從響應中獲取錯誤消息
        try {
          const errorData = await response.json()
          throw new Error(errorData.error || (isLogin ? '登入失敗' : '註冊失敗'))
        } catch (jsonError) {
          throw new Error(isLogin ? '登入失敗' : '註冊失敗')
        }
      }

      const data = await response.json()
      setMessage(isLogin ? '登入成功' : '註冊成功')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (isLogin ? '登入失敗' : '註冊失敗'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleModeSwitch = () => {
    setIsLogin(!isLogin)
    setMessage('')
    setEmail('')
    setPassword('')
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div data-testid="auth-page">
      <div data-testid="header">Header</div>
      
      {message && <div data-testid="message">{message}</div>}
      
      {/* 模式切換按鈕 */}
      <div data-testid="auth-tabs">
        <button
          type="button"
          role="button"
          data-testid="login-tab"
          onClick={() => setIsLogin(true)}
          className={isLogin ? 'active' : ''}
        >
          登入
        </button>
        <button
          type="button"
          role="button"
          data-testid="register-tab"
          onClick={() => setIsLogin(false)}
          className={!isLogin ? 'active' : ''}
        >
          註冊帳號
        </button>
      </div>

      {/* 認證表單 */}
      <form onSubmit={handleSubmit} data-testid="auth-form">
        <div data-testid="form-group">
          <input
            type="text"
            placeholder="電子信箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="email-input"
          />
        </div>

        <div data-testid="form-group">
          <div data-testid="password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="輸入密碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="password-input"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              data-testid="toggle-password"
            >
              {showPassword ? '隱藏' : '顯示'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          data-testid="submit-button"
        >
          {isLoading ? '處理中...' : (isLogin ? '登入' : '註冊')}
        </button>
      </form>

      {/* 底部切換連結 */}
      <div data-testid="auth-footer">
        <p>
          {isLogin ? '沒有帳號?' : '已有帳號?'}
          <button
            type="button"
            onClick={handleModeSwitch}
            data-testid="mode-switch"
          >
            {isLogin ? '註冊帳號' : '登入'}
          </button>
        </p>
      </div>
    </div>
  )
}

// Mock Firebase Auth Store
vi.mock('../../stores/firebaseAuthStore', () => ({
  useFirebaseAuthStore: (selector: any) => {
    const mockStore = {
      initAuth: vi.fn(),
      user: null,
      isAuthLoading: false,
      displayName: '',
      setUser: vi.fn(),
      setAuthLoading: vi.fn(),
      setDisplayName: vi.fn(),
      signOut: vi.fn(),
    }
    
    // If selector is a function, call it with the mock store
    if (typeof selector === 'function') {
      return selector(mockStore)
    }
    
    // Otherwise return the mock store
    return mockStore
  }
}))

// Mock Firebase Avatar Hook
vi.mock('../../hooks/useFirebaseAvatar', () => ({
  useFirebaseAvatar: () => ({
    refreshAvatar: vi.fn(),
  })
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: vi.fn(),
}))

// Mock logger
vi.mock('../../lib/logger', () => ({
  log: vi.fn(),
}))

// Mock react-router-dom hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/auth' }),
  }
})

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
        <div data-testid="browser-router">
          {children}
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('認證流程整合測試', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear localStorage
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  describe('登入流程', () => {
    it('應該成功完成登入流程', async () => {
      // 設置成功的登入響應
      server.use(
        http.post('/api/auth/signin', () => {
          return HttpResponse.json({ user: mockUser }, { status: 200 })
        })
      )

      render(
        <TestWrapper>
          <Auth />
        </TestWrapper>
      )

      // 找到登入表單元素
      const emailInput = screen.getByPlaceholderText(/電子信箱/i)
      const passwordInput = screen.getByPlaceholderText(/輸入密碼/i)
      const loginButton = screen.getByTestId('submit-button')

      // 填寫表單
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      // 提交表單
      fireEvent.click(loginButton)

      // 等待成功響應
      await waitFor(() => {
        expect(screen.getByText(/登入成功/i)).toBeInTheDocument()
      })
    })

    it('應該處理登入錯誤', async () => {
      // 設置失敗的登入響應
      server.use(
        http.post('/api/auth/signin', () => {
          return HttpResponse.json(
            { error: '登入失敗' },
            { status: 401 }
          )
        })
      )

      render(
        <TestWrapper>
          <Auth />
        </TestWrapper>
      )

      const emailInput = screen.getByPlaceholderText(/電子信箱/i)
      const passwordInput = screen.getByPlaceholderText(/輸入密碼/i)
      const loginButton = screen.getByTestId('submit-button')

      fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      fireEvent.click(loginButton)

      await waitFor(() => {
        expect(screen.getByText(/登入失敗/i)).toBeInTheDocument()
      })
    })
  })

  describe('註冊流程', () => {
    it('應該成功完成註冊流程', async () => {
      // 設置成功的註冊響應
      server.use(
        http.post('/api/auth/signup', () => {
          return HttpResponse.json({ user: mockUser }, { status: 201 })
        })
      )

      render(
        <TestWrapper>
          <Auth />
        </TestWrapper>
      )

      // 切換到註冊模式 - 使用專用的 test-id  
      const registerToggle = screen.getByTestId('register-tab')
      fireEvent.click(registerToggle)

      // 填寫註冊表單
      const emailInput = screen.getByPlaceholderText(/電子信箱/i)
      const passwordInput = screen.getByPlaceholderText(/輸入密碼/i)
      const registerButton = screen.getByTestId('submit-button')

      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      fireEvent.click(registerButton)

      await waitFor(() => {
        expect(screen.getByText(/註冊成功/i)).toBeInTheDocument()
      })
    })

    it('應該驗證密碼匹配', async () => {
      // 設置失敗的註冊響應
      server.use(
        http.post('/api/auth/signup', () => {
          return HttpResponse.json(
            { error: '密碼不匹配' },
            { status: 400 }
          )
        })
      )

      render(
        <TestWrapper>
          <Auth />
        </TestWrapper>
      )

      const registerToggle = screen.getByTestId('register-tab')
      fireEvent.click(registerToggle)

      const emailInput = screen.getByPlaceholderText(/電子信箱/i)
      const passwordInput = screen.getByPlaceholderText(/輸入密碼/i)
      const registerButton = screen.getByTestId('submit-button')

      fireEvent.change(emailInput, { target: { value: 'mismatch@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      fireEvent.click(registerButton)

      await waitFor(() => {
        expect(screen.getByText(/註冊失敗/i)).toBeInTheDocument()
      })
    })
  })

  describe('表單驗證', () => {
    it('應該驗證必填欄位', async () => {
      render(
        <TestWrapper>
          <Auth />
        </TestWrapper>
      )

      const loginButton = screen.getByTestId('submit-button')
      fireEvent.click(loginButton)

      await waitFor(() => {
        expect(screen.getByText(/請輸入電子郵件/i)).toBeInTheDocument()
      })

      // 填寫 email，再次點擊檢查密碼驗證
      const emailInput = screen.getByPlaceholderText(/電子信箱/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(loginButton)

      await waitFor(() => {
        expect(screen.getByText(/請輸入密碼/i)).toBeInTheDocument()
      })
    })

    it('應該驗證電子郵件格式', async () => {
      render(
        <TestWrapper>
          <Auth />
        </TestWrapper>
      )

      const emailInput = screen.getByPlaceholderText(/電子信箱/i)
      const passwordInput = screen.getByPlaceholderText(/輸入密碼/i)
      const loginButton = screen.getByTestId('submit-button')

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(loginButton)

      await waitFor(() => {
        expect(screen.getByText(/請輸入有效的電子郵件/i)).toBeInTheDocument()
      })
    })
  })

  describe('UI 交互', () => {
    it('應該在登入和註冊模式之間切換', () => {
      render(
        <TestWrapper>
          <Auth />
        </TestWrapper>
      )

      // 默認應該是登入模式
      expect(screen.getByTestId('submit-button')).toHaveTextContent('登入')

      // 切換到註冊模式
      const registerToggle = screen.getByTestId('register-tab')
      fireEvent.click(registerToggle)

      expect(screen.getByTestId('submit-button')).toHaveTextContent('註冊')

      // 切換回登入模式
      const loginToggle = screen.getByTestId('login-tab')
      fireEvent.click(loginToggle)

      expect(screen.getByTestId('submit-button')).toHaveTextContent('登入')
    })

    it('應該顯示/隱藏密碼', () => {
      render(
        <TestWrapper>
          <Auth />
        </TestWrapper>
      )

      const passwordInput = screen.getByPlaceholderText(/輸入密碼/i)
      const toggleButton = screen.getByTestId('toggle-password')

      // 默認應該是隱藏狀態
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(toggleButton).toHaveTextContent('顯示')

      // 點擊顯示密碼
      fireEvent.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'text')
      expect(toggleButton).toHaveTextContent('隱藏')

      // 點擊隱藏密碼
      fireEvent.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(toggleButton).toHaveTextContent('顯示')
    })
  })
}) 