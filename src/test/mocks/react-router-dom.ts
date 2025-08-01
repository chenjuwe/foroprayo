import { vi } from 'vitest'
import React from 'react'

// Mock React Router DOM
export const mockNavigate = vi.fn()

export const mockUseNavigate = () => mockNavigate

export const mockUseLocation = () => ({
  pathname: '/',
  search: '',
  hash: '',
  state: null,
})

export const mockUseParams = () => ({})

export const mockNavigateComponent = ({ to, replace }: { to: string; replace?: boolean }) => {
  // 模擬 Navigate 組件的行為
  mockNavigate(to, { replace })
  return null
}

// 導出所有需要的組件和 hooks
export const BrowserRouter = ({ children }: { children: React.ReactNode }) => {
  return React.createElement('div', { 'data-testid': 'browser-router' }, children)
}

export const Routes = ({ children }: { children: React.ReactNode }) => {
  return React.createElement('div', { 'data-testid': 'routes' }, children)
}

export const Route = ({ element }: { element: React.ReactNode }) => {
  return React.createElement('div', { 'data-testid': 'route' }, element)
}

export const Navigate = ({ to, replace }: { to: string; replace?: boolean }) => {
  mockNavigateComponent({ to, replace: replace ?? false })
  return null
}

export const Link = ({ to, children, ...props }: { to: string; children: React.ReactNode }) => {
  return React.createElement('a', { href: to, ...props }, children)
}

export const useNavigate = mockUseNavigate
export const useLocation = mockUseLocation
export const useParams = mockUseParams 