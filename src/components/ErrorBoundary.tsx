import React, { Component, ErrorInfo, ReactNode } from 'react';
import { log } from '@/lib/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static override getDerivedStateFromError(error: Error): State {
    // 更新 state，以便下一次渲染可以顯示備用 UI
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 將錯誤記錄到日誌系統中
    log.error("React ErrorBoundary 捕獲到未處理錯誤", { 
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }, 
      errorInfo: {
        componentStack: errorInfo.componentStack
      }
    }, 'ErrorBoundary');
    
    // 在開發環境中，也在 console 中顯示錯誤
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary 捕獲到錯誤:', error);
      console.error('錯誤信息:', errorInfo);
    }
  }

  public override render() {
    if (this.state.hasError) {
      // 您可以渲染任何自定義的備用 UI
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-4 text-center">
          <h1 className="text-2xl font-bold mb-4">糟糕，發生了一些未知的錯誤。</h1>
          <p className="mb-6 text-muted-foreground">我們已經自動記錄了這個問題，並會盡快修復它。</p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mb-4 text-left max-w-md">
              <summary className="cursor-pointer text-sm text-muted-foreground mb-2">
                開發者信息（點擊展開）
              </summary>
              <div className="text-xs bg-muted p-3 rounded overflow-auto">
                <p><strong>錯誤類型:</strong> {this.state.error.name}</p>
                <p><strong>錯誤訊息:</strong> {this.state.error.message}</p>
                <p><strong>錯誤堆疊:</strong></p>
                <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
              </div>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            刷新頁面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 