#!/bin/bash

echo "===== 開始修復最後的Xcode問題 ====="

# 確保我們在專案根目錄
cd "$(dirname "$0")" || exit 1

# 1. 確保Ruby和必要的gem已安裝
echo "檢查並安裝必要的Ruby gem..."
gem list -i xcodeproj || sudo gem install xcodeproj

# 2. 關閉所有Xcode實例
echo "關閉所有Xcode實例..."
osascript -e 'tell application "Xcode" to quit' || true
sleep 2

# 3. 清理派生數據
echo "清理Xcode派生數據..."
rm -rf ~/Library/Developer/Xcode/DerivedData/*
rm -rf ~/Library/Caches/com.apple.dt.Xcode/*

# 4. 修復重複輸出文件問題
echo "修復重複輸出文件問題..."
chmod +x fix-duplicate-output.rb
ruby fix-duplicate-output.rb ios/App/App.xcodeproj

# 5. 修改構建設置
echo "修改Xcode構建設置..."
cd ios/App || exit 1

# 備份項目文件
cp App.xcodeproj/project.pbxproj App.xcodeproj/project.pbxproj.final.backup

# 運行修改項目設置的命令
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

# 設置更先進的構建設置
main_target.build_configurations.each do |config|
  puts "修改App構建設置: #{config.name}"
  
  # 確保檔案不是重複建置
  config.build_settings['ENABLE_BITCODE'] = 'NO'
  config.build_settings['ENABLE_USER_SCRIPT_SANDBOXING'] = 'NO'
  
  # 設置更寬鬆的構建規則
  config.build_settings['GCC_WARN_INHIBIT_ALL_WARNINGS'] = 'YES'
  config.build_settings['SWIFT_SUPPRESS_WARNINGS'] = 'YES'
  
  # 確保正確的iOS部署目標
  config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '14.0'
  
  # 修改其他可能有問題的設置
  config.build_settings['SWIFT_VERSION'] = '5.0'
  config.build_settings['CLANG_ENABLE_MODULES'] = 'YES'
end

# 修改所有腳本階段
main_target.build_phases.each do |phase|
  if phase.is_a?(Xcodeproj::Project::Object::PBXShellScriptBuildPhase)
    if phase.name && phase.name.include?('Embed Pods Frameworks')
      # 完全禁用此階段的依賴分析
      phase.dependency_file = nil
      phase.input_paths = []
      phase.output_paths = []
    end
  end
end

# 儲存項目
project.save
puts "已保存App目標的構建設置修改"

# 修改Pods項目設置
pods_project_path = 'Pods/Pods.xcodeproj'
if File.exist?(pods_project_path)
  puts "修改Pods項目設置..."
  pods_project = Xcodeproj::Project.open(pods_project_path)
  
  # 針對所有目標修改構建設置
  pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      # 禁用腳本沙盒
      config.build_settings['ENABLE_USER_SCRIPT_SANDBOXING'] = 'NO'
      
      # 處理BoringSSL-GRPC和gRPC相關目標的特殊設置
      if target.name.include?('BoringSSL') || target.name.include?('gRPC') || target.name.include?('Firebase')
        # 禁用警告視為錯誤
        if config.build_settings['GCC_TREAT_WARNINGS_AS_ERRORS']
          config.build_settings['GCC_TREAT_WARNINGS_AS_ERRORS'] = 'NO'
        end
        
        # 禁用所有警告
        config.build_settings['GCC_WARN_INHIBIT_ALL_WARNINGS'] = 'YES'
        
        # 確保適用於新ARM架構
        if config.build_settings['OTHER_CFLAGS']
          config.build_settings['OTHER_CFLAGS'] = config.build_settings['OTHER_CFLAGS'].
            to_s.gsub(/-G/, '').gsub(/-Werror/, '-Wno-error')
        end
      end
    end
  end
  
  pods_project.save
  puts "已保存Pods項目設置修改"
end
EOL

# 返回專案根目錄
cd ../..

# 6. 重新同步Capacitor
echo "重新同步Capacitor設定..."
npx cap sync ios

# 7. 重新打開Xcode
echo "重新打開Xcode..."
npx cap open ios

echo "===== 修復完成 ====="
echo ""
echo "請在Xcode中執行以下操作："
echo "1. 選擇Product > Clean Build Folder (⇧⌘K)"
echo "2. 點擊Product > Build (⌘B)"
echo ""
echo "注意："
echo "- 如果仍有警告出現但沒有錯誤，應用程式仍然可以運行"
echo "- 腳本構建階段的警告在許多專案中很常見，通常不影響實際功能" 