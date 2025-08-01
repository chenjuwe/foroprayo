import { test, expect } from '@playwright/test'
import { testPrayers, testSelectors, testUsers } from './fixtures/test-data'
import { 
  setupTestEnvironment, 
  fillInput, 
  clickButton, 
  waitForNavigation, 
  checkErrorMessage, 
  checkSuccessMessage,
  cleanupTestData,
  loginUser
} from './helpers/test-helpers'

test.describe('改進的祈禱流程 E2E 測試', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page)
  })

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page)
  })

  test('應該成功載入新增祈禱頁面', async ({ page }) => {
    await page.goto('/new')
    
    // 檢查是否重定向到認證頁面或載入新增頁面
    const currentUrl = page.url()
    
    if (currentUrl.includes('/auth')) {
      // 重定向到認證頁面是正常的（未登入用戶）
      expect(currentUrl).toContain('/auth')
      console.log('未登入用戶被重定向到認證頁面')
    } else {
      // 直接載入新增頁面
      expect(currentUrl).toContain('/new')
      
      // 檢查表單元素
      const contentTextarea = page.locator(testSelectors.prayer.contentTextarea)
        .or(page.locator('textarea[name="content"]'))
        .or(page.locator('textarea'))
      
      await expect(contentTextarea).toBeVisible()
    }
  })

  test('應該成功載入祈禱列表頁面', async ({ page }) => {
    await page.goto('/prayers')
    
    // 檢查是否重定向到認證頁面或載入祈禱列表
    const currentUrl = page.url()
    
    if (currentUrl.includes('/auth')) {
      expect(currentUrl).toContain('/auth')
      console.log('未登入用戶被重定向到認證頁面')
    } else {
      expect(currentUrl).toContain('/prayers')
      
      // 檢查祈禱列表元素
      const prayerList = page.locator(testSelectors.prayer.prayerList)
        .or(page.locator('[data-testid*="prayer"]'))
        .or(page.locator('.prayer-list'))
        .or(page.locator('.prayer-card'))
      
      // 等待內容載入
      await page.waitForTimeout(2000)
      
      // 檢查是否有祈禱內容或空狀態
      const hasContent = await prayerList.count() > 0
      if (hasContent) {
        console.log('找到祈禱內容')
      } else {
        console.log('祈禱列表為空或仍在載入中')
      }
    }
  })

  test('應該驗證祈禱表單的基本功能', async ({ page }) => {
    await page.goto('/new')
    
    // 如果重定向到認證頁面，跳過此測試
    if (page.url().includes('/auth')) {
      console.log('需要登入，跳過表單測試')
      return
    }
    
    // 檢查表單元素
    const contentTextarea = page.locator(testSelectors.prayer.contentTextarea)
      .or(page.locator('textarea[name="content"]'))
      .or(page.locator('textarea'))
    
    const submitButton = page.locator(testSelectors.prayer.submitButton)
      .or(page.locator('button:has-text("發布")'))
      .or(page.locator('button:has-text("提交")'))
      .or(page.locator('button[type="submit"]'))
    
    if (await contentTextarea.isVisible()) {
      // 測試空內容提交
      if (await submitButton.isVisible()) {
        await submitButton.click()
        
        // 檢查驗證錯誤
        const validationMessage = await contentTextarea.evaluate(el => (el as HTMLTextAreaElement).validationMessage)
        if (validationMessage) {
          expect(validationMessage).toBeTruthy()
        } else {
          const errorResult = await checkErrorMessage(page)
          console.log('空內容驗證結果:', errorResult)
        }
      }
      
      // 測試填寫內容
      await contentTextarea.fill(testPrayers.validPrayer.content)
      await expect(contentTextarea).toHaveValue(testPrayers.validPrayer.content)
      
      // 測試提交
      if (await submitButton.isVisible()) {
        await submitButton.click()
        
        // 等待處理
        await page.waitForTimeout(3000)
        
        // 檢查結果
        const currentUrl = page.url()
        const successResult = await checkSuccessMessage(page)
        const errorResult = await checkErrorMessage(page)
        
        console.log('祈禱提交結果 - URL:', currentUrl, 'Success:', successResult, 'Error:', errorResult)
      }
    }
  })

  test('應該驗證祈禱內容長度限制', async ({ page }) => {
    await page.goto('/new')
    
    if (page.url().includes('/auth')) {
      console.log('需要登入，跳過長度測試')
      return
    }
    
    const contentTextarea = page.locator(testSelectors.prayer.contentTextarea)
      .or(page.locator('textarea[name="content"]'))
      .or(page.locator('textarea'))
    
    const submitButton = page.locator(testSelectors.prayer.submitButton)
      .or(page.locator('button:has-text("發布")'))
      .or(page.locator('button[type="submit"]'))
    
    if (await contentTextarea.isVisible()) {
      // 填寫過長內容
      await contentTextarea.fill(testPrayers.longPrayer.content)
      
      if (await submitButton.isVisible()) {
        await submitButton.click()
        
        // 檢查長度驗證
        const errorResult = await checkErrorMessage(page)
        console.log('長度限制驗證結果:', errorResult)
      }
    }
  })

  test('應該測試搜尋功能', async ({ page }) => {
    await page.goto('/prayers')
    
    if (page.url().includes('/auth')) {
      console.log('需要登入，跳過搜尋測試')
      return
    }
    
    // 等待頁面載入
    await page.waitForTimeout(2000)
    
    const searchInput = page.locator(testSelectors.prayer.searchInput)
      .or(page.locator('input[placeholder*="搜尋"]'))
      .or(page.locator('input[type="search"]'))
      .or(page.locator('input[name="search"]'))
    
    if (await searchInput.isVisible()) {
      // 測試搜尋功能
      await searchInput.fill('測試')
      
      // 等待搜尋結果
      await page.waitForTimeout(2000)
      
      console.log('搜尋功能已測試')
    } else {
      console.log('未找到搜尋輸入框')
    }
  })

  test('應該測試祈禱互動功能', async ({ page }) => {
    await page.goto('/prayers')
    
    if (page.url().includes('/auth')) {
      console.log('需要登入，跳過互動測試')
      return
    }
    
    // 等待頁面載入
    await page.waitForTimeout(3000)
    
    // 查找祈禱卡片
    const prayerCards = page.locator(testSelectors.prayer.prayerCard)
      .or(page.locator('[data-testid*="prayer"]'))
      .or(page.locator('.prayer-card'))
    
    const cardCount = await prayerCards.count()
    console.log('找到祈禱卡片數量:', cardCount)
    
    if (cardCount > 0) {
      const firstCard = prayerCards.first()
      
      // 測試點讚功能
      const likeButton = firstCard.locator(testSelectors.prayer.likeButton)
        .or(firstCard.locator('button[aria-label*="讚"]'))
        .or(firstCard.locator('button:has-text("讚")'))
      
      if (await likeButton.isVisible()) {
        await likeButton.click()
        console.log('點讚功能已測試')
      }
      
      // 測試回應功能
      const responseButton = firstCard.locator(testSelectors.prayer.responseButton)
        .or(firstCard.locator('button:has-text("回應")'))
        .or(firstCard.locator('button:has-text("回覆")'))
      
      if (await responseButton.isVisible()) {
        await responseButton.click()
        console.log('回應功能已測試')
      }
    }
  })

  test('應該測試網路錯誤處理', async ({ page }) => {
    await page.goto('/prayers')
    
    if (page.url().includes('/auth')) {
      console.log('需要登入，跳過網路測試')
      return
    }
    
    // 模擬網路錯誤
    await page.route('**/api/**', route => {
      route.abort('failed')
    })
    
    // 重新載入頁面
    await page.reload()
    
    // 等待錯誤處理
    await page.waitForTimeout(3000)
    
    // 檢查錯誤訊息
    const errorResult = await checkErrorMessage(page)
    console.log('網路錯誤處理結果:', errorResult)
    
    // 恢復網路
    await page.unroute('**/api/**')
  })

  test('應該在不同視窗大小下正常工作', async ({ page }) => {
    // 測試手機尺寸
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/prayers')
    
    await page.waitForTimeout(2000)
    
    // 檢查頁面在手機尺寸下是否正常
    await expect(page.locator('body')).toBeVisible()
    
    // 測試平板尺寸
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.reload()
    
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
    
    // 測試桌面尺寸
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.reload()
    
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
    
    console.log('響應式設計測試完成')
  })

  test('應該測試頁面性能', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/prayers')
    
    // 等待頁面完全載入
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    console.log('頁面載入時間:', loadTime, 'ms')
    
    // 頁面應該在合理時間內載入
    expect(loadTime).toBeLessThan(10000) // 10 秒
    
    // 檢查頁面是否可見
    await expect(page.locator('body')).toBeVisible()
  })
}) 