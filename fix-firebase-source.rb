#!/usr/bin/env ruby

require 'fileutils'

# 修復Firebase源代碼中的類型問題
puts "開始修復Firebase源代碼..."

# 找到Firebase源代碼目錄
pods_dir = File.expand_path("ios/App/Pods")
firebase_storage_dir = File.join(pods_dir, "FirebaseStorage", "FirebaseStorage", "Sources")

if Dir.exist?(firebase_storage_dir)
  puts "找到FirebaseStorage目錄: #{firebase_storage_dir}"
  
  # 修復Storage.swift
  storage_swift = File.join(firebase_storage_dir, "Storage.swift")
  if File.exist?(storage_swift)
    puts "修復 Storage.swift..."
    content = File.read(storage_swift)
    
    # 修復StorageProvider類型問題
    content.gsub!(/storage\?\.storage/, 'storage!.storage')
    content.gsub!(/storage\?\.reference/, 'storage!.reference')
    
    # 修復AuthInterop和AppCheckInterop類型問題
    content.gsub!(/authInterop\?/, 'authInterop!')
    content.gsub!(/appCheckInterop\?/, 'appCheckInterop!')
    
    File.write(storage_swift, content)
    puts "Storage.swift 修復完成"
  end
  
  # 修復StorageComponent.swift
  storage_component_swift = File.join(firebase_storage_dir, "StorageComponent.swift")
  if File.exist?(storage_component_swift)
    puts "修復 StorageComponent.swift..."
    content = File.read(storage_component_swift)
    
    # 修復類型轉換問題
    content.gsub!(/as\?\s+StorageProvider/, 'as! StorageProvider')
    content.gsub!(/as\?\s+AuthInterop/, 'as! AuthInterop')
    content.gsub!(/as\?\s+AppCheckInterop/, 'as! AppCheckInterop')
    
    File.write(storage_component_swift, content)
    puts "StorageComponent.swift 修復完成"
  end
  
  # 修復StorageTokenAuthorizer.swift
  storage_token_swift = File.join(firebase_storage_dir, "StorageTokenAuthorizer.swift")
  if File.exist?(storage_token_swift)
    puts "修復 StorageTokenAuthorizer.swift..."
    content = File.read(storage_token_swift)
    
    # 修復可選類型問題
    content.gsub!(/authInterop\?/, 'authInterop!')
    content.gsub!(/appCheckInterop\?/, 'appCheckInterop!')
    
    File.write(storage_token_swift, content)
    puts "StorageTokenAuthorizer.swift 修復完成"
  end
  
else
  puts "找不到FirebaseStorage目錄"
end

puts "Firebase源代碼修復完成！" 