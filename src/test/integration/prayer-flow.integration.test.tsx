import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { server } from '../setup-integration'
import { http, HttpResponse } from 'msw'
import { mockPrayer, mockPrayerResponse, mockUser } from '../mocks/handlers'
import New from '../../pages/New'
import Prayers from '../../pages/Prayers'

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

describe('祈禱流程整合測試', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('祈禱發布流程', () => {
    it('應該成功發布祈禱', async () => {
      // 設置成功的發布響應
      server.use(
        http.post('/api/prayers', () => {
          return HttpResponse.json(mockPrayer, { status: 201 })
        })
      )

      render(
        <TestWrapper>
          <New />
        </TestWrapper>
      )

      // 找到發布表單元素
      const contentTextarea = screen.getByPlaceholderText(/分享你的代禱/i)
      const publishButton = screen.getByRole('button', { name: /送出/i })

      // 填寫祈禱內容
      fireEvent.change(contentTextarea, { 
        target: { value: '這是一個測試祈禱內容' } 
      })

      // 提交表單
      fireEvent.click(publishButton)

      // 等待成功響應
      await waitFor(() => {
        expect(screen.getByText(/祈禱發布成功/i)).toBeInTheDocument()
      })
    })

    it('應該驗證祈禱內容不能為空', async () => {
      render(
        <TestWrapper>
          <New />
        </TestWrapper>
      )

      const publishButton = screen.getByRole('button', { name: /送出/i })
      fireEvent.click(publishButton)

      await waitFor(() => {
        expect(screen.getByText(/請輸入祈禱內容/i)).toBeInTheDocument()
      })
    })

    it('應該處理發布錯誤', async () => {
      // 設置失敗的發布響應
      server.use(
        http.post('/api/prayers', () => {
          return HttpResponse.json(
            { error: '發布失敗' },
            { status: 500 }
          )
        })
      )

      render(
        <TestWrapper>
          <New />
        </TestWrapper>
      )

      const contentTextarea = screen.getByPlaceholderText(/分享你的代禱/i)
      const publishButton = screen.getByRole('button', { name: /送出/i })

      fireEvent.change(contentTextarea, { 
        target: { value: '測試內容' } 
      })
      fireEvent.click(publishButton)

      await waitFor(() => {
        expect(screen.getByText(/發布失敗/i)).toBeInTheDocument()
      })
    })
  })

  describe('祈禱列表顯示', () => {
    it('應該正確顯示祈禱列表', async () => {
      // 設置祈禱列表響應
      server.use(
        http.get('/api/prayers', () => {
          return HttpResponse.json([mockPrayer])
        })
      )

      render(
        <TestWrapper>
          <Prayers />
        </TestWrapper>
      )

      // 等待祈禱內容載入
      await waitFor(() => {
        expect(screen.getByText(mockPrayer.content)).toBeInTheDocument()
        expect(screen.getByText(mockPrayer.userName)).toBeInTheDocument()
      })
    })

    it('應該處理空祈禱列表', async () => {
      server.use(
        http.get('/api/prayers', () => {
          return HttpResponse.json([])
        })
      )

      render(
        <TestWrapper>
          <Prayers />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/目前沒有祈禱/i)).toBeInTheDocument()
      })
    })
  })

  describe('祈禱回應流程', () => {
    it('應該成功添加回應', async () => {
      // 設置回應響應
      server.use(
        http.post('/api/prayers/:id/responses', () => {
          return HttpResponse.json(mockPrayerResponse, { status: 201 })
        })
      )

      render(
        <TestWrapper>
          <Prayers />
        </TestWrapper>
      )

      // 等待祈禱載入
      await waitFor(() => {
        expect(screen.getByText(mockPrayer.content)).toBeInTheDocument()
      })

      // 找到回應按鈕和輸入框
      const responseButton = screen.getByRole('button', { name: /回應/i })
      fireEvent.click(responseButton)

      const responseInput = screen.getByPlaceholderText(/輸入回應.../i)
      const submitButton = screen.getByRole('button', { name: /提交回應/i })

      fireEvent.change(responseInput, { 
        target: { value: '這是一個測試回應' } 
      })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/回應發布成功/i)).toBeInTheDocument()
      })
    })

    it('應該驗證回應內容不能為空', async () => {
      render(
        <TestWrapper>
          <Prayers />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(mockPrayer.content)).toBeInTheDocument()
      })

      const responseButton = screen.getByRole('button', { name: /回應/i })
      fireEvent.click(responseButton)

      const submitButton = screen.getByRole('button', { name: /提交回應/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/請輸入回應內容/i)).toBeInTheDocument()
      })
    })
  })

  describe('祈禱互動功能', () => {
    it('應該成功點讚祈禱', async () => {
      // 設置點讚響應
      server.use(
        http.post('/api/prayers/:id/like', () => {
          return HttpResponse.json({ likes: 1 }, { status: 200 })
        })
      )

      render(
        <TestWrapper>
          <Prayers />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(mockPrayer.content)).toBeInTheDocument()
      })

      const likeButton = screen.getByRole('button', { name: /點讚/i })
      fireEvent.click(likeButton)

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument()
      })
    })

    it('應該標記祈禱為已回應', async () => {
      // 設置標記響應
      server.use(
        http.put('/api/prayers/:id/answered', () => {
          return HttpResponse.json({ isAnswered: true }, { status: 200 })
        })
      )

      render(
        <TestWrapper>
          <Prayers />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(mockPrayer.content)).toBeInTheDocument()
      })

      const answeredButton = screen.getByRole('button', { name: /標記為已回應/i })
      fireEvent.click(answeredButton)

      await waitFor(() => {
        expect(screen.getByText(/已回應/i)).toBeInTheDocument()
      })
    })
  })

  describe('祈禱搜尋和篩選', () => {
    it('應該根據關鍵字搜尋祈禱', async () => {
      const searchResults = [
        { ...mockPrayer, content: '包含關鍵字的祈禱' }
      ]

      server.use(
        http.get('/api/prayers', ({ request }) => {
          const url = new URL(request.url)
          const search = url.searchParams.get('search')
          
          if (search) {
            return HttpResponse.json(searchResults)
          }
          return HttpResponse.json([mockPrayer])
        })
      )

      render(
        <TestWrapper>
          <Prayers />
        </TestWrapper>
      )

      const searchInput = screen.getByPlaceholderText(/搜尋祈禱.../i)
      fireEvent.change(searchInput, { target: { value: '關鍵字' } })

      await waitFor(() => {
        expect(screen.getByText('包含關鍵字的祈禱')).toBeInTheDocument()
      })
    })

    it('應該篩選已回應的祈禱', async () => {
      const answeredPrayers = [
        { ...mockPrayer, isAnswered: true, content: '已回應的祈禱' }
      ]

      server.use(
        http.get('/api/prayers', ({ request }) => {
          const url = new URL(request.url)
          const answered = url.searchParams.get('answered')
          
          if (answered === 'true') {
            return HttpResponse.json(answeredPrayers)
          }
          return HttpResponse.json([mockPrayer])
        })
      )

      render(
        <TestWrapper>
          <Prayers />
        </TestWrapper>
      )

      const filterButton = screen.getByRole('button', { name: /已回應/i })
      fireEvent.click(filterButton)

      await waitFor(() => {
        expect(screen.getByText('已回應的祈禱')).toBeInTheDocument()
      })
    })
  })

  describe('祈禱分享功能', () => {
    it('應該成功分享祈禱', async () => {
      // Mock navigator.share
      Object.assign(navigator, {
        share: vi.fn().mockResolvedValue(undefined)
      })

      render(
        <TestWrapper>
          <Prayers />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(mockPrayer.content)).toBeInTheDocument()
      })

      const shareButton = screen.getByRole('button', { name: /分享/i })
      fireEvent.click(shareButton)

      await waitFor(() => {
        expect(navigator.share).toHaveBeenCalledWith({
          title: '祈禱分享',
          text: mockPrayer.content,
          url: expect.any(String)
        })
      })
    })
  })
}) 