/**
 * 優化測試範例
 * 
 * 這個文件展示如何使用新的測試優化工具進行測試。
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  MockDatabase, 
  testPerformanceOptimizer, 
  renderWithProviders 
} from '../setup';
import { loadStandardTestData } from '../fixtures/standard-test-data';
import { createOptimizedTestSuite } from '../test-optimization-guide';

// 使用 MockDatabase 單例
const db = MockDatabase.getInstance();

// 標準化測試數據
describe('優化測試範例 - 標準方式', () => {
  beforeEach(() => {
    // 重置數據庫狀態
    db.reset();
    
    // 載入標準測試數據
    loadStandardTestData(db);
  });

  afterEach(() => {
    // 清理測試數據
    db.reset();
  });

  it('應該能夠查詢測試用戶', async () => {
    // 使用效能優化工具測量執行時間
    await testPerformanceOptimizer.measureExecutionTime(async () => {
      // 執行查詢
      const users = db.getAllDocuments('users');
      
      // 驗證結果
      expect(users).toHaveLength(5);
      expect(users[0].displayName).toBe('測試用戶1');
    }, '查詢用戶測試');
  });

  it('應該能夠查詢用戶的代禱', async () => {
    await testPerformanceOptimizer.measureExecutionTime(async () => {
      // 查詢特定用戶的代禱
      const prayers = db.queryDocuments('prayers', prayer => prayer.user_id === 'user-1');
      
      // 驗證結果
      expect(prayers).toHaveLength(2);
    }, '查詢用戶代禱測試');
  });
  
  it('應該能夠獲取代禱的回應', async () => {
    await testPerformanceOptimizer.measureExecutionTime(async () => {
      // 通過關聯查詢特定代禱的回應
      const responses = db.getRelatedDocuments('prayers', 'prayer-1', 'responses', 'has_responses');
      
      // 驗證結果
      expect(responses).toHaveLength(2);
    }, '獲取代禱回應測試');
  });
});

// 使用優化的測試套件模板
createOptimizedTestSuite(
  '優化測試範例 - 使用優化套件',
  {
    '應該能夠批量測試多個用戶查詢': async () => {
      // 批量測試不同用戶ID的查詢
      const userIds = ['user-1', 'user-2', 'user-3'];
      
      for (const userId of userIds) {
        // 使用緩存數據
        const user = testPerformanceOptimizer.getCachedData(
          `user-${userId}`,
          () => db.getDocument('users', userId)
        );
        
        expect(user).toBeDefined();
        expect(user.uid).toBe(userId);
      }
    },
    
    '應該能夠使用索引加速查詢': async () => {
      // 創建索引
      db.createIndex('prayers', 'is_answered');
      
      // 使用索引查詢已回答的代禱
      const answeredPrayers = db.queryByIndex('prayers', 'is_answered', true);
      
      expect(answeredPrayers).toHaveLength(1);
      expect(answeredPrayers[0].id).toBe('prayer-3');
    },
    
    '應該能夠處理用戶與代禱的關聯': async () => {
      // 獲取用戶發布的所有代禱
      const userPrayers = db.getRelatedDocuments('users', 'user-2', 'prayers', 'authored');
      
      expect(userPrayers).toHaveLength(2);
      expect(userPrayers.map(p => p.id).sort()).toEqual(['prayer-2', 'prayer-5'].sort());
    },
  },
  // 設置函數
  async () => {
    // 載入標準測試數據
    loadStandardTestData(db);
  },
  // 清理函數
  async () => {
    db.reset();
  }
); 