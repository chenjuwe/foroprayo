# Prayforo API 快速入門指南

## 🚀 快速開始

這是 Prayforo 代禱應用 API 的快速入門指南，幫助您快速上手使用核心功能。

## 📋 前置要求

- Node.js 18+
- React 18+
- TypeScript
- Supabase 帳戶

## 🔧 基本設置

### 1. 安裝依賴

```bash
npm install @supabase/supabase-js @tanstack/react-query
```

### 2. 配置 Supabase

```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### 3. 導入服務

```typescript
import { prayerService, prayerResponseService, authService } from '@/services'
```

## 🙏 核心功能示例

### 認證

```typescript
// 獲取當前用戶
const user = await authService.getCurrentUser()

// 登出
await authService.signOut()

// 監聽認證狀態
const { data: subscription } = authService.onAuthStateChange((event, session) => {
  console.log('認證狀態變化:', event, session)
})
```

### 代禱操作

```typescript
// 📝 創建代禱
const newPrayer = await prayerService.createPrayer({
  content: "請為我的考試代禱",
  is_anonymous: false,
  user_name: "小明",
  user_id: user?.id
})

// 📖 獲取所有代禱
const prayers = await prayerService.getAllPrayers()

// 🔍 獲取特定代禱
const prayer = await prayerService.getPrayerById('prayer-id')

// ✏️ 更新代禱
const updatedPrayer = await prayerService.updatePrayer('prayer-id', '更新的內容')

// 🗑️ 刪除代禱  
await prayerService.deletePrayer('prayer-id')
```

### 代禱回應

```typescript
// 💬 創建回應
const response = await prayerResponseService.createResponse({
  prayer_id: 'prayer-id',
  content: '我會為你代禱的！',
  is_anonymous: false,
  user_name: '小華',
  user_id: user?.id
})

// 📚 獲取代禱的所有回應
const responses = await prayerResponseService.getResponsesByPrayerId('prayer-id')

// ✏️ 更新回應
await prayerResponseService.updateResponse('response-id', '更新的回應')

// 🗑️ 刪除回應
await prayerResponseService.deleteResponse('response-id')
```

## ❤️ 社交功能

### React Hooks 方式

```typescript
import { 
  useTogglePrayerLike, 
  useTogglePrayerBookmark,
  useSendFriendRequest,
  useToggleFollow 
} from '@/hooks/useSocialFeatures'

function SocialButtons({ prayerId, targetUserId }) {
  const toggleLike = useTogglePrayerLike()
  const toggleBookmark = useTogglePrayerBookmark()
  const sendFriendRequest = useSendFriendRequest()
  const toggleFollow = useToggleFollow()

  return (
    <div>
      {/* 愛心 */}
      <button onClick={() => toggleLike.mutate({ prayerId, isLiked: false })}>
        ❤️ 愛心
      </button>
      
      {/* 收藏 */}
      <button onClick={() => toggleBookmark.mutate({ prayerId, isBookmarked: false })}>
        🔖 收藏
      </button>
      
      {/* 加好友 */}
      <button onClick={() => sendFriendRequest.mutate({ receiverId: targetUserId })}>
        👥 加好友
      </button>
      
      {/* 追蹤 */}
      <button onClick={() => toggleFollow.mutate({ followingId: targetUserId, isFollowing: false })}>
        👁️ 追蹤
      </button>
    </div>
  )
}
```

## 🔍 查詢數據

### 獲取社交數據

```typescript
import { usePrayerLikes, useFriendRequests, useFollows } from '@/hooks/useSocialFeatures'

function SocialData({ prayerId, userId }) {
  // 獲取代禱愛心數據
  const { data: likes } = usePrayerLikes(prayerId)
  
  // 獲取好友請求
  const { data: friendRequests } = useFriendRequests()
  
  // 獲取追蹤列表
  const { data: follows } = useFollows(userId)

  return (
    <div>
      <p>愛心數: {likes?.length || 0}</p>
      <p>好友請求: {friendRequests?.length || 0}</p>
      <p>追蹤數: {follows?.length || 0}</p>
    </div>
  )
}
```

## 🚨 錯誤處理

```typescript
import { ERROR_MESSAGES } from '@/constants'

