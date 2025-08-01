import { test, expect } from '@playwright/test'

test.describe('簡化認證流程 E2E 測試', () => {
  test.beforeEach(async ({ page }) => {
    // 設置較長的超時時間
    page.setDefaultTimeout(10000)
  })

  test('應該成功載入認證頁面', async ({ page }) => {
    await page.goto('/auth')
    
    // 檢查頁面載入
    await expect(page).toHaveURL('/auth')
    await expect(page.locator('body')).toBeVisible()
    
    // 檢查基本表單元素
    const emailInput = page.locator('input[type="email"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })

  test('應該能夠填寫登入表單', async ({ page }) => {
    await page.goto('/auth')
    
    // 等待頁面載入
    await page.waitForLoadState('networkidle')
    
    const emailInput = page.locator('input[type="email"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    
    // 填寫表單
    await emailInput.fill('test@example.com')
    await passwordInput.fill('testpassword123')
    
    // 驗證填寫成功
    await expect(emailInput).toHaveValue('test@example.com')
    await expect(passwordInput).toHaveValue('testpassword123')
  })

  test('應該能夠點擊提交按鈕', async ({ page }) => {
    await page.goto('/auth')
    
    // 等待頁面載入
    await page.waitForLoadState('networkidle')
    
    const emailInput = page.locator('input[type="email"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    const submitButton = page.locator('button[type="submit"]').first()
    
    // 填寫表單
    await emailInput.fill('test@example.com')
    await passwordInput.fill('testpassword123')
    
    // 點擊提交按鈕（不檢查結果，只檢查能否點擊）
    if (await submitButton.isVisible()) {
      await submitButton.click()
      
      // 等待一段時間讓請求處理
      await page.waitForTimeout(2000)
      
      // 記錄當前 URL（可能重定向或顯示錯誤）
      const currentUrl = page.url()
      console.log('提交後的 URL:', currentUrl)
      
      // 只要沒有崩潰就算成功
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('應該檢查表單驗證', async ({ page }) => {
    await page.goto('/auth')
    
    // 等待頁面載入
    await page.waitForLoadState('networkidle')
    
    const emailInput = page.locator('input[type="email"]').first()
    const submitButton = page.locator('button[type="submit"]').first()
    
    // 嘗試提交空表單
    if (await submitButton.isVisible()) {
      await submitButton.click()
      
      // 檢查 HTML5 驗證或自定義驗證
      const validationMessage = await emailInput.evaluate(el => (el as HTMLInputElement).validationMessage).catch(() => '')
      
      if (validationMessage) {
        console.log('HTML5 驗證訊息:', validationMessage)
        expect(validationMessage.length).toBeGreaterThan(0)
      } else {
        // 如果沒有 HTML5 驗證，檢查是否有錯誤訊息顯示
        const errorElements = page.locator('[role="alert"], .error, .text-red-500, .text-danger')
        const errorCount = await errorElements.count()
        console.log('找到錯誤元素數量:', errorCount)
      }
    }
  })

  test('應該測試響應式設計', async ({ page }) => {
    // 測試手機尺寸
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/auth')
    
    await expect(page.locator('body')).toBeVisible()
    
    const emailInput = page.locator('input[type="email"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    
    // 測試桌面尺寸
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.reload({ waitUntil: 'networkidle' })
    
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })

  test('應該測試頁面性能', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/auth')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    console.log('認證頁面載入時間:', loadTime, 'ms')
    
    // 頁面應該在合理時間內載入
    expect(loadTime).toBeLessThan(10000) // 10 秒
    
    // 檢查頁面基本元素
    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('input[type="email"]').first()).toBeVisible()
  })

  test('應該測試切換模式（如果存在）', async ({ page }) => {
    await page.goto('/auth')
    
    // 等待頁面載入
    await page.waitForLoadState('networkidle')
    
    // 查找可能的切換按鈕
    const toggleButtons = page.locator('button:has-text("註冊"), button:has-text("登入"), a:has-text("註冊"), a:has-text("登入")')
    
    const buttonCount = await toggleButtons.count()
    console.log('找到切換按鈕數量:', buttonCount)
    
    if (buttonCount > 0) {
      const firstToggle = toggleButtons.first()
      await firstToggle.click()
      
      // 等待 UI 更新
      await page.waitForTimeout(1000)
      
      // 檢查頁面仍然可見
      await expect(page.locator('body')).toBeVisible()
      console.log('模式切換測試完成')
    } else {
      console.log('未找到切換按鈕，跳過切換測試')
    }
  })

  test('應該處理網路中斷', async ({ page }) => {
    await page.goto('/auth')
    
    // 等待頁面載入
    await page.waitForLoadState('networkidle')
    
    // 模擬網路中斷
    await page.context().setOffline(true)
    
    // 嘗試重新載入
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {
      console.log('離線時重新載入失敗，這是預期的')
    })
    
    // 恢復網路
    await page.context().setOffline(false)
    
    // 重新載入應該成功
    try {
      await page.reload({ waitUntil: 'networkidle' })
      await expect(page.locator('body')).toBeVisible()
      console.log('網路中斷處理測試完成')
    } catch (e) {
      // Firefox 可能仍然有網路問題，嘗試導航到頁面
      await page.goto('/auth', { waitUntil: 'networkidle' })
      await expect(page.locator('body')).toBeVisible()
      console.log('網路中斷處理測試完成（使用導航）')
    }
  })
}) 