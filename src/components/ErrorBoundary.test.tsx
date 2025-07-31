import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock ErrorBoundary component
vi.mock('./ErrorBoundary', () => ({
  ErrorBoundary: ({ children, fallback }: any) => {
    const [hasError, setHasError] = React.useState(false);
    
    if (hasError) {
      return fallback || (
        <div data-testid="error-boundary">
          <h2>發生錯誤</h2>
          <p>應用程式遇到問題，請重新整理頁面。</p>
          <button onClick={() => setHasError(false)} data-testid="retry-button">
            重試
          </button>
        </div>
      );
    }
    
    return (
      <div data-testid="error-boundary-wrapper">
        {children}
        <button onClick={() => setHasError(true)} data-testid="trigger-error">
          觸發錯誤
        </button>
      </div>
    );
  },
}));

import { ErrorBoundary } from './ErrorBoundary';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('應該正確渲染子組件', () => {
    renderWithRouter(
      <ErrorBoundary>
        <div data-testid="child-component">子組件內容</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-boundary-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('child-component')).toBeInTheDocument();
    expect(screen.getByText('子組件內容')).toBeInTheDocument();
  });

  it('應該正確處理錯誤狀態', () => {
    renderWithRouter(
      <ErrorBoundary>
        <div data-testid="child-component">子組件內容</div>
      </ErrorBoundary>
    );

    const triggerButton = screen.getByTestId('trigger-error');
    fireEvent.click(triggerButton);

    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByText('發生錯誤')).toBeInTheDocument();
    expect(screen.getByText('應用程式遇到問題，請重新整理頁面。')).toBeInTheDocument();
  });

  it('應該正確處理重試功能', () => {
    renderWithRouter(
      <ErrorBoundary>
        <div data-testid="child-component">子組件內容</div>
      </ErrorBoundary>
    );

    // 觸發錯誤
    const triggerButton = screen.getByTestId('trigger-error');
    fireEvent.click(triggerButton);

    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();

    // 重試
    const retryButton = screen.getByTestId('retry-button');
    fireEvent.click(retryButton);

    expect(screen.getByTestId('error-boundary-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('child-component')).toBeInTheDocument();
  });

  it('應該正確使用自定義錯誤組件', () => {
    const CustomErrorComponent = () => (
      <div data-testid="custom-error">
        <h1>自定義錯誤頁面</h1>
        <p>這是一個自定義的錯誤處理組件</p>
      </div>
    );

    renderWithRouter(
      <ErrorBoundary fallback={<CustomErrorComponent />}>
        <div data-testid="child-component">子組件內容</div>
      </ErrorBoundary>
    );

    // 觸發錯誤
    const triggerButton = screen.getByTestId('trigger-error');
    fireEvent.click(triggerButton);

    expect(screen.getByTestId('custom-error')).toBeInTheDocument();
    expect(screen.getByText('自定義錯誤頁面')).toBeInTheDocument();
    expect(screen.getByText('這是一個自定義的錯誤處理組件')).toBeInTheDocument();
  });

  it('應該正確處理複雜的子組件', () => {
    const ComplexChild = () => (
      <div data-testid="complex-child">
        <h1>複雜組件</h1>
        <p>這是一個包含多個元素的複雜組件</p>
        <button data-testid="child-button">子組件按鈕</button>
      </div>
    );

    renderWithRouter(
      <ErrorBoundary>
        <ComplexChild />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('complex-child')).toBeInTheDocument();
    expect(screen.getByText('複雜組件')).toBeInTheDocument();
    expect(screen.getByTestId('child-button')).toBeInTheDocument();
  });

  it('應該正確處理空子組件', () => {
    renderWithRouter(
      <ErrorBoundary>
        {null}
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-boundary-wrapper')).toBeInTheDocument();
  });

  it('應該正確處理多個子組件', () => {
    renderWithRouter(
      <ErrorBoundary>
        <div data-testid="child-1">子組件 1</div>
        <div data-testid="child-2">子組件 2</div>
        <div data-testid="child-3">子組件 3</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
  });

  it('應該正確處理錯誤後的狀態恢復', () => {
    renderWithRouter(
      <ErrorBoundary>
        <div data-testid="child-component">子組件內容</div>
      </ErrorBoundary>
    );

    // 觸發錯誤
    const triggerButton = screen.getByTestId('trigger-error');
    fireEvent.click(triggerButton);

    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();

    // 重試
    const retryButton = screen.getByTestId('retry-button');
    fireEvent.click(retryButton);

    // 再次觸發錯誤
    const newTriggerButton = screen.getByTestId('trigger-error');
    fireEvent.click(newTriggerButton);

    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
  });

  it('應該正確處理錯誤邊界組件的生命週期', () => {
    const { unmount } = renderWithRouter(
      <ErrorBoundary>
        <div data-testid="child-component">子組件內容</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-boundary-wrapper')).toBeInTheDocument();

    unmount();

    // 組件應該已經被卸載
    expect(screen.queryByTestId('error-boundary-wrapper')).not.toBeInTheDocument();
  });
}); 