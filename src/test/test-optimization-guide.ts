/**
 * 測試優化指南與工具
 * 
 * 本文件提供測試優化的最佳實踐和通用工具，用於提升測試效能和可維護性。
 */

import { 
  renderWithProviders, 
  testPerformanceOptimizer, 
  MockDatabase, 
  TestDataFactory 
} from './setup';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * 建立優化測試套件的模板
 * 
 * @param suiteName 測試套件名稱
 * @param tests 測試函數集合
 * @param setupFn 可選的設置函數
 * @param teardownFn 可選的清理函數
 */
export function createOptimizedTestSuite(
  suiteName: string,
  tests: Record<string, () => void | Promise<void>>,
  setupFn?: () => void | Promise<void>,
  teardownFn?: () => void | Promise<void>
) {
  describe(suiteName, () => {
    // 測量整個測試套件的執行時間
    const testSuiteStartTime = performance.now();
    
    // 統一的設置和清理
    beforeEach(async () => {
      // 清除效能優化工具的緩存
      testPerformanceOptimizer.clearCache();
      
      // 執行自定義設置
      if (setupFn) {
        await setupFn();
      }
    });
    
    afterEach(async () => {
      // 執行自定義清理
      if (teardownFn) {
        await teardownFn();
      }
    });
    
    // 創建並執行所有測試
    Object.entries(tests).forEach(([testName, testFn]) => {
      it(testName, async () => {
        // 使用效能優化工具測量每個測試的執行時間
        await testPerformanceOptimizer.measureExecutionTime(
          testFn,
          `測試：${testName}`
        );
      });
    });
    
    // 測試套件結束後輸出總執行時間
    afterEach(() => {
      const testSuiteEndTime = performance.now();
      const totalTime = testSuiteEndTime - testSuiteStartTime;
      console.log(`🧪 測試套件「${suiteName}」總執行時間: ${totalTime.toFixed(2)}ms`);
    });
  });
}

/**
 * 優化的元件測試幫助函數
 * 
 * @param componentName 元件名稱
 * @param renderFn 渲染元件的函數
 * @returns 渲染結果和測試工具
 */
export function renderOptimizedComponent<T extends HTMLElement = HTMLElement>(
  componentName: string,
  renderFn: () => ReturnType<typeof renderWithProviders>
) {
  // 測量元件渲染時間
  const startTime = performance.now();
  const result = renderFn();
  const endTime = performance.now();
  const renderTime = endTime - startTime;
  
  console.log(`🖌️ 渲染元件「${componentName}」耗時: ${renderTime.toFixed(2)}ms`);
  
  return result;
}

/**
 * 常用測試數據建立器
 */
export const testData = {
  /**
   * 創建測試用戶數據
   * @param count 用戶數量
   * @returns 測試用戶列表
   */
  createUsers(count: number) {
    return Array.from({ length: count }).map((_, index) => 
      TestDataFactory.createUser({
        uid: `test-user-${index}`,
        displayName: `測試用戶 ${index}`,
        email: `test${index}@example.com`
      })
    );
  },
  
  /**
   * 創建測試代禱數據
   * @param count 代禱數量
   * @param userId 指定用戶 ID (可選)
   * @returns 測試代禱列表
   */
  createPrayers(count: number, userId?: string) {
    return Array.from({ length: count }).map((_, index) => 
      TestDataFactory.createPrayer({
        id: `prayer-${index}`,
        content: `這是第 ${index} 個測試代禱內容`,
        user_id: userId || `test-user-${index % 5}`,
        user_name: `測試用戶 ${index % 5}`,
      })
    );
  },
  
  /**
   * 創建測試回應數據
   * @param prayerId 代禱 ID
   * @param count 回應數量
   * @returns 測試回應列表
   */
  createResponses(prayerId: string, count: number) {
    return Array.from({ length: count }).map((_, index) => 
      TestDataFactory.createPrayerResponse({
        id: `response-${index}-for-${prayerId}`,
        prayer_id: prayerId,
        content: `這是第 ${index} 個對代禱 ${prayerId} 的回應`,
        user_id: `test-user-${index % 7}`,
        user_name: `回應用戶 ${index % 7}`,
      })
    );
  },
  
  /**
   * 建立關聯數據模型
   * @param db MockDatabase 實例
   */
  setupRelationalData(db: MockDatabase) {
    // 創建用戶
    const users = this.createUsers(10);
    users.forEach(user => {
      db.addDocument('users', user.uid, user);
    });
    
    // 創建代禱
    const prayers = this.createPrayers(20, users[0].uid);
    prayers.forEach(prayer => {
      db.addDocument('prayers', prayer.id, prayer);
      
      // 創建用戶與代禱的關聯
      db.createRelationship('users', prayer.user_id, 'prayers', prayer.id, 'authored');
      
      // 為每個代禱添加回應
      const responses = this.createResponses(prayer.id, 5);
      responses.forEach(response => {
        db.addDocument('responses', response.id, response);
        db.createRelationship('prayers', prayer.id, 'responses', response.id, 'has_responses');
      });
    });
    
    return {
      users,
      prayers,
      getResponses: (prayerId: string) => 
        db.getRelatedDocuments('prayers', prayerId, 'responses', 'has_responses')
    };
  }
}; 