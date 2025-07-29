#!/bin/bash

echo "===== 開始簡單修復 ====="

# 1. 確保StorageForcedUnwrap.swift在Xcode項目中
echo "確保StorageForcedUnwrap.swift在項目中..."
cd ios/App || exit 1

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
fixes_file_path = 'App/StorageForcedUnwrap.swift'

# 檢查文件是否已經在項目中
if Dir.exist?('App') && File.exist?(fixes_file_path)
  if source_build_phase.files.none? { |f| f.file_ref.path == 'StorageForcedUnwrap.swift' }
    puts "添加StorageForcedUnwrap.swift到項目"
    file = project.main_group.find_subpath('App').new_file(fixes_file_path)
    source_build_phase.add_file_reference(file)
  end
end

# 儲存項目
project.save
EOL

# 2. 禁用腳本構建分析
echo "禁用腳本構建分析..."

ruby - << 'EOL'
require 'xcodeproj'

project_path = 'App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# 修改主應用程式目標
main_target = project.targets.find { |t| t.name == 'App' }
if main_target
  main_target.build_phases.each do |phase|
    if phase.is_a?(Xcodeproj::Project::Object::PBXShellScriptBuildPhase)
      # 完全禁用依賴分析
      puts "禁用依賴分析: #{phase.name || 'unnamed'}"
      phase.dependency_file = nil
      phase.input_paths = []
      phase.output_paths = []
    end
  end
  
  project.save
end
EOL

# 3. 返回根目錄
cd ../..

# 4. 建議在Xcode中使用StorageForcedUnwrap.swift
echo "===== 修復完成 ====="
echo ""
echo "在Xcode中，請手動執行以下操作："
echo "1. 清理構建文件夾: Product > Clean Build Folder (⇧⌘K)"
echo "2. 在需要使用Firebase Storage的檔案中，使用擴展方法："
echo "   - 將 storage.reference(withPath: path) 改為 storage.safeReference(path: path)"
echo "   - 將 reference.storage 改為 reference.unwrappedStorage 或 reference.getStorage()"
echo "3. 重新構建專案: Product > Build (⌘B)"
echo ""
echo "注意：腳本構建階段警告是正常的，不會影響應用功能。"
echo "如果仍有錯誤，請根據錯誤信息手動修改問題檔案。" 