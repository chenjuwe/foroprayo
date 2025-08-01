import { Page, Locator, expect } from '@playwright/test'
import { testSelectors, waitTimes } from '../fixtures/test-data'

// 等待元素可見並可交互
export async function waitForElement(page: Page, selector: string, timeout = waitTimes.medium) {
  const element = page.locator(selector)
  await element.waitFor({ state: 'visible', timeout })
  return element
}

// 等待元素消失
export async function waitForElementToDisappear(page: Page, selector: string, timeout = waitTimes.medium) {
  const element = page.locator(selector)
  await element.waitFor({ state: 'hidden', timeout })
}

// 安全填寫輸入框
export async function fillInput(page: Page, selector: string, value: string, timeout = waitTimes.medium) {
  const input = await waitForElement(page, selector, timeout)
  await input.clear()
  await input.fill(value)
  // 驗證值是否正確填入
  await expect(input).toHaveValue(value)
}

// 安全點擊按鈕
export async function clickButton(page: Page, selector: string, timeout = waitTimes.medium) {
  const button = await waitForElement(page, selector, timeout)
  await button.click()
}

// 等待載入完成
export async function waitForLoading(page: Page, timeout = waitTimes.long) {
  // 等待載入指示器消失
  const loadingSelectors = [
    testSelectors.auth.loadingSpinner,
    testSelectors.prayer.loadingSpinner,
    testSelectors.common.loadingOverlay
  ]
  
  for (const selector of loadingSelectors) {
    const element = page.locator(selector)
    const isVisible = await element.isVisible({ timeout: 1000 }).catch(() => false)
    if (isVisible) {
      await waitForElementToDisappear(page, selector, timeout)
    }
  }
}

// 等待頁面導航完成
export async function waitForNavigation(page: Page, expectedUrl?: string, timeout = waitTimes.long) {
  if (expectedUrl) {
    await page.waitForURL(expectedUrl, { timeout })
  } else {
    await page.waitForLoadState('networkidle', { timeout })
  }
  await waitForLoading(page)
}

// 檢查錯誤訊息
export async function checkErrorMessage(page: Page, expectedMessage?: string, timeout = waitTimes.medium) {
  const errorSelectors = [
    testSelectors.auth.errorMessage,
    testSelectors.prayer.errorMessage
  ]
  
  let errorFound = false
  let actualMessage = ''
  
  for (const selector of errorSelectors) {
    const element = page.locator(selector)
    const isVisible = await element.isVisible({ timeout: 1000 }).catch(() => false)
    if (isVisible) {
      errorFound = true
      actualMessage = await element.textContent() || ''
      if (expectedMessage) {
        expect(actualMessage).toContain(expectedMessage)
      }
      break
    }
  }
  
  return { found: errorFound, message: actualMessage }
}

// 檢查成功訊息
export async function checkSuccessMessage(page: Page, expectedMessage?: string, timeout = waitTimes.medium) {
  const successSelectors = [
    testSelectors.auth.successMessage,
    testSelectors.prayer.successMessage,
    testSelectors.common.toast
  ]
  
  let successFound = false
  let actualMessage = ''
  
  for (const selector of successSelectors) {
    const element = page.locator(selector)
    const isVisible = await element.isVisible({ timeout }).catch(() => false)
    if (isVisible) {
      successFound = true
      actualMessage = await element.textContent() || ''
      if (expectedMessage) {
        expect(actualMessage).toContain(expectedMessage)
      }
      break
    }
  }
  
  return { found: successFound, message: actualMessage }
}

// 模擬網路條件
export async function simulateNetworkCondition(page: Page, condition: 'offline' | 'slow' | 'normal') {
  switch (condition) {
    case 'offline':
      await page.context().setOffline(true)
      break
    case 'slow':
      await page.context().setOffline(false)
      // 模擬慢速網路
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 2000)
      })
      break
    case 'normal':
      await page.context().setOffline(false)
      await page.unroute('**/*')
      break
  }
}

// 截圖輔助函數
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true })
}

// 清理測試數據
export async function cleanupTestData(page: Page) {
  // 安全地清理 localStorage 和 sessionStorage
  try {
    await page.evaluate(() => {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.clear()
        }
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.clear()
        }
      } catch (e) {
        // 忽略安全性錯誤，在某些瀏覽器中這是正常的
        console.log('Storage cleanup skipped due to security restrictions')
      }
    })
  } catch (e) {
    // 如果 page.evaluate 本身失敗，也忽略
    console.log('Storage cleanup failed, continuing with test')
  }
}

// 設置測試環境
export async function setupTestEnvironment(page: Page) {
  // 設置較寬鬆的超時
  page.setDefaultTimeout(waitTimes.veryLong)
  
  // 清理測試數據
  await cleanupTestData(page)
  
  // 攔截控制台錯誤（可選）
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`Console error: ${msg.text()}`)
    }
  })
}

// 登入輔助函數
export async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/auth')
  
  // 確保在登入模式
  const toggleButton = page.locator(testSelectors.auth.toggleButton)
  const toggleText = await toggleButton.textContent()
  if (toggleText?.includes('登入')) {
    await clickButton(page, testSelectors.auth.toggleButton)
  }
  
  // 填寫登入表單
  await fillInput(page, testSelectors.auth.emailInput, email)
  await fillInput(page, testSelectors.auth.passwordInput, password)
  
  // 提交表單
  await clickButton(page, testSelectors.auth.loginButton)
  
  // 等待登入完成
  await waitForNavigation(page)
}

// 登出輔助函數
export async function logoutUser(page: Page) {
  const logoutButton = page.locator(testSelectors.auth.logoutButton)
  const isVisible = await logoutButton.isVisible({ timeout: 1000 }).catch(() => false)
  
  if (isVisible) {
    await clickButton(page, testSelectors.auth.logoutButton)
    await waitForNavigation(page, '/auth')
  }
} 