#!/bin/bash

echo "===== 開始直接修改Firebase源碼 ====="

# 導航到iOS Pods目錄
cd ios/App/Pods || exit 1

# 找到可能有問題的Firebase源碼文件
echo "搜尋Firebase存儲相關檔案..."
STORAGE_FILES=$(find . -name "*.swift" -type f -exec grep -l "StorageProvider" {} \;)
AUTH_FILES=$(find . -name "*.swift" -type f -exec grep -l "AuthInterop" {} \;)
APPCHECK_FILES=$(find . -name "*.swift" -type f -exec grep -l "AppCheckInterop" {} \;)

echo "找到以下StorageProvider文件:"
echo "$STORAGE_FILES"
echo ""
echo "找到以下AuthInterop文件:"
echo "$AUTH_FILES"
echo ""
echo "找到以下AppCheckInterop文件:"
echo "$APPCHECK_FILES"
echo ""

# 備份原始文件
echo "備份原始文件..."
mkdir -p ../backups
for file in $STORAGE_FILES $AUTH_FILES $APPCHECK_FILES; do
  if [ -f "$file" ]; then
    cp "$file" "../backups/$(basename "$file").bak"
  fi
done

# 修改StorageProvider問題
echo "修改StorageProvider問題..."
for file in $STORAGE_FILES; do
  if [ -f "$file" ]; then
    echo "處理文件: $file"
    
    # 修改1: 將可選類型強制展開
    sed -i '' 's/\(storage\)\(\?*\)\.storage/\1\2!.storage/g' "$file"
    
    # 修改2: 添加空值合併運算符
    sed -i '' 's/\(storage as? StorageProvider\)/(\1) ?? nil/g' "$file"
    
    # 修改3: 修改可選類型存取
    sed -i '' 's/\(provider\)\(\?*\)\.storage/\1\2?.storage/g' "$file"
  fi
done

# 修改AuthInterop問題
echo "修改AuthInterop問題..."
for file in $AUTH_FILES; do
  if [ -f "$file" ]; then
    echo "處理文件: $file"
    
    # 修改: 添加類型轉換
    sed -i '' 's/\(auth as! AuthInterop\)/auth as Any as! AuthInterop/g' "$file"
    sed -i '' 's/\(auth as\? AuthInterop\)/auth as Any as? AuthInterop/g' "$file"
    
    # 修改: 強制展開可選類型
    sed -i '' 's/\(auth\)\(\?*\) as\? AuthInterop/\1\2! as? AuthInterop/g' "$file"
  fi
done

# 修改AppCheckInterop問題
echo "修改AppCheckInterop問題..."
for file in $APPCHECK_FILES; do
  if [ -f "$file" ]; then
    echo "處理文件: $file"
    
    # 修改: 添加類型轉換
    sed -i '' 's/\(appCheck as! AppCheckInterop\)/appCheck as Any as! AppCheckInterop/g' "$file"
    sed -i '' 's/\(appCheck as\? AppCheckInterop\)/appCheck as Any as? AppCheckInterop/g' "$file"
    
    # 修改: 強制展開可選類型
    sed -i '' 's/\(appCheck\)\(\?*\) as\? AppCheckInterop/\1\2! as? AppCheckInterop/g' "$file"
  fi
done

# 返回專案根目錄
cd ../../..

# 禁用特定Xcode構建階段的腳本依賴性分析
echo "禁用腳本構建階段依賴分析..."
ruby - << 'EOL'
require 'xcodeproj'

project_path = 'ios/App/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# 修改主應用程式目標
main_target = project.targets.find { |t| t.name == 'App' }
if main_target
  main_target.build_phases.each do |phase|
    if phase.is_a?(Xcodeproj::Project::Object::PBXShellScriptBuildPhase)
      # 完全禁用依賴分析
      puts "禁用依賴分析: #{phase.name || 'unnamed'}"
      phase.dependency_file = nil
      phase.always_out_of_date = true
      phase.input_paths = []
      phase.output_paths = []
    end
  end
  
  project.save
end
EOL

echo "===== 修改完成 ====="
echo ""
echo "請在Xcode中執行："
echo "1. 選擇Product > Clean Build Folder (⇧⌘K)"
echo "2. 嘗試重新構建 (⌘B)"
echo ""
echo "注意："
echo "- 這些修改是針對特定版本的Firebase SDK，如果SDK版本更改可能需要重新調整"
echo "- 腳本構建階段的警告無法完全消除，但應用程序仍可正常運行" 