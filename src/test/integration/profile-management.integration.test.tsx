import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { server } from '../setup-integration'
import { http, HttpResponse } from 'msw'
import { mockUser } from '../mocks/handlers'
import Profile from '../../pages/Profile'

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

describe('用戶檔案管理整合測試', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('檔案資訊顯示', () => {
    it('應該正確顯示用戶檔案資訊', async () => {
      // 設置用戶檔案響應
      server.use(
        http.get('/api/users/:id', () => {
          return HttpResponse.json(mockUser)
        })
      )

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      )

      // 等待檔案資訊載入
      await waitFor(() => {
        expect(screen.getByText(mockUser.displayName)).toBeInTheDocument()
        expect(screen.getByText(mockUser.email)).toBeInTheDocument()
      })
    })

    it('應該處理檔案載入錯誤', async () => {
      server.use(
        http.get('/api/users/:id', () => {
          return HttpResponse.json(
            { error: '用戶不存在' },
            { status: 404 }
          )
        })
      )

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/載入失敗/i)).toBeInTheDocument()
      })
    })
  })

  describe('檔案資訊更新', () => {
    it('應該成功更新用戶檔案', async () => {
      const updatedUser = { ...mockUser, displayName: '更新後的用戶名' }

      server.use(
        http.put('/api/users/:id', () => {
          return HttpResponse.json(updatedUser, { status: 200 })
        })
      )

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      )

      // 等待檔案載入
      await waitFor(() => {
        expect(screen.getByText(mockUser.displayName)).toBeInTheDocument()
      })

      // 找到編輯按鈕
      const editButton = screen.getByRole('button', { name: /編輯/i })
      fireEvent.click(editButton)

      // 更新用戶名
      const nameInput = screen.getByPlaceholderText(/用戶名/i)
      const saveButton = screen.getByRole('button', { name: /儲存/i })

      fireEvent.change(nameInput, { target: { value: '更新後的用戶名' } })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/更新成功/i)).toBeInTheDocument()
        expect(screen.getByText('更新後的用戶名')).toBeInTheDocument()
      })
    })

    it('應該驗證必填欄位', async () => {
      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(mockUser.displayName)).toBeInTheDocument()
      })

      const editButton = screen.getByRole('button', { name: /編輯/i })
      fireEvent.click(editButton)

      const nameInput = screen.getByPlaceholderText(/用戶名/i)
      const saveButton = screen.getByRole('button', { name: /儲存/i })

      // 清空用戶名
      fireEvent.change(nameInput, { target: { value: '' } })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/用戶名不能為空/i)).toBeInTheDocument()
      })
    })

    it('應該處理更新錯誤', async () => {
      server.use(
        http.put('/api/users/:id', () => {
          return HttpResponse.json(
            { error: '更新失敗' },
            { status: 500 }
          )
        })
      )

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(mockUser.displayName)).toBeInTheDocument()
      })

      const editButton = screen.getByRole('button', { name: /編輯/i })
      fireEvent.click(editButton)

      const nameInput = screen.getByPlaceholderText(/用戶名/i)
      const saveButton = screen.getByRole('button', { name: /儲存/i })

      fireEvent.change(nameInput, { target: { value: '新用戶名' } })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/更新失敗/i)).toBeInTheDocument()
      })
    })
  })

  describe('頭像上傳', () => {
    it('應該成功上傳頭像', async () => {
      // Mock File API
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
      
      server.use(
        http.post('/api/upload', () => {
          return HttpResponse.json({
            url: 'https://example.com/new-avatar.jpg'
          }, { status: 200 })
        })
      )

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(mockUser.displayName)).toBeInTheDocument()
      })

      const avatarInput = screen.getByLabelText(/上傳頭像/i)
      fireEvent.change(avatarInput, { target: { files: [mockFile] } })

      await waitFor(() => {
        expect(screen.getByText(/頭像上傳成功/i)).toBeInTheDocument()
      })
    })

    it('應該驗證檔案格式', async () => {
      const invalidFile = new File(['invalid'], 'invalid.txt', { type: 'text/plain' })

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(mockUser.displayName)).toBeInTheDocument()
      })

      const avatarInput = screen.getByLabelText(/上傳頭像/i)
      fireEvent.change(avatarInput, { target: { files: [invalidFile] } })

      await waitFor(() => {
        expect(screen.getByText(/請選擇圖片檔案/i)).toBeInTheDocument()
      })
    })

    it('應該驗證檔案大小', async () => {
      // 創建一個超過大小限制的檔案
      const largeFile = new File(['x'.repeat(5 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(mockUser.displayName)).toBeInTheDocument()
      })

      const avatarInput = screen.getByLabelText(/上傳頭像/i)
      fireEvent.change(avatarInput, { target: { files: [largeFile] } })

      await waitFor(() => {
        expect(screen.getByText(/檔案大小不能超過 5MB/i)).toBeInTheDocument()
      })
    })
  })

  describe('好友管理', () => {
    it('應該成功發送好友請求', async () => {
      server.use(
        http.post('/api/friends/request', () => {
          return HttpResponse.json({ message: '好友請求已發送' }, { status: 200 })
        })
      )

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(mockUser.displayName)).toBeInTheDocument()
      })

      const addFriendButton = screen.getByRole('button', { name: /添加好友/i })
      fireEvent.click(addFriendButton)

      await waitFor(() => {
        expect(screen.getByText(/好友請求已發送/i)).toBeInTheDocument()
      })
    })

    it('應該接受好友請求', async () => {
      server.use(
        http.put('/api/friends/accept/:id', () => {
          return HttpResponse.json({ message: '已接受好友請求' }, { status: 200 })
        })
      )

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(mockUser.displayName)).toBeInTheDocument()
      })

      const acceptButton = screen.getByRole('button', { name: /接受/i })
      fireEvent.click(acceptButton)

      await waitFor(() => {
        expect(screen.getByText(/已接受好友請求/i)).toBeInTheDocument()
      })
    })

    it('應該拒絕好友請求', async () => {
      server.use(
        http.put('/api/friends/reject/:id', () => {
          return HttpResponse.json({ message: '已拒絕好友請求' }, { status: 200 })
        })
      )

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(mockUser.displayName)).toBeInTheDocument()
      })

      const rejectButton = screen.getByRole('button', { name: /拒絕/i })
      fireEvent.click(rejectButton)

      await waitFor(() => {
        expect(screen.getByText(/已拒絕好友請求/i)).toBeInTheDocument()
      })
    })
  })

  describe('隱私設定', () => {
    it('應該更新隱私設定', async () => {
      server.use(
        http.put('/api/users/:id/privacy', () => {
          return HttpResponse.json({ 
            message: '隱私設定已更新',
            privacy: { profileVisible: false }
          }, { status: 200 })
        })
      )

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(mockUser.displayName)).toBeInTheDocument()
      })

      const privacyButton = screen.getByRole('button', { name: /隱私設定/i })
      fireEvent.click(privacyButton)

      const visibilityToggle = screen.getByRole('checkbox', { name: /檔案可見性/i })
      fireEvent.click(visibilityToggle)

      const saveButton = screen.getByRole('button', { name: /儲存設定/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/隱私設定已更新/i)).toBeInTheDocument()
      })
    })
  })

  describe('統計資訊', () => {
    it('應該顯示用戶統計資訊', async () => {
      const userStats = {
        totalPrayers: 10,
        totalResponses: 25,
        totalLikes: 50,
        answeredPrayers: 3
      }

      server.use(
        http.get('/api/users/:id/stats', () => {
          return HttpResponse.json(userStats)
        })
      )

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument() // 總祈禱數
        expect(screen.getByText('25')).toBeInTheDocument() // 總回應數
        expect(screen.getByText('50')).toBeInTheDocument() // 總點讚數
        expect(screen.getByText('3')).toBeInTheDocument()  // 已回應祈禱數
      })
    })
  })

  describe('活動歷史', () => {
    it('應該顯示用戶活動歷史', async () => {
      const activityHistory = [
        { id: 1, type: 'prayer', content: '發布了祈禱', timestamp: new Date() },
        { id: 2, type: 'response', content: '回應了祈禱', timestamp: new Date() }
      ]

      server.use(
        http.get('/api/users/:id/activity', () => {
          return HttpResponse.json(activityHistory)
        })
      )

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('發布了祈禱')).toBeInTheDocument()
        expect(screen.getByText('回應了祈禱')).toBeInTheDocument()
      })
    })
  })
}) 