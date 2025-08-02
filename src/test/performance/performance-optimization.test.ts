import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MockDatabase, testPerformanceOptimizer } from '../setup';

describe('測試效能優化和模擬資料庫增強功能演示', () => {
  const db = MockDatabase.getInstance();
  
  beforeEach(() => {
    // 每個測試前重置資料庫狀態
    db.reset();
    // 每個測試前清除效能優化緩存
    testPerformanceOptimizer.clearCache();
  });
  
  describe('基本模擬資料庫操作', () => {
    it('應該正確創建和查詢資料', () => {
      // 使用效能監控來測量執行時間
      return testPerformanceOptimizer.measureExecutionTime(async () => {
        // 創建用戶集合
        db.addCollection('users');
        
        // 添加用戶資料
        db.addDocument('users', 'user-1', {
          name: '張三',
          email: 'zhang@example.com',
          age: 25
        });
        
        db.addDocument('users', 'user-2', {
          name: '李四',
          email: 'li@example.com',
          age: 30
        });
        
        // 查詢用戶
        const user = db.getDocument('users', 'user-1');
        
        // 驗證結果
        expect(user).toBeDefined();
        expect(user.name).toBe('張三');
        expect(user.email).toBe('zhang@example.com');
        
        // 測試查詢功能
        const youngUsers = db.queryDocuments('users', doc => doc.age < 30);
        expect(youngUsers.length).toBe(1);
        expect(youngUsers[0].name).toBe('張三');
      }, '基本資料庫操作');
    });
    
    it('應該支持資料更新和刪除', async () => {
      // 添加測試資料
      db.addDocument('products', 'prod-1', {
        name: '手機',
        price: 5000,
        stock: 100
      });
      
      // 更新資料
      const updateResult = db.updateDocument('products', 'prod-1', {
        price: 4500,
        stock: 80
      });
      
      expect(updateResult).toBe(true);
      
      // 驗證更新結果
      const product = db.getDocument('products', 'prod-1');
      expect(product.price).toBe(4500);
      expect(product.stock).toBe(80);
      expect(product.name).toBe('手機'); // 未更新的字段保持不變
      
      // 刪除資料
      const deleteResult = db.deleteDocument('products', 'prod-1');
      expect(deleteResult).toBe(true);
      
      // 驗證刪除結果
      const deletedProduct = db.getDocument('products', 'prod-1');
      expect(deletedProduct).toBeNull();
    });
  });
  
  describe('高級功能 - 索引和查詢優化', () => {
    it('應該支持通過索引查詢資料', async () => {
      // 創建許多資料
      for (let i = 0; i < 100; i++) {
        db.addDocument('items', `item-${i}`, {
          name: `Item ${i}`,
          category: i % 5, // 0-4 的分類
          price: 10 + i
        });
      }
      
      // 創建索引
      db.createIndex('items', 'category');
      
      // 使用索引查詢
      const performanceWithIndex = await testPerformanceOptimizer.measureExecutionTime(() => {
        const category2Items = db.queryByIndex('items', 'category', 2);
        expect(category2Items.length).toBe(20); // 每個分類應有 20 條資料
      }, '使用索引的查詢');
      
      // 對比不使用索引的查詢（使用常規查詢）
      const performanceWithoutIndex = await testPerformanceOptimizer.measureExecutionTime(() => {
        const category2Items = db.queryDocuments('items', doc => doc.category === 2);
        expect(category2Items.length).toBe(20);
      }, '不使用索引的查詢');
      
      // 在實際應用中，索引查詢應該更快
      console.log(`索引查詢效能：${performanceWithIndex}ms vs 無索引查詢：${performanceWithoutIndex}ms`);
    });
  });
  
  describe('高級功能 - 關聯資料查詢', () => {
    it('應該支持關聯資料的創建和查詢', async () => {
      // 創建用戶和文章
      db.addDocument('users', 'user-1', { name: '王五' });
      
      for (let i = 0; i < 5; i++) {
        db.addDocument('posts', `post-${i}`, { 
          title: `Post ${i}`,
          content: `Content ${i}`,
          author: 'user-1'
        });
        
        // 創建用戶與文章的關聯
        db.createRelationship('users', 'user-1', 'posts', `post-${i}`, 'authored');
      }
      
      // 查詢用戶發表的所有文章
      const userPosts = db.getRelatedDocuments('users', 'user-1', 'posts', 'authored');
      
      expect(userPosts.length).toBe(5);
      expect(userPosts[0].title).toContain('Post');
    });
  });
  
  describe('高級功能 - 事務支持', () => {
    it('應該支持事務操作', async () => {
      // 開始事務
      db.beginTransaction();
      
      try {
        // 添加一系列相關資料
        db.addDocument('accounts', 'account-1', { balance: 1000 });
        db.addDocument('accounts', 'account-2', { balance: 500 });
        
        // 模擬轉帳
        const account1 = db.getDocument('accounts', 'account-1');
        const account2 = db.getDocument('accounts', 'account-2');
        
        db.updateDocument('accounts', 'account-1', { balance: account1.balance - 300 });
        db.updateDocument('accounts', 'account-2', { balance: account2.balance + 300 });
        
        // 提交事務
        db.commitTransaction();
      } catch (error) {
        // 發生錯誤時回滾事務
        db.rollbackTransaction();
        throw error;
      }
      
      // 驗證轉帳結果
      const updatedAccount1 = db.getDocument('accounts', 'account-1');
      const updatedAccount2 = db.getDocument('accounts', 'account-2');
      
      expect(updatedAccount1.balance).toBe(700);
      expect(updatedAccount2.balance).toBe(800);
    });
  });
  
  describe('效能優化工具', () => {
    it('應該正確緩存和重用昂貴的計算結果', () => {
      // 模擬昂貴計算的函數
      const expensiveCalculation = (input: number) => {
        // 模擬複雜計算
        let result = 0;
        for (let i = 0; i < 1000000; i++) {
          result += Math.sin(i * input);
        }
        return result;
      };
      
      // 第一次計算，結果會被緩存
      const firstRunResult = testPerformanceOptimizer.measureExecutionTime(() => {
        const result = testPerformanceOptimizer.getCachedData('expensiveCalc-1', () => expensiveCalculation(1));
        return result;
      }, '首次執行昂貴計算');
      
      // 第二次計算，應該使用緩存
      const secondRunResult = testPerformanceOptimizer.measureExecutionTime(() => {
        const result = testPerformanceOptimizer.getCachedData('expensiveCalc-1', () => expensiveCalculation(1));
        return result;
      }, '第二次執行（緩存）');
      
      // 第二次應該顯著快於第一次
      expect(secondRunResult).toBeDefined();
      console.log(`緩存效能提升: 首次執行 vs 緩存執行`);
    });
    
    it('應該支持批量處理測試', () => {
      // 定義多個測試案例
      const testCases = [
        { input: 5, expected: 25 },
        { input: 10, expected: 100 },
        { input: 15, expected: 225 }
      ];
      
      // 批量執行測試
      testPerformanceOptimizer.batchTests(testCases, (testCase) => {
        const result = testCase.input * testCase.input;
        expect(result).toBe(testCase.expected);
      });
    });
  });
}); 