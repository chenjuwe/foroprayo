import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Auth from './Auth';

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/auth' }),
  };
});

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock AuthForm component
vi.mock('@/components/auth/AuthForm', () => ({
  AuthForm: ({ email, password, isLogin, isLoading, onEmailChange, onPasswordChange, onToggle, onSubmit }: any) => (
    <div data-testid="auth-form">
      <div>Auth Form Component</div>
      <input
        type="email"
        value={email}
        onChange={onEmailChange}
        placeholder="電子郵件"
        data-testid="email-input"
      />
      <input
        type="password"
        value={password}
        onChange={onPasswordChange}
        placeholder="密碼"
        data-testid="password-input"
      />
      <button
        type="submit"
        onClick={onSubmit}
        disabled={isLoading}
        data-testid="submit-button"
      >
        {isLogin ? '登入' : '註冊'}
      </button>
      <button
        type="button"
        onClick={onToggle}
        data-testid="toggle-button"
      >
        {isLogin ? '切換到註冊' : '切換到登入'}
      </button>
    </div>
  ),
}));

// Mock Firebase Auth Hook
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
      isLoggedIn: false,
      initAuth: vi.fn(),
    };
    return selector ? selector(state) : state;
  },
}));

// Mock Firebase Avatar Hook
vi.mock('@/hooks/useFirebaseAvatar', () => ({
  useFirebaseAvatar: () => ({
    refreshAvatar: vi.fn(),
  }),
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

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: '',
  },
  writable: true,
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
  });

  describe('基本渲染', () => {
    it('應該正確渲染認證頁面', async () => {
      await act(async () => {
        renderAuth();
      });
      
      expect(screen.getByTestId('auth-form')).toBeInTheDocument();
    });

    it('應該預設顯示登入模式', async () => {
      await act(async () => {
        renderAuth();
      });
      
      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toHaveTextContent('登入');
    });

    it('應該包含所有必要的表單元素', async () => {
      await act(async () => {
        renderAuth();
      });
      
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-button')).toBeInTheDocument();
    });
  });

  describe('表單交互', () => {
    it('應該正確處理電子郵件輸入', async () => {
      await act(async () => {
        renderAuth();
      });
      
      const emailInput = screen.getByTestId('email-input');
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      });
      
      expect(emailInput).toHaveValue('test@example.com');
    });

    it('應該正確處理密碼輸入', async () => {
      await act(async () => {
        renderAuth();
      });
      
      const passwordInput = screen.getByTestId('password-input');
      await act(async () => {
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
      });
      
      expect(passwordInput).toHaveValue('password123');
    });

    it('應該在輸入時顯示正確的類型', async () => {
      await act(async () => {
        renderAuth();
      });
      
      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('模式切換', () => {
    it('應該能夠從登入切換到註冊模式', async () => {
      await act(async () => {
        renderAuth();
      });
      
      const toggleButton = screen.getByTestId('toggle-button');
      await act(async () => {
        fireEvent.click(toggleButton);
      });
      
      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toHaveTextContent('註冊');
    });
  });
}); 
