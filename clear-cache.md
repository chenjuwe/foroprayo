# 🔄 Chrome 快取清理指南

## 🚀 快速解決方案

### **方法一：硬重新整理（最簡單）**
```
Mac: Cmd + Shift + R
Windows: Ctrl + Shift + R
```

### **方法二：開發者工具清除（推薦）**
1. 按 `Cmd + Option + I` 打開開發者工具
2. 右鍵點擊重新整理按鈕（在網址列左邊）
3. 選擇「**清空快取並強制重新載入**」

### **方法三：開發者工具設定**
1. 打開開發者工具（F12）
2. 進入 **Network** 標籤
3. 勾選 **"Disable cache"** 選項
4. 保持開發者工具開啟狀態

### **方法四：完全清除網站資料**
1. 在網址列輸入：`chrome://settings/content/all`
2. 搜尋：`localhost:8081`
3. 點擊垃圾桶圖示刪除所有資料

## 🛠️ 已完成的配置優化

✅ **Vite 開發服務器**已配置禁用快取：
- `Cache-Control: no-cache, no-store, must-revalidate`
- `Pragma: no-cache`
- `Expires: 0`

✅ **PWA 服務工作者**在開發環境中已禁用

## 📋 開發最佳實踐

### **建議的 Chrome 開發設定**
1. **永久禁用快取**：
   - 打開開發者工具
   - Network 標籤 → 勾選 "Disable cache"
   - 保持開發者工具開啟

2. **使用無痕模式**：
   - `Cmd + Shift + N` 開啟無痕視窗
   - 每次都是全新的狀態

3. **使用不同埠號測試**：
   - 修改 `vite.config.ts` 中的 port
   - 避免快取干擾

## 🔧 故障排除

如果仍有問題，請依序嘗試：

1. **重新啟動瀏覽器**
2. **清除所有 Chrome 資料**：
   ```
   chrome://settings/clearBrowserData
   ```
3. **檢查服務工作者**：
   ```
   chrome://serviceworker-internals/
   ```
   取消註冊相關的服務工作者

4. **使用其他瀏覽器測試**：
   - Safari、Firefox 等確認問題範圍

## 📱 移動端測試

對於移動端測試：
- iOS Safari：設定 → Safari → 清除歷史記錄與網站資料
- Android Chrome：設定 → 隱私權與安全性 → 清除瀏覽資料 