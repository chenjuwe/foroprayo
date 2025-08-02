import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge, badgeVariants } from './badge';

describe('Badge 組件', () => {
  it('應該正確渲染默認 Badge', () => {
    render(<Badge data-testid="badge">Default Badge</Badge>);
    
    const badge = screen.getByTestId('badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Default Badge');
    expect(badge).toHaveClass(
      'inline-flex',
      'items-center',
      'rounded-full',
      'border',
      'px-2.5',
      'py-0.5',
      'text-xs',
      'font-semibold',
      'transition-colors'
    );
  });

  it('應該支持 default 變體', () => {
    render(<Badge variant="default" data-testid="badge">Default</Badge>);
    
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass(
      'border-transparent',
      'bg-primary',
      'text-primary-foreground'
    );
  });

  it('應該支持 secondary 變體', () => {
    render(<Badge variant="secondary" data-testid="badge">Secondary</Badge>);
    
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass(
      'border-transparent',
      'bg-secondary',
      'text-secondary-foreground'
    );
  });

  it('應該支持 destructive 變體', () => {
    render(<Badge variant="destructive" data-testid="badge">Destructive</Badge>);
    
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass(
      'border-transparent',
      'bg-destructive',
      'text-destructive-foreground'
    );
  });

  it('應該支持 outline 變體', () => {
    render(<Badge variant="outline" data-testid="badge">Outline</Badge>);
    
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('text-foreground');
  });

  it('應該支持自定義 className', () => {
    render(<Badge className="custom-class" data-testid="badge">Custom</Badge>);
    
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('custom-class');
    expect(badge).toHaveClass('inline-flex'); // 仍保留默認類別
  });

  it('應該支持所有標準 HTML 屬性', () => {
    render(
      <Badge 
        data-testid="badge"
        id="test-badge"
        role="status"
        aria-label="Test Badge"
      >
        Test
      </Badge>
    );
    
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('id', 'test-badge');
    expect(badge).toHaveAttribute('role', 'status');
    expect(badge).toHaveAttribute('aria-label', 'Test Badge');
  });

  it('應該使用 div 元素', () => {
    render(<Badge data-testid="badge">Content</Badge>);
    
    const badge = screen.getByTestId('badge');
    expect(badge.tagName).toBe('DIV');
  });

  it('應該支持點擊事件', () => {
    let clicked = false;
    const handleClick = () => { clicked = true; };
    
    render(<Badge onClick={handleClick} data-testid="badge">Clickable</Badge>);
    
    const badge = screen.getByTestId('badge');
    badge.click();
    expect(clicked).toBe(true);
  });

  it('應該正確處理 focus 樣式', () => {
    render(<Badge data-testid="badge">Focusable</Badge>);
    
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass(
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-ring',
      'focus:ring-offset-2'
    );
  });

  it('應該支持不同的內容類型', () => {
    render(
      <Badge data-testid="badge">
        <span>Nested Content</span>
        123
      </Badge>
    );
    
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveTextContent('Nested Content123');
  });

  describe('badgeVariants', () => {
    it('應該正確生成變體類別', () => {
      expect(badgeVariants()).toContain('inline-flex');
      expect(badgeVariants({ variant: 'default' })).toContain('bg-primary');
      expect(badgeVariants({ variant: 'secondary' })).toContain('bg-secondary');
      expect(badgeVariants({ variant: 'destructive' })).toContain('bg-destructive');
      expect(badgeVariants({ variant: 'outline' })).toContain('text-foreground');
    });
  });
}); 