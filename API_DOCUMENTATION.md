# Prayforo API 文檔 v0.3.6

## 概覽

Prayforo 是一個現代化的代禱應用，提供代禱發布、回應、社交互動等功能。本文檔詳細描述了應用中所有可用的 API 端點和使用方法。

## 目錄

- [認證](#認證)
- [代禱服務](#代禱服務) 
- [代禱回應服務](#代禱回應服務)
- [社交功能](#社交功能)
- [數據模型](#數據模型)
- [錯誤處理](#錯誤處理)
- [配置常數](#配置常數)

---

## 認證

### AuthService

認證服務處理用戶登入、登出和會話管理。

#### 獲取當前用戶

```typescript
await authService.getCurrentUser()
```

**回應:**
```typescript
User | null
```

**用途:** 獲取當前登入的用戶信息

---

#### 獲取當前會話

```typescript
await authService.getSession()
```

**回應:**
```typescript
Session | null
```

**用途:** 獲取當前用戶的認證會話

---

#### 監聽認證狀態變化

```typescript
authService.onAuthStateChange((event: string, session: Session | null) => {
  // 處理認證狀態變化
})
```

**參數:**
- `callback`: 認證狀態變化時的回調函數

**用途:** 監聽用戶登入/登出狀態變化

---

#### 登出

```typescript
await authService.signOut()
```

**用途:** 登出當前用戶

---

## 代禱服務

### PrayerService

代禱服務提供代禱的 CRUD 操作。

#### 獲取所有代禱

```typescript
await prayerService.getAllPrayers()
```

**回應:**
```typescript
Prayer[]
```

**用途:** 獲取所有代禱列表，按創建時間降序排列

---

#### 根據 ID 獲取代禱

```typescript
await prayerService.getPrayerById(id: string)
```

**參數:**
- `id`: 代禱的唯一識別碼

**回應:**
```typescript
Prayer | null
```

**用途:** 獲取特定代禱的詳細信息

---

#### 創建新代禱

```typescript
await prayerService.createPrayer(prayer: CreatePrayerRequest)
```

**參數:**
```typescript
interface CreatePrayerRequest {
  content: string;           // 代禱內容 (1-1000字)
  is_anonymous: boolean;     // 是否匿名發布
  user_name?: string | null; // 用戶名稱
  user_avatar?: string | null; // 用戶頭像 URL
  user_id?: string | null;   // 用戶 ID
}
```

**回應:**
```typescript
Prayer
```

**用途:** 創建新的代禱請求

---

#### 更新代禱內容

```typescript
await prayerService.updatePrayer(id: string, content: string)
```

**參數:**
- `id`: 代禱 ID
- `content`: 新的代禱內容

**回應:**
```typescript
Prayer
```

**權限:** 僅限代禱作者

**用途:** 更新現有代禱的內容

---

#### 刪除代禱

```typescript
await prayerService.deletePrayer(id: string)
```

**參數:**
- `id`: 代禱 ID

**權限:** 僅限代禱作者

**用途:** 刪除指定的代禱

---

#### 根據用戶 ID 獲取代禱

```typescript
await prayerService.getPrayersByUserId(userId: string)
```

**參數:**
- `userId`: 用戶 ID

**回應:**
```typescript
Prayer[]
```

**用途:** 獲取特定用戶發布的所有代禱

---

## 代禱回應服務

### PrayerResponseService

代禱回應服務處理對代禱的回應操作。

#### 獲取代禱回應列表

```typescript
await prayerResponseService.getResponsesByPrayerId(prayerId: string)
```

**參數:**
- `prayerId`: 代禱 ID

**回應:**
```typescript
PrayerResponse[]
```

**用途:** 獲取特定代禱的所有回應，按創建時間升序排列

---

#### 創建新回應

```typescript
await prayerResponseService.createResponse(response: CreateResponseRequest)
```

**參數:**
```typescript
interface CreateResponseRequest {
  prayer_id: string;         // 代禱 ID
  content: string;           // 回應內容 (1-500字)
  is_anonymous: boolean;     // 是否匿名回應
  user_name?: string | null; // 用戶名稱
  user_avatar?: string | null; // 用戶頭像 URL
  user_id?: string | null;   // 用戶 ID
}
```

**回應:**
```typescript
PrayerResponse
```

**特殊處理:** 匿名回應時，`user_name` 自動設為 "訪客"

**用途:** 對代禱發布回應

---

#### 更新回應內容

```typescript
await prayerResponseService.updateResponse(id: string, content: string)
```

**參數:**
- `id`: 回應 ID
- `content`: 新的回應內容

**回應:**
```typescript
PrayerResponse
```

**權限:** 僅限回應作者

**用途:** 更新現有回應的內容

---

#### 刪除回應

```typescript
await prayerResponseService.deleteResponse(id: string)
```

**參數:**
- `id`: 回應 ID

**權限:** 僅限回應作者

**用途:** 刪除指定的回應

---

## 社交功能

### 好友系統

#### 獲取好友請求列表

```typescript
const { data } = useFriendRequests()
```

**回應:** 當前用戶的所有好友請求（發送和接收）

---

#### 發送好友請求

```typescript
const sendRequest = useSendFriendRequest()
await sendRequest.mutateAsync({ receiverId: 'user-id' })
```

**參數:**
- `receiverId`: 接收者的用戶 ID

---

#### 回應好友請求

```typescript
const respond = useRespondToFriendRequest()
await respond.mutateAsync({ 
  requestId: 'request-id', 
  status: 'accepted' | 'rejected' 
})
```

**參數:**
- `requestId`: 好友請求 ID
- `status`: 'accepted' (接受) 或 'rejected' (拒絕)

---

### 追蹤系統

#### 獲取追蹤列表

```typescript
const { data } = useFollows(userId)
```

**參數:**
- `userId`: 用戶 ID (可選，默認當前用戶)

---

#### 切換追蹤狀態

```typescript
const toggleFollow = useToggleFollow()
await toggleFollow.mutateAsync({ 
  followingId: 'user-id', 
  isFollowing: false 
})
```

**參數:**
- `followingId`: 被追蹤用戶的 ID
- `isFollowing`: 當前是否已追蹤

---

### 愛心系統

#### 獲取代禱愛心列表

```typescript
const { data } = usePrayerLikes(prayerId)
```

**參數:**
- `prayerId`: 代禱 ID

---

#### 切換愛心狀態

```typescript
const toggleLike = useTogglePrayerLike()
await toggleLike.mutateAsync({ 
  prayerId: 'prayer-id', 
  isLiked: false 
})
```

**參數:**
- `prayerId`: 代禱 ID
- `isLiked`: 當前是否已點愛心

---

### 收藏系統

#### 切換收藏狀態

```typescript
const toggleBookmark = useTogglePrayerBookmark()
await toggleBookmark.mutateAsync({ 
  prayerId: 'prayer-id', 
  isBookmarked: false 
})
```

**參數:**
- `prayerId`: 代禱 ID
- `isBookmarked`: 當前是否已收藏

---

## 數據模型

### Prayer (代禱)

```typescript
interface Prayer {
  id: string;                    // 唯一識別碼
  content: string;               // 代禱內容
  is_anonymous: boolean;         // 是否匿名
  user_name?: string;           // 用戶名稱
  user_avatar?: string;         // 用戶頭像 URL
  user_id?: string;             // 用戶 ID
  created_at: string;           // 創建時間 (ISO 8601)
  updated_at: string;           // 更新時間 (ISO 8601)
  prayer_responses?: PrayerResponse[]; // 關聯的回應列表
}
```

---

### PrayerResponse (代禱回應)

```typescript
interface PrayerResponse {
  id: string;                    // 唯一識別碼
  prayer_id: string;            // 關聯的代禱 ID
  content: string;              // 回應內容
  is_anonymous: boolean;        // 是否匿名
  user_name?: string;          // 用戶名稱
  user_avatar?: string;        // 用戶頭像 URL
  user_id?: string;            // 用戶 ID
  created_at: string;          // 創建時間 (ISO 8601)
  updated_at: string;          // 更新時間 (ISO 8601)
}
```

---

### PrayerLike (代禱愛心)

```typescript
interface PrayerLike {
  id: string;                   // 唯一識別碼
  user_id: string;             // 用戶 ID
  prayer_id: string;           // 代禱 ID
  created_at: string;          // 創建時間 (ISO 8601)
}
```

---

## 錯誤處理

### 錯誤類型

所有 API 調用都會拋出包含以下錯誤信息的異常：

#### 認證錯誤
```typescript
ERROR_MESSAGES.AUTH_ERROR = "請先登入再進行此操作"
```

#### 權限錯誤
```typescript
ERROR_MESSAGES.PERMISSION_ERROR = "您沒有權限執行此操作"
```

#### 網路錯誤
```typescript
ERROR_MESSAGES.NETWORK_ERROR = "網路連線失敗，請檢查網路狀態"
```

#### 驗證錯誤
```typescript
ERROR_MESSAGES.VALIDATION_ERROR = "輸入資料格式不正確"
```

#### 操作特定錯誤
```typescript
ERROR_MESSAGES.PRAYER_CREATE_ERROR = "代禱發布失敗，請稍後再試"
ERROR_MESSAGES.PRAYER_UPDATE_ERROR = "代禱更新失敗，請稍後再試"
ERROR_MESSAGES.PRAYER_DELETE_ERROR = "代禱刪除失敗，請稍後再試"
ERROR_MESSAGES.RESPONSE_CREATE_ERROR = "回應發布失敗，請稍後再試"
ERROR_MESSAGES.RESPONSE_UPDATE_ERROR = "回應更新失敗，請稍後再試"
ERROR_MESSAGES.RESPONSE_DELETE_ERROR = "回應刪除失敗，請稍後再試"
```

### 錯誤處理範例

```typescript
try {
  const prayer = await prayerService.createPrayer({
    content: "請為我的家人代禱",
    is_anonymous: false,
    user_name: "John",
    user_id: "user-123"
  });
  console.log("代禱創建成功:", prayer);
} catch (error) {
  console.error("代禱創建失敗:", error.message);
  // 根據錯誤類型進行適當處理
}
```

---

## 配置常數

### 驗證配置

```typescript
VALIDATION_CONFIG = {
  PRAYER_CONTENT: {
    MIN_LENGTH: 1,        // 代禱內容最少字數
    MAX_LENGTH: 1000,     // 代禱內容最多字數
  },
  RESPONSE_CONTENT: {
    MIN_LENGTH: 1,        // 回應內容最少字數
    MAX_LENGTH: 500,      // 回應內容最多字數
  },
  USERNAME: {
    MIN_LENGTH: 2,        // 用戶名最少字數
    MAX_LENGTH: 20,       // 用戶名最多字數
  },
}
```

### 社交配置

```typescript
SOCIAL_CONFIG = {
  MAX_FRIENDS: 1000,      // 最大好友數量
  MAX_FOLLOWING: 1000,    // 最大追蹤數量
  MAX_BOOKMARKS: 500,     // 最大收藏數量
}
```

### API 配置

```typescript
API_CONFIG = {
  TIMEOUT: 30000,         // API 超時時間 (毫秒)
  RETRY_ATTEMPTS: 3,      // 重試次數
  RETRY_DELAY: 1000,      // 重試延遲 (毫秒)
}
```

---

## 使用範例

### 完整的代禱發布流程

```typescript
import { prayerService } from '@/services';

// 1. 檢查用戶認證
const user = await authService.getCurrentUser();
if (!user) {
  throw new Error("請先登入");
}

// 2. 創建代禱
const newPrayer = await prayerService.createPrayer({
  content: "請為我即將到來的考試代禱，希望能有好的結果。",
  is_anonymous: false,
  user_name: user.user_metadata?.display_name || "匿名用戶",
  user_avatar: user.user_metadata?.avatar_url,
  user_id: user.id
});

console.log("代禱發布成功:", newPrayer);
```

### 社交互動範例

```typescript
import { useTogglePrayerLike, useTogglePrayerBookmark } from '@/hooks/useSocialFeatures';

function PrayerInteractions({ prayerId, isLiked, isBookmarked }) {
  const toggleLike = useTogglePrayerLike();
  const toggleBookmark = useTogglePrayerBookmark();

  const handleLike = async () => {
    await toggleLike.mutateAsync({ prayerId, isLiked });
  };

  const handleBookmark = async () => {
    await toggleBookmark.mutateAsync({ prayerId, isBookmarked });
  };

  return (
    <div>
      <button onClick={handleLike}>
        {isLiked ? "已愛心" : "愛心"}
      </button>
      <button onClick={handleBookmark}>
        {isBookmarked ? "已收藏" : "收藏"}
      </button>
    </div>
  );
}
```

---

## 版本信息

- **API 版本:** v0.3.348
- **最後更新:** 2024年12月
- **技術棧:** React 18.3.1, TypeScript, Supabase, TanStack Query

---

## 支援

如需技術支援或回報問題，請聯繫開發團隊或在 GitHub 上提交 Issue。 