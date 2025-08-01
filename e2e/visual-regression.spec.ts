import { test, expect } from '@playwright/test';

test.describe('視覺回歸測試', () => {
  test.beforeEach(async ({ page }) => {
    // 設置一致的視窗大小
    await page.setViewportSize({ width: 1200, height: 800 });
  });

  test('禱告頁面視覺快照', async ({ page }) => {
    await page.goto('/prayers');
    
    // 等待頁面完全載入
    await page.waitForLoadState('networkidle');
    
    // 隱藏動態內容（如時間戳）以確保一致性
    await page.addStyleTag({
      content: `
        [data-dynamic-content],
        .time-stamp,
        .relative-time {
          visibility: hidden !important;
        }
      `
    });
    
    // 拍攝整頁快照
    await expect(page).toHaveScreenshot('prayers-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('響應式設計視覺測試', async ({ page }) => {
    await page.goto('/prayers');
    await page.waitForLoadState('networkidle');

    // 桌面版本
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page).toHaveScreenshot('prayers-desktop.png', {
      animations: 'disabled'
    });

    // 平板版本
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page).toHaveScreenshot('prayers-tablet.png', {
      animations: 'disabled'
    });

    // 手機版本
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page).toHaveScreenshot('prayers-mobile.png', {
      animations: 'disabled'
    });
  });

  test('個人資料頁面視覺測試', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    // 隱藏動態內容
    await page.addStyleTag({
      content: `
        .avatar-upload-button,
        [data-dynamic-content] {
          opacity: 0.5;
        }
      `
    });
    
    await expect(page).toHaveScreenshot('profile-page.png', {
      animations: 'disabled'
    });
  });

  test('組件庫視覺測試', async ({ page }) => {
    // 創建一個測試頁面來展示所有組件
    await page.goto('/prayers');
    
    // 注入組件展示頁面
    await page.evaluate(() => {
      document.body.innerHTML = `
        <div style="padding: 20px; font-family: system-ui;">
          <h1>組件庫視覺測試</h1>
          
          <!-- 按鈕組件 -->
          <section style="margin: 20px 0;">
            <h2>按鈕組件</h2>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <button class="btn-primary">主要按鈕</button>
              <button class="btn-secondary">次要按鈕</button>
              <button class="btn-danger">危險按鈕</button>
              <button class="btn-outline">輪廓按鈕</button>
              <button disabled>禁用按鈕</button>
            </div>
          </section>
          
          <!-- 卡片組件 -->
          <section style="margin: 20px 0;">
            <h2>卡片組件</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
              <div class="card">
                <div class="card-header">
                  <h3>禱告卡片</h3>
                </div>
                <div class="card-content">
                  <p>這是一個示例禱告內容，用於測試卡片組件的視覺效果。</p>
                </div>
                <div class="card-footer">
                  <button class="btn-sm">點讚</button>
                  <button class="btn-sm">分享</button>
                </div>
              </div>
            </div>
          </section>
          
          <!-- 表單組件 -->
          <section style="margin: 20px 0;">
            <h2>表單組件</h2>
            <form style="max-width: 400px;">
              <div style="margin: 10px 0;">
                <label>文字輸入框</label>
                <input type="text" placeholder="請輸入內容" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
              </div>
              <div style="margin: 10px 0;">
                <label>文字區域</label>
                <textarea placeholder="請輸入詳細內容" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; height: 80px;"></textarea>
              </div>
              <div style="margin: 10px 0;">
                <label>
                  <input type="checkbox"> 同意條款
                </label>
              </div>
              <button type="submit">提交</button>
            </form>
          </section>
        </div>
      `;
    });

    // 添加基本樣式
    await page.addStyleTag({
      content: `
        .btn-primary, .btn-secondary, .btn-danger, .btn-outline, button[type="submit"] {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        .btn-primary { background: #007bff; color: white; }
        .btn-secondary { background: #6c757d; color: white; }
        .btn-danger { background: #dc3545; color: white; }
        .btn-outline { background: transparent; color: #007bff; border: 1px solid #007bff; }
        .btn-sm { padding: 4px 8px; font-size: 12px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 3px; }
        .card {
          border: 1px solid #e3e6f0;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .card-header {
          background: #f8f9fa;
          padding: 15px;
          border-bottom: 1px solid #e3e6f0;
        }
        .card-content {
          padding: 15px;
        }
        .card-footer {
          background: #f8f9fa;
          padding: 10px 15px;
          border-top: 1px solid #e3e6f0;
          display: flex;
          gap: 10px;
        }
        h1, h2, h3 {
          color: #333;
          margin: 0 0 10px 0;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
      `
    });

    await expect(page).toHaveScreenshot('component-library.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('主題和色彩測試', async ({ page }) => {
    await page.goto('/prayers');
    await page.waitForLoadState('networkidle');

    // 測試亮色主題
    await page.addStyleTag({
      content: `
        :root {
          --primary-color: #007bff;
          --secondary-color: #6c757d;
          --success-color: #28a745;
          --danger-color: #dc3545;
          --warning-color: #ffc107;
          --info-color: #17a2b8;
          --light-color: #f8f9fa;
          --dark-color: #343a40;
        }
      `
    });

    await expect(page).toHaveScreenshot('theme-light.png', {
      animations: 'disabled'
    });

    // 測試暗色主題（如果支持）
    await page.addStyleTag({
      content: `
        body {
          background-color: #1a1a1a;
          color: #ffffff;
        }
        :root {
          --primary-color: #0d6efd;
          --secondary-color: #6c757d;
          --background-color: #1a1a1a;
          --text-color: #ffffff;
        }
      `
    });

    await expect(page).toHaveScreenshot('theme-dark.png', {
      animations: 'disabled'
    });
  });

  test('載入狀態視覺測試', async ({ page }) => {
    // 攔截 API 請求以模擬載入狀態
    await page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5秒延遲
      await route.continue();
    });

    await page.goto('/prayers');
    
    // 捕獲載入狀態
    await expect(page).toHaveScreenshot('loading-state.png', {
      animations: 'disabled'
    });
  });

  test('錯誤狀態視覺測試', async ({ page }) => {
    // 模擬 API 錯誤
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    await page.goto('/prayers');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('error-state.png', {
      animations: 'disabled'
    });
  });

  test('無障礙功能視覺測試', async ({ page }) => {
    await page.goto('/prayers');
    await page.waitForLoadState('networkidle');

    // 模擬高對比度模式
    await page.addStyleTag({
      content: `
        * {
          filter: contrast(150%) !important;
        }
        :focus {
          outline: 3px solid #ff0000 !important;
          outline-offset: 2px !important;
        }
      `
    });

    // 使用鍵盤導航突出焦點
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    await expect(page).toHaveScreenshot('accessibility-focus.png', {
      animations: 'disabled'
    });
  });

  test('空狀態視覺測試', async ({ page }) => {
    // 模擬空數據狀態
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] })
      });
    });

    await page.goto('/prayers');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('empty-state.png', {
      animations: 'disabled'
    });
  });

  test('表單驗證視覺測試', async ({ page }) => {
    await page.goto('/prayers');
    await page.waitForLoadState('networkidle');

    // 查找表單並觸發驗證錯誤
    const form = page.locator('form').first();
    if (await form.isVisible()) {
      // 嘗試提交空表單
      const submitButton = form.locator('button[type="submit"]');
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // 等待驗證錯誤顯示
        await page.waitForTimeout(1000);
        
        await expect(page).toHaveScreenshot('form-validation-errors.png', {
          animations: 'disabled'
        });
      }
    }
  });

  test('互動狀態視覺測試', async ({ page }) => {
    await page.goto('/prayers');
    await page.waitForLoadState('networkidle');

    // 添加 hover 效果樣式
    await page.addStyleTag({
      content: `
        button:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        .card:hover {
          box-shadow: 0 8px 16px rgba(0,0,0,0.15);
        }
      `
    });

    // 模擬 hover 狀態
    const firstButton = page.locator('button').first();
    if (await firstButton.isVisible()) {
      await firstButton.hover();
      
      await expect(page).toHaveScreenshot('interactive-hover-state.png', {
        animations: 'disabled'
      });
    }
  });
}); 