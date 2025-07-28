import { toast } from "@/hooks/use-toast";
import { log, LogData } from "./logger";

export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

// 錯誤類型定義
export type NotificationError = Error | string | { message: string; code?: string } | unknown;

// 類型守護函數
function hasMessage(error: unknown): error is { message: string } {
  return typeof error === 'object' && 
         error !== null && 
         'message' in error && 
         typeof (error as Record<string, unknown>).message === 'string';
}

interface NotificationOptions {
  title?: string;
  description?: string;
  duration?: number;
}

class NotificationService {
  // 顯示成功通知
  success(message: string, options?: NotificationOptions): void {
    log.info('Success notification', { message, options });
    
    toast({
      title: options?.title || "成功",
      description: message,
      duration: options?.duration || 3000,
      ...options,
    });
  }

  // 顯示錯誤通知
  error(message: string, error?: NotificationError, options?: NotificationOptions): void {
    log.error('Error notification', { message, error, options });
    
    toast({
      variant: "destructive",
      title: options?.title || "錯誤",
      description: message,
      duration: options?.duration || 5000,
      ...options,
    });
  }

  // 顯示警告通知
  warning(message: string, options?: NotificationOptions): void {
    log.warn('Warning notification', { message, options });
    
    toast({
      title: options?.title || "警告",
      description: message,
      duration: options?.duration || 4000,
      ...options,
    });
  }

  // 顯示資訊通知
  info(message: string, options?: NotificationOptions): void {
    log.info('Info notification', { message, options });
    
    toast({
      title: options?.title || "提示",
      description: message,
      duration: options?.duration || 3000,
      ...options,
    });
  }

  // 處理API錯誤
  handleApiError(error: NotificationError, fallbackMessage = "發生未知錯誤"): void {
    let errorMessage = fallbackMessage;
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (hasMessage(error)) {
      errorMessage = error.message;
    }

    // 特殊錯誤處理
    if (errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
      this.error("請先登入再進行此操作", error);
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      this.error("網路連線失敗，請檢查網路狀態", error);
    } else {
      this.error(errorMessage, error);
    }
  }

  // 確認對話框（替代 confirm）
  confirm(
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    options?: {
      title?: string;
      confirmText?: string;
      cancelText?: string;
    }
  ): void {
    // 這裡可以整合 AlertDialog 組件
    // 暫時使用 toast 來處理
    this.warning(message, {
      title: options?.title || "確認",
    });
    
    // 簡化版本：用戶需要手動點擊確認
    log.info('Confirmation requested', { message, options });
  }

  // 處理表單驗證錯誤
  handleValidationError(errors: Record<string, string>): void {
    const errorMessages = Object.values(errors);
    if (errorMessages.length > 0) {
      this.error(errorMessages[0], null, {
        title: "表單驗證失敗",
      });
    }
  }

  // 顯示載入狀態提示
  loading(message: string): () => void {
    const toastId = toast({
      title: "載入中...",
      description: message,
      duration: 0, // 不自動消失
    });

    // 返回關閉函數
    return () => {
      // 這裡需要根據實際的 toast 實現來關閉
      log.debug('Loading notification dismissed', { message });
    };
  }
}

// 創建全域通知實例
export const notifications = new NotificationService();

// 便利方法
export const notify = {
  success: (message: string, options?: NotificationOptions) => 
    notifications.success(message, options),
  error: (message: string, error?: NotificationError, options?: NotificationOptions) => 
    notifications.error(message, error, options),
  warning: (message: string, options?: NotificationOptions) => 
    notifications.warning(message, options),
  info: (message: string, options?: NotificationOptions) => 
    notifications.info(message, options),
  apiError: (error: NotificationError, fallbackMessage?: string) => 
    notifications.handleApiError(error, fallbackMessage),
  confirm: (
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    options?: { title?: string; confirmText?: string; cancelText?: string }
  ) => notifications.confirm(message, onConfirm, onCancel, options),
}; 