import { render } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Index from './Index';
import { ROUTES } from '@/constants';

// 模擬路由
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  Navigate: ({ to, replace }: { to: string; replace?: boolean }) => {
    mockNavigate(to, { replace });
    return <div data-testid="navigate">Redirecting to {to}</div>;
  },
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('Index Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('應該重定向到代禱社群頁面', () => {
    render(<Index />);
    
    // 驗證導航到 ROUTES.PRAYERS
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.PRAYERS, { replace: true });
  });
}); 