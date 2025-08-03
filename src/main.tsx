import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// 確保在 React 渲染前先引入樣式
const rootElement = document.getElementById("root");

if (!rootElement) {
  // 如果找不到 root 元素，顯示錯誤並嘗試創建一個
  console.error("找不到 root 元素！嘗試創建一個...");
  
  const newRoot = document.createElement('div');
  newRoot.id = 'root';
  newRoot.style.cssText = `
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #FFE5D9;
    font-family: Arial, sans-serif;
  `;
  newRoot.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <h1 style="color: #721c24; margin-bottom: 20px;">⚠️ 應用程式初始化錯誤</h1>
      <p style="color: #333; margin-bottom: 20px;">無法找到 root 元素，正在嘗試修復...</p>
      <button onclick="window.location.reload()" style="
        background: #007bff;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
      ">重新載入</button>
    </div>
  `;
  
  document.body.appendChild(newRoot);
  
  // 給瀏覽器一點時間渲染錯誤訊息，然後嘗試正常初始化
  setTimeout(() => {
    try {
      const root = createRoot(newRoot);
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
    } catch (error) {
      console.error('應用程式初始化失敗:', error);
      newRoot.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <h1 style="color: #721c24; margin-bottom: 20px;">🚨 應用程式載入失敗</h1>
          <p style="color: #333; margin-bottom: 20px;">請檢查瀏覽器控制台以獲取更多信息</p>
          <pre style="background: white; padding: 10px; border-radius: 4px; text-align: left; font-size: 12px; overflow: auto;">
${error instanceof Error ? error.stack : String(error)}
          </pre>
          <button onclick="window.location.reload()" style="
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 10px;
          ">重新載入</button>
          <button onclick="window.location.href='/test-app.html'" style="
            background: #28a745;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 10px;
          ">診斷工具</button>
        </div>
      `;
    }
  }, 100);
  
  // 不繼續執行正常的初始化流程
  throw new Error("Root 元素不存在，已創建備用元素");
}

try {
  const root = createRoot(rootElement);
  root.render(
    // 使用嚴格模式提早發現潛在問題
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log('✅ ForoPrayo 應用程式成功初始化');
} catch (error) {
  console.error('❌ ForoPrayo 應用程式初始化失敗:', error);
  
  // 顯示友好的錯誤訊息
  rootElement.innerHTML = `
    <div style="
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: #FFE5D9;
      font-family: Arial, sans-serif;
      text-align: center;
      padding: 20px;
    ">
      <div>
        <h1 style="color: #721c24; margin-bottom: 20px;">🚨 React 應用程式載入失敗</h1>
        <p style="color: #333; margin-bottom: 20px;">ForoPrayo 無法正常啟動</p>
        <details style="background: white; padding: 10px; border-radius: 4px; margin: 20px 0;">
          <summary style="cursor: pointer; margin-bottom: 10px;">
            顯示錯誤詳情
          </summary>
          <pre style="font-size: 12px; color: #721c24; text-align: left; overflow: auto;">
${error instanceof Error ? error.stack : String(error)}
          </pre>
        </details>
        <button onclick="window.location.reload()" style="
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          margin: 5px;
        ">重新載入</button>
        <button onclick="window.location.href='/test-app.html'" style="
          background: #28a745;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          margin: 5px;
        ">診斷工具</button>
      </div>
    </div>
  `;
}

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('ServiceWorker registered with scope:', registration.scope);
    }).catch(error => {
      console.error('ServiceWorker registration failed:', error);
    });
  });
}
