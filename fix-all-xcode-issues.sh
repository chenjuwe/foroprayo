#!/bin/bash

echo "===== 開始全面修復Xcode問題 ====="

# 導航到iOS目錄
cd ios/App || exit 1

# 備份文件
echo "備份重要文件..."
cp Podfile Podfile.backup
cp App.xcodeproj/project.pbxproj App.xcodeproj/project.pbxproj.backup

# 創建新的Podfile來解決所有問題
echo "創建更新的Podfile..."
cat > Podfile.new << 'EOL'
require_relative '../../node_modules/@capacitor/ios/scripts/pods_helpers'

platform :ios, '14.0'
use_frameworks!

# 禁用輸入輸出路徑以避免Xcode緩存問題
install! 'cocoapods', :disable_input_output_paths => true

def capacitor_pods
  pod 'Capacitor', :path => '../../node_modules/@capacitor/ios'
  pod 'CapacitorCordova', :path => '../../node_modules/@capacitor/ios'
  pod 'CapacitorCamera', :path => '../../node_modules/@capacitor/camera'
  pod 'CapacitorSplashScreen', :path => '../../node_modules/@capacitor/splash-screen'
end

def firebase_pods
  # 指定Firebase版本
  pod 'Firebase/Core', '~> 10.19.0'
  pod 'Firebase/Auth', '~> 10.19.0'
  pod 'Firebase/Firestore', '~> 10.19.0'
  pod 'Firebase/Storage', '~> 10.19.0'
  pod 'Firebase/Analytics', '~> 10.19.0'
end

target 'App' do
  capacitor_pods
  firebase_pods
end

post_install do |installer|
  # 確保部署目標一致
  assertDeploymentTarget(installer)
  
  # 解決腳本構建階段警告和編譯問題
  installer.pods_project.targets.each do |target|
    # 處理腳本構建階段問題
    target.build_phases.each do |build_phase|
      if build_phase.is_a?(Xcodeproj::Project::Object::PBXShellScriptBuildPhase)
        # 啟用基於依賴分析
        build_phase.dependency_file = '$(DERIVED_FILE_DIR)/$(PRODUCT_NAME)-$(CURRENT_ARCH).d'
        build_phase.always_out_of_date = false
        
        # 顯示環境變數
        build_phase.show_env_vars_in_log = '1'
        
        # 確保輸入/輸出路徑存在
        if build_phase.input_paths.nil? || build_phase.input_paths.empty?
          build_phase.input_paths = []
        end
        
        if build_phase.output_paths.nil? || build_phase.output_paths.empty?
          build_phase.output_paths = []
        end
      end
    end
    
    # 處理編譯器設置
    target.build_configurations.each do |config|
      # 確保iOS部署目標
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '14.0'
      
      # 修復FirebaseStorage錯誤
      if target.name.include?('Firebase') || target.name.include?('Google')
        config.build_settings['BUILD_LIBRARY_FOR_DISTRIBUTION'] = 'YES'
        
        # 修復Swift相容性問題
        config.build_settings['SWIFT_VERSION'] = '5.0'
        
        # 禁用嚴格錯誤檢查
        if config.build_settings['OTHER_SWIFT_FLAGS']
          config.build_settings['OTHER_SWIFT_FLAGS'] = config.build_settings['OTHER_SWIFT_FLAGS'].to_s.gsub(/-strict-/, '-no-strict-')
        end
      end
      
      # 修復BoringSSL和gRPC錯誤
      if target.name.include?('BoringSSL') || target.name.include?('gRPC') || target.name.include?('tls_')
        # 修改C編譯器標誌
        if config.build_settings['OTHER_CFLAGS']
          config.build_settings['OTHER_CFLAGS'] = config.build_settings['OTHER_CFLAGS'].
            gsub(/-G\s+/, ' ').
            gsub(/-Werror/, '-Wno-error')
        end
        
        # 修改C++編譯器標誌
        if config.build_settings['OTHER_CPLUSPLUSFLAGS']
          config.build_settings['OTHER_CPLUSPLUSFLAGS'] = config.build_settings['OTHER_CPLUSPLUSFLAGS'].
            gsub(/-G\s+/, ' ').
            gsub(/-Werror/, '-Wno-error')
        end
      end
      
      # 為所有目標啟用新的構建系統
      config.build_settings['ENABLE_USER_SCRIPT_SANDBOXING'] = 'NO'
      
      # 修復重複庫問題
      if config.build_settings['OTHER_LDFLAGS']
        unique_libs = []
        flags = config.build_settings['OTHER_LDFLAGS']
        
        if flags.is_a?(Array)
          flags.each do |flag|
            unique_libs << flag unless flag.start_with?('-l') && unique_libs.any? { |f| f == flag }
          end
          config.build_settings['OTHER_LDFLAGS'] = unique_libs
        end
      end
    end
  end
end
EOL

# 更新Podfile
echo "更新Podfile..."
mv Podfile.new Podfile

# 清理Pods
echo "清理Pods目錄..."
rm -rf Pods Podfile.lock
rm -rf ~/Library/Caches/CocoaPods
rm -rf "${HOME}/Library/Developer/Xcode/DerivedData"/*

# 重新安裝Pods
echo "重新安裝Pods..."
pod install --repo-update

# 創建GoogleService-Info.plist檢查
if [ -f "App/GoogleService-Info.plist" ]; then
  echo "Firebase配置文件已存在"
else
  echo "警告：在 App/GoogleService-Info.plist 找不到Firebase配置文件"
  if [ -f "../../GoogleService-Info.plist" ]; then
    echo "從專案根目錄複製Firebase配置文件..."
    cp "../../GoogleService-Info.plist" "App/"
  fi
fi

# 返回到專案根目錄
cd ../..

# 同步Capacitor
echo "同步Capacitor設定..."
npx cap sync ios

# 檢查AppDelegate.swift是否有Firebase配置代碼
if ! grep -q "FirebaseApp.configure()" ios/App/App/AppDelegate.swift; then
  echo "在AppDelegate中添加Firebase初始化..."
  sed -i '' 's/import UIKit/import UIKit\nimport FirebaseCore/' ios/App/App/AppDelegate.swift
  sed -i '' 's/func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: \[UIApplication.LaunchOptionsKey: Any\]?) -> Bool {/func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {\n        FirebaseApp.configure()/' ios/App/App/AppDelegate.swift
fi

echo "===== 修復完成 ====="
echo ""
echo "請在Xcode中執行以下操作："
echo "1. 選擇Product > Clean Build Folder (⇧⌘K)"
echo "2. 關閉並重新開啟Xcode"
echo "3. 點擊Product > Build (⌘B)"
echo ""
echo "如果還有錯誤，請查看BuildSettings中的具體問題並手動修復" 