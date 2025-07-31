import { test, expect } from '@playwright/test'

test.describe('認證流程 E2E 測試', () => {
  test.beforeEach(async ({ page }) => {
    // 導航到認證頁面
    await page.goto('/auth')
  })

  test('應該成功完成用戶註冊流程', async ({ page }) => {
    // 切換到註冊模式
    await page.click('text=註冊')

    // 填寫註冊表單
    await page.fill('input[type="email"]', 'newuser@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'password123')
    await page.fill('input[name="displayName"]', 'New User')

    // 提交表單
    await page.click('button:has-text("註冊")')

    // 驗證成功狀態
    await expect(page.locator('text=註冊成功')).toBeVisible()
  })

  test('應該處理註冊錯誤', async ({ page }) => {
    // 切換到註冊模式
    await page.click('text=註冊')

    // 填寫已存在的電子郵件
    await page.fill('input[type="email"]', 'existing@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'password123')
    await page.fill('input[name="displayName"]', 'Test User')

    // 提交表單
    await page.click('button:has-text("註冊")')

    // 驗證錯誤訊息
    await expect(page.locator('text=電子郵件已被使用')).toBeVisible()
  })

  test('應該成功完成用戶登入流程', async ({ page }) => {
    // 確保在登入模式
    await page.click('text=登入')

    // 填寫登入表單
    await page.fill('input[type="email"]', 'user@example.com')
    await page.fill('input[type="password"]', 'password123')

    // 提交表單
    await page.click('button:has-text("登入")')

    // 驗證成功狀態並重定向到主頁
    await expect(page).toHaveURL('/')
    await expect(page.locator('text=登入成功')).toBeVisible()
  })

  test('應該處理登入錯誤', async ({ page }) => {
    // 確保在登入模式
    await page.click('text=登入')

    // 填寫錯誤的登入資訊
    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')

    // 提交表單
    await page.click('button:has-text("登入")')

    // 驗證錯誤訊息
    await expect(page.locator('text=電子郵件或密碼錯誤')).toBeVisible()
  })

  test('應該成功發送密碼重置郵件', async ({ page }) => {
    // 點擊忘記密碼連結
    await page.click('text=忘記密碼')

    // 填寫電子郵件
    await page.fill('input[type="email"]', 'user@example.com')

    // 提交表單
    await page.click('button:has-text("發送重置郵件")')

    // 驗證成功訊息
    await expect(page.locator('text=密碼重置郵件已發送')).toBeVisible()
  })

  test('應該驗證必填欄位', async ({ page }) => {
    // 嘗試提交空表單
    await page.click('button:has-text("登入")')

    // 驗證錯誤訊息
    await expect(page.locator('text=請輸入電子郵件')).toBeVisible()
    await expect(page.locator('text=請輸入密碼')).toBeVisible()
  })

  test('應該驗證電子郵件格式', async ({ page }) => {
    // 輸入無效的電子郵件
    await page.fill('input[type="email"]', 'invalid-email')

    // 失去焦點觸發驗證
    await page.blur('input[type="email"]')

    // 驗證錯誤訊息
    await expect(page.locator('text=請輸入有效的電子郵件地址')).toBeVisible()
  })

  test('應該驗證密碼強度', async ({ page }) => {
    // 切換到註冊模式
    await page.click('text=註冊')

    // 輸入弱密碼
    await page.fill('input[type="password"]', '123')

    // 失去焦點觸發驗證
    await page.blur('input[type="password"]')

    // 驗證錯誤訊息
    await expect(page.locator('text=密碼至少需要6個字符')).toBeVisible()
  })

  test('應該驗證密碼確認', async ({ page }) => {
    // 切換到註冊模式
    await page.click('text=註冊')

    // 填寫不匹配的密碼
    await page.fill('input[type="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'different123')

    // 失去焦點觸發驗證
    await page.blur('input[name="confirmPassword"]')

    // 驗證錯誤訊息
    await expect(page.locator('text=密碼不匹配')).toBeVisible()
  })

  test('應該在表單提交時顯示載入狀態', async ({ page }) => {
    // 填寫登入表單
    await page.fill('input[type="email"]', 'user@example.com')
    await page.fill('input[type="password"]', 'password123')

    // 提交表單
    await page.click('button:has-text("登入")')

    // 驗證載入狀態
    await expect(page.locator('button:has-text("登入中...")')).toBeVisible()
  })

  test('應該在網路錯誤時顯示錯誤訊息', async ({ page }) => {
    // 模擬網路錯誤
    await page.route('**/api/auth/signin', route => {
      route.abort('failed')
    })

    // 填寫登入表單
    await page.fill('input[type="email"]', 'user@example.com')
    await page.fill('input[type="password"]', 'password123')

    // 提交表單
    await page.click('button:has-text("登入")')

    // 驗證錯誤訊息
    await expect(page.locator('text=網路連接失敗')).toBeVisible()
  })

  test('應該在成功登入後重定向到正確頁面', async ({ page }) => {
    // 填寫登入表單
    await page.fill('input[type="email"]', 'user@example.com')
    await page.fill('input[type="password"]', 'password123')

    // 提交表單
    await page.click('button:has-text("登入")')

    // 驗證重定向到主頁
    await expect(page).toHaveURL('/')
  })

  test('應該記住用戶登入狀態', async ({ page }) => {
    // 成功登入
    await page.fill('input[type="email"]', 'user@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button:has-text("登入")')

    // 重新載入頁面
    await page.reload()

    // 驗證用戶仍然登入
    await expect(page).toHaveURL('/')
    await expect(page.locator('text=歡迎回來')).toBeVisible()
  })

  test('應該成功登出', async ({ page }) => {
    // 先登入
    await page.fill('input[type="email"]', 'user@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button:has-text("登入")')

    // 點擊登出按鈕
    await page.click('button:has-text("登出")')

    // 驗證重定向到登入頁面
    await expect(page).toHaveURL('/auth')
  })
}) 