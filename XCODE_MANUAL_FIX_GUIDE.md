# Xcode專案修復指南

## GoogleService-Info.plist相關問題

如果您遇到Firebase配置錯誤：`'FirebaseApp.configure()' could not find a valid GoogleService-Info.plist in your project.`

### 解決方法
1. 在Xcode中，右鍵點擊左側導航中的"App"群組
2. 選擇"Add Files to App..."
3. 瀏覽到 `ios/App/App/GoogleService-Info.plist`
4. 確保選中"Copy items if needed"
5. 確保"Add to targets"中選中了"App"
6. 點擊"Add"按鈕

## 腳本構建階段問題

若遇到警告：`Run script build phase '[CP] Embed Pods Frameworks' will be run during every build...`

### 解決方法
1. 在Xcode中，選擇左側導航中的"App"目標
2. 點擊"Build Phases"標籤
3. 展開所有標記為"Run Script"的部分
4. 對每個腳本階段：
   - 勾選"Show environment variables in build log"
   - 勾選"Based on dependency analysis"
   - 如果有"Input Files"部分，確保填入了正確的值
   - 可以添加一個輸出文件：`$(DERIVED_FILE_DIR)/$(PRODUCT_NAME)-$(CURRENT_ARCH).d`

## 編譯器選項問題

對於錯誤：`unsupported option '-G' for target 'arm64-apple-ios14.0'`

### 解決方法
1. 在Xcode中，點擊左側的"Pods"專案
2. 找到並展開問題目標（如BoringSSL-GRPC, tls_method, tls_record等）
3. 選擇"Build Settings"標籤
4. 在搜索欄輸入"Other C Flags"
5. 找到包含"-G"選項的設置，將該選項刪除
6. 同時將"-Werror"選項改為"-Wno-error"來避免警告被視為錯誤

## 重複庫問題

如果遇到警告：`Ignoring duplicate libraries: 'c++'`

### 解決方法
1. 選擇"App"目標的"Build Phases"標籤
2. 展開"Link Binary With Libraries"部分
3. 找到重複的庫引用，並刪除多餘的實例（保留一個）

## UIScene生命週期警告

對於警告：`CLIENT OF UIKIT REQUIRES UPDATE: This process does not adopt UIScene lifecycle.`

### 解決方法

**選項1：忽略警告（簡單）**
目前這只是一個警告，不會影響應用程式運行。未來版本可能會強制要求，但現在可以安全忽略。

**選項2：更新至UIScene生命週期（複雜）**
1. 創建SceneDelegate.swift文件
2. 更新Info.plist以支持UIScene配置
3. 修改AppDelegate.swift以支持UISceneSession生命週期

## 額外清理步驟

如果以上步驟仍然無法解決問題：

1. 選擇Xcode菜單中的"Product" > "Clean Build Folder"（Shift+Command+K）
2. 關閉Xcode
3. 刪除衍生數據：
   ```
   rm -rf ~/Library/Developer/Xcode/DerivedData
   ```
4. 重新打開Xcode專案
5. 重新構建

## 如果依然有問題

1. 嘗試更新CocoaPods：
   ```
   sudo gem install cocoapods
   ```

2. 然後重新安裝Pod：
   ```
   cd ios/App
   pod deintegrate
   pod install
   ```

3. 再次同步Capacitor：
   ```
   npx cap sync ios
   ``` 