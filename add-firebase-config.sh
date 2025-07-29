#!/bin/bash

# 確保GoogleService-Info.plist在正確位置
SOURCE_PLIST="ios/App/App/GoogleService-Info.plist"
if [ ! -f "$SOURCE_PLIST" ]; then
  echo "錯誤：找不到 $SOURCE_PLIST"
  exit 1
fi

echo "開始更新依賴關係..."

# 導航到iOS目錄
cd ios/App

# 清除舊的Pod緩存
rm -rf Pods
rm -rf Podfile.lock

# 安裝和更新Pod
pod install --repo-update

# 返回項目根目錄
cd ../..

# 同步Capacitor
echo "同步Capacitor專案..."
npx cap sync ios

echo "完成！"
echo "請在Xcode中手動檢查GoogleService-Info.plist是否已正確添加到專案中"
echo "如未添加，請在Xcode中右鍵點擊App目標，選擇'Add Files to \"App\"'，然後選擇 $SOURCE_PLIST 檔案"
echo "請確保選中'Copy items if needed'選項"

echo "然後清理構建文件夾：Xcode > Product > Clean Build Folder"
echo "並嘗試重新構建應用" 