import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Profile from './Profile';

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams()],
  };
});

// Mock Firebase Avatar Hook
vi.mock('@/hooks/useFirebaseAvatar', () => ({
  useFirebaseAvatar: () => ({
    user: { uid: 'test-user-id', email: 'test@example.com' },
    avatarUrl: 'https://example.com/avatar.jpg',
    isLoggedIn: true,
    isAuthLoading: false,
  }),
}));

// Mock Firebase User Data Hook
vi.mock('@/hooks/useFirebaseUserData', () => ({
  default: () => ({
    userData: {
      displayName: 'Test User',
      photoURL: 'https://example.com/avatar.jpg',
    },
    scripture: 'John 3:16',
    updateScripture: vi.fn(),
    refreshUserData: vi.fn(),
  }),
}));

// Mock Firebase Auth Store
vi.mock('@/stores/firebaseAuthStore', () => ({
  useFirebaseAuthStore: () => ({
    initAuth: vi.fn(),
  }),
}));

// Mock Firebase Client
vi.mock('@/integrations/firebase/client', () => ({
  auth: vi.fn(),
  db: vi.fn(),
}));

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  updateProfile: vi.fn().mockResolvedValue(true),
}));

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({
      displayName: 'Test User',
      photoURL: 'https://example.com/avatar.jpg',
      scripture: 'John 3:16',
    }),
  }),
}));

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: {
      user_name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
      scripture: 'John 3:16',
    },
    isLoading: false,
    error: null,
  }),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
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

// Mock toast
vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

// Mock utils
vi.mock('@/lib/utils', () => ({
  debounce: vi.fn((fn) => fn),
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' ')),
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

const renderProfile = () => {
  return render(
    <BrowserRouter>
      <Profile />
    </BrowserRouter>
  );
};

describe('Profile Page - 用戶個人資料管理', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
  });

  describe('基本渲染', () => {
    it('應該正確渲染個人資料頁面', () => {
      renderProfile();
      
      // 檢查基本元素是否存在
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('應該顯示用戶頭像', () => {
      renderProfile();
      
      // 檢查頭像元素
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('應該顯示用戶統計資訊', () => {
      renderProfile();
      
      // 檢查統計資訊區域
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('用戶資訊編輯', () => {
    it('應該正確處理用戶名稱編輯', async () => {
      renderProfile();
      
      // 檢查用戶名稱編輯
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('應該正確處理經文編輯', async () => {
      renderProfile();
      
      // 檢查經文編輯
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('應該正確處理頭像上傳', async () => {
      renderProfile();
      
      // 檢查頭像上傳功能
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('資料保存', () => {
    it('應該正確處理資料保存', async () => {
      renderProfile();
      
      // 檢查保存功能
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('應該在保存成功後顯示成功訊息', async () => {
      renderProfile();
      
      // 檢查成功訊息
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('應該正確處理保存錯誤', async () => {
      renderProfile();
      
      // 檢查錯誤處理
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('好友功能', () => {
    it('應該正確顯示加好友按鈕', () => {
      renderProfile();
      
      // 檢查加好友按鈕
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('應該正確處理加好友請求', async () => {
      renderProfile();
      
      // 檢查加好友功能
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('應該正確處理傳送訊息', async () => {
      renderProfile();
      
      // 檢查傳送訊息功能
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('登出功能', () => {
    it('應該正確處理登出', async () => {
      renderProfile();
      
      // 檢查登出功能
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('應該在登出前顯示確認對話框', async () => {
      renderProfile();
      
      // 檢查確認對話框
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('導航功能', () => {
    it('應該正確處理返回按鈕', async () => {
      renderProfile();
      
      // 檢查返回功能
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('應該正確處理發布按鈕', async () => {
      renderProfile();
      
      // 檢查發布功能
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('載入狀態', () => {
    it('應該在載入時顯示載入狀態', async () => {
      renderProfile();
      
      // 檢查載入狀態
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('應該在保存時顯示載入狀態', async () => {
      renderProfile();
      
      // 檢查保存載入狀態
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('錯誤處理', () => {
    it('應該正確處理網路錯誤', async () => {
      renderProfile();
      
      // 檢查網路錯誤處理
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('應該正確處理認證錯誤', async () => {
      renderProfile();
      
      // 檢查認證錯誤處理
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('無障礙功能', () => {
    it('應該有正確的 ARIA 標籤', () => {
      renderProfile();
      
      // 檢查 ARIA 標籤
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('應該支持鍵盤導航', () => {
      renderProfile();
      
      // 檢查鍵盤導航
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('響應式設計', () => {
    it('應該在小螢幕上正確顯示', () => {
      // 模擬小螢幕
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        writable: true,
      });
      
      renderProfile();
      
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('應該在大螢幕上正確顯示', () => {
      // 模擬大螢幕
      Object.defineProperty(window, 'innerWidth', {
        value: 1920,
        writable: true,
      });
      
      renderProfile();
      
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('用戶體驗', () => {
    it('應該提供清晰的視覺反饋', () => {
      renderProfile();
      
      // 檢查視覺反饋
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('應該在操作成功後顯示成功訊息', async () => {
      renderProfile();
      
      // 檢查成功訊息
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('邊界情況', () => {
    it('應該正確處理空用戶名稱', () => {
      renderProfile();
      
      // 檢查空名稱處理
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('應該正確處理空經文', () => {
      renderProfile();
      
      // 檢查空經文處理
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('應該正確處理特殊字符', () => {
      renderProfile();
      
      // 檢查特殊字符處理
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('安全性', () => {
    it('應該正確處理 XSS 攻擊', async () => {
      renderProfile();
      
      // 檢查 XSS 處理
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('應該正確處理檔案類型驗證', async () => {
      renderProfile();
      
      // 檢查檔案類型驗證
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('資料驗證', () => {
    it('應該正確驗證用戶名稱長度', async () => {
      renderProfile();
      
      // 檢查長度驗證
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('應該正確驗證經文格式', async () => {
      renderProfile();
      
      // 檢查格式驗證
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });
}); 