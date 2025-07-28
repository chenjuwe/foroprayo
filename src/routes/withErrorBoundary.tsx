import React from "react";
import ErrorBoundary from "../components/ErrorBoundary";

// 更安全的錯誤邊界高階組件實現
export const withErrorBoundary = <P extends Record<string, unknown>>(
  Component: React.ComponentType<P>
) => {
  // 返回一個具名組件而非匿名函數
  const WithErrorBoundary = (props: P) => (
    <ErrorBoundary>
      <Component {...props} />
    </ErrorBoundary>
  );

  // 設置更有意義的顯示名稱，幫助調試
  const displayName = Component.displayName || Component.name || 'Component';
  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;
  
  return WithErrorBoundary;
}; 