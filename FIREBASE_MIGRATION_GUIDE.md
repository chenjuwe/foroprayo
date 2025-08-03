# Firebase 資料庫遷移指南

這個指南將協助您從 `prayforo` Firebase 專案完整遷移到 `foroprayo` Firebase 專案。

## 📋 遷移內容

- ✅ **Firestore 數據**：所有集合和文檔
- ✅ **Firebase Storage**：所有檔案和媒體
- ✅ **Firebase Authentication**：所有用戶帳戶
- ✅ **安全規則**：Firestore 和 Storage 規則
- ✅ **索引設定**：Firestore 索引配置

## 🚀 快速開始

### 第一步：安裝依賴

```bash
npm install firebase-admin --save-dev
```

### 第二步：獲取服務帳戶金鑰

#### 1. 源專案 (prayforo) 服務帳戶

1. 前往 [Firebase Console](https://console.firebase.google.com)
2. 選擇 `prayforo` 專案
3. 點擊 ⚙️ **專案設定** > **服務帳戶**
4. 點擊 **產生新的私密金鑰**
5. 下載 JSON 檔案並重命名為 `prayforo-service-account-key.json`
6. 將檔案放置在 `scripts/` 資料夾中

#### 2. 目標專案 (foroprayo) 服務帳戶

1. 在同一個 Firebase Console 中切換到 `foroprayo` 專案
2. 重複上述步驟
3. 下載並重命名為 `foroprayo-service-account-key.json`
4. 同樣放置在 `scripts/` 資料夾中

### 第三步：執行遷移

#### 完整遷移（推薦）
```bash
node scripts/firebase-migration.js full
```

#### 分步驟遷移
```bash
# 僅遷移 Firestore 數據
node scripts/firebase-migration.js firestore

# 僅遷移 Storage 檔案
node scripts/firebase-migration.js storage

# 僅遷移 Authentication 用戶
node scripts/firebase-migration.js auth
```

## 📝 詳細操作步驟

### 1. 準備工作

#### 1.1 確認專案權限
確保您在兩個 Firebase 專案中都具有以下權限：
- **Firebase Admin SDK Admin Service Agent**
- **Cloud Datastore Owner**
- **Storage Admin**
- **Firebase Authentication Admin**

#### 1.2 備份現有數據
```bash
# 導出 foroprayo 現有數據（可選）
gcloud firestore export gs://foroprayo-backup/$(date +%Y%m%d_%H%M%S) --project=foroprayo
```

### 2. 遷移 Firestore 數據

腳本將遷移以下集合：
- `users` - 用戶資料
- `avatars` - 用戶頭像
- `user_backgrounds` - 用戶背景
- `prayers` - 代禱文章
- `prayer_responses` - 代禱回應
- `prayer_likes` - 代禱按讚記錄
- `prayer_response_likes` - 回應按讚記錄
- `baptism` - 受洗分享
- `baptism_responses` - 受洗回應
- `journey` - 旅程分享
- `journey_responses` - 旅程回應
- `miracle` - 神蹟見證
- `miracle_responses` - 神蹟回應

### 3. 遷移 Storage 檔案

腳本將遷移以下路徑的所有檔案：
- `avatars/` - 用戶頭像圖片
- `prayer-images/` - 代禱相關圖片
- `response-images/` - 回應相關圖片
- `test/` - 測試檔案

### 4. 遷移 Authentication 用戶

- 保留原始 UID
- 保留電子郵件和密碼
- 保留用戶元數據（註冊時間、最後登入時間）
- 保留用戶顯示名稱和照片 URL

### 5. 部署安全規則和索引

#### 5.1 部署 Firestore 規則和索引
```bash
firebase deploy --only firestore
```

#### 5.2 部署 Storage 規則
```bash
firebase deploy --only storage
```

## ⚠️ 注意事項

### 時間估計
- **小型專案** (< 1000 文檔): 5-10 分鐘
- **中型專案** (1000-10000 文檔): 30-60 分鐘
- **大型專案** (> 10000 文檔): 1-3 小時

### 限制和考量

1. **Firebase 配額限制**
   - Firestore 寫入：每秒 10,000 次操作
   - Storage 上傳：每日 TB 級別限制
   
2. **數據一致性**
   - 遷移過程中不建議對源資料庫進行寫入操作
   - 建議在低流量時段執行遷移

3. **成本考量**
   - 數據傳輸會產生 Firebase 使用費用
   - Storage 檔案下載/上傳計入用量

## 🔍 驗證遷移結果

### 1. 檢查文檔數量
```javascript
// 在 Firebase Console 或使用 Admin SDK 檢查
const snapshot = await admin.firestore().collection('prayers').get();
console.log(`prayers 集合文檔數量: ${snapshot.size}`);
```

### 2. 檢查 Storage 檔案
在 Firebase Console 的 Storage 頁面中檢查檔案是否正確遷移。

### 3. 檢查用戶數量
在 Authentication 頁面檢查用戶數量是否一致。

## 🔧 疑難排解

### 常見錯誤

#### 1. 權限不足
```
Error: 7 PERMISSION_DENIED: Missing or insufficient permissions
```
**解決方案**：檢查服務帳戶權限設定

#### 2. 配額超限
```
Error: 8 RESOURCE_EXHAUSTED: Quota exceeded
```
**解決方案**：等待配額重置或聯繫 Firebase 支援

#### 3. 網路連接問題
```
Error: 14 UNAVAILABLE: Connection failed
```
**解決方案**：檢查網路連接，重新執行遷移

### 手動驗證步驟

1. **隨機檢查文檔**
   ```javascript
   // 比較源文檔和目標文檔
   const sourceDoc = await sourceDb.collection('prayers').doc('docId').get();
   const targetDoc = await targetDb.collection('prayers').doc('docId').get();
   ```

2. **檢查檔案完整性**
   - 比較檔案大小和元數據
   - 驗證檔案可訪問性

## 📞 支援

如果遇到問題，請檢查：
1. Firebase Console 的配額使用情況
2. 服務帳戶權限設定
3. 網路連接狀態

## 🎯 遷移完成後

1. **更新應用配置**
   - 確認 `src/integrations/firebase/client.ts` 指向正確的專案
   
2. **測試應用功能**
   - 登入/註冊功能
   - 數據讀寫功能
   - 檔案上傳/下載功能

3. **清理工作**
   - 刪除服務帳戶金鑰檔案（安全考量）
   - 更新環境變數
   - 通知團隊成員

---

**⚠️ 重要提醒**：遷移前請務必備份現有數據，並在測試環境中先行驗證遷移腳本的正確性。 