#!/bin/bash

echo "===== 開始修復剩餘的Xcode問題 ====="

# 確保我們在專案根目錄
cd "$(dirname "$0")" || exit 1

# 1. 安裝必要的gem
echo "安裝必要的Ruby gem..."
gem list -i xcodeproj || sudo gem install xcodeproj

# 2. 運行腳本階段修復
echo "修復腳本構建階段問題..."
ruby fix-build-scripts.rb ios/App/App.xcodeproj

# 3. 確保Firebase類型修復文件已添加到項目中
echo "確保Firebase修復文件已添加到項目..."
cd ios/App || exit 1

# 備份項目文件
cp App.xcodeproj/project.pbxproj App.xcodeproj/project.pbxproj.backup

# 運行修改項目的命令
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

# 檢查文件是否已經存在
type_fixes_file_path = 'App/FirebaseTypeFixes.swift'
type_declarations_file_path = 'App/FirebaseTypeDeclarations.swift'
extension_file_path = 'App/StorageProviderExtension.swift'

# 檢查文件是否已經在項目中
files_to_add = []

# 檢查FirebaseTypeFixes.swift
if Dir.exist?('App') && File.exist?(type_fixes_file_path)
  if source_build_phase.files.none? { |f| f.file_ref.path == 'FirebaseTypeFixes.swift' }
    puts "添加FirebaseTypeFixes.swift到項目"
    file = project.main_group.find_subpath('App').new_file(type_fixes_file_path)
    source_build_phase.add_file_reference(file)
    files_to_add << file
  end
end

# 檢查FirebaseTypeDeclarations.swift
if Dir.exist?('App') && File.exist?(type_declarations_file_path)
  if source_build_phase.files.none? { |f| f.file_ref.path == 'FirebaseTypeDeclarations.swift' }
    puts "添加FirebaseTypeDeclarations.swift到項目"
    file = project.main_group.find_subpath('App').new_file(type_declarations_file_path)
    source_build_phase.add_file_reference(file)
    files_to_add << file
  end
end

# 檢查StorageProviderExtension.swift
if Dir.exist?('App') && File.exist?(extension_file_path)
  if source_build_phase.files.none? { |f| f.file_ref.path == 'StorageProviderExtension.swift' }
    puts "添加StorageProviderExtension.swift到項目"
    file = project.main_group.find_subpath('App').new_file(extension_file_path)
    source_build_phase.add_file_reference(file)
    files_to_add << file
  end
end

# 檢查GoogleService-Info.plist
plist_path = 'App/GoogleService-Info.plist'
if Dir.exist?('App') && File.exist?(plist_path)
  resources_phase = main_target.resources_build_phase
  if resources_phase.files.none? { |f| f.file_ref.path == 'GoogleService-Info.plist' }
    puts "添加GoogleService-Info.plist到項目"
    file = project.main_group.find_subpath('App').new_file(plist_path)
    resources_phase.add_file_reference(file)
  end
end

# 儲存項目
project.save
EOL

# 返回專案根目錄
cd ../..

# 4. 清理並重新同步
echo "清理並重新同步項目..."
npx cap sync ios

echo "===== 修復完成 ====="
echo ""
echo "請在Xcode中執行以下操作："
echo "1. 選擇Product > Clean Build Folder (⇧⌘K)"
echo "2. 點擊Product > Build (⌘B)"
echo ""
echo "如果仍有FirebaseStorage錯誤，請在Xcode中嘗試以下操作："
echo "- 在左側導航中找到並展開'Pods > Pods > FirebaseStorage'"
echo "- 找到有問題的源文件，在編輯器中打開它們"
echo "- 尋找類型錯誤並修改相應的代碼"
echo ""
echo "以下是一些常見修復："
echo "1. 對於'StorageProvider'錯誤: 使用'if let' 進行安全解包"
echo "2. 對於'AuthInterop'和'AppCheckInterop'錯誤: 使用'as?' 進行類型轉換" 