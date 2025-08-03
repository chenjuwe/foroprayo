import React, { useEffect, Suspense } from 'react';
import './App.css';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './config/queryClient';
import { Toaster } from './components/ui/toaster';
import { NetworkStatusAlert } from './components/NetworkStatusAlert';
import { usePerformanceMonitor } from './hooks/usePerformanceMonitor';
import { FirebaseAuthProvider } from './contexts/FirebaseAuthContext';
import ErrorBoundary from './components/ErrorBoundary';

// 簡單的載入組件
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#FFE5D9',
    flexDirection: 'column',
    fontFamily: 'Arial, sans-serif'
  }}>
    <div style={{
      width: '50px',
      height: '50px',
      border: '3px solid #f3f3f3',
      borderTop: '3px solid #007bff',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '20px'
    }}></div>
    <p style={{ color: '#333', margin: 0 }}>ForoPrayo 載入中...</p>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

function App() {
  // 使用 usePerformanceMonitor 監控性能（安全包裝）
  try {
    usePerformanceMonitor();
  } catch (error) {
    console.warn('Performance monitor failed:', error);
  }
  
  // 設置全局背景色
  useEffect(() => {
    document.body.style.backgroundColor = '#FFE5D9';
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <FirebaseAuthProvider>
          <div className="App">
            <Suspense fallback={<LoadingSpinner />}>
              <NetworkStatusAlert />
              <RouterProvider router={router} />
              <Toaster />
            </Suspense>
          </div>
        </FirebaseAuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;