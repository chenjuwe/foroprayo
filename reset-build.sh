#!/bin/bash

echo "===== 開始徹底重建iOS專案 ====="

# 關閉所有Xcode實例
echo "關閉所有Xcode實例..."
osascript -e 'tell application "Xcode" to quit' || true
sleep 2

# 刪除派生數據
echo "刪除Xcode派生數據..."
rm -rf ~/Library/Developer/Xcode/DerivedData/*
rm -rf ~/Library/Caches/com.apple.dt.Xcode/*

# 導航到iOS目錄
cd ios/App || exit 1

# 完全清除Pods
echo "清除Pod緩存..."
rm -rf Pods
rm -rf Podfile.lock
rm -rf ~/Library/Caches/CocoaPods/*
pod cache clean --all

# 確保FirebaseFixes.swift已添加到專案中
echo "確保Firebase修復文件已添加到項目..."
ruby - << 'EOL'
require 'xcodeproj'

project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# 找到主要目標
main_target = project.targets.find { |t| t.name == 'App' }
if main_target.nil?
  puts "錯誤: 找不到App目標"
  exit 1
end

# 確保源文件引用已存在
source_build_phase = main_target.source_build_phase
fixes_file_path = 'App/FirebaseFixes.swift'

# 檢查文件是否已經在項目中
if Dir.exist?('App') && File.exist?(fixes_file_path)
  if source_build_phase.files.none? { |f| f.file_ref.path == 'FirebaseFixes.swift' }
    puts "添加FirebaseFixes.swift到項目"
    file = project.main_group.find_subpath('App').new_file(fixes_file_path)
    source_build_phase.add_file_reference(file)
  end
end

# 禁用腳本構建階段分析
main_target.build_phases.each do |phase|
  if phase.is_a?(Xcodeproj::Project::Object::PBXShellScriptBuildPhase)
    puts "禁用依賴分析: #{phase.name || 'unnamed'}"
    phase.dependency_file = nil
    phase.input_paths = []
    phase.output_paths = []
    phase.always_out_of_date = true
  end
end

# 儲存項目
project.save
puts "已保存App目標的構建設置修改"
EOL

# 重新安裝Pod
echo "重新安裝Pod..."
pod deintegrate
pod setup
pod install --repo-update

# 返回專案根目錄
cd ../..

# 重新同步Capacitor
echo "重新同步Capacitor設定..."
npx cap sync ios

# 繼續執行源碼修改腳本
echo "修改Firebase源碼..."
chmod +x fix-firebase-source.sh
./fix-firebase-source.sh

# 重新打開Xcode
echo "重新打開Xcode..."
npx cap open ios

echo "===== 重建完成 ====="
echo ""
echo "請在Xcode中執行："
echo "1. 選擇Product > Clean Build Folder (⇧⌘K)"
echo "2. 嘗試重新構建 (⌘B)"
echo ""
echo "如果仍有腳本構建階段警告，可以忽略它們，專注於修復類型錯誤"
echo "腳本警告通常不會影響應用程式的功能，這是CocoaPods構建系統的常見問題" 