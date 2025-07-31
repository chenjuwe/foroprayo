import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Auth from './Auth';

// Mock Firebase Auth
vi.mock('@/hooks/useFirebaseAuth', () => ({
  useFirebaseAuth: () => ({
    signIn: vi.fn(),
    signUp: vi.fn(),
    refreshUserAvatar: vi.fn(),
  }),
}));

// Mock Firebase Auth Store
vi.mock('@/stores/firebaseAuthStore', () => ({
  useFirebaseAuthStore: (selector: any) => {
    const state = {
      user: null,
      isAuthLoading: false,
      displayName: '',
      initAuth: vi.fn(),
      signOut: vi.fn(),
    };
    return selector ? selector(state) : state;
  },
}));

// Mock Firebase Avatar Hook
vi.mock('@/hooks/useFirebaseAvatar', () => ({
  useFirebaseAvatar: () => ({
    user: null,
    isLoggedIn: false,
    isAuthLoading: false,
    avatarUrl: 'https://example.com/avatar.jpg',
    avatarUrl30: 'https://example.com/avatar-30.jpg',
    avatarUrl48: 'https://example.com/avatar-48.jpg',
    avatarUrl96: 'https://example.com/avatar-96.jpg',
    avatarError: false,
    isLoading: false,
    error: null,
    refreshAvatar: vi.fn(() => Promise.resolve(true)),
    data: {
      avatar_url: 'https://example.com/avatar.jpg',
      user_name: 'Test User'
    }
  }),
}));

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/auth' }),
  };
});

// Mock Sonner toast
vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  value: true,
  writable: true,
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: '',
  },
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

const renderAuth = () => {
  return render(
    <BrowserRouter>
      <Auth />
    </BrowserRouter>
  );
};

describe('Auth Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
  });

  describe('基本渲染', () => {
    it('應該正確渲染認證頁面', () => {
      renderAuth();
      
      expect(screen.getByPlaceholderText('電子信箱')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('輸入密碼')).toBeInTheDocument();
    });

    it('應該預設顯示登入模式', () => {
      renderAuth();
      
      expect(screen.getByRole('button', { name: '登入帳號' })).toBeInTheDocument();
    });

    it('應該包含所有必要的表單元素', () => {
      renderAuth();
      
      expect(screen.getByPlaceholderText('電子信箱')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('輸入密碼')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '登入帳號' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '訪客帳號' })).toBeInTheDocument();
    });
  });

  describe('表單交互', () => {
    it('應該正確處理電子郵件輸入', async () => {
      renderAuth();
      
      const emailInput = screen.getByPlaceholderText('電子郵件') as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      expect(emailInput.value).toBe('test@example.com');
    });

    it('應該正確處理密碼輸入', async () => {
      renderAuth();
      
      const passwordInput = screen.getByPlaceholderText('輸入密碼') as HTMLInputElement;
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      expect(passwordInput.value).toBe('password123');
    });

    it('應該在輸入時顯示正確的類型', () => {
      renderAuth();
      
      const emailInput = screen.getByPlaceholderText('電子郵件') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('輸入密碼') as HTMLInputElement;
      
      expect(emailInput.type).toBe('email');
      expect(passwordInput.type).toBe('password');
    });
  });

  describe('模式切換', () => {
    it('應該能夠從登入切換到註冊模式', async () => {
      renderAuth();
      
      const registerButton = screen.getByRole('button', { name: '註冊帳號' });
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '註冊帳號' })).toBeInTheDocument();
      });
    });
  });
}); 
