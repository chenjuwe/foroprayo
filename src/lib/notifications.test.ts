import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export notify functions', async () => {
    // 使用動態 import 來測試模塊
    const module = await import('./notifications');
    expect(module.notify).toBeDefined();
    expect(module.notify.success).toBeDefined();
    expect(module.notify.error).toBeDefined();
    expect(module.notifications).toBeDefined();
  });

  it('should have working notify functions', async () => {
    // 基本功能測試：確保函數不會崩潰
    const module = await import('./notifications');
    
    // 這些調用不應該拋出錯誤
    expect(() => {
      module.notify.success('Test success');
    }).not.toThrow();
    
    expect(() => {
      module.notify.error('Test error');
    }).not.toThrow();
    
    expect(() => {
      module.notify.warning('Test warning');
    }).not.toThrow();
    
    expect(() => {
      module.notify.info('Test info');
    }).not.toThrow();
  });

  it('should have notifications service', async () => {
    const module = await import('./notifications');
    
    // 檢查 notifications 對象存在
    expect(module.notifications).toBeDefined();
    expect(typeof module.notifications).toBe('object');
    
    // 檢查關鍵方法存在
    expect(module.notifications.handleValidationError).toBeDefined();
    expect(module.notifications.loading).toBeDefined();
    
    // 測試這些方法可以被調用而不拋出錯誤
    expect(() => {
      module.notifications.handleValidationError({});
    }).not.toThrow();
  });

  it('should have convenience methods', async () => {
    const module = await import('./notifications');
    
    // 測試便利方法存在
    expect(typeof module.notify.apiError).toBe('function');
    expect(typeof module.notify.confirm).toBe('function');
    
    // 測試它們可以被調用而不拋出錯誤
    expect(() => {
      module.notify.apiError(new Error('test error'));
    }).not.toThrow();
  });

  it('should handle validation errors', async () => {
    const module = await import('./notifications');
    
    // 測試 handleValidationError 不會拋出錯誤
    expect(() => {
      module.notifications.handleValidationError({
        field1: 'Error message 1',
        field2: 'Error message 2'
      });
    }).not.toThrow();
  });
}); 