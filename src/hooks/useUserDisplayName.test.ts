import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUserDisplayName } from './useUserDisplayName';
import { useTempUserStore } from '@/stores/tempUserStore';
import { getUnifiedUserName } from '@/lib/getUnifiedUserName';

// Mock the dependencies
vi.mock('@/stores/tempUserStore');
vi.mock('@/lib/getUnifiedUserName');

describe('useUserDisplayName', () => {
  const mockUseTempUserStore = vi.mocked(useTempUserStore);
  const mockGetUnifiedUserName = vi.mocked(getUnifiedUserName);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('應該返回正確的用戶顯示名稱', () => {
    const mockUser = {
      uid: 'test-user-id',
      displayName: 'Test User',
      email: 'test@example.com'
    };
    const tempName = 'Temp Name';
    const expectedName = 'Expected Name';

    // Mock store selector to return temp name
    mockUseTempUserStore.mockImplementation((selector: any) => 
      selector({ tempDisplayNames: { 'test-user-id': tempName } })
    );

    // Mock getUnifiedUserName to return expected name
    mockGetUnifiedUserName.mockReturnValue(expectedName);

    const { result } = renderHook(() => 
      useUserDisplayName(mockUser, false, 'test-user-id')
    );

    expect(mockUseTempUserStore).toHaveBeenCalledWith(expect.any(Function));
    expect(mockGetUnifiedUserName).toHaveBeenCalledWith(
      mockUser,
      false,
      tempName,
      'test-user-id'
    );
    expect(result.current).toBe(expectedName);
  });

  it('應該處理匿名用戶', () => {
    const mockUser = null;
    const tempName = '';
    const expectedName = 'Anonymous User';

    mockUseTempUserStore.mockImplementation((selector: any) => 
      selector({ tempDisplayNames: {} })
    );
    mockGetUnifiedUserName.mockReturnValue(expectedName);

    const { result } = renderHook(() => 
      useUserDisplayName(mockUser, true, undefined)
    );

    expect(mockGetUnifiedUserName).toHaveBeenCalledWith(
      mockUser,
      true,
      '',
      undefined
    );
    expect(result.current).toBe(expectedName);
  });

  it('應該處理沒有 userId 的情況', () => {
    const mockUser = {
      uid: 'test-user-id',
      displayName: 'Test User',
      email: 'test@example.com'
    };
    const expectedName = 'Test User';

    mockUseTempUserStore.mockImplementation((selector: any) => 
      selector({ tempDisplayNames: {} })
    );
    mockGetUnifiedUserName.mockReturnValue(expectedName);

    const { result } = renderHook(() => 
      useUserDisplayName(mockUser, false, undefined)
    );

    expect(mockGetUnifiedUserName).toHaveBeenCalledWith(
      mockUser,
      false,
      '',
      undefined
    );
    expect(result.current).toBe(expectedName);
  });

  it('應該響應 store 變化', () => {
    const mockUser = {
      uid: 'test-user-id',
      displayName: 'Test User',
      email: 'test@example.com'
    };

    let tempName = 'Initial Name';
    const expectedName1 = 'Expected Name 1';
    const expectedName2 = 'Expected Name 2';

    // First render
    mockUseTempUserStore.mockImplementation((selector: any) => 
      selector({ tempDisplayNames: { 'test-user-id': tempName } })
    );
    mockGetUnifiedUserName.mockReturnValue(expectedName1);

    const { result, rerender } = renderHook(() => 
      useUserDisplayName(mockUser, false, 'test-user-id')
    );

    expect(result.current).toBe(expectedName1);

    // Update temp name and rerender
    tempName = 'Updated Name';
    mockUseTempUserStore.mockImplementation((selector: any) => 
      selector({ tempDisplayNames: { 'test-user-id': tempName } })
    );
    mockGetUnifiedUserName.mockReturnValue(expectedName2);

    rerender();

    expect(result.current).toBe(expectedName2);
    expect(mockGetUnifiedUserName).toHaveBeenLastCalledWith(
      mockUser,
      false,
      tempName,
      'test-user-id'
    );
  });

  it('應該處理空的 tempDisplayNames', () => {
    const mockUser = {
      uid: 'test-user-id',
      displayName: 'Test User'
    };
    const expectedName = 'Test User';

    mockUseTempUserStore.mockImplementation((selector: any) => 
      selector({ tempDisplayNames: {} })
    );
    mockGetUnifiedUserName.mockReturnValue(expectedName);

    const { result } = renderHook(() => 
      useUserDisplayName(mockUser, false, 'test-user-id')
    );

    expect(mockGetUnifiedUserName).toHaveBeenCalledWith(
      mockUser,
      false,
      '',
      'test-user-id'
    );
    expect(result.current).toBe(expectedName);
  });

  it('應該處理用戶對象有額外屬性', () => {
    const mockUser = {
      uid: 'test-user-id',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: 'https://example.com/photo.jpg',
      customProperty: 'custom value'
    };
    const tempName = 'Temp Name';
    const expectedName = 'Expected Name';

    mockUseTempUserStore.mockImplementation((selector: any) => 
      selector({ tempDisplayNames: { 'test-user-id': tempName } })
    );
    mockGetUnifiedUserName.mockReturnValue(expectedName);

    const { result } = renderHook(() => 
      useUserDisplayName(mockUser, false, 'test-user-id')
    );

    expect(mockGetUnifiedUserName).toHaveBeenCalledWith(
      mockUser,
      false,
      tempName,
      'test-user-id'
    );
    expect(result.current).toBe(expectedName);
  });
}); 