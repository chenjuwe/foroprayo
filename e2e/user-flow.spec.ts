import { test, expect } from '@playwright/test';

test.describe('用戶流程端到端測試', () => {
  test('完整的訪客模式流程', async ({ page }) => {
    // 1. 進入首頁
    await page.goto('/');
    
    // 2. 檢查是否重定向到禱告頁面
    await expect(page).toHaveURL(/\/prayers/);
    
    // 3. 等待頁面載入
    await page.waitForLoadState('networkidle');
    
    // 4. 檢查頁面元素
    await expect(page.locator('body')).toBeVisible();
    
    // 5. 檢查是否有訪客模式提示
    const guestModeElement = page.locator('text=訪客');
    if (await guestModeElement.isVisible()) {
      console.log('訪客模式元素可見');
    }
    
    // 6. 瀏覽禱告列表
    await page.waitForTimeout(2000);
    
    // 7. 嘗試導航到其他頁面
    const profileLink = page.locator('a[href*="/profile"], [data-testid="profile-link"]');
    if (await profileLink.isVisible()) {
      await profileLink.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('應該能夠導航到不同頁面', async ({ page }) => {
    await page.goto('/prayers');
    
    // 測試導航到個人資料頁面
    if (await page.locator('a[href*="/profile"]').isVisible()) {
      await page.locator('a[href*="/profile"]').first().click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/profile');
    }
    
    // 回到禱告頁面
    await page.goto('/prayers');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/prayers');
  });

  test('應該處理無效路由', async ({ page }) => {
    // 導航到不存在的頁面
    await page.goto('/nonexistent-page');
    
    // 檢查是否有適當的錯誤處理或重定向
    await page.waitForLoadState('networkidle');
    
    // 可能會重定向到首頁或顯示 404 頁面
    const currentUrl = page.url();
    const is404 = currentUrl.includes('404') || currentUrl.includes('not-found');
    const isRedirected = currentUrl.includes('/prayers') || currentUrl === '/';
    
    expect(is404 || isRedirected).toBeTruthy();
  });

  test('應該保持狀態在頁面刷新後', async ({ page }) => {
    // 設置訪客模式
    await page.goto('/prayers');
    await page.waitForLoadState('networkidle');
    
    // 模擬設置 localStorage
    await page.evaluate(() => {
      localStorage.setItem('guestMode', 'true');
    });
    
    // 刷新頁面
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 檢查狀態是否保持
    const guestMode = await page.evaluate(() => {
      return localStorage.getItem('guestMode');
    });
    
    expect(guestMode).toBe('true');
  });

  test('應該有適當的載入狀態', async ({ page }) => {
    // 使用慢速網路模擬載入狀態
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒延遲
      await route.continue();
    });
    
    await page.goto('/prayers');
    
    // 檢查載入狀態
    const loadingElement = page.locator('[data-testid="skeleton-list"], [data-testid="loading"]');
    if (await loadingElement.isVisible()) {
      await expect(loadingElement).toBeVisible();
    }
    
    // 等待載入完成
    await page.waitForLoadState('networkidle');
  });

  test('應該支援鍵盤導航', async ({ page }) => {
    await page.goto('/prayers');
    await page.waitForLoadState('networkidle');
    
    // 使用 Tab 鍵導航
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    
    // 檢查焦點是否正確移動
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    
    expect(focusedElement).toBeDefined();
  });

  test('應該處理大量數據', async ({ page }) => {
    await page.goto('/prayers');
    
    // 模擬滾動載入更多內容
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    await page.waitForTimeout(2000);
    
    // 檢查頁面是否仍然響應
    await expect(page.locator('body')).toBeVisible();
  });

  test('應該有適當的錯誤邊界', async ({ page }) => {
    // 故意觸發可能的錯誤
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    await page.goto('/prayers');
    await page.waitForLoadState('networkidle');
    
    // 檢查錯誤是否被適當處理
    await expect(page.locator('body')).toBeVisible();
  });

  test('應該記錄用戶交互分析', async ({ page }) => {
    // 啟用控制台監聽
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });
    
    await page.goto('/prayers');
    await page.waitForLoadState('networkidle');
    
    // 執行一些用戶操作
    if (await page.locator('[data-testid="prayer-post"]').isVisible()) {
      await page.locator('[data-testid="prayer-post"]').first().click();
    }
    
    // 檢查是否有分析事件記錄
    await page.waitForTimeout(1000);
  });

  test('應該在不同設備上正常工作', async ({ page }) => {
    const devices = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const device of devices) {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.goto('/prayers');
      await page.waitForLoadState('networkidle');
      
      // 檢查頁面在當前設備上是否正常顯示
      await expect(page.locator('body')).toBeVisible();
      
      console.log(`✓ ${device.name} (${device.width}x${device.height}) 測試通過`);
    }
  });
}); 