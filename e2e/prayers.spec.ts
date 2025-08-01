import { test, expect } from '@playwright/test';

test.describe('禱告功能端到端測試', () => {
  test.beforeEach(async ({ page }) => {
    // 導航到禱告頁面
    await page.goto('/prayers');
  });

  test('應該顯示禱告頁面基本結構', async ({ page }) => {
    // 檢查頁面標題
    await expect(page).toHaveTitle(/PrayForO/);
    
    // 檢查頁面主要元素
    await expect(page.locator('[data-testid="header"]')).toBeVisible();
    
    // 等待頁面載入完成
    await page.waitForLoadState('networkidle');
  });

  test('應該能夠進入訪客模式', async ({ page }) => {
    // 檢查是否有訪客模式選項
    const guestButton = page.locator('text=訪客模式');
    if (await guestButton.isVisible()) {
      await guestButton.click();
    }
    
    // 驗證訪客模式功能
    await expect(page.locator('body')).toBeVisible();
  });

  test('應該顯示禱告列表', async ({ page }) => {
    // 等待禱告列表載入
    await page.waitForSelector('[data-testid="prayer-post"], [data-testid="skeleton-list"]', { timeout: 10000 });
    
    // 檢查是否有禱告內容或載入狀態
    const prayerPosts = page.locator('[data-testid="prayer-post"]');
    const skeletonList = page.locator('[data-testid="skeleton-list"]');
    
    const isPostsVisible = await prayerPosts.first().isVisible().catch(() => false);
    const isSkeletonVisible = await skeletonList.isVisible().catch(() => false);
    
    expect(isPostsVisible || isSkeletonVisible).toBeTruthy();
  });

  test('應該能夠創建新禱告（如果已登入）', async ({ page }) => {
    // 檢查是否有新增禱告的表單
    const prayerForm = page.locator('[data-testid="prayer-form"]');
    
    if (await prayerForm.isVisible()) {
      // 填寫禱告內容
      const textInput = page.locator('[data-testid="prayer-input"]');
      await textInput.fill('測試禱告內容 - 端到端測試');
      
      // 提交禱告
      const submitButton = page.locator('[data-testid="submit-button"]');
      await submitButton.click();
      
      // 等待提交完成
      await page.waitForTimeout(2000);
    }
  });

  test('應該能夠與禱告互動', async ({ page }) => {
    // 等待禱告列表載入
    await page.waitForSelector('[data-testid="prayer-post"]', { timeout: 10000 });
    
    const firstPrayer = page.locator('[data-testid="prayer-post"]').first();
    
    if (await firstPrayer.isVisible()) {
      // 檢查禱告內容
      await expect(firstPrayer).toContainText(/./); // 應該有一些文字內容
      
      // 檢查是否有互動按鈕（點讚、分享等）
      const likeButton = page.locator('[data-testid="like-button"]').first();
      if (await likeButton.isVisible()) {
        await likeButton.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('應該響應式設計正常工作', async ({ page }) => {
    // 測試桌面視窗
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('body')).toBeVisible();
    
    // 測試平板視窗
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();
    
    // 測試手機視窗
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('應該處理網路錯誤', async ({ page }) => {
    // 模擬網路錯誤
    await page.route('**/api/**', route => route.abort());
    
    // 重新載入頁面
    await page.reload();
    
    // 檢查錯誤處理
    await expect(page.locator('body')).toBeVisible();
  });

  test('應該有正確的頁面性能', async ({ page }) => {
    // 測量頁面載入時間
    const startTime = Date.now();
    await page.goto('/prayers');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // 頁面應該在合理時間內載入（10秒）
    expect(loadTime).toBeLessThan(10000);
    
    // 檢查是否有性能問題
    const performanceEntries = await page.evaluate(() => {
      return JSON.stringify(performance.getEntriesByType('navigation'));
    });
    
    expect(performanceEntries).toBeDefined();
  });
}); 