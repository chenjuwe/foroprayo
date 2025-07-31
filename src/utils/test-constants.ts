import { Prayer } from '@/types/prayer';
import { PrayerResponse } from '@/types/prayer';
import { vi } from 'vitest';
import { FirebaseUser } from 'firebase/auth';

// 模擬用戶數據 - Firebase 版本
export const mockUser: FirebaseUser = {
  uid: 'test-user-id-123',
  email: 'test@example.com',
  displayName: '測試用戶',
  photoURL: 'https://example.com/avatar.png',
  emailVerified: true,
  isAnonymous: false,
  metadata: {
    creationTime: '2025-01-01',
    lastSignInTime: '2025-01-01'
  },
  providerData: [],
  refreshToken: 'test-refresh-token',
  tenantId: null,
  delete: vi.fn(),
  getIdToken: vi.fn(),
  getIdTokenResult: vi.fn(),
  reload: vi.fn(),
  toJSON: vi.fn()
} as unknown as FirebaseUser;

// 定義一個通用的測試用戶（簡化版，用於模擬）
export const genericUser = {
  uid: 'test-user-id-123',
  email: 'test@example.com',
  displayName: '測試用戶',
};

// 模擬代禱數據
export const mockPrayers: Prayer[] = [
    {
    id: 'prayer-1',
    content: '第一個測試代禱內容',
    user_id: 'test-user-id-123',
      user_name: '測試用戶',
    user_avatar: 'https://example.com/avatar.png',
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-01T10:00:00Z',
    is_anonymous: false,
    response_count: 2,
  },
  {
    id: 'prayer-2',
    content: '第二個測試代禱內容',
    user_id: 'other-user-id',
    user_name: '其他用戶',
    user_avatar: 'https://example.com/avatar2.png',
    created_at: '2025-01-02T10:00:00Z',
    updated_at: '2025-01-02T10:00:00Z',
      is_anonymous: false,
    response_count: 0,
    },
  {
    id: 'prayer-3',
    content: '匿名代禱內容',
    user_id: 'anon-user-id',
    user_name: '匿名用戶',
    user_avatar: '',
    created_at: '2025-01-03T10:00:00Z',
    updated_at: '2025-01-03T10:00:00Z',
    is_anonymous: true,
    response_count: 1,
  },
];

// 模擬代禱回應數據
export const mockResponses: PrayerResponse[] = [
  {
    id: 'response-1',
    prayer_id: 'prayer-1',
    content: '第一個回應內容',
    user_id: 'other-user-id',
    user_name: '其他用戶',
    user_avatar: 'https://example.com/avatar2.png',
    created_at: '2025-01-04T10:00:00Z',
    updated_at: '2025-01-04T10:00:00Z',
    is_anonymous: false,
  },
  {
    id: 'response-2',
    prayer_id: 'prayer-1',
    content: '第二個回應內容',
    user_id: 'test-user-id-123',
    user_name: '測試用戶',
    user_avatar: 'https://example.com/avatar.png',
    created_at: '2025-01-05T10:00:00Z',
    updated_at: '2025-01-05T10:00:00Z',
    is_anonymous: false,
  },
  {
    id: 'response-3',
    prayer_id: 'prayer-3',
    content: '匿名回應內容',
    user_id: 'anon-user-id',
    user_name: '匿名用戶',
    user_avatar: '',
    created_at: '2025-01-06T10:00:00Z',
    updated_at: '2025-01-06T10:00:00Z',
    is_anonymous: true,
  },
]; 