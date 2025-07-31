import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

// Mock the SVG import
vi.mock('../../assets/icons/PrayforLogo.svg', () => ({
  default: 'mocked-logo.svg',
}));

import { AuthLogo } from './AuthLogo';

describe('AuthLogo', () => {
  it('應該正確渲染 Logo', () => {
    render(<AuthLogo />);

    const logoContainer = screen.getByRole('img', { name: 'Prayfor Logo' }).parentElement;
    expect(logoContainer).toBeInTheDocument();
  });

  it('應該包含正確的 CSS 類別', () => {
    render(<AuthLogo />);

    const logoContainer = screen.getByRole('img', { name: 'Prayfor Logo' }).parentElement;
    expect(logoContainer).toHaveClass('mb-12');
  });

  it('應該正確設定樣式', () => {
    render(<AuthLogo />);

    const logoImage = screen.getByAltText('Prayfor Logo');
    expect(logoImage).toHaveStyle({
      color: 'rgb(0, 0, 0)',
    });
  });

  it('應該包含 Logo 圖片', () => {
    render(<AuthLogo />);

    const logoImage = screen.getByAltText('Prayfor Logo');
    expect(logoImage).toBeInTheDocument();
    expect(logoImage).toHaveAttribute('src', 'mocked-logo.svg');
  });

  it('應該正確設定圖片屬性', () => {
    render(<AuthLogo />);

    const logoImage = screen.getByAltText('Prayfor Logo');
    expect(logoImage).toHaveAttribute('alt', 'Prayfor Logo');
    expect(logoImage).toHaveClass('aspect-[3.27]', 'object-contain', 'w-[100px]', 'md:w-[120px]', 'lg:w-[140px]');
  });
}); 