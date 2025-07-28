# Firebase Firestore 設置指南

本文檔提供有關如何在 Firebase 控制台中設置 Firestore 數據庫和部署安全規則的說明。

## 步驟 1: 創建 Firestore 數據庫

1. 訪問 [Firebase 控制台](https://console.firebase.google.com/)
2. 選擇您的項目 "prayforo"
3. 在左側導航欄中，點擊 "Firestore Database"
4. 點擊 "創建數據庫" 按鈕
5. 選擇安全規則模式（建議從"測試模式"開始，稍後再部署正式規則）
6. 選擇數據庫位置（建議選擇離您的用戶最近的位置）
7. 點擊 "完成" 按鈕

## 步驟 2: 部署 Firestore 安全規則

### 選項 1: 通過 Firebase 控制台部署

1. 在 Firestore 數據庫頁面，點擊 "規則" 選項卡
2. 將本項目中的 `firestore.rules` 文件內容複製到編輯器中
3. 點擊 "發布" 按鈕

### 選項 2: 通過 Firebase CLI 部署

1. 確保已安裝 Firebase CLI：
   ```bash
   npm install -g firebase-tools
   ```

2. 登錄到 Firebase：
   ```bash
   firebase login
   ```

3. 初始化 Firebase 項目（如果尚未初始化）：
   ```bash
   firebase init firestore
   ```

4. 部署規則：
   ```bash
   firebase deploy --only firestore:rules
   ```

## 數據結構

Firestore 數據庫包含以下集合：

### users 集合

每個文檔代表一個用戶，文檔 ID 是用戶的 UID。

```
users/
  {userId}/
    userId: string         // 用戶的 Firebase Auth UID
    displayName: string    // 用戶顯示名稱
    email: string          // 用戶電子郵件
    scripture: string      // 用戶喜愛的經文
    createdAt: timestamp   // 記錄創建時間
    updatedAt: timestamp   // 記錄更新時間
```

## 安全規則說明

我們的 Firestore 安全規則實施以下策略：

1. 用戶只能讀取和修改自己的數據
2. 用戶不能刪除自己的數據（防止意外刪除）
3. 默認拒絕所有其他請求

這確保了用戶數據的安全性和隱私性。 