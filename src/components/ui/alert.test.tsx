import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { Alert, AlertTitle, AlertDescription } from './alert';

describe('Alert 組件', () => {
  it('應該正確渲染默認 Alert', () => {
    render(<Alert data-testid="alert">Alert Content</Alert>);
    
    const alert = screen.getByTestId('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Alert Content');
    expect(alert).toHaveAttribute('role', 'alert');
    expect(alert).toHaveClass(
      'relative',
      'w-full',
      'rounded-lg',
      'border',
      'p-4'
    );
  });

  it('應該支持 default 變體', () => {
    render(<Alert variant="default" data-testid="alert">Default Alert</Alert>);
    
    const alert = screen.getByTestId('alert');
    expect(alert).toHaveClass('bg-background', 'text-foreground');
  });

  it('應該支持 destructive 變體', () => {
    render(<Alert variant="destructive" data-testid="alert">Destructive Alert</Alert>);
    
    const alert = screen.getByTestId('alert');
    expect(alert).toHaveClass('border-destructive/50', 'text-destructive');
  });

  it('應該支持自定義 className', () => {
    render(<Alert className="custom-class" data-testid="alert">Custom Alert</Alert>);
    
    const alert = screen.getByTestId('alert');
    expect(alert).toHaveClass('custom-class');
    expect(alert).toHaveClass('relative'); // 仍保留默認類別
  });

  it('應該正確渲染 AlertTitle', () => {
    render(<AlertTitle data-testid="alert-title">Alert Title</AlertTitle>);
    
    const title = screen.getByTestId('alert-title');
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe('H5');
    expect(title).toHaveTextContent('Alert Title');
    expect(title).toHaveClass('mb-1', 'font-medium', 'leading-none', 'tracking-tight');
  });

  it('應該正確渲染 AlertDescription', () => {
    render(<AlertDescription data-testid="alert-description">Alert Description</AlertDescription>);
    
    const description = screen.getByTestId('alert-description');
    expect(description).toBeInTheDocument();
    expect(description.tagName).toBe('DIV');
    expect(description).toHaveTextContent('Alert Description');
    expect(description).toHaveClass('text-sm');
  });

  it('應該支持完整的 Alert 結構', () => {
    render(
      <Alert data-testid="full-alert">
        <AlertTitle data-testid="full-title">Alert Title</AlertTitle>
        <AlertDescription data-testid="full-description">
          This is an alert description.
        </AlertDescription>
      </Alert>
    );
    
    expect(screen.getByTestId('full-alert')).toBeInTheDocument();
    expect(screen.getByTestId('full-title')).toHaveTextContent('Alert Title');
    expect(screen.getByTestId('full-description')).toHaveTextContent('This is an alert description.');
  });

  it('應該正確轉發 ref', () => {
    const alertRef = vi.fn();
    const titleRef = vi.fn();
    const descriptionRef = vi.fn();
    
    render(
      <>
        <Alert ref={alertRef}>Alert</Alert>
        <AlertTitle ref={titleRef}>Title</AlertTitle>
        <AlertDescription ref={descriptionRef}>Description</AlertDescription>
      </>
    );
    
    expect(alertRef).toHaveBeenCalled();
    expect(titleRef).toHaveBeenCalled();
    expect(descriptionRef).toHaveBeenCalled();
  });

  it('應該支持所有標準 HTML 屬性', () => {
    render(
      <Alert 
        data-testid="alert"
        id="test-alert"
        aria-label="Test Alert"
      >
        Alert Content
      </Alert>
    );
    
    const alert = screen.getByTestId('alert');
    expect(alert).toHaveAttribute('id', 'test-alert');
    expect(alert).toHaveAttribute('aria-label', 'Test Alert');
    expect(alert).toHaveAttribute('role', 'alert'); // 預設的 role
  });

  it('應該具有正確的 displayName', () => {
    expect(Alert.displayName).toBe('Alert');
    expect(AlertTitle.displayName).toBe('AlertTitle');
    expect(AlertDescription.displayName).toBe('AlertDescription');
  });

  it('應該支持嵌套的複雜內容', () => {
    render(
      <Alert data-testid="complex-alert">
        <div>
          <AlertTitle>Important Notice</AlertTitle>
          <AlertDescription>
            <p>This is a paragraph within the description.</p>
            <span>Additional text content.</span>
          </AlertDescription>
        </div>
      </Alert>
    );
    
    const alert = screen.getByTestId('complex-alert');
    expect(alert).toHaveTextContent('Important Notice');
    expect(alert).toHaveTextContent('This is a paragraph within the description.');
    expect(alert).toHaveTextContent('Additional text content.');
  });

  it('應該支持 SVG 圖標樣式', () => {
    render(
      <Alert data-testid="alert-with-icon">
        <svg data-testid="alert-icon" />
        <AlertTitle>Title with Icon</AlertTitle>
        <AlertDescription>Description with Icon</AlertDescription>
      </Alert>
    );
    
    const alert = screen.getByTestId('alert-with-icon');
    // 檢查是否包含 SVG 相關的 CSS 類別
    expect(alert).toHaveClass('[&>svg~*]:pl-7', '[&>svg+div]:translate-y-[-3px]');
    expect(alert).toHaveClass('[&>svg]:absolute', '[&>svg]:left-4', '[&>svg]:top-4');
  });
}); 