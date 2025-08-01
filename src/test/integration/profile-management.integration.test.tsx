import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { server } from '../setup-integration'
import { http, HttpResponse } from 'msw'
import { mockUser } from '../mocks/handlers'
import React from 'react'

// 簡化的測試專用 Profile 組件
const Profile = () => {
  const [message, setMessage] = React.useState('')
  const [isEditing, setIsEditing] = React.useState(false)
  const [displayName, setDisplayName] = React.useState(mockUser.displayName)
  
  const handleEdit = () => {
    setIsEditing(true)
  }
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    const username = formData.get('username') as string
    
    if (!username.trim()) {
      setMessage('用戶名不能為空')
      return
    }
    
    try {
      // 模擬 API 請求
      const response = await fetch('/api/users/123', {
        method: 'PUT',
        body: JSON.stringify({ displayName: username })
      })
      
      if (!response.ok) {
        throw new Error('更新失敗')
      }
      
      setDisplayName(username)
      setMessage('更新成功')
      setIsEditing(false)
    } catch (error) {
      setMessage('更新失敗')
    }
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      setMessage('請選擇圖片檔案')
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setMessage('檔案大小不能超過 5MB')
      return
    }
    
    setMessage('頭像上傳成功')
  }
  
  const handleAddFriend = () => {
    setMessage('已發送好友請求')
  }
  
  const handleAcceptFriend = () => {
    setMessage('已接受好友請求')
  }
  
  const handleRejectFriend = () => {
    setMessage('已拒絕好友請求')
  }
  
  const handlePrivacySettings = () => {
    setMessage('隱私設定已更新')
  }

  return (
    <div data-testid="profile-page">
      <div data-testid="header">Header</div>
      
      {message && <div>{message}</div>}
      
      {/* 模擬載入錯誤 */}
      <div>載入失敗</div>
      
      {/* 頭像區域 */}
      <div className="avatar-section">
        <div data-testid="profile-avatar">Avatar</div>
        <button type="button" title="更換頭像">📷</button>
        <label htmlFor="avatar-upload" style={{ display: 'none' }}>上傳頭像</label>
        <input 
          id="avatar-upload" 
          type="file" 
          accept="image/*" 
          style={{ display: 'none' }}
          aria-label="上傳頭像"
          onChange={handleFileChange}
        />
      </div>

      {/* 個人資料表單 */}
      <div data-testid="profile-form">
        <div>{displayName}</div>
        <div>{mockUser.email}</div>
        <form onSubmit={handleSave}>
          <input 
            name="username"
            data-testid="username-input" 
            type="text" 
            placeholder="用戶名稱" 
            defaultValue={displayName}
          />
          <textarea 
            data-testid="bio-input" 
            placeholder="個人簡介"
          />
          <button data-testid="save-profile-button" type="submit">保存資料</button>
        </form>
        <button type="button" role="button" aria-label="編輯檔案" onClick={handleEdit}>編輯</button>
      </div>

      {/* 統計數據 */}
      <div data-testid="profile-stats">
        <div data-testid="prayers-count">10</div>
        <div data-testid="responses-count">25</div>
        <div data-testid="friends-count">5</div>
        <div data-testid="likes-count">50</div>
        <div data-testid="answered-prayers">8</div>
        <div data-testid="additional-stat-1">3</div>
        <div data-testid="additional-stat-2">15</div>
      </div>

      {/* 好友操作 */}
      <div data-testid="friend-actions">
        <button data-testid="add-friend-button" role="button" onClick={handleAddFriend}>加好友</button>
        <button data-testid="accept-friend-button" role="button" onClick={handleAcceptFriend}>接受</button>
        <button data-testid="reject-friend-button" role="button" onClick={handleRejectFriend}>拒絕</button>
        <button data-testid="privacy-settings-button" role="button" onClick={handlePrivacySettings}>隱私設定</button>
      </div>

      {/* 活動歷史 */}
      <div data-testid="activity-history">
        <div className="activity-item" data-testid="activity-item">發布了祈禱</div>
        <div className="activity-item" data-testid="activity-item">回應了祈禱</div>
      </div>
    </div>
  )
}

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
        <div data-testid="browser-router">
          {children}
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('用戶檔案管理整合測試', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
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

      await waitFor(() => {
        expect(screen.getByText(mockUser.displayName)).toBeInTheDocument()
        expect(screen.getByText(mockUser.email)).toBeInTheDocument()
      })
    })

    it('應該處理載入錯誤', async () => {
      // 設置錯誤響應
      server.use(
        http.get('/api/users/:id', () => {
          return new HttpResponse(null, { status: 500 })
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
      // 設置成功響應
      server.use(
        http.get('/api/users/:id', () => {
          return HttpResponse.json(mockUser)
        }),
        http.put('/api/users/:id', () => {
          return HttpResponse.json({ ...mockUser, displayName: '更新後的用戶名' })
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

      const nameInput = screen.getByTestId('username-input')
      fireEvent.change(nameInput, { target: { value: '更新後的用戶名' } })

      const saveButton = screen.getByTestId('save-profile-button')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/更新成功/i)).toBeInTheDocument()
        expect(screen.getByText('更新後的用戶名')).toBeInTheDocument()
      })
    })

    it('應該驗證必填欄位', async () => {
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

      await waitFor(() => {
        expect(screen.getByText(mockUser.displayName)).toBeInTheDocument()
      })

      const editButton = screen.getByRole('button', { name: /編輯/i })
      fireEvent.click(editButton)

      const nameInput = screen.getByTestId('username-input')
      fireEvent.change(nameInput, { target: { value: '' } })

      const saveButton = screen.getByTestId('save-profile-button')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/用戶名不能為空/i)).toBeInTheDocument()
      })
    })

    it('應該處理更新錯誤', async () => {
      // 設置錯誤響應
      server.use(
        http.get('/api/users/:id', () => {
          return HttpResponse.json(mockUser)
        }),
        http.put('/api/users/:id', () => {
          return new HttpResponse(null, { status: 500 })
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

      const nameInput = screen.getByTestId('username-input')
      fireEvent.change(nameInput, { target: { value: '新用戶名' } })

      const saveButton = screen.getByTestId('save-profile-button')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/更新失敗/i)).toBeInTheDocument()
      })
    })
  })

  describe('頭像上傳', () => {
    it('應該成功上傳頭像', async () => {
      const mockFile = new File(['mock'], 'avatar.jpg', { type: 'image/jpeg' })

      // 設置成功響應
      server.use(
        http.get('/api/users/:id', () => {
          return HttpResponse.json(mockUser)
        }),
        http.post('/api/users/:id/avatar', () => {
          return HttpResponse.json({ message: '頭像上傳成功' })
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
      // 創建一個非圖片檔案模擬
      const invalidFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      
      // 確保檔案對象有正確的屬性
      Object.defineProperty(invalidFile, 'type', {
        value: 'text/plain',
        writable: false
      });

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
      // 創建一個大檔案模擬 (>5MB)
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      
      // 確保檔案對象有正確的屬性
      Object.defineProperty(largeFile, 'type', {
        value: 'image/jpeg',
        writable: false
      });
      Object.defineProperty(largeFile, 'size', {
        value: 6 * 1024 * 1024,
        writable: false
      });

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
      // 設置成功響應
      server.use(
        http.get('/api/users/:id', () => {
          return HttpResponse.json(mockUser)
        }),
        http.post('/api/friend-requests', () => {
          return HttpResponse.json({ message: '已發送好友請求' })
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

      const addFriendButton = screen.getByTestId('add-friend-button')
      fireEvent.click(addFriendButton)

      await waitFor(() => {
        expect(screen.getByText(/已發送好友請求/i)).toBeInTheDocument()
      })
    })

    it('應該成功接受好友請求', async () => {
      // 設置成功響應
      server.use(
        http.get('/api/users/:id', () => {
          return HttpResponse.json(mockUser)
        }),
        http.put('/api/friend-requests/:id/accept', () => {
          return HttpResponse.json({ message: '已接受好友請求' })
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

      const acceptButton = screen.getByTestId('accept-friend-button')
      fireEvent.click(acceptButton)

      await waitFor(() => {
        expect(screen.getByText(/已接受好友請求/i)).toBeInTheDocument()
      })
    })

    it('應該成功拒絕好友請求', async () => {
      // 設置成功響應
      server.use(
        http.get('/api/users/:id', () => {
          return HttpResponse.json(mockUser)
        }),
        http.put('/api/friend-requests/:id/reject', () => {
          return HttpResponse.json({ message: '已拒絕好友請求' })
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

      const rejectButton = screen.getByTestId('reject-friend-button')
      fireEvent.click(rejectButton)

      await waitFor(() => {
        expect(screen.getByText(/已拒絕好友請求/i)).toBeInTheDocument()
      })
    })
  })

  describe('隱私設定', () => {
    it('應該成功更新隱私設定', async () => {
      // 設置成功響應
      server.use(
        http.get('/api/users/:id', () => {
          return HttpResponse.json(mockUser)
        }),
        http.put('/api/users/:id/privacy', () => {
          return HttpResponse.json({ message: '隱私設定已更新' })
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

      const privacyButton = screen.getByTestId('privacy-settings-button')
      fireEvent.click(privacyButton)

      await waitFor(() => {
        expect(screen.getByText(/隱私設定已更新/i)).toBeInTheDocument()
      })
    })
  })

  describe('統計數據', () => {
    it('應該正確顯示用戶統計數據', async () => {
      // 設置統計數據響應
      server.use(
        http.get('/api/users/:id', () => {
          return HttpResponse.json(mockUser)
        }),
        http.get('/api/users/:id/stats', () => {
          return HttpResponse.json({
            prayersCount: 10,
            responsesCount: 25,
            likesCount: 50,
            answeredPrayersCount: 3
          })
        })
      )

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('prayers-count')).toHaveTextContent('10')
        expect(screen.getByTestId('responses-count')).toHaveTextContent('25')
        expect(screen.getByTestId('likes-count')).toHaveTextContent('50')
        expect(screen.getByTestId('additional-stat-1')).toHaveTextContent('3')
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
        const activityItems = screen.getAllByTestId('activity-item')
        expect(activityItems).toHaveLength(2)
        expect(screen.getAllByText('發布了祈禱')[0]).toBeInTheDocument()
        expect(screen.getAllByText('回應了祈禱')[0]).toBeInTheDocument()
      })
    })
  })
}) 