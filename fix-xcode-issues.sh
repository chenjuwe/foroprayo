#!/bin/bash

# 導航到iOS專案目錄
cd ios/App

echo "===== 開始修復Xcode構建問題 ====="

# 1. 修改Podfile以解決編譯器選項問題
cat > PodfileTemp << EOL
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

# 解決常見問題的post_install鉤子
post_install do |installer|
  # 確保部署目標一致
  assertDeploymentTarget(installer)
  
  # 修復構建腳本和編譯器選項問題
  installer.pods_project.targets.each do |target|
    # 修復腳本構建階段問題
    target.build_phases.each do |build_phase|
      if build_phase.is_a?(Xcodeproj::Project::Object::PBXShellScriptBuildPhase)
        build_phase.show_env_vars_in_log = '0'
        
        # 添加依賴分析設置
        build_phase.dependency_file = '$(DERIVED_FILE_DIR)/\$(PRODUCT_NAME)-\$(CURRENT_ARCH).d'
        build_phase.input_paths = []
        build_phase.output_paths = []
      end
    end
    
    # 修復編譯器設置
    target.build_configurations.each do |config|
      # 設置iOS部署目標
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '14.0'
      
      # 禁用有問題的編譯器標誌
      if config.build_settings['OTHER_CFLAGS']
        config.build_settings['OTHER_CFLAGS'] = config.build_settings['OTHER_CFLAGS'].
          gsub(/-G\s/, '').
          gsub(/-unsupported-opt/, '')
      end
      
      # 啟用庫分發構建
      config.build_settings['BUILD_LIBRARY_FOR_DISTRIBUTION'] = 'YES'
      
      # 解決tls_method和tls_record錯誤
      if target.name.include?('BoringSSL-GRPC') || target.name.include?('gRPC')
        if config.build_settings['OTHER_CFLAGS']
          config.build_settings['OTHER_CFLAGS'] = config.build_settings['OTHER_CFLAGS'].
            gsub(/-Werror/, '-Wno-error')
        end
      end
    end
  end
end
EOL

# 備份原始Podfile
mv Podfile Podfile.backup
mv PodfileTemp Podfile

echo "已更新Podfile以修復構建問題"

# 2. 清除舊的Pod安裝
echo "清除Pod緩存和重新安裝..."
rm -rf Pods
rm -rf Podfile.lock

# 3. 重新安裝Pod
pod install --repo-update

# 4. 返回項目根目錄
cd ../..

# 5. 重新同步Capacitor配置
echo "重新同步Capacitor設定..."
npx cap sync ios

echo "===== 修復完成 ====="
echo ""
echo "請在Xcode中執行以下操作："
echo "1. 確保GoogleService-Info.plist已正確添加到專案（右鍵點擊App群組 > Add Files to App...）"
echo "2. 選擇Product > Clean Build Folder"
echo "3. 選擇Product > Build (⌘+B)"
echo ""
echo "如果仍有錯誤，請手動打開Xcode並檢查每個目標的構建設置" 