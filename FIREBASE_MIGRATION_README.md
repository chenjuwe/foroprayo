# Firebase 資料庫遷移工具包

這個工具包提供完整的 Firebase 資料庫遷移解決方案，協助您從 `prayforo` 專案遷移到 `foroprayo` 專案。

## 🎯 快速開始

```bash
# 執行快速設置腳本
./scripts/migration-quick-start.sh
```

## 📦 包含檔案

### 🔧 遷移腳本
- **`scripts/firebase-migration.cjs`** - 主要的遷移腳本
- **`scripts/deploy-firebase-config.cjs`** - Firebase 設定部署腳本
- **`scripts/migration-quick-start.sh`** - 快速設置引導腳本

### 📚 文件和範例
- **`FIREBASE_MIGRATION_GUIDE.md`** - 詳細的遷移指南
- **`scripts/service-account-key-example.json`** - 服務帳戶金鑰格式範例

## 🚀 使用方法

### 1. 自動設置
```bash
./scripts/migration-quick-start.sh
```

### 2. 手動執行遷移

#### 完整遷移
```bash
npm run firebase:migrate
```

#### 分步驟遷移
```bash
npm run firebase:migrate:firestore  # 僅 Firestore 數據
npm run firebase:migrate:storage    # 僅 Storage 檔案
npm run firebase:migrate:auth       # 僅 Authentication 用戶
```

### 3. 部署 Firebase 設定
```bash
npm run firebase:deploy             # 部署所有設定
npm run firebase:deploy:firestore   # 僅 Firestore 規則
npm run firebase:deploy:storage     # 僅 Storage 規則
```

## 📋 前置需求

1. **Node.js** (版本 14 或以上)
2. **Firebase CLI** (`npm install -g firebase-tools`)
3. **服務帳戶金鑰**：
   - `scripts/prayforo-service-account-key.json`
   - `scripts/foroprayo-service-account-key.json`

## 🔐 獲取服務帳戶金鑰

1. 前往 [Firebase Console](https://console.firebase.google.com)
2. 選擇您的專案
3. 點擊 ⚙️ **專案設定** > **服務帳戶**
4. 點擊 **產生新的私密金鑰**
5. 下載並重命名 JSON 檔案
6. 放置在 `scripts/` 資料夾中

## 📊 遷移內容

✅ **Firestore 數據** - 所有集合和文檔  
✅ **Firebase Storage** - 所有檔案和媒體  
✅ **Firebase Authentication** - 所有用戶帳戶  
✅ **安全規則** - Firestore 和 Storage 規則  
✅ **索引設定** - Firestore 索引配置  

## ⚠️ 重要注意事項

- 遷移前請**備份現有數據**
- 建議在**低流量時段**執行遷移
- 遷移完成後請**測試所有功能**
- **不要**將服務帳戶金鑰提交到版本控制

## 🔍 疑難排解

常見問題解決方案請參考 `FIREBASE_MIGRATION_GUIDE.md` 的疑難排解章節。

## 📞 支援

如果遇到問題，請檢查：
1. Firebase Console 的配額使用情況
2. 服務帳戶權限設定
3. 網路連接狀態

---

**📖 詳細說明請參考：[FIREBASE_MIGRATION_GUIDE.md](./FIREBASE_MIGRATION_GUIDE.md)** 