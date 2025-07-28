# 修復回應卡片上傳圖片功能

## 問題描述
回應卡片上傳圖片功能出現兩種錯誤：
1. 「錯誤: Could not find the 'image_url' column of 'prayer_responses' in the schema cache」
2. 「圖片上傳失敗: new row violates row-level security policy」

## 原因分析
1. 雖然 `image_url` 欄位已在數據庫遷移中添加，但 Supabase 的 schema 快取沒有更新
2. 回覆卡片的 RLS（行級安全）政策存在問題，不允許用戶上傳帶圖片的回覆

## 解決方案

### 1. 添加數據庫修復遷移腳本
建立了兩個遷移腳本：
- `20250720000000_fix_prayer_response_image_url.sql` - 確保欄位存在並重置 schema 快取
- `20250720100000_fix_prayer_response_image_rls.sql` - 修復行級安全政策

### 2. 改進 PrayerResponseService
- 增強錯誤處理，專門處理圖片相關錯誤
- 添加詳細的日誌記錄，便於問題診斷

### 3. 優化 useCreatePrayerResponse Hook
- 改進錯誤處理邏輯，提供更友好的錯誤消息
- 針對不同類型的錯誤（欄位問題、安全政策違反等）提供特定錯誤提示

## 部署步驟
1. 應用數據庫遷移腳本：
   ```
   npx supabase migration up
   ```
   或通過 Supabase 管理界面運行 SQL 腳本

2. 更新前端代碼（已包含在提交中）

3. 重新部署應用或刷新瀏覽器快取

## 測試步驟
1. 登入系統，嘗試在回應中上傳圖片
2. 以訪客身份嘗試在回應中上傳圖片
3. 驗證圖片是否顯示在回應卡片中
4. 驗證圖片上傳過程中的錯誤處理

## 注意事項
- 如果問題仍然存在，可能需要手動刷新 Supabase 的 schema 快取
- 確保服務器已連接到最新的 Supabase 實例 