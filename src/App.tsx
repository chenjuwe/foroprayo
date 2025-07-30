import React, { useEffect } from 'react';
import './App.css';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './config/queryClient';
import { Toaster } from './components/ui/toaster';
import { NetworkStatusAlert } from './components/NetworkStatusAlert';
import { usePerformanceMonitor } from './hooks/usePerformanceMonitor';
import { FirebaseAuthProvider } from './contexts/FirebaseAuthContext';

function App() {
  // 使用 usePerformanceMonitor 監控性能
  usePerformanceMonitor();
  
  // 設置全局背景色
  useEffect(() => {
    document.body.style.backgroundColor = '#FFE5D9';
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <FirebaseAuthProvider>
        <div className="App">
          <NetworkStatusAlert />
          <RouterProvider router={router} />
          <Toaster />
        </div>
      </FirebaseAuthProvider>
    </QueryClientProvider>
  );
}

export default App;