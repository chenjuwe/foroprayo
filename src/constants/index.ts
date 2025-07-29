// 應用配置常數
export const APP_CONFIG = {
  name: "Pray for Others",
  version: "0.1.4",
  description: "A prayer sharing platform",
  author: "Pray for Others Team",
  repository: "https://github.com/chenjuwe/prayforo",
} as const;

// API 配置常數
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// 緩存配置常數
export const CACHE_CONFIG = {
  // 記憶體緩存配置
  MEMORY_TTL: 5 * 60 * 1000,         // 內存緩存時間：5分鐘
  MEMORY_STALE_TTL: 30 * 60 * 1000,  // 過期但仍可用的緩存：30分鐘

  // 持久化緩存配置
  INDEXED_DB_TTL: 7 * 24 * 60 * 60 * 1000, // IndexedDB緩存時間：7天
  
  // 特定資源類型的緩存時間配置
  RESOURCES: {
    PRAYERS: {
      STALE_TIME: 2 * 60 * 1000,      // 代禱列表：2分鐘
      GC_TIME: 10 * 60 * 1000,        // 垃圾回收時間：10分鐘
    },
    PRAYER_RESPONSES: {
      STALE_TIME: 3 * 60 * 1000,      // 代禱回應：3分鐘
      GC_TIME: 15 * 60 * 1000,        // 垃圾回收時間：15分鐘
    },
    USER_PROFILE: {
      STALE_TIME: 10 * 60 * 1000,     // 用戶資料：10分鐘
      GC_TIME: 30 * 60 * 1000,        // 垃圾回收時間：30分鐘
    },
    SOCIAL_FEATURES: {
      STALE_TIME: 15 * 60 * 1000,     // 社交功能相關：15分鐘
      GC_TIME: 60 * 60 * 1000,        // 垃圾回收時間：1小時
    }
  },
  
  // 預取配置
  PREFETCH: {
    IDLE_DELAY: 60000,                // 閒置後多久觸發預取（毫秒）- 從 5 秒增加到 60 秒
    TOP_RESPONSES_COUNT: 5,           // 預取頂部多少個代禱的回應
    USER_PRAYERS_LIMIT: 20,           // 預取用戶代禱數量限制
  },
} as const;

// React Query 配置常數
export const QUERY_CONFIG = {
  STALE_TIME: 2 * 60 * 1000,            // 默認過期時間：2分鐘
  GC_TIME: 5 * 60 * 1000,               // 默認垃圾回收時間：5分鐘
  RETRY_COUNT: 1,                      // 重試次數：1次
  RETRY_DELAY: (attemptIndex: number) => Math.min(500 * 2 ** attemptIndex, 10000), // 指數退避重試延遲
} as const;

// UI 常數
export const UI_CONFIG = {
  TOAST_DURATION: {
    SUCCESS: 3000,
    ERROR: 5000,
    WARNING: 4000,
    INFO: 3000,
  },
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  BREAKPOINTS: {
    XS: 390,
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1200,
  },
  MAX_CONTENT_WIDTH: 390,
  MAX_HEIGHT: 844,
} as const;

// 表單驗證常數
export const VALIDATION_CONFIG = {
  PRAYER_CONTENT: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 20000,
  },
  RESPONSE_CONTENT: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 20000,
  },
  USERNAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 20,
  },
} as const;

// 本地存儲鍵常數
export const STORAGE_KEYS = {
  USERNAME_PREFIX: 'username_',
  AVATAR_PREFIX: 'avatar_',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  LANGUAGE: 'language',
  BACKGROUND: 'global_background', // 全局背景設置
  CUSTOM_BACKGROUND: 'global_custom_background', // 全局自定義背景圖片
  CUSTOM_BACKGROUND_SIZE: 'global_custom_background_size', // 全局自定義背景大小
} as const;

// 錯誤訊息常數
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '網路連線失敗，請檢查網路狀態',
  AUTH_ERROR: '請先登入再進行此操作',
  PERMISSION_ERROR: '您沒有權限執行此操作',
  VALIDATION_ERROR: '輸入資料格式不正確',
  UNKNOWN_ERROR: '發生未知錯誤，請稍後再試',
  PRAYER_CREATE_ERROR: '代禱發布失敗，請稍後再試',
  PRAYER_UPDATE_ERROR: '代禱更新失敗，請稍後再試',
  PRAYER_DELETE_ERROR: '代禱刪除失敗，請稍後再試',
  RESPONSE_CREATE_ERROR: '回應發布失敗，請稍後再試',
  RESPONSE_UPDATE_ERROR: '回應更新失敗，請稍後再試',
  RESPONSE_DELETE_ERROR: '回應刪除失敗，請稍後再試',
} as const;

