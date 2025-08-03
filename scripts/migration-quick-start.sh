#!/bin/bash

# Firebase 資料庫遷移快速開始腳本
# 這個腳本將引導您完成從 prayforo 到 foroprayo 的遷移設置

set -e

echo "🚀 Firebase 資料庫遷移快速開始"
echo "================================"
echo "從 prayforo 遷移到 foroprayo"
echo ""

# 檢查 Node.js
echo "📋 檢查系統需求..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安裝，請先安裝 Node.js"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js 版本: $NODE_VERSION"

# 檢查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安裝"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo "✅ npm 版本: $NPM_VERSION"

# 檢查是否已安裝 firebase-admin
echo ""
echo "📦 檢查依賴..."
if npm list firebase-admin &> /dev/null; then
    echo "✅ firebase-admin 已安裝"
else
    echo "⚠️  firebase-admin 未安裝，正在安裝..."
    npm install firebase-admin --save-dev
    echo "✅ firebase-admin 安裝完成"
fi

# 檢查 Firebase CLI
echo ""
echo "🔧 檢查 Firebase CLI..."
if command -v firebase &> /dev/null; then
    FIREBASE_VERSION=$(firebase --version)
    echo "✅ Firebase CLI 已安裝: $FIREBASE_VERSION"
else
    echo "❌ Firebase CLI 未安裝"
    echo "請執行以下命令安裝:"
    echo "npm install -g firebase-tools"
    echo ""
    read -p "是否要現在安裝 Firebase CLI? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm install -g firebase-tools
        echo "✅ Firebase CLI 安裝完成"
    else
        echo "⚠️  請手動安裝 Firebase CLI 後再繼續"
        exit 1
    fi
fi

# 檢查 Firebase 登入狀態
echo ""
echo "🔐 檢查 Firebase 登入狀態..."
if firebase projects:list &> /dev/null; then
    echo "✅ 已登入 Firebase"
else
    echo "❌ 未登入 Firebase"
    echo "正在啟動登入流程..."
    firebase login
fi

# 檢查必要檔案
echo ""
echo "📁 檢查設定檔案..."
REQUIRED_FILES=("firebase.json" "firestore.rules" "firestore.indexes.json" "storage.rules")
MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file 存在"
    else
        echo "❌ $file 不存在"
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo "❌ 缺少必要的設定檔案，請確認專案結構"
    exit 1
fi

# 檢查服務帳戶金鑰檔案
echo ""
echo "🔑 檢查服務帳戶金鑰..."
if [ ! -d "scripts" ]; then
    mkdir scripts
    echo "✅ 建立 scripts 資料夾"
fi

PRAYFORO_KEY="scripts/prayforo-service-account-key.json"
FOROPRAYO_KEY="scripts/foroprayo-service-account-key.json"

if [ ! -f "$PRAYFORO_KEY" ]; then
    echo "❌ 找不到 prayforo 服務帳戶金鑰: $PRAYFORO_KEY"
    echo ""
    echo "請按照以下步驟獲取服務帳戶金鑰："
    echo "1. 前往 Firebase Console (https://console.firebase.google.com)"
    echo "2. 選擇 prayforo 專案"
    echo "3. 點擊 ⚙️ 專案設定 > 服務帳戶"
    echo "4. 點擊 '產生新的私密金鑰'"
    echo "5. 下載 JSON 檔案並重命名為 'prayforo-service-account-key.json'"
    echo "6. 將檔案放置在 scripts/ 資料夾中"
    echo ""
    read -p "完成後按 Enter 繼續..."
    
    if [ ! -f "$PRAYFORO_KEY" ]; then
        echo "❌ 仍然找不到 prayforo 服務帳戶金鑰"
        exit 1
    fi
fi

echo "✅ prayforo 服務帳戶金鑰存在"

if [ ! -f "$FOROPRAYO_KEY" ]; then
    echo "❌ 找不到 foroprayo 服務帳戶金鑰: $FOROPRAYO_KEY"
    echo ""
    echo "請按照以下步驟獲取服務帳戶金鑰："
    echo "1. 在 Firebase Console 中切換到 foroprayo 專案"
    echo "2. 點擊 ⚙️ 專案設定 > 服務帳戶"
    echo "3. 點擊 '產生新的私密金鑰'"
    echo "4. 下載 JSON 檔案並重命名為 'foroprayo-service-account-key.json'"
    echo "5. 將檔案放置在 scripts/ 資料夾中"
    echo ""
    read -p "完成後按 Enter 繼續..."
    
    if [ ! -f "$FOROPRAYO_KEY" ]; then
        echo "❌ 仍然找不到 foroprayo 服務帳戶金鑰"
        exit 1
    fi
fi

echo "✅ foroprayo 服務帳戶金鑰存在"

# 完成設置
echo ""
echo "🎉 設置完成！"
echo "================================"
echo ""
echo "📋 您現在可以執行以下命令："
echo ""
echo "完整遷移 (包含 Firestore、Storage、Authentication):"
echo "  npm run firebase:migrate"
echo ""
echo "分步驟遷移:"
echo "  npm run firebase:migrate:firestore  # 僅遷移 Firestore"
echo "  npm run firebase:migrate:storage    # 僅遷移 Storage"
echo "  npm run firebase:migrate:auth       # 僅遷移 Authentication"
echo ""
echo "部署 Firebase 設定:"
echo "  npm run firebase:deploy             # 部署所有設定"
echo "  npm run firebase:deploy:firestore   # 僅部署 Firestore 規則"
echo "  npm run firebase:deploy:storage     # 僅部署 Storage 規則"
echo ""
echo "⚠️  重要提醒："
echo "- 遷移前請確保 prayforo 專案處於穩定狀態"
echo "- 建議在低流量時段執行遷移"
echo "- 遷移完成後請測試所有功能"
echo ""
echo "📖 詳細說明請參考: FIREBASE_MIGRATION_GUIDE.md"
echo ""

# 詢問是否立即開始遷移
read -p "是否要立即開始完整遷移? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 開始執行完整遷移..."
    npm run firebase:migrate
else
    echo ""
    echo "✅ 設置完成，您可以稍後手動執行遷移命令"
fi 