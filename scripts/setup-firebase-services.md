# Firebase 服務設置指南

## 🎯 目標
為 foroprayo 專案啟用必要的 Firebase 服務，以便進行數據遷移。

## 📋 需要啟用的服務

### 1. Firestore Database
- 用於存儲應用程式數據
- 支援即時同步
- 提供離線支援

### 2. Firebase Authentication  
- 用於用戶登入/註冊
- 支援多種登入方式
- 管理用戶會話

### 3. Firebase Storage
- 用於存儲檔案和媒體
- 支援圖片、影片等檔案上傳

## 🔧 設置步驟

### 步驟 1：啟用 Firestore Database

#### 方法 A：透過直接連結
點擊以下連結直接啟用 Firestore API：
```
https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=foroprayo
```

#### 方法 B：透過 Firebase Console
1. 前往 [Firebase Console](https://console.firebase.google.com)
2. 選擇 **foroprayo** 專案
3. 點擊左側選單的 **Firestore Database**
4. 點擊 **建立資料庫** 按鈕
5. 選擇安全規則模式：
   - 🔒 **正式模式**（推薦）：使用安全規則
   - 🧪 **測試模式**：30 天內允許所有讀寫（僅測試用）
6. 選擇資料庫位置：
   - 推薦：**asia-east1** (台灣)
   - 備選：**asia-southeast1** (新加坡)
7. 點擊 **建立**

### 步驟 2：啟用 Firebase Authentication

1. 在 Firebase Console 中，點擊左側選單的 **Authentication**
2. 點擊 **開始使用** 按鈕
3. 前往 **Sign-in method** 分頁
4. 啟用您需要的登入方式：
   - ✅ **電子郵件/密碼**（基本登入）
   - ✅ **Google**（社交登入）
   - 其他方式依需求選擇
5. 設定授權網域（如果需要）

### 步驟 3：啟用 Firebase Storage

1. 點擊左側選單的 **Storage**
2. 點擊 **開始使用** 按鈕
3. 選擇安全規則模式（通常選擇測試模式開始）
4. 選擇儲存位置（建議與 Firestore 相同）
5. 點擊 **完成**

## ⏰ 等待時間

啟用服務後，請等待 **2-5 分鐘** 讓變更完全生效。

## 🔍 驗證設置

完成後，可以執行以下命令來驗證設置：

```bash
# 檢查目標專案狀態
node scripts/check-target-data.cjs
```

應該看到：
- ✅ Firestore 連接正常
- ✅ Authentication 服務可用
- ✅ 可以讀取（即使是空的）集合

## 🚀 重新執行遷移

服務啟用後，重新執行完整遷移：

```bash
npm run firebase:migrate
```

或分步驟執行：

```bash
npm run firebase:migrate:auth       # 先遷移用戶
npm run firebase:migrate:firestore  # 再遷移數據
npm run firebase:migrate:storage    # 最後遷移檔案
```

## 🔧 常見問題

### Q: 啟用服務後仍然出現權限錯誤？
A: 請等待 5-10 分鐘，有時 API 啟用需要時間傳播到所有服務器。

### Q: 無法找到「建立資料庫」按鈕？
A: 確保您已選擇正確的專案，且具有該專案的 Owner 或 Editor 權限。

### Q: 資料庫位置選擇建議？
A: 
- 台灣用戶：asia-east1（台灣）
- 亞洲其他地區：asia-southeast1（新加坡）
- 全球服務：us-central1（美國中部）

### Q: 安全規則模式選擇？
A:
- **正式模式**：適合正式環境，需要設定安全規則
- **測試模式**：適合開發測試，30 天後自動切換為拒絕所有請求

## 📞 需要協助？

如果遇到問題，請檢查：
1. 是否有專案的適當權限
2. 是否選擇了正確的專案
3. 網路連接是否正常
4. 是否等待了足夠的時間讓服務生效 