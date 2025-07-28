import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// 確保在 React 渲染前先引入樣式
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("找不到 root 元素！");
}

const root = createRoot(rootElement);
root.render(
  // 使用嚴格模式提早發現潛在問題
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

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
