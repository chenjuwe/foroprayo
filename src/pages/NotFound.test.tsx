import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import NotFound from './NotFound';

// Mock logger
vi.mock('@/lib/logger', () => ({
  log: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock react-router-dom
const mockLocation = { pathname: '/non-existent-page' };
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => mockLocation,
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('NotFound 頁面', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('應該正確渲染 404 頁面', () => {
    renderWithRouter(<NotFound />);
    
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Oops! Page not found')).toBeInTheDocument();
    expect(screen.getByText('Return to Home')).toBeInTheDocument();
  });

  it('應該有正確的返回首頁連結', () => {
    renderWithRouter(<NotFound />);
    
    const homeLink = screen.getByRole('link', { name: 'Return to Home' });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('應該有正確的 CSS 類別', () => {
    renderWithRouter(<NotFound />);
    
    const container = screen.getByText('404').closest('div');
    expect(container).toHaveClass('text-center');
    
    const mainContainer = container?.parentElement;
    expect(mainContainer).toHaveClass('min-h-screen', 'flex', 'items-center', 'justify-center', 'bg-gray-100');
  });

  it('應該記錄 404 錯誤到日誌', async () => {
    const { log } = await import('@/lib/logger');
    
    renderWithRouter(<NotFound />);
    
    expect(log.error).toHaveBeenCalledWith(
      "404 Error: User attempted to access non-existent route",
      { pathname: '/non-existent-page' },
      'NotFound'
    );
  });

  it('應該在路徑改變時重新記錄錯誤', async () => {
    const { log } = await import('@/lib/logger');
    
    // 第一次渲染
    const { rerender } = renderWithRouter(<NotFound />);
    
    expect(log.error).toHaveBeenCalledTimes(1);
    
    // 模擬路徑改變
    mockLocation.pathname = '/another-non-existent-page';
    
    // 重新渲染
    rerender(<NotFound />);
    
    expect(log.error).toHaveBeenCalledTimes(2);
    expect(log.error).toHaveBeenLastCalledWith(
      "404 Error: User attempted to access non-existent route",
      { pathname: '/another-non-existent-page' },
      'NotFound'
    );
  });

  it('應該具有適當的可訪問性標籤', () => {
    renderWithRouter(<NotFound />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('404');
    
    const link = screen.getByRole('link');
    expect(link).toHaveAccessibleName('Return to Home');
  });
}); 