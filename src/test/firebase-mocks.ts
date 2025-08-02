import { vi } from 'vitest';

/**
 * 統一的Firebase Mock基礎設施
 * 提供標準化的Firebase服務mock，避免重複配置
 */

// ===== Firebase Firestore Mock =====
export const createFirestoreMocks = () => {
  const mockDocSnap = {
    exists: vi.fn(() => true),
    data: vi.fn(() => ({} as any)),
    id: 'mock-doc-id',
  };

  const mockQuerySnapshot = {
    docs: [] as any[],
    size: 0,
    empty: true,
    forEach: vi.fn(),
  };

  const mockDocRef = {
    id: 'mock-doc-id',
    path: 'mock/path',
    parent: null,
    converter: null,
  };

  const mockCollectionRef = {
    id: 'mock-collection',
    path: 'mock-collection',
    parent: null,
  };

  return {
    // Firestore functions
    addDoc: vi.fn(() => Promise.resolve(mockDocRef)),
    getDoc: vi.fn(() => Promise.resolve(mockDocSnap)),
    getDocs: vi.fn(() => Promise.resolve(mockQuerySnapshot)),
    setDoc: vi.fn(() => Promise.resolve()),
    updateDoc: vi.fn(() => Promise.resolve()),
    deleteDoc: vi.fn(() => Promise.resolve()),
    doc: vi.fn(() => mockDocRef),
    collection: vi.fn(() => mockCollectionRef),
    query: vi.fn(() => ({})),
    where: vi.fn(() => ({})),
    orderBy: vi.fn(() => ({})),
    limit: vi.fn(() => ({})),
    serverTimestamp: vi.fn(() => 'server-timestamp'),
    Timestamp: vi.fn(),
    writeBatch: vi.fn(() => ({
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn(() => Promise.resolve()),
    })),
    
    // Mock objects for easy customization
    mockDocSnap,
    mockQuerySnapshot,
    mockDocRef,
    mockCollectionRef,
  };
};

// ===== Firebase Auth Mock =====
export const createAuthMocks = () => {
  const mockUser = {
    uid: 'test-user-id',
    displayName: 'Test User',
    email: 'test@example.com',
    photoURL: 'https://example.com/avatar.jpg',
  };

  const mockAuth = {
    currentUser: mockUser,
    signInWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: mockUser })),
    createUserWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: mockUser })),
    signOut: vi.fn(() => Promise.resolve()),
    onAuthStateChanged: vi.fn(),
  };

  return {
    auth: vi.fn(() => mockAuth),
    mockAuth,
    mockUser,
  };
};

// ===== Firebase Storage Mock =====
export const createStorageMocks = () => {
  const mockStorageRef = {
    bucket: 'test-bucket',
    fullPath: 'test/path',
    name: 'test-file',
  };

  return {
    storage: vi.fn(() => ({})),
    ref: vi.fn(() => mockStorageRef),
    uploadBytes: vi.fn(() => Promise.resolve({ ref: mockStorageRef })),
    getDownloadURL: vi.fn(() => Promise.resolve('https://example.com/file.jpg')),
    deleteObject: vi.fn(() => Promise.resolve()),
    mockStorageRef,
  };
};

// ===== 統一Firebase Client Mock =====
export const createFirebaseClientMocks = () => {
  const firestoreMocks = createFirestoreMocks();
  const authMocks = createAuthMocks();
  const storageMocks = createStorageMocks();

  return {
    ...firestoreMocks,
    ...authMocks,
    ...storageMocks,
  };
};

// ===== 便利函數：設定成功響應 =====
export const mockFirebaseSuccess = (mocks: ReturnType<typeof createFirestoreMocks>) => {
  mocks.mockDocSnap.exists.mockReturnValue(true);
  mocks.mockDocSnap.data.mockReturnValue({
    id: 'test-doc',
    created_at: new Date(),
    updated_at: new Date(),
  });
  
  mocks.mockQuerySnapshot.docs = [mocks.mockDocSnap as any];
  mocks.mockQuerySnapshot.size = 1;
  mocks.mockQuerySnapshot.empty = false;
};

// ===== 便利函數：設定空響應 =====
export const mockFirebaseEmpty = (mocks: ReturnType<typeof createFirestoreMocks>) => {
  mocks.mockDocSnap.exists.mockReturnValue(false);
  mocks.mockDocSnap.data.mockReturnValue(undefined as any);
  
  mocks.mockQuerySnapshot.docs = [];
  mocks.mockQuerySnapshot.size = 0;
  mocks.mockQuerySnapshot.empty = true;
};

// ===== 便利函數：設定錯誤響應 =====
export const mockFirebaseError = (mocks: ReturnType<typeof createFirestoreMocks>, errorMessage = 'Firebase error') => {
  const error = new Error(errorMessage);
  
  mocks.addDoc.mockRejectedValue(error);
  mocks.getDoc.mockRejectedValue(error);
  mocks.getDocs.mockRejectedValue(error);
  mocks.setDoc.mockRejectedValue(error);
  mocks.updateDoc.mockRejectedValue(error);
  mocks.deleteDoc.mockRejectedValue(error);
};

// ===== 便利函數：重置所有mocks =====
export const resetFirebaseMocks = (mocks: ReturnType<typeof createFirestoreMocks>) => {
  Object.values(mocks).forEach(mock => {
    if (typeof mock === 'function' && 'mockReset' in mock) {
      mock.mockReset();
    }
  });
  
  // 重新設定預設行為
  mockFirebaseSuccess(mocks);
};

// ===== 導出統一配置 =====
export const setupFirebaseMocks = () => {
  const mocks = createFirebaseClientMocks();
  
  // 設定vitest mock
  vi.mock('firebase/firestore', () => ({
    addDoc: mocks.addDoc,
    getDoc: mocks.getDoc,
    getDocs: mocks.getDocs,
    setDoc: mocks.setDoc,
    updateDoc: mocks.updateDoc,
    deleteDoc: mocks.deleteDoc,
    doc: mocks.doc,
    collection: mocks.collection,
    query: mocks.query,
    where: mocks.where,
    orderBy: mocks.orderBy,
    limit: mocks.limit,
    serverTimestamp: mocks.serverTimestamp,
    Timestamp: mocks.Timestamp,
    writeBatch: mocks.writeBatch,
  }));

  vi.mock('@/integrations/firebase/client', () => ({
    db: vi.fn(() => ({})),
    auth: mocks.auth,
    storage: mocks.storage,
  }));

  // 預設設定為成功響應
  mockFirebaseSuccess(mocks);

  return mocks;
}; 