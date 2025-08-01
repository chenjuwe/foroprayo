import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { NavigationButtons } from './NavigationButtons';

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
    useLocation: vi.fn(() => ({ pathname: '/prayers' })),
  };
});

// Mock icons
vi.mock('@/assets/icons/PrayersIcon.svg?react', () => ({
  default: () => <div data-testid="prayers-icon">Prayers Icon</div>,
}));

vi.mock('@/assets/icons/NewIcon.svg?react', () => ({
  default: () => <div data-testid="new-icon">New Icon</div>,
}));

vi.mock('@/assets/icons/MyIcon.svg?react', () => ({
  default: () => <div data-testid="my-icon">My Icon</div>,
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('NavigationButtons', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    const { useNavigate } = require('react-router-dom');
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  describe('基本渲染', () => {
    it('應該正確渲染所有導航按鈕', () => {
      renderWithRouter(<NavigationButtons />);
      
      expect(screen.getByText('代禱')).toBeInTheDocument();
      expect(screen.getByText('發布')).toBeInTheDocument();
      expect(screen.getByText('我的')).toBeInTheDocument();
      
      expect(screen.getByTestId('prayers-icon')).toBeInTheDocument();
      expect(screen.getByTestId('new-icon')).toBeInTheDocument();
      expect(screen.getByTestId('my-icon')).toBeInTheDocument();
    });

    it('應該正確設置按鈕樣式', () => {
      renderWithRouter(<NavigationButtons />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('flex', 'flex-col', 'items-center', 'gap-1');
      });
    });
  });

  describe('導航功能', () => {
    it('應該在點擊代禱按鈕時導航到代禱頁面', async () => {
      const user = userEvent.setup();
      renderWithRouter(<NavigationButtons />);
      
      const prayersButton = screen.getByText('代禱');
      await user.click(prayersButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/prayers');
    });

    it('應該在點擊發布按鈕時導航到發布頁面', async () => {
      const user = userEvent.setup();
      renderWithRouter(<NavigationButtons />);
      
      const newButton = screen.getByText('發布');
      await user.click(newButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/new');
    });

    it('應該在點擊我的按鈕時導航到個人資料頁面', async () => {
      const user = userEvent.setup();
      renderWithRouter(<NavigationButtons />);
      
      const profileButton = screen.getByText('我的');
      await user.click(profileButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });
  });

  describe('活動狀態', () => {
    it('應該在代禱頁面時高亮代禱按鈕', () => {
      const { useLocation } = require('react-router-dom');
      vi.mocked(useLocation).mockReturnValue({ pathname: '/prayers' });
      
      renderWithRouter(<NavigationButtons />);
      
      const prayersButton = screen.getByText('代禱').closest('button');
      expect(prayersButton).toHaveClass('text-blue-600');
    });

    it('應該在發布頁面時高亮發布按鈕', () => {
      const { useLocation } = require('react-router-dom');
      vi.mocked(useLocation).mockReturnValue({ pathname: '/new' });
      
      renderWithRouter(<NavigationButtons />);
      
      const newButton = screen.getByText('發布').closest('button');
      expect(newButton).toHaveClass('text-blue-600');
    });

    it('應該在個人資料頁面時高亮我的按鈕', () => {
      const { useLocation } = require('react-router-dom');
      vi.mocked(useLocation).mockReturnValue({ pathname: '/profile' });
      
      renderWithRouter(<NavigationButtons />);
      
      const profileButton = screen.getByText('我的').closest('button');
      expect(profileButton).toHaveClass('text-blue-600');
    });
  });

  describe('響應式設計', () => {
    it('應該在移動端正確顯示', () => {
      renderWithRouter(<NavigationButtons />);
      
      const container = screen.getAllByRole('button')[0].parentElement;
      expect(container).toHaveClass('flex', 'justify-around');
    });
  });

  describe('無障礙功能', () => {
    it('應該有正確的按鈕標籤', () => {
      renderWithRouter(<NavigationButtons />);
      
      expect(screen.getByRole('button', { name: /代禱/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /發布/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /我的/i })).toBeInTheDocument();
    });

    it('應該支援鍵盤導航', async () => {
      const user = userEvent.setup();
      renderWithRouter(<NavigationButtons />);
      
      const buttons = screen.getAllByRole('button');
      
      // Tab 鍵導航
      await user.tab();
      expect(buttons[0]).toHaveFocus();
      
      await user.tab();
      expect(buttons[1]).toHaveFocus();
      
      await user.tab();
      expect(buttons[2]).toHaveFocus();
    });

    it('應該支援 Enter 鍵觸發點擊', async () => {
      const user = userEvent.setup();
      renderWithRouter(<NavigationButtons />);
      
      const prayersButton = screen.getByText('代禱');
      prayersButton.focus();
      await user.keyboard('{Enter}');
      
      expect(mockNavigate).toHaveBeenCalledWith('/prayers');
    });
  });

  describe('錯誤處理', () => {
    it('應該處理導航錯誤', async () => {
      const user = userEvent.setup();
      mockNavigate.mockImplementation(() => {
        throw new Error('Navigation failed');
      });
      
      renderWithRouter(<NavigationButtons />);
      
      const prayersButton = screen.getByText('代禱');
      // 應該不會拋出錯誤
      await user.click(prayersButton);
    });
  });
}); 