async function createPrayerWithErrorHandling(content: string) {
  try {
    const prayer = await prayerService.createPrayer({
      content,
      is_anonymous: false,
      user_name: "用戶名",
      user_id: user?.id
    })
    
    console.log('✅ 代禱創建成功:', prayer)
    return prayer
    
  } catch (error) {
    console.error('❌ 代禱創建失敗:', error.message)
    
    // 根據錯誤類型處理
    if (error.message === ERROR_MESSAGES.AUTH_ERROR) {
      // 跳轉到登入頁面
      window.location.href = '/auth'
    } else if (error.message === ERROR_MESSAGES.NETWORK_ERROR) {
      // 顯示網路錯誤提示
      alert('網路連線失敗，請檢查網路狀態')
    } else {
      // 通用錯誤處理
      alert(error.message || ERROR_MESSAGES.UNKNOWN_ERROR)
    }
    
    throw error
  }
}
```

## 📱 完整組件範例

```typescript
import React, { useState } from 'react'
import { prayerService } from '@/services'
import { useTogglePrayerLike } from '@/hooks/useSocialFeatures'

function PrayerCard({ prayer, user }) {
  const [isLoading, setIsLoading] = useState(false)
  const toggleLike = useTogglePrayerLike()

  const handleLike = async () => {
    if (!user) {
      alert('請先登入')
      return
    }

    try {
      await toggleLike.mutateAsync({ 
        prayerId: prayer.id, 
        isLiked: false 
      })
    } catch (error) {
      console.error('愛心操作失敗:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm('確定要刪除這個代禱嗎？')) return

    setIsLoading(true)
    try {
      await prayerService.deletePrayer(prayer.id)
      alert('代禱已刪除')
      // 重新整理或更新狀態
    } catch (error) {
      alert('刪除失敗: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="prayer-card">
      <div className="prayer-content">
        <h3>{prayer.user_name}</h3>
        <p>{prayer.content}</p>
        <small>{new Date(prayer.created_at).toLocaleString()}</small>
      </div>
      
      <div className="prayer-actions">
        <button onClick={handleLike} disabled={toggleLike.isPending}>
          {toggleLike.isPending ? '⏳' : '❤️'} 愛心
        </button>
        
        {prayer.user_id === user?.id && (
          <button onClick={handleDelete} disabled={isLoading}>
            {isLoading ? '刪除中...' : '🗑️ 刪除'}
          </button>
        )}
      </div>
    </div>
  )
}
```

## 🔧 配置選項

### 驗證限制

```typescript
import { VALIDATION_CONFIG } from '@/constants'

// 代禱內容限制: 1-1000 字
const maxPrayerLength = VALIDATION_CONFIG.PRAYER_CONTENT.MAX_LENGTH // 1000

// 回應內容限制: 1-500 字  
const maxResponseLength = VALIDATION_CONFIG.RESPONSE_CONTENT.MAX_LENGTH // 500

// 用戶名限制: 2-20 字
const maxUsernameLength = VALIDATION_CONFIG.USERNAME.MAX_LENGTH // 20
```

### API 配置

```typescript
import { API_CONFIG } from '@/constants'

// API 超時: 30 秒
const timeout = API_CONFIG.TIMEOUT // 30000

// 重試次數: 3 次
const retryAttempts = API_CONFIG.RETRY_ATTEMPTS // 3
```

## 📚 更多資源

- [完整 API 文檔](./API_DOCUMENTATION.md) - 詳細的 API 參考文檔
- [數據庫架構](./supabase/migrations/) - Supabase 數據表結構
- [組件庫](./src/components/) - 可重用的 UI 組件
- [測試範例](./src/services/prayerService.test.ts) - API 測試示例

## 💡 最佳實踐

1. **認證檢查**: 執行需要權限的操作前，先檢查用戶登入狀態
2. **錯誤處理**: 使用 try-catch 包裝所有 API 調用
3. **載入狀態**: 為異步操作提供載入指示器
4. **權限控制**: 確保用戶只能操作自己的數據
5. **數據驗證**: 提交前驗證輸入數據格式和長度

## 🆘 支援

如有問題或需要幫助，請：
- 查看 [完整 API 文檔](./API_DOCUMENTATION.md)
- 檢查 [測試文件](./src/services/) 獲取更多使用範例
- 在 GitHub 上提交 Issue 