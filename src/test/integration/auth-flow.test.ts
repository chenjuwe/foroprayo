import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { server } from '../../test/mocks/handlers'
import { rest } from 'msw'
import { setupTestEnvironment } from '../../test/mocks/handlers'
import Auth from '../../pages/Auth'
import { FirebaseAuthProvider } from '../../contexts/FirebaseAuthContext'

// Setup test environment
setupTestEnvironment()

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  
  return render(
    <QueryClientProvider client={queryClient}>
      <FirebaseAuthProvider>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </FirebaseAuthProvider>
    </QueryClientProvider>
  )
}

describe('認證流程整合測試', () => {
  describe('註冊流程', () => {
    it('應該成功完成用戶註冊流程', async () => {
      // Mock 成功的註冊響應
      server.use(
        rest.post('/api/auth/signup', (req, res, ctx) => {
          return res(
            ctx.status(201),
            ctx.json({
              user: {
                uid: 'new-user-id',
                email: 'newuser@example.com',
                displayName: 'New User',
              },
              token: 'new-jwt-token',
            })
          )
        })
      )

      renderWithProviders(<Auth />)

      // 切換到註冊模式
      const signupTab = screen.getByText('註冊')
      fireEvent.click(signupTab)

      // 填寫註冊表單
      const emailInput = screen.getByLabelText(/電子郵件/i)
      const passwordInput = screen.getByLabelText(/密碼/i)
      const confirmPasswordInput = screen.getByLabelText(/確認密碼/i)
      const displayNameInput = screen.getByLabelText(/顯示名稱/i)

      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      fireEvent.change(displayNameInput, { target: { value: 'New User' } })

      // 提交表單
      const submitButton = screen.getByRole('button', { name: /註冊/i })
      fireEvent.click(submitButton)

      // 驗證成功狀態
      await waitFor(() => {
        expect(screen.getByText(/註冊成功/i)).toBeInTheDocument()
      })
    })

    it('應該處理註冊錯誤', async () => {
      // Mock 註冊錯誤
      server.use(
        rest.post('/api/auth/signup', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({
              error: '電子郵件已被使用',
            })
          )
        })
      )

      renderWithProviders(<Auth />)

      // 切換到註冊模式
      const signupTab = screen.getByText('註冊')
      fireEvent.click(signupTab)

      // 填寫表單
      const emailInput = screen.getByLabelText(/電子郵件/i)
      const passwordInput = screen.getByLabelText(/密碼/i)
      const confirmPasswordInput = screen.getByLabelText(/確認密碼/i)
      const displayNameInput = screen.getByLabelText(/顯示名稱/i)

      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      fireEvent.change(displayNameInput, { target: { value: 'Test User' } })

      // 提交表單
      const submitButton = screen.getByRole('button', { name: /註冊/i })
      fireEvent.click(submitButton)

      // 驗證錯誤訊息
      await waitFor(() => {
        expect(screen.getByText(/電子郵件已被使用/i)).toBeInTheDocument()
      })
    })
  })

  describe('登入流程', () => {
    it('應該成功完成用戶登入流程', async () => {
      // Mock 成功的登入響應
      server.use(
        rest.post('/api/auth/signin', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              user: {
                uid: 'existing-user-id',
                email: 'user@example.com',
                displayName: 'Existing User',
              },
              token: 'existing-jwt-token',
            })
          )
        })
      )

      renderWithProviders(<Auth />)

      // 確保在登入模式
      const loginTab = screen.getByText('登入')
      fireEvent.click(loginTab)

      // 填寫登入表單
      const emailInput = screen.getByLabelText(/電子郵件/i)
      const passwordInput = screen.getByLabelText(/密碼/i)

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      // 提交表單
      const submitButton = screen.getByRole('button', { name: /登入/i })
      fireEvent.click(submitButton)

      // 驗證成功狀態
      await waitFor(() => {
        expect(screen.getByText(/登入成功/i)).toBeInTheDocument()
      })
    })

    it('應該處理登入錯誤', async () => {
      // Mock 登入錯誤
      server.use(
        rest.post('/api/auth/signin', (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({
              error: '電子郵件或密碼錯誤',
            })
          )
        })
      )

      renderWithProviders(<Auth />)

      // 確保在登入模式
      const loginTab = screen.getByText('登入')
      fireEvent.click(loginTab)

      // 填寫錯誤的登入資訊
      const emailInput = screen.getByLabelText(/電子郵件/i)
      const passwordInput = screen.getByLabelText(/密碼/i)

      fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })

      // 提交表單
      const submitButton = screen.getByRole('button', { name: /登入/i })
      fireEvent.click(submitButton)

      // 驗證錯誤訊息
      await waitFor(() => {
        expect(screen.getByText(/電子郵件或密碼錯誤/i)).toBeInTheDocument()
      })
    })
  })

  describe('密碼重置流程', () => {
    it('應該成功發送密碼重置郵件', async () => {
      // Mock 密碼重置成功
      server.use(
        rest.post('/api/auth/reset-password', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              message: '密碼重置郵件已發送',
            })
          )
        })
      )

      renderWithProviders(<Auth />)

      // 點擊忘記密碼連結
      const forgotPasswordLink = screen.getByText(/忘記密碼/i)
      fireEvent.click(forgotPasswordLink)

      // 填寫電子郵件
      const emailInput = screen.getByLabelText(/電子郵件/i)
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } })

      // 提交表單
      const submitButton = screen.getByRole('button', { name: /發送重置郵件/i })
      fireEvent.click(submitButton)

      // 驗證成功訊息
      await waitFor(() => {
        expect(screen.getByText(/密碼重置郵件已發送/i)).toBeInTheDocument()
      })
    })
  })

  describe('表單驗證', () => {
    it('應該驗證必填欄位', async () => {
      renderWithProviders(<Auth />)

      // 嘗試提交空表單
      const submitButton = screen.getByRole('button', { name: /登入/i })
      fireEvent.click(submitButton)

      // 驗證錯誤訊息
      await waitFor(() => {
        expect(screen.getByText(/請輸入電子郵件/i)).toBeInTheDocument()
        expect(screen.getByText(/請輸入密碼/i)).toBeInTheDocument()
      })
    })

    it('應該驗證電子郵件格式', async () => {
      renderWithProviders(<Auth />)

      // 輸入無效的電子郵件
      const emailInput = screen.getByLabelText(/電子郵件/i)
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })

      // 失去焦點觸發驗證
      fireEvent.blur(emailInput)

      // 驗證錯誤訊息
      await waitFor(() => {
        expect(screen.getByText(/請輸入有效的電子郵件地址/i)).toBeInTheDocument()
      })
    })

    it('應該驗證密碼強度', async () => {
      renderWithProviders(<Auth />)

      // 切換到註冊模式
      const signupTab = screen.getByText('註冊')
      fireEvent.click(signupTab)

      // 輸入弱密碼
      const passwordInput = screen.getByLabelText(/密碼/i)
      fireEvent.change(passwordInput, { target: { value: '123' } })

      // 失去焦點觸發驗證
      fireEvent.blur(passwordInput)

      // 驗證錯誤訊息
      await waitFor(() => {
        expect(screen.getByText(/密碼至少需要6個字符/i)).toBeInTheDocument()
      })
    })
  })

  describe('網路錯誤處理', () => {
    it('應該處理網路錯誤', async () => {
      // Mock 網路錯誤
      server.use(
        rest.post('/api/auth/signin', (req, res, ctx) => {
          return res.networkError('網路連接失敗')
        })
      )

      renderWithProviders(<Auth />)

      // 填寫登入表單
      const emailInput = screen.getByLabelText(/電子郵件/i)
      const passwordInput = screen.getByLabelText(/密碼/i)

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      // 提交表單
      const submitButton = screen.getByRole('button', { name: /登入/i })
      fireEvent.click(submitButton)

      // 驗證錯誤訊息
      await waitFor(() => {
        expect(screen.getByText(/網路連接失敗/i)).toBeInTheDocument()
      })
    })
  })
}) 