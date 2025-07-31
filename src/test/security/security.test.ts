import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { server } from '../mocks/handlers'
import { rest } from 'msw'
import { setupTestEnvironment } from '../mocks/handlers'
import New from '../../pages/New'
import Prayers from '../../pages/Prayers'
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

describe('安全性測試', () => {
  describe('XSS 防護測試', () => {
    it('應該防止 XSS 攻擊在代禱內容中', async () => {
      const maliciousScript = '<script>alert("XSS")</script>'
      const maliciousContent = `這是一個測試代禱<script>alert("XSS")</script>`
      
      // Mock 成功的代禱創建
      server.use(
        rest.post('/api/prayers', (req, res, ctx) => {
          return res(
            ctx.status(201),
            ctx.json({
              id: 'new-prayer-id',
              content: maliciousContent,
              userId: 'test-user-id',
              userName: 'Test User',
              timestamp: new Date().toISOString(),
              likes: 0,
              responses: [],
              isAnswered: false,
            })
          )
        })
      )

      renderWithProviders(<New />)

      // 輸入惡意腳本
      const contentTextarea = screen.getByLabelText(/代禱內容/i)
      fireEvent.change(contentTextarea, { 
        target: { value: maliciousContent } 
      })

      // 提交代禱
      const submitButton = screen.getByRole('button', { name: /發布代禱/i })
      fireEvent.click(submitButton)

      // 驗證腳本被轉義，不會執行
      await waitFor(() => {
        expect(screen.getByText(/代禱發布成功/i)).toBeInTheDocument()
      })

      // 檢查 DOM 中不應該有 script 標籤
      const scriptElements = document.querySelectorAll('script')
      expect(scriptElements.length).toBe(0)
    })

    it('應該防止 XSS 攻擊在用戶名稱中', async () => {
      const maliciousUserName = '<script>alert("XSS")</script>User'
      
      // Mock 包含惡意用戶名的代禱
      server.use(
        rest.get('/api/prayers', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json([
              {
                id: 'prayer-1',
                content: '測試代禱',
                userId: 'user-1',
                userName: maliciousUserName,
                timestamp: new Date().toISOString(),
                likes: 0,
                responses: [],
                isAnswered: false,
              },
            ])
          )
        })
      )

      renderWithProviders(<Prayers />)

      // 等待代禱列表載入
      await waitFor(() => {
        expect(screen.getByText('測試代禱')).toBeInTheDocument()
      })

      // 檢查用戶名稱被正確轉義
      const userNameElement = screen.getByText(maliciousUserName)
      expect(userNameElement).toBeInTheDocument()
      
      // 檢查 DOM 中不應該有 script 標籤
      const scriptElements = document.querySelectorAll('script')
      expect(scriptElements.length).toBe(0)
    })

    it('應該防止 XSS 攻擊在回應內容中', async () => {
      const maliciousResponse = '<img src="x" onerror="alert(\'XSS\')">'
      
      // Mock 包含惡意回應的代禱
      server.use(
        rest.get('/api/prayers', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json([
              {
                id: 'prayer-1',
                content: '測試代禱',
                userId: 'user-1',
                userName: 'Test User',
                timestamp: new Date().toISOString(),
                likes: 0,
                responses: [
                  {
                    id: 'response-1',
                    content: maliciousResponse,
                    userId: 'user-2',
                    userName: 'User 2',
                    timestamp: new Date().toISOString(),
                  },
                ],
                isAnswered: false,
              },
            ])
          )
        })
      )

      renderWithProviders(<Prayers />)

      // 等待代禱列表載入
      await waitFor(() => {
        expect(screen.getByText('測試代禱')).toBeInTheDocument()
      })

      // 檢查回應內容被正確轉義
      const responseElement = screen.getByText(maliciousResponse)
      expect(responseElement).toBeInTheDocument()
      
      // 檢查沒有 img 標籤被執行
      const imgElements = document.querySelectorAll('img[onerror]')
      expect(imgElements.length).toBe(0)
    })
  })

  describe('CSRF 防護測試', () => {
    it('應該在 API 請求中包含 CSRF Token', async () => {
      let requestHeaders: any = {}
      
      server.use(
        rest.post('/api/prayers', (req, res, ctx) => {
          requestHeaders = req.headers
          return res(
            ctx.status(201),
            ctx.json({
              id: 'new-prayer-id',
              content: '測試代禱',
              userId: 'test-user-id',
              userName: 'Test User',
              timestamp: new Date().toISOString(),
              likes: 0,
              responses: [],
              isAnswered: false,
            })
          )
        })
      )

      renderWithProviders(<New />)

      // 填寫代禱內容
      const contentTextarea = screen.getByLabelText(/代禱內容/i)
      fireEvent.change(contentTextarea, { 
        target: { value: '測試代禱' } 
      })

      // 提交代禱
      const submitButton = screen.getByRole('button', { name: /發布代禱/i })
      fireEvent.click(submitButton)

      // 驗證請求包含 CSRF Token
      await waitFor(() => {
        expect(requestHeaders['x-csrf-token']).toBeDefined()
      })
    })

    it('應該拒絕沒有 CSRF Token 的請求', async () => {
      server.use(
        rest.post('/api/prayers', (req, res, ctx) => {
          const csrfToken = req.headers.get('x-csrf-token')
          if (!csrfToken) {
            return res(
              ctx.status(403),
              ctx.json({
                error: 'CSRF Token 缺失',
              })
            )
          }
          return res(
            ctx.status(201),
            ctx.json({
              id: 'new-prayer-id',
              content: '測試代禱',
              userId: 'test-user-id',
              userName: 'Test User',
              timestamp: new Date().toISOString(),
              likes: 0,
              responses: [],
              isAnswered: false,
            })
          )
        })
      )

      renderWithProviders(<New />)

      // 填寫代禱內容
      const contentTextarea = screen.getByLabelText(/代禱內容/i)
      fireEvent.change(contentTextarea, { 
        target: { value: '測試代禱' } 
      })

      // 提交代禱
      const submitButton = screen.getByRole('button', { name: /發布代禱/i })
      fireEvent.click(submitButton)

      // 驗證錯誤訊息
      await waitFor(() => {
        expect(screen.getByText(/CSRF Token 缺失/i)).toBeInTheDocument()
      })
    })
  })

  describe('SQL 注入防護測試', () => {
    it('應該防止 SQL 注入在搜尋查詢中', async () => {
      const sqlInjectionQuery = "'; DROP TABLE prayers; --"
      
      server.use(
        rest.get('/api/prayers', (req, res, ctx) => {
          const searchQuery = req.url.searchParams.get('search')
          
          // 驗證搜尋查詢被正確處理
          if (searchQuery && searchQuery.includes('DROP TABLE')) {
            return res(
              ctx.status(400),
              ctx.json({
                error: '無效的搜尋查詢',
              })
            )
          }
          
          return res(
            ctx.status(200),
            ctx.json([])
          )
        })
      )

      renderWithProviders(<Prayers />)

      // 輸入 SQL 注入查詢
      const searchInput = screen.getByPlaceholderText(/搜尋代禱/i)
      fireEvent.change(searchInput, { target: { value: sqlInjectionQuery } })

      // 驗證錯誤處理
      await waitFor(() => {
        expect(screen.getByText(/無效的搜尋查詢/i)).toBeInTheDocument()
      })
    })
  })

  describe('認證和授權測試', () => {
    it('應該防止未認證用戶訪問受保護的頁面', async () => {
      // 模擬未認證狀態
      server.use(
        rest.get('/api/auth/me', (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({
              error: '未認證',
            })
          )
        })
      )

      renderWithProviders(<New />)

      // 驗證重定向到登入頁面
      await waitFor(() => {
        expect(window.location.pathname).toBe('/auth')
      })
    })

    it('應該防止用戶編輯他人的代禱', async () => {
      // Mock 代禱數據
      server.use(
        rest.get('/api/prayers', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json([
              {
                id: 'prayer-1',
                content: '他人的代禱',
                userId: 'other-user-id',
                userName: 'Other User',
                timestamp: new Date().toISOString(),
                likes: 0,
                responses: [],
                isAnswered: false,
              },
            ])
          )
        })
      )

      renderWithProviders(<Prayers />)

      // 等待代禱列表載入
      await waitFor(() => {
        expect(screen.getByText('他人的代禱')).toBeInTheDocument()
      })

      // 驗證編輯按鈕不可見（因為不是自己的代禱）
      const editButtons = screen.queryAllByRole('button', { name: /編輯/i })
      expect(editButtons.length).toBe(0)
    })

    it('應該防止用戶刪除他人的代禱', async () => {
      // Mock 代禱數據
      server.use(
        rest.get('/api/prayers', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json([
              {
                id: 'prayer-1',
                content: '他人的代禱',
                userId: 'other-user-id',
                userName: 'Other User',
                timestamp: new Date().toISOString(),
                likes: 0,
                responses: [],
                isAnswered: false,
              },
            ])
          )
        })
      )

      renderWithProviders(<Prayers />)

      // 等待代禱列表載入
      await waitFor(() => {
        expect(screen.getByText('他人的代禱')).toBeInTheDocument()
      })

      // 驗證刪除按鈕不可見（因為不是自己的代禱）
      const deleteButtons = screen.queryAllByRole('button', { name: /刪除/i })
      expect(deleteButtons.length).toBe(0)
    })
  })

  describe('輸入驗證測試', () => {
    it('應該驗證電子郵件格式', async () => {
      renderWithProviders(<Auth />)

      // 輸入無效的電子郵件
      const emailInput = screen.getByLabelText(/電子郵件/i)
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.blur(emailInput)

      // 驗證錯誤訊息
      await waitFor(() => {
        expect(screen.getByText(/請輸入有效的電子郵件地址/i)).toBeInTheDocument()
      })
    })

    it('應該防止過長的輸入', async () => {
      renderWithProviders(<New />)

      // 輸入過長的內容
      const longContent = 'a'.repeat(10001) // 超過 10000 字符
      const contentTextarea = screen.getByLabelText(/代禱內容/i)
      fireEvent.change(contentTextarea, { target: { value: longContent } })
      fireEvent.blur(contentTextarea)

      // 驗證錯誤訊息
      await waitFor(() => {
        expect(screen.getByText(/代禱內容不能超過10000個字符/i)).toBeInTheDocument()
      })
    })

    it('應該防止特殊字符注入', async () => {
      const specialChars = '<>&"\''
      
      renderWithProviders(<New />)

      // 輸入包含特殊字符的內容
      const contentTextarea = screen.getByLabelText(/代禱內容/i)
      fireEvent.change(contentTextarea, { target: { value: specialChars } })

      // 提交代禱
      const submitButton = screen.getByRole('button', { name: /發布代禱/i })
      fireEvent.click(submitButton)

      // 驗證內容被正確處理
      await waitFor(() => {
        expect(screen.getByText(/代禱發布成功/i)).toBeInTheDocument()
      })

      // 檢查特殊字符被正確轉義
      const escapedContent = screen.getByText(specialChars)
      expect(escapedContent).toBeInTheDocument()
    })
  })

  describe('檔案上傳安全測試', () => {
    it('應該驗證檔案類型', async () => {
      renderWithProviders(<New />)

      // 創建一個惡意檔案
      const maliciousFile = new File(['malicious content'], 'malicious.exe', {
        type: 'application/x-executable',
      })

      // 模擬檔案上傳
      const fileInput = screen.getByLabelText(/上傳圖片/i)
      fireEvent.change(fileInput, { target: { files: [maliciousFile] } })

      // 驗證錯誤訊息
      await waitFor(() => {
        expect(screen.getByText(/請選擇有效的圖片文件/i)).toBeInTheDocument()
      })
    })

    it('應該限制檔案大小', async () => {
      renderWithProviders(<New />)

      // 創建一個過大的檔案
      const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      })

      // 模擬檔案上傳
      const fileInput = screen.getByLabelText(/上傳圖片/i)
      fireEvent.change(fileInput, { target: { files: [largeFile] } })

      // 驗證錯誤訊息
      await waitFor(() => {
        expect(screen.getByText(/檔案大小不能超過5MB/i)).toBeInTheDocument()
      })
    })
  })

  describe('會話管理測試', () => {
    it('應該在閒置後自動登出', async () => {
      // 模擬長時間閒置
      jest.useFakeTimers()
      
      renderWithProviders(<Prayers />)

      // 快進時間超過閒置時間限制
      jest.advanceTimersByTime(30 * 60 * 1000) // 30 分鐘

      // 驗證自動登出
      await waitFor(() => {
        expect(window.location.pathname).toBe('/auth')
      })

      jest.useRealTimers()
    })

    it('應該在登出後清除所有會話數據', async () => {
      renderWithProviders(<Prayers />)

      // 點擊登出按鈕
      const logoutButton = screen.getByRole('button', { name: /登出/i })
      fireEvent.click(logoutButton)

      // 驗證重定向到登入頁面
      await waitFor(() => {
        expect(window.location.pathname).toBe('/auth')
      })

      // 驗證本地存儲被清除
      expect(localStorage.getItem('authToken')).toBeNull()
      expect(sessionStorage.getItem('userData')).toBeNull()
    })
  })

  describe('HTTPS 強制測試', () => {
    it('應該在非 HTTPS 環境下顯示警告', async () => {
      // 模擬非 HTTPS 環境
      Object.defineProperty(window.location, 'protocol', {
        writable: true,
        value: 'http:',
      })

      renderWithProviders(<Auth />)

      // 驗證 HTTPS 警告
      await waitFor(() => {
        expect(screen.getByText(/請使用 HTTPS 連接以確保安全/i)).toBeInTheDocument()
      })

      // 恢復 HTTPS
      Object.defineProperty(window.location, 'protocol', {
        writable: true,
        value: 'https:',
      })
    })
  })

  describe('內容安全策略測試', () => {
    it('應該設置適當的 CSP 標頭', async () => {
      // 檢查 meta 標籤中的 CSP
      const metaTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]')
      expect(metaTags.length).toBeGreaterThan(0)
      
      const cspContent = metaTags[0].getAttribute('content')
      expect(cspContent).toContain("default-src 'self'")
      expect(cspContent).toContain("script-src 'self'")
      expect(cspContent).toContain("style-src 'self' 'unsafe-inline'")
    })
  })
}) 