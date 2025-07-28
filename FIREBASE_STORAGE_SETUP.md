# Firebase Storage 設置指南

## 問題診斷：頭像上傳失敗

如果您在上傳頭像時遇到問題（一直轉圈圈），這很可能是由於 Firebase Storage 權限設置問題。以下是解決步驟：

## Firebase Storage 規則設置

1. **登入 Firebase 控制台**：
   - 訪問 [Firebase 控制台](https://console.firebase.google.com/)
   - 選擇您的專案 "prayforo"

2. **導航到 Storage 設置**：
   - 在左側導航欄中點擊 "Storage"
   - 點擊 "規則" 標籤

3. **更新 Storage 規則**：
   - 將以下規則複製並粘貼到規則編輯器中：

```
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // 允許所有用戶讀取頭像
    match /avatars/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 默認規則：拒絕所有未明確允許的請求
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

4. **發布規則**：
   - 點擊 "發布" 按鈕保存並應用這些規則

## 使用 Firebase CLI 部署規則（可選）

如果您喜歡使用命令行工具，可以按照以下步驟操作：

1. **安裝 Firebase CLI**（如果尚未安裝）：
   ```bash
   npm install -g firebase-tools
   ```

2. **登入 Firebase**：
   ```bash
   firebase login
   ```

3. **初始化專案**（如果尚未初始化）：
   ```bash
   firebase init storage
   ```

4. **部署規則**：
   - 確保項目根目錄中有 `firebase.storage.rules` 文件
   - 執行以下命令部署規則：
   ```bash
   firebase deploy --only storage
   ```

## 驗證設置

設置完成後，請嘗試再次上傳頭像。如果仍然遇到問題，請檢查瀏覽器控制台中的錯誤信息，並確保：

1. Firebase 專案已正確配置
2. Storage 服務已啟用
3. 用戶已成功登入
4. 應用程式中的 `storageBucket` 配置與 Firebase 控制台中的設置匹配

## 常見問題

1. **"Firebase Storage: User does not have permission to access..."**
   - 這表示 Storage 規則阻止了上傳操作
   - 確認用戶已登入且規則已正確設置

2. **"Firebase Storage: Quota exceeded"**
   - 您可能已達到 Firebase 免費計劃的存儲限制
   - 考慮升級到付費計劃或清理不必要的文件

3. **"Network Error"**
   - 檢查網絡連接
   - 確認 Firebase Storage 服務運行正常 