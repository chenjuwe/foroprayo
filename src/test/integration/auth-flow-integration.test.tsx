import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Auth from '../../pages/Auth';
import { testHelpers, testUtils, testCoverageMonitor, MockDatabase } from '../setup';
import { TestDataFactory } from '../setup';

// 模擬 useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: () => mockNavigate
  };
});

describe('身分驗證流程集成測試', () => {
  // 啟動測試套件監控
  const testSuite = testCoverageMonitor.startTestSuite('AuthIntegrationTests');
  
  // 設置測試數據庫
  const db = MockDatabase.getInstance();
  
  beforeEach(() => {
    db.reset();
    mockNavigate.mockClear();
    
    // 添加測試用戶
    db.addDocument('users', 'test-user-123', {
      displayName: '測試用戶',
      email: 'test@example.com',
      avatar_url: 'https://example.com/avatar.jpg'
    });
  });
  
  afterEach(() => {
    // 清理測試環境
    vi.clearAllMocks();
  });
  
  it('用戶應該能夠成功登入並跳轉到主頁', async () => {
    // 記錄測試開始時間
    const startTime = performance.now();
    
    // 渲染身分驗證頁面
    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    );
    
    // 等待頁面加載完成
    await waitFor(() => {
      expect(screen.getByText(/歡迎回來/i)).toBeInTheDocument();
    });
    
    // 輸入登入資訊
    const emailInput = screen.getByLabelText(/電子郵件/i);
    const passwordInput = screen.getByLabelText(/密碼/i);
    
    await testUtils.userType(emailInput as HTMLInputElement, 'test@example.com');
    await testUtils.userType(passwordInput as HTMLInputElement, 'password');
    
    // 點擊登入按鈕
    const loginButton = screen.getByText(/登入/i);
    fireEvent.click(loginButton);
    
    // 等待登入流程完成並檢查導航
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
    
    // 記錄測試結束時間和結果
    const endTime = performance.now();
    const duration = endTime - startTime;
    testCoverageMonitor.recordTest('用戶應該能夠成功登入並跳轉到主頁', true, duration);
  });
  
  it('登入失敗應該顯示錯誤訊息', async () => {
    // 記錄測試開始時間
    const startTime = performance.now();
    
    // 渲染身分驗證頁面
    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    );
    
    // 等待頁面加載完成
    await waitFor(() => {
      expect(screen.getByText(/歡迎回來/i)).toBeInTheDocument();
    });
    
    // 輸入錯誤的登入資訊
    const emailInput = screen.getByLabelText(/電子郵件/i);
    const passwordInput = screen.getByLabelText(/密碼/i);
    
    await testUtils.userType(emailInput as HTMLInputElement, 'wrong@example.com');
    await testUtils.userType(passwordInput as HTMLInputElement, 'wrongpassword');
    
    // 點擊登入按鈕
    const loginButton = screen.getByText(/登入/i);
    fireEvent.click(loginButton);
    
    // 等待錯誤訊息出現
    await waitFor(() => {
      expect(screen.getByText(/登入失敗/i)).toBeInTheDocument();
    });
    
    // 確認沒有導航到主頁
    expect(mockNavigate).not.toHaveBeenCalled();
    
    // 記錄測試結束時間和結果
    const endTime = performance.now();
    const duration = endTime - startTime;
    testCoverageMonitor.recordTest('登入失敗應該顯示錯誤訊息', true, duration);
  });
  
  // 測試結束後生成報告
  afterEach(() => {
    const report = testCoverageMonitor.endTestSuite('AuthIntegrationTests');
    console.log('測試報告:', report);
  });
}); 