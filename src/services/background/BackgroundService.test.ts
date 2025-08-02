// 所有 vi.mock 調用必須在頂部，防止引用問題
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock Firebase modules
vi.mock('@/integrations/firebase/client', () => ({
  db: vi.fn()
}));

// Mock Firestore
vi.mock('firebase/firestore', () => {
  return {
    doc: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    serverTimestamp: vi.fn(() => ({ 
      toDate: () => new Date(),
      seconds: 1672531200, // 2023-01-01T00:00:00Z in seconds
      nanoseconds: 0
    })),
    Timestamp: {
      now: vi.fn(() => ({
        toDate: () => new Date(),
        seconds: 1672531200,
        nanoseconds: 0
      })),
      fromDate: vi.fn((date) => ({
        toDate: () => date,
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: (date.getTime() % 1000) * 1000000
      }))
    },
    collection: vi.fn(),
    getDocs: vi.fn(),
    updateDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
  };
});

// Mock logger
vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

// 導入要測試的 BackgroundService
import { BackgroundService, UserBackground } from './BackgroundService';
import { BaseService } from '../base/BaseService';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';

describe('BackgroundService', () => {
  // 創建 localStorage mock
  let mockLocalStorage: Record<string, any> = {};
  
  // 在每個測試前重置 mock
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 重設 localStorage mock
    mockLocalStorage = {
      getItem: vi.fn((key: string) => {
        return mockLocalStorage[key] || null;
      }),
      setItem: vi.fn((key: string, value: string) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockLocalStorage[key];
      }),
      clear: vi.fn(() => {
        mockLocalStorage = {};
      }),
      key: vi.fn(),
      length: 0
    };
    
    // 設置全局 localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
    
    // 設置 Firebase mocks
    vi.mocked(db).mockReturnValue({} as any);
  });

  // 在測試後恢復原始實現
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create an instance correctly', () => {
    const service = new BackgroundService();
    
    expect(service).toBeInstanceOf(BackgroundService);
    expect(service).toBeInstanceOf(BaseService);
  });
  
  it('should properly handle getUserBackground', async () => {
    // 設置 mock
    const mockDocRef = { id: 'test-user-id' };
    const mockDocSnap = {
      exists: vi.fn(() => true),
      data: vi.fn(() => ({
        background_id: 'bg-1',
        custom_background: 'https://example.com/bg.jpg',
        custom_background_size: 'cover',
        updated_at: { 
          toDate: () => new Date('2023-01-01T00:00:00Z'),
          seconds: 1672531200,
          nanoseconds: 0
        }
      }))
    };
    
    vi.mocked(doc).mockReturnValue(mockDocRef as any);
    vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);
    
    // 執行方法
    const service = new BackgroundService();
    const result = await service.getUserBackground('test-user-id');
    
    // 驗證結果
    expect(doc).toHaveBeenCalledWith({}, 'user_backgrounds', 'test-user-id');
    expect(getDoc).toHaveBeenCalledWith(mockDocRef);
    expect(result).toEqual({
      user_id: 'test-user-id',
      background_id: 'bg-1',
      custom_background: 'https://example.com/bg.jpg',
      custom_background_size: 'cover',
      updated_at: '2023-01-01T00:00:00.000Z'
    });
  });
  
  it('should handle nonexistent document in getUserBackground', async () => {
    // 設置 mock 返回不存在的文檔
    const mockDocRef = { id: 'test-user-id' };
    const mockDocSnap = {
      exists: vi.fn(() => false),
      data: vi.fn()
    };
    
    vi.mocked(doc).mockReturnValue(mockDocRef as any);
    vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);
    
    // 執行方法
    const service = new BackgroundService();
    const result = await service.getUserBackground('test-user-id');
    
    // 驗證結果
    expect(result).toBeNull();
  });
  
  it('should fallback to localStorage on error in getUserBackground', async () => {
    // 設置 doc 拋出錯誤
    vi.mocked(doc).mockImplementation(() => {
      throw new Error('Firestore error');
    });
    
    // 設置 localStorage 模擬數據
    const mockLocalData = {
      user_id: 'test-user-id',
      background_id: 'local-bg',
      custom_background: 'https://example.com/local.jpg'
    };
    mockLocalStorage.setItem('background_test-user-id', JSON.stringify(mockLocalData));
    
    // 執行方法
    const service = new BackgroundService();
    const result = await service.getUserBackground('test-user-id');
    
    // 驗證結果
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('background_test-user-id');
    expect(result).toEqual(mockLocalData);
  });
  
  it('should properly handle upsertUserBackground', async () => {
    // 設置 mock
    const mockDocRef = { id: 'test-user-id' };
    vi.mocked(doc).mockReturnValue(mockDocRef as any);
    vi.mocked(setDoc).mockResolvedValue(undefined);
    
    // 創建測試數據
    const backgroundData: UserBackground = {
      user_id: 'test-user-id',
      background_id: 'bg-2',
      custom_background: 'https://example.com/new-bg.jpg',
      custom_background_size: 'contain'
    };
    
    // 設置 dispatchEvent spy
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    
    // 執行方法
    const service = new BackgroundService();
    await service.upsertUserBackground(backgroundData);
    
    // 驗證結果
    expect(doc).toHaveBeenCalledWith({}, 'user_backgrounds', 'test-user-id');
    expect(setDoc).toHaveBeenCalledWith(
      mockDocRef,
      expect.objectContaining({
        user_id: 'test-user-id',
        background_id: 'bg-2',
        custom_background: 'https://example.com/new-bg.jpg',
        custom_background_size: 'contain',
        updated_at: expect.anything()
      }),
      { merge: true }
    );
    
    // 驗證事件觸發
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
    expect(dispatchSpy.mock.calls[0][0].type).toBe('prayforo-background-updated');
  });
  
  it('should handle error in upsertUserBackground by saving to localStorage', async () => {
    // 設置 doc 拋出錯誤
    vi.mocked(doc).mockImplementation(() => {
      throw new Error('Firestore error');
    });
    
    // 創建測試數據
    const backgroundData: UserBackground = {
      user_id: 'test-user-id',
      background_id: 'bg-error',
      custom_background: null
    };
    
    // 執行方法
    const service = new BackgroundService();
    await service.upsertUserBackground(backgroundData);
    
    // 驗證結果
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'background_test-user-id',
      JSON.stringify(backgroundData)
    );
  });
}); 