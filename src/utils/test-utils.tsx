
// 首先放置所有 vi.mock 調用，確保它們在任何導入之前
vi.mock('@/integrations/firebase/client', () => ({
  auth: vi.fn(() => ({
    currentUser: null,
    onAuthStateChanged: vi.fn((callback) => {
      return () => {};
    }),
    signOut: vi.fn().mockResolvedValue(undefined)
  })),
  db: vi.fn(() => ({
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({
      exists: true,
      data: () => ({}),
      docs: []
    }),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis()
  })),
  storage: vi.fn(() => ({
    ref: vi.fn(() => ({
      put: vi.fn().mockResolvedValue({
        ref: {
          getDownloadURL: vi.fn().mockResolvedValue('https://example.com/avatar.png')
        }
      })
    }))
  }))
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback(null);
    return () => {};
  }),
  signOut: vi.fn().mockResolvedValue(undefined),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn(),
  onSnapshot: vi.fn()
}));

vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn()
}));

// 然後是其他導入
import React, { PropsWithChildren } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { User as FirebaseUser } from 'firebase/auth';
import { FirebaseAuthProvider, useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { Prayer } from '@/types/prayer';
import { PrayerResponse } from '@/types/prayer';
import { vi } from 'vitest';
import { useFirebaseAuthStore } from '@/stores/firebaseAuthStore';

// 創建一個模擬的 QueryClient
export const createTestQueryClient = () => 
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
        staleTime: Infinity,
      },
    },
  });

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
];

// 模擬 Zustand Firebase 認證存儲
export const mockFirebaseAuthStore = () => {
  const originalUseFirebaseAuthStore = useFirebaseAuthStore;
  
  // 模擬登入狀態
  const mockLoggedInState = {
    user: mockUser,
    isAuthLoading: false,
    displayName: '測試用戶',
    setUser: vi.fn(),
    setAuthLoading: vi.fn(),
    setDisplayName: vi.fn(),
    initAuth: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
  };
  
  // 模擬未登入狀態
  const mockLoggedOutState = {
    user: null,
    isAuthLoading: false,
    displayName: '',
    setUser: vi.fn(),
    setAuthLoading: vi.fn(),
    setDisplayName: vi.fn(),
    initAuth: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
  };
  
  // 創建模擬函數
  const mockStore = (isLoggedIn = true) => {
    vi.spyOn(useFirebaseAuthStore, 'getState').mockReturnValue(
      isLoggedIn ? mockLoggedInState : mockLoggedOutState
    );
    
    return vi.fn().mockImplementation((selector) => {
      const state = isLoggedIn ? mockLoggedInState : mockLoggedOutState;
      return selector(state);
    });
  };
  
  return { originalUseFirebaseAuthStore, mockStore };
};

// 模擬 FirebaseAuthProvider 和 useFirebaseAuth
vi.mock('@/contexts/FirebaseAuthContext', () => {
  const MockFirebaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => children;
  return {
    useFirebaseAuth: () => ({
      currentUser: null,
      loading: false,
      signIn: vi.fn().mockResolvedValue({ user: null, error: null }),
      signUp: vi.fn().mockResolvedValue({ user: null, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPassword: vi.fn().mockResolvedValue({ error: null }),
      refreshUserAvatar: vi.fn()
    }),
    FirebaseAuthProvider: MockFirebaseAuthProvider
  };
});

// 模擬 useFirebaseAvatar hook
vi.mock('@/hooks/useFirebaseAvatar', () => {
  return {
    useFirebaseAvatar: () => ({
      firebaseAvatarUrl: '/test-avatar.png',
      firebaseAvatarUrl30: '/test-avatar-30.png',
      firebaseAvatarUrl48: '/test-avatar-48.png',
      firebaseAvatarUrl96: '/test-avatar-96.png',
      isLoading: false,
      error: null,
      refreshAvatar: vi.fn(),
      data: null
    })
  };
});

// 測試包裝組件的 Props 介面
interface AllTheProvidersProps extends PropsWithChildren {
  queryClient?: QueryClient;
  initialEntries?: string[];
  authenticatedUser?: boolean; // 如果為 true，將模擬用戶已登入
  user?: FirebaseUser | null; // 可以直接傳入用戶對象
}

// 測試渲染的包裝組件，提供所有必要的上下文提供者
export const AllTheProviders: React.FC<AllTheProvidersProps> = ({
  children,
  queryClient = createTestQueryClient(),
  initialEntries = ['/'],
  authenticatedUser = false,
  user = authenticatedUser ? mockUser : null,
}) => {
  
  // 模擬認證狀態
  if (authenticatedUser || user) {
    const { mockStore } = mockFirebaseAuthStore();
    mockStore(true);
    
    // 如果有提供 user，更新 mockStore 的用戶狀態
    if (user) {
      vi.spyOn(useFirebaseAuthStore, 'getState').mockReturnValue({
        user,
        isAuthLoading: false,
        displayName: user.displayName || '',
        setUser: vi.fn(),
        setAuthLoading: vi.fn(),
        setDisplayName: vi.fn(),
        initAuth: vi.fn().mockResolvedValue(undefined),
        signOut: vi.fn().mockResolvedValue(undefined),
      });

      // 同時模擬 useFirebaseAuth
      vi.mocked(useFirebaseAuth).mockReturnValue({
        currentUser: user,
        loading: false,
        signIn: vi.fn().mockResolvedValue({ user: user, error: null }),
        signUp: vi.fn().mockResolvedValue({ user: user, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        resetPassword: vi.fn().mockResolvedValue({ error: null }),
        refreshUserAvatar: vi.fn()
      });
    }
  }
  
  return (
      <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <FirebaseAuthProvider>
          <Routes>
            <Route path="*" element={children} />
          </Routes>
        </FirebaseAuthProvider>
      </MemoryRouter>
      </QueryClientProvider>
  );
};

// 自定義渲染函數
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialEntries?: string[];
  authenticatedUser?: boolean;
  user?: FirebaseUser | null; // 可以直接傳入用戶對象
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    queryClient = createTestQueryClient(),
    initialEntries = ['/'],
    authenticatedUser = false,
    user = null,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders
        queryClient={queryClient}
        initialEntries={initialEntries}
        authenticatedUser={authenticatedUser}
        user={user}
      >
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
}

// 導出所有測試庫函數
export * from '@testing-library/react';
export { renderWithProviders as render }; 