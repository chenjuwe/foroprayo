// 測試用戶數據
export const testUsers = {
  validUser: {
    email: 'test@example.com',
    password: 'TestPassword123!',
    displayName: '測試用戶',
    confirmPassword: 'TestPassword123!'
  },
  existingUser: {
    email: 'existing@example.com',
    password: 'ExistingPassword123!',
    displayName: '已存在用戶'
  },
  invalidUser: {
    email: 'invalid-email',
    password: '123', // 太短
    displayName: ''
  }
}

// 測試祈禱數據
export const testPrayers = {
  validPrayer: {
    content: '這是一個測試祈禱內容，請為我的家人祈禱。',
    category: '家庭'
  },
  longPrayer: {
    content: 'a'.repeat(1001), // 超過長度限制
    category: '其他'
  },
  emptyPrayer: {
    content: '',
    category: '健康'
  }
}

// 測試響應數據
export const testResponses = {
  validResponse: {
    content: '我會為你祈禱，願上帝保佑你的家人。'
  },
  longResponse: {
    content: 'a'.repeat(501) // 超過響應長度限制
  }
}

// 測試選擇器 - 使用 data-testid
export const testSelectors = {
  // 認證相關
  auth: {
    emailInput: '[data-testid="auth-email-input"]',
    passwordInput: '[data-testid="auth-password-input"]',
    confirmPasswordInput: '[data-testid="auth-confirm-password-input"]',
    displayNameInput: '[data-testid="auth-display-name-input"]',
    loginButton: '[data-testid="auth-login-button"]',
    signupButton: '[data-testid="auth-signup-button"]',
    toggleButton: '[data-testid="auth-toggle-button"]',
    resetPasswordButton: '[data-testid="auth-reset-password-button"]',
    logoutButton: '[data-testid="auth-logout-button"]',
    errorMessage: '[data-testid="auth-error-message"]',
    successMessage: '[data-testid="auth-success-message"]',
    loadingSpinner: '[data-testid="auth-loading-spinner"]'
  },
  
  // 祈禱相關
  prayer: {
    contentTextarea: '[data-testid="prayer-content-textarea"]',
    categorySelect: '[data-testid="prayer-category-select"]',
    submitButton: '[data-testid="prayer-submit-button"]',
    editButton: '[data-testid="prayer-edit-button"]',
    deleteButton: '[data-testid="prayer-delete-button"]',
    likeButton: '[data-testid="prayer-like-button"]',
    shareButton: '[data-testid="prayer-share-button"]',
    responseButton: '[data-testid="prayer-response-button"]',
    searchInput: '[data-testid="prayer-search-input"]',
    filterSelect: '[data-testid="prayer-filter-select"]',
    prayerCard: '[data-testid="prayer-card"]',
    prayerList: '[data-testid="prayer-list"]',
    errorMessage: '[data-testid="prayer-error-message"]',
    successMessage: '[data-testid="prayer-success-message"]',
    loadingSpinner: '[data-testid="prayer-loading-spinner"]'
  },
  
  // 響應相關
  response: {
    contentTextarea: '[data-testid="response-content-textarea"]',
    submitButton: '[data-testid="response-submit-button"]',
    editButton: '[data-testid="response-edit-button"]',
    deleteButton: '[data-testid="response-delete-button"]',
    responseCard: '[data-testid="response-card"]',
    responseList: '[data-testid="response-list"]'
  },
  
  // 導航相關
  navigation: {
    homeLink: '[data-testid="nav-home-link"]',
    prayersLink: '[data-testid="nav-prayers-link"]',
    newPrayerLink: '[data-testid="nav-new-prayer-link"]',
    profileLink: '[data-testid="nav-profile-link"]',
    settingsLink: '[data-testid="nav-settings-link"]'
  },
  
  // 通用元素
  common: {
    modal: '[data-testid="modal"]',
    modalClose: '[data-testid="modal-close"]',
    confirmDialog: '[data-testid="confirm-dialog"]',
    confirmButton: '[data-testid="confirm-button"]',
    cancelButton: '[data-testid="cancel-button"]',
    toast: '[data-testid="toast"]',
    loadingOverlay: '[data-testid="loading-overlay"]'
  }
}

// 等待時間配置
export const waitTimes = {
  short: 1000,    // 1 秒
  medium: 3000,   // 3 秒
  long: 5000,     // 5 秒
  veryLong: 10000 // 10 秒
} 