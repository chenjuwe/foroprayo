import { log, LogData } from '@/lib/logger';

/**
 * 基礎服務類，提供通用的日誌記錄和錯誤處理功能
 */
export abstract class BaseService {
  protected readonly serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * 記錄操作日誌
   */
  protected logOperation(operation: string, data?: LogData): void {
    log.debug(`${this.serviceName}: ${operation}`, data, this.serviceName);
  }

  /**
   * 處理錯誤並重新拋出
   */
  protected handleError(error: unknown, operation: string): never {
    log.error(`${this.serviceName} error: ${operation}`, error, this.serviceName);
    throw error;
  }

  /**
   * 處理錯誤但不拋出，僅記錄
   * 返回 false 表示發生錯誤
   */
  protected handleErrorSilent(error: unknown, operation: string): false {
    log.error(`${this.serviceName} error: ${operation} (silently handled)`, error, this.serviceName);
    return false;
  }
} 