// 成功訊息常數
export const SUCCESS_MESSAGES = {
  PRAYER_CREATED: '代禱發布成功',
  PRAYER_UPDATED: '代禱內容已更新',
  PRAYER_DELETED: '代禱已刪除',
  RESPONSE_CREATED: '回應發布成功',
  RESPONSE_UPDATED: '回應內容已更新',
  RESPONSE_DELETED: '回應已刪除',
  PROFILE_UPDATED: '個人資料已更新',
} as const;

// 路由常數
export const ROUTES = {
  HOME: '/',
  PRAYERS: '/prayers',             // 代禱社群 (Firebase 版本)
  PRAYERS_NEW: '/new',             // 發布代禱 (Firebase 版本)
  NEW_PRAYER: '/new',              // 發布代禱 (別名，與路由模組匹配)
  AUTH: '/auth',                   // Firebase 版本的認證頁面
  PROFILE: '/profile',         // Firebase 版本的個人資料頁面
  LOG: '/log',                 // Firebase 版本的日誌頁面
  MESSAGE: '/message',         // Firebase 版本的訊息頁面
  SETTING: '/setting',         // Firebase 版本的設定頁面
  BAPTISM: '/baptism',         // 受洗故事頁面
  MIRACLE: '/miracle',         // 神蹟經驗頁面
  JOURNEY: '/journey',         // 恩典之路頁面
  // Claire 管理後台路由
  CLAIRE: '/claire',
  CLAIRE_DASHBOARD: '/claire/dashboard', // 添加儀表板路由
  CLAIRE_USERS: '/claire/users',
  CLAIRE_PRAYERS: '/claire/prayers',
  CLAIRE_REPORTS: '/claire/reports',
  CLAIRE_SUPER_ADMINS: '/claire/super-admins', // 添加超級管理員路由
  FIX_DATABASE: '/fix-database', // 添加修復資料庫頁面路由
  NOT_FOUND: '*',
} as const;

// 查詢鍵常數
export const QUERY_KEYS = {
  PRAYERS: ['prayers'],
  PRAYER_RESPONSES: (prayerId: string) => ['prayer-responses', prayerId],
  USER_PROFILE: (userId: string) => ['user-profile', userId],
  PRAYER_BOOKMARKS: ['prayer-bookmarks'],
  SOCIAL_FEATURES: ['social-features'],
} as const;

// 頁面類型常數
export const PAGE_TYPES = {
  PUBLISH: 'publish',
  COMMUNITY: 'community',

  PROFILE: 'profile',
} as const;

// 社交功能常數
export const SOCIAL_CONFIG = {

  MAX_FOLLOWING: 1000,
  MAX_BOOKMARKS: 500,
} as const;

// 圖片配置常數
export const IMAGE_CONFIG = {
  AVATAR_SIZE: {
    SMALL: 32,
    MEDIUM: 40,
    LARGE: 48,
  },
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  PLACEHOLDER_URL: '/placeholder.svg',
} as const;

// 背景選項常數
export const BACKGROUND_OPTIONS = [
  { id: 'default', name: '預設二', style: '', bgColor: '#f8e9e2' },
  { id: 'default3', name: '預設三', style: '', bgColor: '#ffe6e6' },
  { id: 'default5', name: '預設五', style: '', bgColor: '#e6f3ff' },
  { id: 'default8', name: '預設八', style: '', bgColor: '#f0f8e6' },
  { id: 'default1', name: '預設一', style: '', bgColor: '#fffbe6' },
  { id: 'default4', name: '預設四', style: '', bgColor: '#e6fff7' },
  { id: 'default6', name: '預設六', style: '', bgColor: '#e6eaff' },
  { id: 'default7', name: '預設七', style: '', bgColor: '#ffe6fa' },
  { id: 'default9', name: '預設九', style: '', bgColor: '#e6ffe6' },
  { id: 'guest', name: '訪客背景', style: '', bgColor: '#F4E4DD' },
  { id: 'custom', name: '自定義', style: '' },
];

// 添加一個訪客默認背景常數
export const GUEST_DEFAULT_BACKGROUND = 'guest';

// 環境配置
export const ENV_CONFIG = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  isTest: import.meta.env.MODE === 'test',
} as const; 