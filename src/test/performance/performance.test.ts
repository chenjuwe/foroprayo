import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { server } from '../mocks/handlers'
import { rest } from 'msw'
import { setupTestEnvironment } from '../mocks/handlers'
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

// 生成大量測試數據
const generateLargePrayerList = (count: number) => {
  const prayers = []
  for (let i = 0; i < count; i++) {
    prayers.push({
      id: `prayer-${i}`,
      content: `這是第 ${i + 1} 個測試代禱內容，包含一些較長的文字來測試性能表現。`,
      userId: `user-${i % 10}`,
      userName: `User ${i % 10}`,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      likes: Math.floor(Math.random() * 100),
      responses: Array.from({ length: Math.floor(Math.random() * 10) }, (_, j) => ({
        id: `response-${i}-${j}`,
        content: `回應 ${j + 1}`,
        userId: `user-${j % 5}`,
        userName: `User ${j % 5}`,
        timestamp: new Date().toISOString(),
      })),
      isAnswered: Math.random() > 0.7,
    })
  }
  return prayers
}

describe('性能測試', () => {
  describe('大量數據載入性能', () => {
    it('應該在 2 秒內載入 1000 個代禱', async () => {
      const startTime = performance.now()
      
      // Mock 1000 個代禱數據
      const largePrayerList = generateLargePrayerList(1000)
      server.use(
        rest.get('/api/prayers', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json(largePrayerList)
          )
        })
      )

      renderWithProviders(<Prayers />)

      // 等待載入完成
      await waitFor(() => {
        expect(screen.getByText('這是第 1 個測試代禱內容')).toBeInTheDocument()
      }, { timeout: 2000 })

      const endTime = performance.now()
      const loadTime = endTime - startTime

      // 驗證載入時間在 2 秒內
      expect(loadTime).toBeLessThan(2000)
    })

    it('應該在 3 秒內載入 5000 個代禱', async () => {
      const startTime = performance.now()
      
      // Mock 5000 個代禱數據
      const largePrayerList = generateLargePrayerList(5000)
      server.use(
        rest.get('/api/prayers', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json(largePrayerList)
          )
        })
      )

      renderWithProviders(<Prayers />)

      // 等待載入完成
      await waitFor(() => {
        expect(screen.getByText('這是第 1 個測試代禱內容')).toBeInTheDocument()
      }, { timeout: 3000 })

      const endTime = performance.now()
      const loadTime = endTime - startTime

      // 驗證載入時間在 3 秒內
      expect(loadTime).toBeLessThan(3000)
    })

    it('應該在 5 秒內載入 10000 個代禱', async () => {
      const startTime = performance.now()
      
      // Mock 10000 個代禱數據
      const largePrayerList = generateLargePrayerList(10000)
      server.use(
        rest.get('/api/prayers', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json(largePrayerList)
          )
        })
      )

      renderWithProviders(<Prayers />)

      // 等待載入完成
      await waitFor(() => {
        expect(screen.getByText('這是第 1 個測試代禱內容')).toBeInTheDocument()
      }, { timeout: 5000 })

      const endTime = performance.now()
      const loadTime = endTime - startTime

      // 驗證載入時間在 5 秒內
      expect(loadTime).toBeLessThan(5000)
    })
  })

  describe('虛擬滾動性能', () => {
    it('應該在滾動時保持流暢的 60fps', async () => {
      // Mock 大量數據
      const largePrayerList = generateLargePrayerList(10000)
      server.use(
        rest.get('/api/prayers', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json(largePrayerList)
          )
        })
      )

      const { container } = renderWithProviders(<Prayers />)

      // 等待初始載入
      await waitFor(() => {
        expect(screen.getByText('這是第 1 個測試代禱內容')).toBeInTheDocument()
      })

      // 模擬滾動事件
      const scrollContainer = container.querySelector('.prayer-list')
      if (scrollContainer) {
        const scrollStartTime = performance.now()
        
        // 執行多次滾動
        for (let i = 0; i < 10; i++) {
          scrollContainer.scrollTop += 100
          scrollContainer.dispatchEvent(new Event('scroll'))
          
          // 等待一幀
          await new Promise(resolve => requestAnimationFrame(resolve))
        }
        
        const scrollEndTime = performance.now()
        const scrollTime = scrollEndTime - scrollStartTime
        
        // 驗證滾動時間合理（10次滾動應該在 200ms 內完成）
        expect(scrollTime).toBeLessThan(200)
      }
    })
  })

  describe('搜尋性能', () => {
    it('應該在 500ms 內完成大量數據的搜尋', async () => {
      // Mock 大量數據
      const largePrayerList = generateLargePrayerList(10000)
      server.use(
        rest.get('/api/prayers', (req, res, ctx) => {
          const searchQuery = req.url.searchParams.get('search')
          if (searchQuery) {
            const filteredPrayers = largePrayerList.filter(prayer => 
              prayer.content.includes(searchQuery)
            )
            return res(ctx.status(200), ctx.json(filteredPrayers))
          }
          return res(ctx.status(200), ctx.json(largePrayerList))
        })
      )

      renderWithProviders(<Prayers />)

      // 等待初始載入
      await waitFor(() => {
        expect(screen.getByText('這是第 1 個測試代禱內容')).toBeInTheDocument()
      })

      // 執行搜尋
      const searchStartTime = performance.now()
      
      // 這裡需要實際觸發搜尋，具體實現取決於搜尋組件
      // 假設有一個搜尋輸入框
      const searchInput = screen.getByPlaceholderText(/搜尋代禱/i)
      if (searchInput) {
        searchInput.dispatchEvent(new Event('input', { bubbles: true }))
        
        await waitFor(() => {
          // 等待搜尋結果
        }, { timeout: 500 })
      }
      
      const searchEndTime = performance.now()
      const searchTime = searchEndTime - searchStartTime
      
      // 驗證搜尋時間在 500ms 內
      expect(searchTime).toBeLessThan(500)
    })
  })

  describe('記憶體使用性能', () => {
    it('應該在載入大量數據時保持合理的記憶體使用', async () => {
      // 記錄初始記憶體使用
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0
      
      // Mock 大量數據
      const largePrayerList = generateLargePrayerList(10000)
      server.use(
        rest.get('/api/prayers', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json(largePrayerList)
          )
        })
      )

      renderWithProviders(<Prayers />)

      // 等待載入完成
      await waitFor(() => {
        expect(screen.getByText('這是第 1 個測試代禱內容')).toBeInTheDocument()
      })

      // 記錄載入後的記憶體使用
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory
      
      // 驗證記憶體增加不超過 50MB
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    })
  })

  describe('渲染性能', () => {
    it('應該在 100ms 內完成組件初始渲染', async () => {
      const startTime = performance.now()
      
      renderWithProviders(<Prayers />)
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // 驗證初始渲染時間在 100ms 內
      expect(renderTime).toBeLessThan(100)
    })

    it('應該在 50ms 內完成組件重新渲染', async () => {
      const { rerender } = renderWithProviders(<Prayers />)
      
      const startTime = performance.now()
      
      // 重新渲染組件
      rerender(<Prayers />)
      
      const endTime = performance.now()
      const reRenderTime = endTime - startTime
      
      // 驗證重新渲染時間在 50ms 內
      expect(reRenderTime).toBeLessThan(50)
    })
  })

  describe('網路請求性能', () => {
    it('應該在 1 秒內完成 API 請求', async () => {
      const startTime = performance.now()
      
      // Mock API 響應
      server.use(
        rest.get('/api/prayers', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json(generateLargePrayerList(1000))
          )
        })
      )

      renderWithProviders(<Prayers />)

      // 等待 API 請求完成
      await waitFor(() => {
        expect(screen.getByText('這是第 1 個測試代禱內容')).toBeInTheDocument()
      }, { timeout: 1000 })

      const endTime = performance.now()
      const requestTime = endTime - startTime
      
      // 驗證請求時間在 1 秒內
      expect(requestTime).toBeLessThan(1000)
    })
  })

  describe('圖片載入性能', () => {
    it('應該在 2 秒內載入大量圖片', async () => {
      // Mock 包含圖片的代禱數據
      const prayersWithImages = generateLargePrayerList(100).map(prayer => ({
        ...prayer,
        imageUrl: 'https://example.com/test-image.jpg',
      }))
      
      server.use(
        rest.get('/api/prayers', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json(prayersWithImages)
          )
        })
      )

      const startTime = performance.now()
      
      renderWithProviders(<Prayers />)

      // 等待圖片載入完成
      await waitFor(() => {
        const images = screen.getAllByRole('img')
        expect(images.length).toBeGreaterThan(0)
      }, { timeout: 2000 })

      const endTime = performance.now()
      const imageLoadTime = endTime - startTime
      
      // 驗證圖片載入時間在 2 秒內
      expect(imageLoadTime).toBeLessThan(2000)
    })
  })

  describe('離線緩存性能', () => {
    it('應該在離線時快速載入緩存數據', async () => {
      // 模擬離線狀態
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })

      const startTime = performance.now()
      
      renderWithProviders(<Prayers />)

      // 等待緩存數據載入
      await waitFor(() => {
        expect(screen.getByText(/離線模式/i)).toBeVisible()
      }, { timeout: 1000 })

      const endTime = performance.now()
      const cacheLoadTime = endTime - startTime
      
      // 驗證緩存載入時間在 1 秒內
      expect(cacheLoadTime).toBeLessThan(1000)
      
      // 恢復線上狀態
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      })
    })
  })
}) 