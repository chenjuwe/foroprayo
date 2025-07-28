import { log } from './logger';
import { notify } from './notifications';
import { ERROR_MESSAGES } from '@/constants';

export interface AppError extends Error {
  code?: string;
  details?: Record<string, unknown>;
  isUserFriendly?: boolean;
}

export class ErrorHandler {
  /**
   * 處理應用程式錯誤
   */
  static handle(error: unknown, context?: string): void {
    const appError = this.normalizeError(error);
    
    // 記錄錯誤
    log.error(`Error in ${context || 'unknown context'}`, appError, 'ErrorHandler');
    
    // 顯示用戶友善的錯誤訊息
    if (appError.isUserFriendly) {
      notify.error(appError.message);
    } else {
      this.showUserFriendlyError(appError);
    }
  }

  /**
   * 標準化錯誤物件
   */
  private static normalizeError(error: unknown): AppError {
    if (error instanceof Error) {
      return {
        ...error,
        isUserFriendly: false,
      };
    }
    
    if (typeof error === 'string') {
      return {
        name: 'AppError',
        message: error,
        isUserFriendly: false,
      };
    }
    
    return {
      name: 'UnknownError',
      message: ERROR_MESSAGES.UNKNOWN_ERROR,
      isUserFriendly: false,
    };
  }

  /**
   * 顯示用戶友善的錯誤訊息
   */
  private static showUserFriendlyError(error: AppError): void {
    let userMessage: string = ERROR_MESSAGES.UNKNOWN_ERROR;
    
    // 根據錯誤類型顯示不同的訊息
    if (error.message.includes('auth') || error.message.includes('unauthorized')) {
      userMessage = ERROR_MESSAGES.AUTH_ERROR;
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      userMessage = ERROR_MESSAGES.NETWORK_ERROR;
    } else if (error.message.includes('permission') || error.message.includes('RLS')) {
      userMessage = ERROR_MESSAGES.PERMISSION_ERROR;
    } else if (error.message.includes('validation')) {
      userMessage = ERROR_MESSAGES.VALIDATION_ERROR;
    }
    
    notify.error(userMessage);
  }

  /**
   * 處理 API 錯誤
   */
  static handleApiError(error: unknown, operation: string): void {
    const appError = this.normalizeError(error);
    
    log.error(`API Error in ${operation}`, appError, 'ErrorHandler');
    
    // 根據操作類型顯示特定錯誤訊息
    switch (operation) {
      case 'createPrayer':
        notify.error(ERROR_MESSAGES.PRAYER_CREATE_ERROR);
        break;
      case 'updatePrayer':
        notify.error(ERROR_MESSAGES.PRAYER_UPDATE_ERROR);
        break;
      case 'deletePrayer':
        notify.error(ERROR_MESSAGES.PRAYER_DELETE_ERROR);
        break;
      case 'createResponse':
        notify.error(ERROR_MESSAGES.RESPONSE_CREATE_ERROR);
        break;
      case 'updateResponse':
        notify.error(ERROR_MESSAGES.RESPONSE_UPDATE_ERROR);
        break;
      case 'deleteResponse':
        notify.error(ERROR_MESSAGES.RESPONSE_DELETE_ERROR);
        break;
      default:
        this.showUserFriendlyError(appError);
    }
  }

  /**
   * 處理表單驗證錯誤
   */
  static handleValidationError(errors: Record<string, string[]>): void {
    const firstError = Object.values(errors)[0]?.[0];
    if (firstError) {
      notify.error(firstError, null, {
        title: '表單驗證失敗',
      });
    }
  }
} 