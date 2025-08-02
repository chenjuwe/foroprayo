import { vi } from 'vitest';
import type { User, Prayer, PrayerResponse } from '@/types'

// 靜態 Mock 數據 - 用於需要固定數據的測試場景

export const mockUsers: Record<string, User> = {
  regular: {
    uid: 'user-1',
    displayName: '張小明',
    email: 'zhang@example.com',
    photoURL: 'https://example.com/avatar1.jpg',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isGuest: false,
  },
  guest: {
    uid: 'guest-1',
    displayName: '訪客_ABC123',
    email: null,
    photoURL: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isGuest: true,
  },
  admin: {
    uid: 'admin-1',
    displayName: '管理員',
    email: 'admin@example.com',
    photoURL: 'https://example.com/admin-avatar.jpg',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isGuest: false,
  },
}

export const mockPrayers: Record<string, Prayer> = {
  simple: {
    id: 'prayer-1',
    userId: 'user-1',
    content: '請為我的健康禱告',
    title: '健康禱告',
    isAnonymous: false,
    isAnswered: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    likes: 5,
    responses: 2,
    tags: ['健康'],
  },
  answered: {
    id: 'prayer-2',
    userId: 'user-1',
    content: '感謝神，我的禱告已經應驗了',
    title: '感恩禱告',
    isAnonymous: false,
    isAnswered: true,
    answeredAt: '2024-01-15T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    likes: 15,
    responses: 8,
    tags: ['感恩'],
  },
  anonymous: {
    id: 'prayer-3',
    userId: 'user-1',
    content: '請為我的工作禱告',
    title: '工作禱告',
    isAnonymous: true,
    isAnswered: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    likes: 3,
    responses: 1,
    tags: ['工作'],
  },
  longContent: {
    id: 'prayer-4',
    userId: 'user-1',
    content: '這是一個非常長的禱告內容，包含了很多詳細的描述和請求。希望能夠得到大家的代禱支持，讓這個困難的時期能夠順利度過。',
    title: '長內容禱告',
    isAnonymous: false,
    isAnswered: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    likes: 7,
    responses: 4,
    tags: ['家庭', '健康'],
  },
}

export const mockResponses: Record<string, PrayerResponse> = {
  simple: {
    id: 'response-1',
    prayerId: 'prayer-1',
    userId: 'user-2',
    content: '我會為你禱告的',
    isAnonymous: false,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    likes: 2,
  },
  anonymous: {
    id: 'response-2',
    prayerId: 'prayer-1',
    userId: 'user-3',
    content: '願神賜福給你',
    isAnonymous: true,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
    likes: 1,
  },
  long: {
    id: 'response-3',
    prayerId: 'prayer-2',
    userId: 'user-4',
    content: '這是一個很長的回應內容，表達了對禱告應驗的喜悅和感恩。願神繼續賜福給我們每一個人。',
    isAnonymous: false,
    createdAt: '2024-01-16T00:00:00Z',
    updatedAt: '2024-01-16T00:00:00Z',
    likes: 5,
  },
}

// 測試場景數據
export const mockTestScenario = {
  users: Object.values(mockUsers),
  prayers: Object.values(mockPrayers),
  responses: Object.values(mockResponses),
}

// 空數據場景
export const mockEmptyData = {
  users: [],
  prayers: [],
  responses: [],
}

// 錯誤場景數據
export const mockErrorData = {
  networkError: new Error('網路連線失敗'),
  authError: new Error('認證失敗'),
  validationError: new Error('資料驗證失敗'),
  serverError: new Error('伺服器錯誤'),
}

// 表單數據
export const mockFormData = {
  validPrayer: {
    content: '請為我的家庭禱告',
    isAnonymous: false,
  },
  invalidPrayer: {
    content: '', // 空內容
    isAnonymous: false,
  },
  longPrayer: {
    content: 'a'.repeat(1000), // 超長內容
    isAnonymous: false,
  },
  validResponse: {
    content: '我會為你禱告',
    isAnonymous: false,
  },
  invalidResponse: {
    content: '',
    isAnonymous: false,
  },
}

// 分頁數據
export const mockPaginationData = {
  firstPage: {
    data: Object.values(mockPrayers).slice(0, 2),
    pagination: {
      page: 1,
      limit: 10,
      total: 4,
      hasMore: true,
    },
  },
  lastPage: {
    data: Object.values(mockPrayers).slice(2),
    pagination: {
      page: 2,
      limit: 10,
      total: 4,
      hasMore: false,
    },
  },
  emptyPage: {
    data: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      hasMore: false,
    },
  },
}

// 統計數據 Mock
export const mockUserStats = {
  default: {
    prayerCount: 10,
    responseCount: 25,
    receivedLikesCount: 5,
  },
  zero: {
    prayerCount: 0,
    responseCount: 0,
    receivedLikesCount: 0,
  },
  large: {
    prayerCount: 999,
    responseCount: 1234,
    receivedLikesCount: 567,
  },
  thousand: {
    prayerCount: 1000,
    responseCount: 1500,
    receivedLikesCount: 2000,
  },
}

// Mock 工廠函數
export const createMockUserStats = (scenario: keyof typeof mockUserStats = 'default') => {
  return { ...mockUserStats[scenario] };
}

// Firebase 服務 Mock 工廠
export const createMockFirebasePrayerService = (statsScenario: keyof typeof mockUserStats = 'default') => {
  const stats = createMockUserStats(statsScenario);
  
  return {
    getUserStats: vi.fn().mockResolvedValue(stats),
    getAllPrayers: vi.fn().mockResolvedValue([]),
    createPrayer: vi.fn().mockResolvedValue(mockPrayers.simple),
    updatePrayer: vi.fn().mockResolvedValue(mockPrayers.simple),
    deletePrayer: vi.fn().mockResolvedValue(true),
    getPrayersByUserId: vi.fn().mockResolvedValue([]),
  };
}

// 測試工具函數
export const mockServiceInstances = {
  // 重置所有服務 mock
  resetAll: () => {
    vi.clearAllMocks();
  },
  
  // 設置特定場景的 mock 數據
  setupUserStats: (scenario: keyof typeof mockUserStats) => {
    const stats = createMockUserStats(scenario);
    return stats;
  }
} 