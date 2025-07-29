#!/bin/bash

# 這個腳本手動編輯Xcode項目文件來修復腳本構建階段問題

# 導航到iOS專案目錄
cd ios/App

echo "===== 開始修復腳本構建階段問題 ====="

# 1. 備份原始的project.pbxproj文件
cp App.xcodeproj/project.pbxproj App.xcodeproj/project.pbxproj.backup
echo "已備份原始項目文件"

# 2. 打開Xcode工作區，這將自動執行pod install命令中的post_install鉤子
echo "打開Xcode工作區..."
open App.xcworkspace

echo "===== 請按照以下步驟操作 ====="
echo ""
echo "在Xcode中打開的專案中："
echo ""
echo "1. 選擇左側導航器中的'App'目標"
echo "2. 選擇'Build Phases'標籤"
echo "3. 展開每個'Run Script'階段"
echo "4. 對每個腳本階段執行以下操作："
echo "   - 勾選'Show environment variables in build log'"
echo "   - 在'Output Files'部分，點擊'+'添加以下內容："
echo "     \$(DERIVED_FILE_DIR)/\$(INPUT_FILE_PATH:base).o"
echo "   - 如果有'Input Files'部分，確保有對應的輸入文件"
echo "   - 勾選'Based on dependency analysis'"
echo ""
echo "5. 完成上述步驟後，選擇Product > Clean Build Folder"
echo "6. 然後嘗試重新構建 (⌘+B)"
echo ""
echo "針對tls_method和tls_record錯誤："
echo ""
echo "1. 點擊左側的Pods專案"
echo "2. 展開'Pods > Targets > BoringSSL-GRPC'"
echo "3. 選擇'Build Settings'標籤"
echo "4. 搜索'Other C Flags'"
echo "5. 將任何包含'-G'的標誌移除，並將'-Werror'改為'-Wno-error'"
echo ""
echo "對於重複庫問題："
echo ""
echo "1. 選擇App目標的'Build Phases'標籤"
echo "2. 展開'Link Binary With Libraries'"
echo "3. 移除任何重複的庫引用"
echo ""
echo "完成所有步驟後重新構建專案" 