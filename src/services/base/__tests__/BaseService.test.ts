import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseService } from '../BaseService';
import { log } from '@/lib/logger';

// Mock logger
vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn()
  }
}));

// 建立測試用的實現類
class TestService extends BaseService {
  constructor() {
    super('TestService');
  }

  // 暴露受保護的方法供測試使用
  public testLogOperation(operation: string, data?: any): void {
    this.logOperation(operation, data);
  }

  public testHandleError(error: unknown, operation: string): never {
    return this.handleError(error, operation);
  }

  public testHandleErrorSilent(error: unknown, operation: string): false {
    return this.handleErrorSilent(error, operation);
  }
}

describe('BaseService', () => {
  let testService: TestService;

  beforeEach(() => {
    vi.clearAllMocks();
    testService = new TestService();
  });

  describe('logOperation', () => {
    it('應該正確記錄操作日誌', () => {
      const operation = 'testOperation';
      const data = { id: '123', value: 'test' };

      testService.testLogOperation(operation, data);

      expect(log.debug).toHaveBeenCalledWith(
        'TestService: testOperation',
        data,
        'TestService'
      );
    });

    it('應該處理沒有數據的情況', () => {
      testService.testLogOperation('noDataOperation');

      expect(log.debug).toHaveBeenCalledWith(
        'TestService: noDataOperation',
        undefined,
        'TestService'
      );
    });
  });

  describe('handleError', () => {
    it('應該記錄錯誤並重新拋出', () => {
      const error = new Error('Test error');
      const operation = 'failedOperation';

      expect(() => {
        testService.testHandleError(error, operation);
      }).toThrow('Test error');

      expect(log.error).toHaveBeenCalledWith(
        'TestService error: failedOperation',
        error,
        'TestService'
      );
    });
  });

  describe('handleErrorSilent', () => {
    it('應該記錄錯誤但不拋出，返回 false', () => {
      const error = new Error('Silent error');
      const operation = 'silentFailOperation';

      const result = testService.testHandleErrorSilent(error, operation);

      expect(result).toBe(false);
      expect(log.error).toHaveBeenCalledWith(
        'TestService error: silentFailOperation (silently handled)',
        error,
        'TestService'
      );
    });
  });
});
