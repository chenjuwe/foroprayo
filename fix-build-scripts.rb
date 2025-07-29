#!/usr/bin/env ruby
require 'xcodeproj'

# 專門用於修復腳本構建階段問題的Ruby腳本

def fix_script_phases(project_path)
  puts "修復Xcode項目: #{project_path}"
  
  project = Xcodeproj::Project.open(project_path)
  
  # 遍歷所有目標
  project.targets.each do |target|
    puts "處理目標: #{target.name}"
    
    # 遍歷所有構建階段
    target.build_phases.each do |phase|
      if phase.is_a?(Xcodeproj::Project::Object::PBXShellScriptBuildPhase)
        puts "- 修復腳本階段: #{phase.name || 'Unnamed'}"
        
        # 設置基於依賴性分析
        phase.dependency_file = '$(DERIVED_FILE_DIR)/$(PRODUCT_NAME)-$(CURRENT_ARCH).d'
        phase.input_file_list_paths ||= []
        phase.output_file_list_paths ||= []
        
        # 確保有輸入/輸出文件
        if phase.input_paths.nil? || phase.input_paths.empty?
          phase.input_paths = []
        end
        
        if phase.output_paths.nil? || phase.output_paths.empty?
          phase.output_paths = ["$(DERIVED_FILE_DIR)/$(INPUT_FILE_PATH:base).o"]
        end
        
        # 顯示環境變數
        phase.show_env_vars_in_log = '1'
        
        # 禁用總是過期標誌
        phase.always_out_of_date = false
      end
    end
  end
  
  # 儲存修改後的項目
  project.save
  puts "已保存修改到項目文件"
end

# 主程序
if __FILE__ == $0
  if ARGV.length != 1
    puts "用法: ruby fix-build-scripts.rb <path/to/project.xcodeproj>"
    exit 1
  end
  
  project_path = ARGV[0]
  fix_script_phases(project_path)
end 