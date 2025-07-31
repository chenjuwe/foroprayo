import { test, expect } from '@playwright/test'

test.describe('代禱流程 E2E 測試', () => {
  test.beforeEach(async ({ page }) => {
    // 先登入用戶
    await page.goto('/auth')
    await page.fill('input[type="email"]', 'user@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button:has-text("登入")')
    
    // 等待登入完成
    await expect(page).toHaveURL('/')
  })

  test('應該成功創建新代禱', async ({ page }) => {
    // 導航到創建代禱頁面
    await page.goto('/new')

    // 填寫代禱內容
    await page.fill('textarea[name="content"]', '這是一個測試代禱內容')

    // 提交代禱
    await page.click('button:has-text("發布代禱")')

    // 驗證成功狀態
    await expect(page.locator('text=代禱發布成功')).toBeVisible()

    // 驗證重定向到代禱列表
    await expect(page).toHaveURL('/prayers')
  })

  test('應該驗證代禱內容不能為空', async ({ page }) => {
    // 導航到創建代禱頁面
    await page.goto('/new')

    // 嘗試提交空代禱
    await page.click('button:has-text("發布代禱")')

    // 驗證錯誤訊息
    await expect(page.locator('text=代禱內容不能為空')).toBeVisible()
  })

  test('應該驗證代禱內容長度限制', async ({ page }) => {
    // 導航到創建代禱頁面
    await page.goto('/new')

    // 輸入過長的內容
    const longContent = 'a'.repeat(1001)
    await page.fill('textarea[name="content"]', longContent)

    // 失去焦點觸發驗證
    await page.blur('textarea[name="content"]')

    // 驗證錯誤訊息
    await expect(page.locator('text=代禱內容不能超過1000個字符')).toBeVisible()
  })

  test('應該成功載入代禱列表', async ({ page }) => {
    // 導航到代禱列表頁面
    await page.goto('/prayers')

    // 等待代禱列表載入
    await expect(page.locator('.prayer-item')).toBeVisible()

    // 驗證代禱內容顯示
    await expect(page.locator('text=這是一個測試代禱內容')).toBeVisible()
  })

  test('應該成功點讚代禱', async ({ page }) => {
    // 導航到代禱列表頁面
    await page.goto('/prayers')

    // 等待代禱列表載入
    await expect(page.locator('.prayer-item')).toBeVisible()

    // 點擊第一個代禱的點讚按鈕
    const likeButton = page.locator('.like-button').first()
    await likeButton.click()

    // 驗證點讚成功
    await expect(page.locator('text=點讚成功')).toBeVisible()
  })

  test('應該成功回應代禱', async ({ page }) => {
    // 導航到代禱列表頁面
    await page.goto('/prayers')

    // 等待代禱列表載入
    await expect(page.locator('.prayer-item')).toBeVisible()

    // 點擊回應按鈕
    const responseButton = page.locator('.response-button').first()
    await responseButton.click()

    // 填寫回應內容
    await page.fill('textarea[name="responseContent"]', '這是一個測試回應')

    // 提交回應
    await page.click('button:has-text("提交回應")')

    // 驗證回應成功
    await expect(page.locator('text=回應發布成功')).toBeVisible()
  })

  test('應該成功搜尋代禱', async ({ page }) => {
    // 導航到代禱列表頁面
    await page.goto('/prayers')

    // 輸入搜尋關鍵字
    await page.fill('input[placeholder="搜尋代禱"]', '測試')

    // 等待搜尋結果
    await expect(page.locator('text=包含測試關鍵字的代禱')).toBeVisible()
  })

  test('應該成功篩選代禱', async ({ page }) => {
    // 導航到代禱列表頁面
    await page.goto('/prayers')

    // 選擇篩選選項
    await page.selectOption('select[name="filter"]', 'answered')

    // 等待篩選結果
    await expect(page.locator('text=已回應的代禱')).toBeVisible()
  })

  test('應該成功編輯自己的代禱', async ({ page }) => {
    // 導航到代禱列表頁面
    await page.goto('/prayers')

    // 等待代禱列表載入
    await expect(page.locator('.prayer-item')).toBeVisible()

    // 點擊編輯按鈕
    const editButton = page.locator('.edit-button').first()
    await editButton.click()

    // 編輯內容
    await page.fill('textarea[name="content"]', '已編輯的代禱內容')

    // 保存編輯
    await page.click('button:has-text("保存")')

    // 驗證編輯成功
    await expect(page.locator('text=代禱更新成功')).toBeVisible()
  })

  test('應該成功刪除自己的代禱', async ({ page }) => {
    // 導航到代禱列表頁面
    await page.goto('/prayers')

    // 等待代禱列表載入
    await expect(page.locator('.prayer-item')).toBeVisible()

    // 點擊刪除按鈕
    const deleteButton = page.locator('.delete-button').first()
    await deleteButton.click()

    // 確認刪除
    await page.click('button:has-text("確認刪除")')

    // 驗證刪除成功
    await expect(page.locator('text=代禱刪除成功')).toBeVisible()
  })

  test('應該處理網路錯誤', async ({ page }) => {
    // 模擬網路錯誤
    await page.route('**/api/prayers', route => {
      route.abort('failed')
    })

    // 導航到代禱列表頁面
    await page.goto('/prayers')

    // 驗證錯誤訊息
    await expect(page.locator('text=載入代禱列表失敗')).toBeVisible()
  })

  test('應該在離線時顯示離線提示', async ({ page }) => {
    // 模擬離線狀態
    await page.route('**/*', route => {
      route.abort('failed')
    })

    // 導航到代禱列表頁面
    await page.goto('/prayers')

    // 驗證離線提示
    await expect(page.locator('text=您目前處於離線狀態')).toBeVisible()
  })

  test('應該成功上傳圖片', async ({ page }) => {
    // 導航到創建代禱頁面
    await page.goto('/new')

    // 選擇圖片文件
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('test-image.jpg')

    // 填寫代禱內容
    await page.fill('textarea[name="content"]', '帶有圖片的代禱')

    // 提交代禱
    await page.click('button:has-text("發布代禱")')

    // 驗證成功狀態
    await expect(page.locator('text=代禱發布成功')).toBeVisible()
  })

  test('應該驗證圖片格式和大小', async ({ page }) => {
    // 導航到創建代禱頁面
    await page.goto('/new')

    // 選擇無效的圖片文件
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('invalid-file.txt')

    // 驗證錯誤訊息
    await expect(page.locator('text=請選擇有效的圖片文件')).toBeVisible()
  })

  test('應該成功分享代禱', async ({ page }) => {
    // 導航到代禱列表頁面
    await page.goto('/prayers')

    // 等待代禱列表載入
    await expect(page.locator('.prayer-item')).toBeVisible()

    // 點擊分享按鈕
    const shareButton = page.locator('.share-button').first()
    await shareButton.click()

    // 驗證分享選項
    await expect(page.locator('text=分享到 Facebook')).toBeVisible()
    await expect(page.locator('text=分享到 Twitter')).toBeVisible()
  })

  test('應該成功標記代禱為已回應', async ({ page }) => {
    // 導航到代禱列表頁面
    await page.goto('/prayers')

    // 等待代禱列表載入
    await expect(page.locator('.prayer-item')).toBeVisible()

    // 點擊標記為已回應按鈕
    const markAnsweredButton = page.locator('.mark-answered-button').first()
    await markAnsweredButton.click()

    // 驗證成功狀態
    await expect(page.locator('text=代禱已標記為已回應')).toBeVisible()
  })

  test('應該成功查看代禱詳情', async ({ page }) => {
    // 導航到代禱列表頁面
    await page.goto('/prayers')

    // 等待代禱列表載入
    await expect(page.locator('.prayer-item')).toBeVisible()

    // 點擊代禱標題查看詳情
    const prayerTitle = page.locator('.prayer-title').first()
    await prayerTitle.click()

    // 驗證詳情頁面
    await expect(page.locator('.prayer-detail')).toBeVisible()
    await expect(page.locator('.response-list')).toBeVisible()
  })

  test('應該成功導出代禱記錄', async ({ page }) => {
    // 導航到個人資料頁面
    await page.goto('/profile')

    // 點擊導出按鈕
    await page.click('button:has-text("導出代禱記錄")')

    // 驗證下載開始
    await expect(page.locator('text=導出成功')).toBeVisible()
  })

  test('應該成功設置代禱提醒', async ({ page }) => {
    // 導航到創建代禱頁面
    await page.goto('/new')

    // 填寫代禱內容
    await page.fill('textarea[name="content"]', '需要提醒的代禱')

    // 設置提醒
    await page.click('input[name="setReminder"]')
    await page.fill('input[name="reminderDate"]', '2024-12-31')

    // 提交代禱
    await page.click('button:has-text("發布代禱")')

    // 驗證成功狀態
    await expect(page.locator('text=代禱發布成功')).toBeVisible()
  })

  test('應該成功報告不當內容', async ({ page }) => {
    // 導航到代禱列表頁面
    await page.goto('/prayers')

    // 等待代禱列表載入
    await expect(page.locator('.prayer-item')).toBeVisible()

    // 點擊報告按鈕
    const reportButton = page.locator('.report-button').first()
    await reportButton.click()

    // 選擇報告原因
    await page.selectOption('select[name="reportReason"]', 'spam')

    // 填寫報告說明
    await page.fill('textarea[name="reportDescription"]', '這是不當內容')

    // 提交報告
    await page.click('button:has-text("提交報告")')

    // 驗證成功狀態
    await expect(page.locator('text=報告提交成功')).toBeVisible()
  })
}) 