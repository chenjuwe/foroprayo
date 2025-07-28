import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn function', () => {
  it('should merge class names correctly', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const hasError = false;
    expect(cn('base', isActive && 'active', hasError && 'error')).toBe('base active');
  });

  it('should override conflicting classes correctly', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('should handle various types of arguments', () => {
    expect(cn('button', null, undefined, false, 'button-primary')).toBe('button button-primary');
  });
}); 