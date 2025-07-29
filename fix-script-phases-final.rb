#!/usr/bin/env ruby
require 'xcodeproj'

# 修復腳本階段問題，特別是alwaysOutOfDate屬性類型錯誤
def fix_script_phases(project_path)
  puts "修復腳本階段問題: #{project_path}"
  
  project = Xcodeproj::Project.open(project_path)
  
  # 遍歷所有目標
  project.targets.each do |target|
    puts "處理目標: #{target.name}"
    
    # 遍歷所有構建階段
    target.build_phases.each do |phase|
      if phase.is_a?(Xcodeproj::Project::Object::PBXShellScriptBuildPhase)
        # 獲取腳本階段名稱用於標識
        phase_name = phase.name || "unnamed_#{phase.uuid}"
        puts "- 處理腳本階段: #{phase_name}"
        
        # 1. 清除依賴文件設置
        if phase.respond_to?(:dependency_file=)
          phase.dependency_file = nil
          puts "  - 已移除依賴文件設置"
        end
        
        # 2. 設置alwaysOutOfDate屬性為字符串值
        # XcodeProj期望的是字符串而非布爾值
        if phase.respond_to?(:always_out_of_date=)
          begin
            phase.always_out_of_date = nil
            puts "  - 已重置always_out_of_date屬性"
          rescue => e
            puts "  - 無法設置always_out_of_date: #{e.message}"
          end
        end
        
        # 3. 清除輸入和輸出路徑
        if phase.respond_to?(:input_paths=)
          phase.input_paths = []
          puts "  - 已清除輸入路徑"
        end
        
        if phase.respond_to?(:output_paths=)
          phase.output_paths = []
          puts "  - 已清除輸出路徑"
        end
        
        # 4. 設置其他屬性
        if phase.respond_to?(:show_env_vars_in_log=)
          phase.show_env_vars_in_log = '1'
          puts "  - 已設置顯示環境變數"
        end
        
        # 5. 直接修改屬性（繞過類型檢查）
        if phase.respond_to?(:attributes)
          begin
            phase.attributes["alwaysOutOfDate"] = "1"
            puts "  - 已直接設置屬性"
          rescue => e
            puts "  - 無法直接設置屬性: #{e.message}"
          end
        end
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
    puts "用法: ruby fix-script-phases-final.rb <path/to/project.xcodeproj>"
    exit 1
  end
  
  project_path = ARGV[0]
  fix_script_phases(project_path)
end 