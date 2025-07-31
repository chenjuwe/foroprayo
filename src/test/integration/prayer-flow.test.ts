import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { server } from '../../test/mocks/handlers'
import { rest } from 'msw'
import { setupTestEnvironment } from '../../test/mocks/handlers'
import New from '../../pages/New'
import Prayers from '../../pages/Prayers'
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

describe('代禱流程整合測試', () => {
  describe('創建代禱', () => {
    it('應該成功創建新代禱', async () => {
      // Mock 成功的代禱創建
      server.use(
        rest.post('/api/prayers', (req, res, ctx) => {
          return res(
            ctx.status(201),
            ctx.json({
              id: 'new-prayer-id',
              content: '這是一個測試代禱',
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
        target: { value: '這是一個測試代禱' } 
      })

      // 提交代禱
      const submitButton = screen.getByRole('button', { name: /發布代禱/i })
      fireEvent.click(submitButton)

      // 驗證成功狀態
      await waitFor(() => {
        expect(screen.getByText(/代禱發布成功/i)).toBeInTheDocument()
      })
    })

    it('應該處理代禱創建錯誤', async () => {
      // Mock 代禱創建錯誤
      server.use(
        rest.post('/api/prayers', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({
              error: '代禱內容不能為空',
            })
          )
        })
      )

      renderWithProviders(<New />)

      // 嘗試提交空代禱
      const submitButton = screen.getByRole('button', { name: /發布代禱/i })
      fireEvent.click(submitButton)

      // 驗證錯誤訊息
      await waitFor(() => {
        expect(screen.getByText(/代禱內容不能為空/i)).toBeInTheDocument()
      })
    })

    it('應該驗證代禱內容長度', async () => {
      renderWithProviders(<New />)

      // 輸入過長的代禱內容
      const contentTextarea = screen.getByLabelText(/代禱內容/i)
      const longContent = 'a'.repeat(1001) // 超過1000字符
      fireEvent.change(contentTextarea, { target: { value: longContent } })

      // 失去焦點觸發驗證
      fireEvent.blur(contentTextarea)

      // 驗證錯誤訊息
      await waitFor(() => {
        expect(screen.getByText(/代禱內容不能超過1000個字符/i)).toBeInTheDocument()
      })
    })
  })

  describe('代禱列表', () => {
    it('應該成功載入代禱列表', async () => {
      // Mock 代禱列表數據
      const mockPrayers = [
        {
          id: 'prayer-1',
          content: '第一個測試代禱',
          userId: 'user-1',
          userName: 'User 1',
          timestamp: new Date().toISOString(),
          likes: 5,
          responses: [],
          isAnswered: false,
        },
        {
          id: 'prayer-2',
          content: '第二個測試代禱',
          userId: 'user-2',
          userName: 'User 2',
          timestamp: new Date().toISOString(),
          likes: 3,
          responses: [],
          isAnswered: true,
        },
      ]

      server.use(
        rest.get('/api/prayers', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json(mockPrayers)
          )
        })
      )

      renderWithProviders(<Prayers />)

      // 驗證代禱列表載入
      await waitFor(() => {
        expect(screen.getByText('第一個測試代禱')).toBeInTheDocument()
        expect(screen.getByText('第二個測試代禱')).toBeInTheDocument()
      })
    })

    it('應該處理代禱列表載入錯誤', async () => {
      // Mock 載入錯誤
      server.use(
        rest.get('/api/prayers', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({
              error: '載入代禱列表失敗',
            })
          )
        })
      )

      renderWithProviders(<Prayers />)

      // 驗證錯誤訊息
      await waitFor(() => {
        expect(screen.getByText(/載入代禱列表失敗/i)).toBeInTheDocument()
      })
    })
  })

  describe('代禱互動', () => {
    it('應該成功點讚代禱', async () => {
      // Mock 點讚成功
      server.use(
        rest.post('/api/prayers/:id/like', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              message: '點讚成功',
              likes: 6,
            })
          )
        })
      )

      renderWithProviders(<Prayers />)

      // 等待代禱列表載入
      await waitFor(() => {
        expect(screen.getByText('第一個測試代禱')).toBeInTheDocument()
      })

      // 點擊點讚按鈕
      const likeButtons = screen.getAllByRole('button', { name: /點讚/i })
      fireEvent.click(likeButtons[0])

      // 驗證點讚成功
      await waitFor(() => {
        expect(screen.getByText(/點讚成功/i)).toBeInTheDocument()
      })
    })

    it('應該成功回應代禱', async () => {
      // Mock 回應成功
      server.use(
        rest.post('/api/prayers/:id/responses', (req, res, ctx) => {
          return res(
            ctx.status(201),
            ctx.json({
              id: 'response-1',
              content: '這是一個測試回應',
              userId: 'test-user-id',
              userName: 'Test User',
              timestamp: new Date().toISOString(),
              prayerId: 'prayer-1',
            })
          )
        })
      )

      renderWithProviders(<Prayers />)

      // 等待代禱列表載入
      await waitFor(() => {
        expect(screen.getByText('第一個測試代禱')).toBeInTheDocument()
      })

      // 點擊回應按鈕
      const responseButtons = screen.getAllByRole('button', { name: /回應/i })
      fireEvent.click(responseButtons[0])

      // 填寫回應內容
      const responseTextarea = screen.getByLabelText(/回應內容/i)
      fireEvent.change(responseTextarea, { 
        target: { value: '這是一個測試回應' } 
      })

      // 提交回應
      const submitButton = screen.getByRole('button', { name: /提交回應/i })
      fireEvent.click(submitButton)

      // 驗證回應成功
      await waitFor(() => {
        expect(screen.getByText(/回應發布成功/i)).toBeInTheDocument()
      })
    })
  })

  describe('代禱搜尋和篩選', () => {
    it('應該成功搜尋代禱', async () => {
      // Mock 搜尋結果
      server.use(
        rest.get('/api/prayers', (req, res, ctx) => {
          const searchQuery = req.url.searchParams.get('search')
          if (searchQuery === '測試') {
            return res(
              ctx.status(200),
              ctx.json([
                {
                  id: 'prayer-1',
                  content: '包含測試關鍵字的代禱',
                  userId: 'user-1',
                  userName: 'User 1',
                  timestamp: new Date().toISOString(),
                  likes: 0,
                  responses: [],
                  isAnswered: false,
                },
              ])
            )
          }
          return res(ctx.status(200), ctx.json([]))
        })
      )

      renderWithProviders(<Prayers />)

      // 輸入搜尋關鍵字
      const searchInput = screen.getByPlaceholderText(/搜尋代禱/i)
      fireEvent.change(searchInput, { target: { value: '測試' } })

      // 等待搜尋結果
      await waitFor(() => {
        expect(screen.getByText('包含測試關鍵字的代禱')).toBeInTheDocument()
      })
    })

    it('應該成功篩選已回應的代禱', async () => {
      // Mock 篩選結果
      server.use(
        rest.get('/api/prayers', (req, res, ctx) => {
          const filter = req.url.searchParams.get('filter')
          if (filter === 'answered') {
            return res(
              ctx.status(200),
              ctx.json([
                {
                  id: 'prayer-2',
                  content: '已回應的代禱',
                  userId: 'user-2',
                  userName: 'User 2',
                  timestamp: new Date().toISOString(),
                  likes: 0,
                  responses: [],
                  isAnswered: true,
                },
              ])
            )
          }
          return res(ctx.status(200), ctx.json([]))
        })
      )

      renderWithProviders(<Prayers />)

      // 選擇篩選選項
      const filterSelect = screen.getByLabelText(/篩選/i)
      fireEvent.change(filterSelect, { target: { value: 'answered' } })

      // 等待篩選結果
      await waitFor(() => {
        expect(screen.getByText('已回應的代禱')).toBeInTheDocument()
      })
    })
  })

  describe('代禱管理', () => {
    it('應該成功刪除自己的代禱', async () => {
      // Mock 刪除成功
      server.use(
        rest.delete('/api/prayers/:id', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              message: '代禱刪除成功',
            })
          )
        })
      )

      renderWithProviders(<Prayers />)

      // 等待代禱列表載入
      await waitFor(() => {
        expect(screen.getByText('第一個測試代禱')).toBeInTheDocument()
      })

      // 點擊刪除按鈕
      const deleteButtons = screen.getAllByRole('button', { name: /刪除/i })
      fireEvent.click(deleteButtons[0])

      // 確認刪除
      const confirmButton = screen.getByRole('button', { name: /確認刪除/i })
      fireEvent.click(confirmButton)

      // 驗證刪除成功
      await waitFor(() => {
        expect(screen.getByText(/代禱刪除成功/i)).toBeInTheDocument()
      })
    })

    it('應該成功編輯自己的代禱', async () => {
      // Mock 編輯成功
      server.use(
        rest.put('/api/prayers/:id', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              id: 'prayer-1',
              content: '已編輯的代禱內容',
              userId: 'user-1',
              userName: 'User 1',
              timestamp: new Date().toISOString(),
              likes: 0,
              responses: [],
              isAnswered: false,
            })
          )
        })
      )

      renderWithProviders(<Prayers />)

      // 等待代禱列表載入
      await waitFor(() => {
        expect(screen.getByText('第一個測試代禱')).toBeInTheDocument()
      })

      // 點擊編輯按鈕
      const editButtons = screen.getAllByRole('button', { name: /編輯/i })
      fireEvent.click(editButtons[0])

      // 編輯內容
      const editTextarea = screen.getByLabelText(/代禱內容/i)
      fireEvent.change(editTextarea, { 
        target: { value: '已編輯的代禱內容' } 
      })

      // 保存編輯
      const saveButton = screen.getByRole('button', { name: /保存/i })
      fireEvent.click(saveButton)

      // 驗證編輯成功
      await waitFor(() => {
        expect(screen.getByText(/代禱更新成功/i)).toBeInTheDocument()
      })
    })
  })

  describe('離線功能', () => {
    it('應該在離線時緩存代禱', async () => {
      // Mock 離線狀態
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })

      renderWithProviders(<Prayers />)

      // 驗證離線提示
      await waitFor(() => {
        expect(screen.getByText(/您目前處於離線狀態/i)).toBeInTheDocument()
      })

      // 恢復線上狀態
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      })
    })
  })
}) 