import { beforeAll, afterEach, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// 簡化的 mock 數據
export const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/avatar.jpg',
  emailVerified: true,
}

export const mockPrayer = {
  id: 'prayer-1',
  content: 'Test prayer content',
  userId: 'test-user-id',
  userName: 'Test User',
  timestamp: new Date(),
  likes: 0,
  responses: [],
  isAnswered: false,
}

// 簡化的 handlers
export const handlers = [
  // Auth endpoints
  http.post('/api/auth/signin', () => {
    return HttpResponse.json({
      user: mockUser,
      token: 'mock-jwt-token',
    }, { status: 200 })
  }),

  http.post('/api/auth/signup', () => {
    return HttpResponse.json({
      user: mockUser,
      token: 'mock-jwt-token',
    }, { status: 201 })
  }),

  // Prayer endpoints
  http.get('/api/prayers', () => {
    return HttpResponse.json([mockPrayer])
  }),

  http.post('/api/prayers', () => {
    return HttpResponse.json(mockPrayer, { status: 201 })
  }),

  // User endpoints
  http.get('/api/users/:id', () => {
    return HttpResponse.json(mockUser)
  }),

  // Upload endpoint
  http.post('/api/upload', () => {
    return HttpResponse.json({
      url: 'https://example.com/uploaded-image.jpg',
    }, { status: 200 })
  }),
]

// 設置 MSW 伺服器
const server = setupServer(...handlers)

// 在所有測試開始前啟動 MSW 伺服器
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// 每個測試後重置處理器
afterEach(() => server.resetHandlers())

// 所有測試結束後關閉 MSW 伺服器
afterAll(() => server.close())

// 導出 server 以便在測試中使用
export { server } 