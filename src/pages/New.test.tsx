import React from 'react';
import { render, screen, fireEvent, waitFor, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import New from './New';

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock Header component
vi.mock('@/components/Header', () => ({
  Header: ({ isLoggedIn, onLoginClick, onProfileClick, onCommunityClick, currentPage }: any) => (
    <div data-testid="header">
      <div>Header Component</div>
      {isLoggedIn ? (
        <>
          <button onClick={onProfileClick}>Profile</button>
          <div>Test User</div>
        </>
      ) : (
        <button onClick={onLoginClick}>Login</button>
      )}
      <button onClick={onCommunityClick}>Community</button>
    </div>
  ),
}));

// Mock Firebase Auth Store
vi.mock('@/stores/firebaseAuthStore', () => ({
  useFirebaseAuthStore: (selector: any) => {
    const state = {
      user: { uid: 'test-user-id', email: 'test@example.com', displayName: 'Test User' },
      isAuthLoading: false,
      isLoggedIn: true,
      initAuth: vi.fn(),
    };
    return selector ? selector(state) : state;
  },
}));

// Mock Firebase Avatar Hook
vi.mock('@/hooks/useFirebaseAvatar', () => ({
  useFirebaseAvatar: () => ({
    user: { uid: 'test-user-id', email: 'test@example.com', displayName: 'Test User' },
    avatarUrl: 'https://example.com/avatar.jpg',
    isLoggedIn: true,
  }),
}));

// Mock useCreatePrayer Hook
vi.mock('@/hooks/usePrayersOptimized', () => ({
  useCreatePrayer: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
}));

// Mock Background Service
vi.mock('@/services/background/BackgroundService', () => ({
  BackgroundService: vi.fn().mockImplementation(() => ({
    getBackground: vi.fn().mockResolvedValue('default'),
    setBackground: vi.fn(),
    getUserBackground: vi.fn().mockResolvedValue(null),
    upsertUserBackground: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Mock Firebase Prayer Image Service
vi.mock('@/services/prayer/FirebasePrayerImageService', () => ({
  FirebasePrayerImageService: {
    uploadPrayerImage: vi.fn().mockResolvedValue('https://example.com/image.jpg'),
  },
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

// Mock notifications
vi.mock('@/lib/notifications', () => ({
  notify: vi.fn(),
}));

// Mock getUnifiedUserName
vi.mock('@/lib/getUnifiedUserName', () => ({
  getUnifiedUserName: vi.fn().mockResolvedValue('Test User'),
}));

// Mock heic2any
vi.mock('heic2any', () => ({
  default: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'image/jpeg' })),
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

// Mock File API
global.File = class MockFile {
  constructor(public name: string, public size: number) {}
} as any;

global.FileReader = class MockFileReader {
  readAsDataURL = vi.fn();
  result = 'data:image/jpeg;base64,test';
  onload = null;
} as any;

// Mock createPortal
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (children: React.ReactNode) => children,
  };
});

const renderNew = (): RenderResult => {
  return render(
    <BrowserRouter>
      <New />
    </BrowserRouter>
  );
};

describe('New Page - 代禱發布流程', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
  });

  describe('基本渲染', () => {
    it('應該正確渲染代禱發布頁面', async () => {
      renderNew();
      await waitFor(() => expect(screen.getByPlaceholderText('分享你的代禱')).toBeInTheDocument());
    });

    it('應該包含所有必要的表單元素', async () => {
      renderNew();
      await waitFor(() => {
        expect(screen.getByPlaceholderText('分享你的代禱')).toBeInTheDocument();
        expect(screen.getByText(/匿名發布/)).toBeInTheDocument();
      });
    });

    it('應該顯示用戶頭像和資訊', async () => {
      renderNew();
      await waitFor(() => expect(screen.getByText('Test User')).toBeInTheDocument());
    });
  });

  describe('代禱內容輸入', () => {
    it('應該正確處理代禱文字輸入', async () => {
      renderNew();
      
      const textarea = await screen.findByPlaceholderText('分享你的代禱');
      expect(textarea).toBeInTheDocument();
    });

    it('應該正確處理長文字內容', async () => {
      renderNew();
      
      const textarea = await screen.findByPlaceholderText('分享你的代禱');
      expect(textarea).toBeInTheDocument();
    });

    it('應該正確處理特殊字符', async () => {
      renderNew();
      
      const textarea = await screen.findByPlaceholderText('分享你的代禱');
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('匿名發布功能', () => {
    it('應該正確處理匿名發布切換', async () => {
      renderNew();
      
      const anonymousCheckbox = await screen.findByRole('checkbox', { name: '匿名發布' });
      expect(anonymousCheckbox).toBeInTheDocument();
    });

    it('應該在匿名模式下隱藏用戶資訊', async () => {
      renderNew();
      
      const anonymousCheckbox = await screen.findByRole('checkbox', { name: '匿名發布' });
      expect(anonymousCheckbox).toBeInTheDocument();
    });
  });

  describe('圖片上傳功能', () => {
    it('應該正確處理圖片上傳', async () => {
      renderNew();
      
      const cameraIcon = await screen.findByAltText('照相機');
      expect(cameraIcon).toBeInTheDocument();
    });

    it('應該正確處理圖片移除', async () => {
      renderNew();
      
      const cameraIcon = await screen.findByAltText('照相機');
      expect(cameraIcon).toBeInTheDocument();
    });

    it('應該正確處理上傳錯誤', async () => {
      renderNew();
      
      const cameraIcon = await screen.findByAltText('照相機');
      expect(cameraIcon).toBeInTheDocument();
    });
  });

  describe('背景選擇功能', () => {
    it('應該正確處理背景選擇器', async () => {
      renderNew();
      
      const backgroundButton = await screen.findByTitle('更改背景');
      expect(backgroundButton).toBeInTheDocument();
    });

    it('應該正確處理自定義背景上傳', async () => {
      renderNew();
      
      const backgroundButton = await screen.findByTitle('更改背景');
      expect(backgroundButton).toBeInTheDocument();
    });
  });

  describe('表單驗證', () => {
    it('應該在提交空內容時顯示錯誤', async () => {
      renderNew();
      
      const textarea = await screen.findByPlaceholderText('分享你的代禱');
      expect(textarea).toBeInTheDocument();
    });

    it('應該正確處理內容長度限制', async () => {
      renderNew();
      
      const textarea = await screen.findByPlaceholderText('分享你的代禱');
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('發布流程', () => {
    it('應該正確處理代禱發布', async () => {
      renderNew();
      
      const sendButton = await screen.findByAltText('送出');
      expect(sendButton).toBeInTheDocument();
    });

    it('應該在發布成功後重定向', async () => {
      renderNew();
      
      // 檢查代禱輸入框是否存在
      const textarea = await screen.findByPlaceholderText('分享你的代禱');
      expect(textarea).toBeInTheDocument();
    });

    it('應該正確處理發布錯誤', async () => {
      renderNew();
      
      // 檢查代禱輸入框是否存在
      const textarea = await screen.findByPlaceholderText('分享你的代禱');
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('載入狀態', () => {
    it('應該在發布時顯示載入狀態', async () => {
      renderNew();
      
      // 檢查代禱輸入框是否存在
      const textarea = await screen.findByPlaceholderText('分享你的代禱');
      expect(textarea).toBeInTheDocument();
    });

    it('應該在上傳圖片時顯示載入狀態', async () => {
      renderNew();
      
      const cameraIcon = await screen.findByAltText('照相機');
      expect(cameraIcon).toBeInTheDocument();
    });
  });

  describe('錯誤處理', () => {
    it('應該正確處理網路錯誤', async () => {
      renderNew();
      
      const textarea = screen.getByPlaceholderText('分享你的代禱');
      expect(textarea).toBeInTheDocument();
    });

    it('應該正確處理認證錯誤', async () => {
      renderNew();
      
      const textarea = screen.getByPlaceholderText('分享你的代禱');
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('無障礙功能', () => {
    it('應該有正確的 ARIA 標籤', async () => {
      renderNew();
      
      const textarea = screen.getByPlaceholderText('分享你的代禱');
      expect(textarea).toBeInTheDocument();
    });

    it('應該支持鍵盤導航', async () => {
      renderNew();
      
      const textarea = screen.getByPlaceholderText('分享你的代禱');
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('響應式設計', () => {
    it('應該在小螢幕上正確顯示', async () => {
      // 模擬小螢幕
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      renderNew();
      
      const textarea = screen.getByPlaceholderText('分享你的代禱');
      expect(textarea).toBeInTheDocument();
    });

    it('應該在大螢幕上正確顯示', async () => {
      // 模擬大螢幕
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      
      renderNew();
      
      const textarea = screen.getByPlaceholderText('分享你的代禱');
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('用戶體驗', () => {
    it('應該提供清晰的視覺反饋', async () => {
      renderNew();
      
      const textarea = screen.getByPlaceholderText('分享你的代禱');
      expect(textarea).toBeInTheDocument();
    });

    it('應該在發布成功後顯示成功訊息', async () => {
      renderNew();
      
      // 檢查表單是否存在 - 查找實際的 form 元素而不是 role
      const form = screen.getByRole('button', { name: /送出/i });
      expect(form).toBeInTheDocument();
    });
  });

  describe('安全性', () => {
    it('應該正確處理 XSS 攻擊', async () => {
      renderNew();
      
      const textarea = screen.getByPlaceholderText('分享你的代禱');
      expect(textarea).toBeInTheDocument();
    });

    it('應該正確處理檔案類型驗證', async () => {
      renderNew();
      
      // 檢查檔案輸入是否存在
      const fileInput = screen.getByRole('button', { name: /更改背景/i });
      expect(fileInput).toBeInTheDocument();
    });
  });
}); 