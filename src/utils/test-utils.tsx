/* eslint-disable react-refresh/only-export-components */
import React, { PropsWithChildren } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { User as FirebaseUser } from 'firebase/auth';
import { FirebaseAuthProvider } from '@/contexts/FirebaseAuthContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { mockUser, mockPrayers, mockResponses } from './test-constants';
import { vi } from 'vitest';
import { useFirebaseAuthStore } from '@/stores/firebaseAuthStore';
import { createTestQueryClient, mockFirebaseAuthStore } from './test-helpers';

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

// FirebaseAuthContext 已在 setup.ts 中 mock

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
  user?: FirebaseUser | null;
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