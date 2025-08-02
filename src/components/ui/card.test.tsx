import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card';

describe('Card 組件', () => {
  it('應該正確渲染 Card', () => {
    render(<Card data-testid="card">Card Content</Card>);
    
    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveTextContent('Card Content');
    expect(card).toHaveClass('rounded-lg', 'border', 'bg-card', 'text-card-foreground', 'shadow-sm');
  });

  it('應該支持自定義 className', () => {
    render(<Card className="custom-class" data-testid="card">Content</Card>);
    
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('custom-class');
    expect(card).toHaveClass('rounded-lg'); // 仍保留默認類別
  });

  it('應該正確渲染 CardHeader', () => {
    render(<CardHeader data-testid="card-header">Header Content</CardHeader>);
    
    const header = screen.getByTestId('card-header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveTextContent('Header Content');
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
  });

  it('應該正確渲染 CardTitle', () => {
    render(<CardTitle data-testid="card-title">Title</CardTitle>);
    
    const title = screen.getByTestId('card-title');
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe('H3');
    expect(title).toHaveTextContent('Title');
    expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight');
  });

  it('應該正確渲染 CardDescription', () => {
    render(<CardDescription data-testid="card-description">Description</CardDescription>);
    
    const description = screen.getByTestId('card-description');
    expect(description).toBeInTheDocument();
    expect(description.tagName).toBe('P');
    expect(description).toHaveTextContent('Description');
    expect(description).toHaveClass('text-sm', 'text-muted-foreground');
  });

  it('應該正確渲染 CardContent', () => {
    render(<CardContent data-testid="card-content">Content</CardContent>);
    
    const content = screen.getByTestId('card-content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveTextContent('Content');
    expect(content).toHaveClass('p-6', 'pt-0');
  });

  it('應該正確渲染 CardFooter', () => {
    render(<CardFooter data-testid="card-footer">Footer</CardFooter>);
    
    const footer = screen.getByTestId('card-footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveTextContent('Footer');
    expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
  });

  it('應該支持完整的 Card 結構', () => {
    render(
      <Card data-testid="full-card">
        <CardHeader data-testid="full-header">
          <CardTitle data-testid="full-title">Card Title</CardTitle>
          <CardDescription data-testid="full-description">Card Description</CardDescription>
        </CardHeader>
        <CardContent data-testid="full-content">
          Card Content
        </CardContent>
        <CardFooter data-testid="full-footer">
          Card Footer
        </CardFooter>
      </Card>
    );
    
    expect(screen.getByTestId('full-card')).toBeInTheDocument();
    expect(screen.getByTestId('full-header')).toBeInTheDocument();
    expect(screen.getByTestId('full-title')).toHaveTextContent('Card Title');
    expect(screen.getByTestId('full-description')).toHaveTextContent('Card Description');
    expect(screen.getByTestId('full-content')).toHaveTextContent('Card Content');
    expect(screen.getByTestId('full-footer')).toHaveTextContent('Card Footer');
  });

  it('應該正確轉發 ref', () => {
    const ref = vi.fn();
    render(<Card ref={ref}>Content</Card>);
    
    expect(ref).toHaveBeenCalled();
  });

  it('應該支持所有標準 HTML 屬性', () => {
    render(
      <Card 
        data-testid="card"
        id="test-card"
        role="region"
        aria-label="Test Card"
      >
        Content
      </Card>
    );
    
    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('id', 'test-card');
    expect(card).toHaveAttribute('role', 'region');
    expect(card).toHaveAttribute('aria-label', 'Test Card');
  });

  it('應該具有正確的 displayName', () => {
    expect(Card.displayName).toBe('Card');
    expect(CardHeader.displayName).toBe('CardHeader');
    expect(CardTitle.displayName).toBe('CardTitle');
    expect(CardDescription.displayName).toBe('CardDescription');
    expect(CardContent.displayName).toBe('CardContent');
    expect(CardFooter.displayName).toBe('CardFooter');
  });
}); 