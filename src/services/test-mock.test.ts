import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createServiceMock, TestDataFactory, MockTimestamp } from '../test/setup';
// 匯入實際服務以便類型檢查
import { PrayerService } from './prayer/PrayerService';

// 定義測試所需的類型
type User = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
};

type AuthResult = {
  success: boolean;
  user?: User;
  error?: string;
};

// 測試服務層模擬工具
describe('服務層模擬工具測試', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createServiceMock', () => {
    it('應該能夠創建基本的服務層模擬', () => {
      // 定義模擬服務方法
      const mockMethods = {
        getPrayer: (id: string) => ({ id, content: 'Test Prayer' }),
        createPrayer: (data: any) => ({ id: 'new-id', ...data }),
        updatePrayer: (id: string, data: any) => ({ id, ...data, updated: true }),
        deletePrayer: (id: string) => ({ success: true, id }),
      };
      
      // 使用工廠函數創建模擬服務
      const mockService = createServiceMock(mockMethods);
      
      // 檢查模擬方法是否正確創建
      expect(mockService.getPrayer).toBeDefined();
      expect(mockService.createPrayer).toBeDefined();
      expect(mockService.updatePrayer).toBeDefined();
      expect(mockService.deletePrayer).toBeDefined();
      
      // 確認模擬方法能正確運行
      const result = mockService.getPrayer('test-id');
      expect(result).toEqual({ id: 'test-id', content: 'Test Prayer' });
      
      // 確認模擬方法被調用
      expect(mockService.getPrayer).toHaveBeenCalledWith('test-id');
      expect(mockService.getPrayer).toHaveBeenCalledTimes(1);
    });
    
    it('應該能夠跟踪複雜的模擬服務調用', async () => {
      // 創建異步模擬服務
      const mockAsyncService = createServiceMock({
        fetchData: async () => ({ success: true, data: [1, 2, 3] }),
        processItem: async (item: number) => item * 2,
        handleError: async (error: Error) => ({ handled: true, error: error.message }),
      });
      
      // 測試異步調用
      const result = await mockAsyncService.fetchData();
      expect(result).toEqual({ success: true, data: [1, 2, 3] });
      
      // 處理多個項目
      const items = result.data;
      const processedItems = await Promise.all(items.map((item: number) => mockAsyncService.processItem(item)));
      
      expect(processedItems).toEqual([2, 4, 6]);
      expect(mockAsyncService.processItem).toHaveBeenCalledTimes(3);
      expect(mockAsyncService.processItem).toHaveBeenNthCalledWith(1, 1);
      expect(mockAsyncService.processItem).toHaveBeenNthCalledWith(2, 2);
      expect(mockAsyncService.processItem).toHaveBeenNthCalledWith(3, 3);
    });
  });
  
  describe('實際服務模擬整合', () => {
    // 創建模擬服務
    const mockPrayerService = createServiceMock({
      getPrayers: () => Promise.resolve([
        TestDataFactory.createPrayer(),
        TestDataFactory.createPrayer({ id: 'prayer-456' }),
      ]),
      createPrayer: (data: any) => Promise.resolve({ 
        id: 'new-prayer', 
        ...data,
        timestamp: MockTimestamp.now(),
      }),
      deletePrayer: (id: string) => Promise.resolve({ success: true }),
    });
    
    it('應該能整合現有服務的模擬功能', async () => {
      // 獲取代禱列表
      const prayers = await mockPrayerService.getPrayers();
      expect(prayers).toHaveLength(2);
      expect(prayers[0].id).toBe('prayer-123');
      expect(prayers[1].id).toBe('prayer-456');
      
      // 創建新代禱
      const newPrayer = await mockPrayerService.createPrayer({ 
        content: '新的代禱內容',
        user_id: 'test-user',
      });
      
      expect(newPrayer.id).toBe('new-prayer');
      expect(newPrayer.content).toBe('新的代禱內容');
      expect(newPrayer.timestamp).toBeDefined();
      
      // 確認調用參數
      expect(mockPrayerService.createPrayer).toHaveBeenCalledWith({
        content: '新的代禱內容',
        user_id: 'test-user',
      });
    });
  });
  
  describe('服務繼承模擬', () => {
    it('應該能夠模擬通用的認證服務', () => {
      // 模擬通用認證服務
      const mockAuthService = createServiceMock({
        signIn: async (email: string, password: string): Promise<AuthResult> => {
          if (email === 'test@example.com' && password === 'password') {
            return { 
              success: true,
              user: TestDataFactory.createUser() 
            };
          }
          return { success: false, error: 'Invalid credentials' };
        },
        
        signOut: async (): Promise<{ success: boolean }> => ({ success: true }),
        
        getCurrentUser: (): User | null => TestDataFactory.createUser(),
      });
      
      // 測試登入
      return mockAuthService.signIn('test@example.com', 'password')
        .then((result: AuthResult) => {
          expect(result.success).toBe(true);
          expect(result.user).toBeDefined();
          expect(result.user!.uid).toBe('test-user-123');
        });
    });
  });
}); 