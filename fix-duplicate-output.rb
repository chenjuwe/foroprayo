#!/usr/bin/env ruby
require 'xcodeproj'

# 這個腳本專門解決重複輸出文件的問題

def fix_duplicate_outputs(project_path)
  puts "修復重複輸出文件問題: #{project_path}"
  
  project = Xcodeproj::Project.open(project_path)
  
  # 遍歷所有目標
  project.targets.each do |target|
    puts "處理目標: #{target.name}"
    
    # 追蹤已使用的輸出路徑，確保唯一性
    used_dependency_files = {}
    
    # 遍歷所有構建階段
    target.build_phases.each do |phase|
      if phase.is_a?(Xcodeproj::Project::Object::PBXShellScriptBuildPhase)
        # 獲取腳本階段名稱用於標識
        phase_name = phase.name || "Unnamed-#{phase.object_id}"
        puts "- 處理腳本階段: #{phase_name}"
        
        # 創建唯一的依賴文件路徑
        unique_suffix = phase_name.gsub(/\s+/, '-').gsub(/\W+/, '-').downcase
        unique_dependency_file = "$(DERIVED_FILE_DIR)/$(PRODUCT_NAME)-#{unique_suffix}.d"
        
        # 設置唯一的依賴文件
        phase.dependency_file = unique_dependency_file
        puts "  設置依賴文件: #{unique_dependency_file}"
        
        # 確保其他設置正確
        phase.always_out_of_date = false
        phase.show_env_vars_in_log = '1'
        
        # 創建唯一的輸出路徑
        if phase.output_paths.nil? || phase.output_paths.empty?
          phase.output_paths = ["$(DERIVED_FILE_DIR)/$(PRODUCT_NAME)-#{unique_suffix}-output.txt"]
        else
          # 如果已有輸出路徑，確保它們是唯一的
          unique_outputs = []
          phase.output_paths.each_with_index do |path, index|
            unique_output = "$(DERIVED_FILE_DIR)/$(PRODUCT_NAME)-#{unique_suffix}-output-#{index}.txt"
            unique_outputs << unique_output
          end
          phase.output_paths = unique_outputs
        end
        
        puts "  設置輸出路徑: #{phase.output_paths.join(', ')}"
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
    puts "用法: ruby fix-duplicate-output.rb <path/to/project.xcodeproj>"
    exit 1
  end
  
  project_path = ARGV[0]
  fix_duplicate_outputs(project_path)
end 