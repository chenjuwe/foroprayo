import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notify, notifications } from './notifications';

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

// Mock logger
vi.mock('./logger', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { toast } from '@/hooks/use-toast';

describe('Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Success Notifications', () => {
    it('should show success notification', () => {
      notify.success('Operation completed successfully');
      expect(toast).toHaveBeenCalledWith({
        title: '成功',
        description: 'Operation completed successfully',
        duration: 3000,
      });
    });

    it('should allow custom title and duration', () => {
      notify.success('Custom message', { title: 'Custom Title', duration: 5000 });
      expect(toast).toHaveBeenCalledWith({
        title: 'Custom Title',
        description: 'Custom message',
        duration: 5000,
      });
    });
  });

  describe('Error Notifications', () => {
    it('should show error notification', () => {
      notify.error('Something went wrong');
      expect(toast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: '錯誤',
        description: 'Something went wrong',
        duration: 5000,
      });
    });

    it('should handle error objects', () => {
      const error = new Error('Test error');
      notify.error('Error occurred', error);
      expect(toast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: '錯誤',
        description: 'Error occurred',
        duration: 5000,
      });
    });
  });

  describe('Info Notifications', () => {
    it('should show info notification', () => {
      notify.info('Information message');
      expect(toast).toHaveBeenCalledWith({
        title: '提示',
        description: 'Information message',
        duration: 3000,
      });
    });
  });

  describe('Warning Notifications', () => {
    it('should show warning notification', () => {
      notify.warning('Warning message');
      expect(toast).toHaveBeenCalledWith({
        title: '警告',
        description: 'Warning message',
        duration: 4000,
      });
    });
  });

  describe('API Error Handling', () => {
    it('should handle Error objects', () => {
      const error = new Error('Network error');
      notify.apiError(error);
      expect(toast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: '錯誤',
        description: 'Network error',
        duration: 5000,
      });
    });

    it('should handle string errors', () => {
      notify.apiError('String error message');
      expect(toast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: '錯誤',
        description: 'String error message',
        duration: 5000,
      });
    });

    it('should handle auth errors specifically', () => {
      const authError = new Error('unauthorized access');
      notify.apiError(authError);
      expect(toast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: '錯誤',
        description: '請先登入再進行此操作',
        duration: 5000,
      });
    });

    it('should handle network errors specifically', () => {
      const networkError = new Error('network connection failed');
      notify.apiError(networkError);
      expect(toast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: '錯誤',
        description: '網路連線失敗，請檢查網路狀態',
        duration: 5000,
      });
    });

    it('should use fallback message for unknown errors', () => {
      notify.apiError(null, 'Custom fallback');
      expect(toast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: '錯誤',
        description: 'Custom fallback',
        duration: 5000,
      });
    });
  });

  describe('Confirmation Dialogs', () => {
    it('should show confirmation message', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      
      notify.confirm('Are you sure?', onConfirm, onCancel);
      
      expect(toast).toHaveBeenCalledWith({
        title: '確認',
        description: 'Are you sure?',
        duration: 4000,
      });
    });

    it('should allow custom confirmation options', () => {
      const onConfirm = vi.fn();
      
      notify.confirm('Delete item?', onConfirm, undefined, {
        title: 'Delete Confirmation',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      });
      
      expect(toast).toHaveBeenCalledWith({
        title: 'Delete Confirmation',
        description: 'Delete item?',
        duration: 4000,
      });
    });
  });

  describe('NotificationService Class', () => {
    it('should handle validation errors', () => {
      const validationErrors = {
        email: 'Email is required',
        password: 'Password is too short'
      };
      
      notifications.handleValidationError(validationErrors);
      
      expect(toast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: '表單驗證失敗',
        description: 'Email is required',
        duration: 5000,
      });
    });

    it('should create loading notification', () => {
      const mockToastResult = {
        id: 'toast-id',
        dismiss: vi.fn(),
        update: vi.fn(),
      };
      vi.mocked(toast).mockReturnValue(mockToastResult);
      
      const dismissFn = notifications.loading('Processing data...');
      
      expect(toast).toHaveBeenCalledWith({
        title: '載入中...',
        description: 'Processing data...',
        duration: 0,
      });
      expect(typeof dismissFn).toBe('function');
    });
  });
}); 