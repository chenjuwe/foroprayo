// 通用的TypeScript類型定義

// API響應類型
export interface ApiResponse<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

// 用戶相關類型
export interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// 代禱相關的擴展類型
export interface PrayerWithUser {
  id: string;
  content: string;
  is_anonymous: boolean;
  user_name?: string;
  user_avatar?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  user_profile?: UserProfile;
  response_count?: number;
}

// 表單驗證類型
export interface FormValidationError {
  field: string;
  message: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: FormValidationError[];
}

// 載入狀態類型
export interface LoadingState<T = unknown> {
  isLoading: boolean;
  error: string | null;
  data: T | null;
}

// 分頁類型
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// 事件處理類型
export type EventHandler<T = void> = (data?: T) => void | Promise<void>;

// 組件Props的通用類型
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// 錯誤邊界相關類型
export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// 主題相關類型
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  mode: ThemeMode;
  primaryColor: string;
  secondaryColor: string;
}

// 通知類型強化
export type NotificationVariant = 'success' | 'error' | 'warning' | 'info';

export interface NotificationConfig {
  id: string;
  type: NotificationVariant;
  title: string;
  message: string;
  duration: number;
  dismissible: boolean;
  timestamp: Date;
}

// 路由相關類型
export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  protected: boolean;
  title?: string;
}

// 本地存儲鍵類型（避免拼寫錯誤）
export const STORAGE_KEYS = {
  USER_AVATAR: (userId: string) => `avatar_${userId}`,
  USER_NAME: (userId: string) => `username_${userId}`,
  USER_SCRIPTURE: (userId: string) => `scripture_${userId}`,
  THEME_MODE: 'theme_mode',
  LANGUAGE: 'language',
} as const;

// 環境變數類型
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

// 日誌相關類型
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  component?: string;
  data?: Record<string, unknown> | string | number | boolean | null;
  stack?: string;
}

// 查詢錯誤類型
export interface QueryError extends Error {
  message: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

// 類型守護函數
export function isQueryError(error: unknown): error is QueryError {
  return error instanceof Error;
}

export function isAuthError(error: unknown): boolean {
  if (!isQueryError(error)) return false;
  const message = error.message.toLowerCase();
  return message.includes('auth') || 
         message.includes('401') || 
         message.includes('unauthorized') ||
         error.code === 'auth-error';
}

// 檢舉類型定義
export interface Report {
  id: string;
  type: string;
  target_id: string;
  target_type: string;
  reporter_id: string | null;
  reporter_name?: string;
  reporter_avatar?: string; // 將此屬性設為可選
  reason: string;
  details?: string;
  status: string;
  created_at: string;
  updated_at: string;
  admin_notes: string | null;
}

export interface CreateReportData {
  report_type: 'prayer' | 'response';
  target_id: string;
  target_content: string;
  target_user_id?: string;
  target_user_name?: string;
  target_user_avatar?: string;
  reason?: string;
}

// 超級管理員類型定義
export interface SuperAdmin {
  id: string;
  email: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  is_active: boolean | null;
}

// 用戶個人資料變更歷史
export interface UserProfileHistory {
  id: string;
  user_id: string;
  changed_at: string;
  old_username: string | null;
  new_username: string | null;
  old_avatar_url: string | null;
  new_avatar_url: string | null;
} 