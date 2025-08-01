import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { vi } from 'vitest'

// Firebase Auth Mock
export const mockFirebaseAuth = {
  currentUser: null,
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  confirmPasswordReset: vi.fn(),
  verifyPasswordResetCode: vi.fn(),
}

// Firestore Mock
export const mockFirestore = {
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(),
}

// Firebase Storage Mock
export const mockFirebaseStorage = {
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
}

// Mock Data
export const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/avatar.jpg',
  emailVerified: true,
}

export const mockPrayer = {
  id: 'prayer-1',
  content: 'Test prayer content',
  userId: 'test-user-id',
  userName: 'Test User',
  timestamp: new Date(),
  likes: 0,
  responses: [],
  isAnswered: false,
}

export const mockPrayerResponse = {
  id: 'response-1',
  content: 'Test response content',
  userId: 'test-user-id',
  userName: 'Test User',
  timestamp: new Date(),
  prayerId: 'prayer-1',
}

// MSW Handlers for API Testing
export const handlers = [
  // Auth endpoints
  http.post('/api/auth/signin', () => {
    return HttpResponse.json({
      user: mockUser,
      token: 'mock-jwt-token',
    }, { status: 200 })
  }),

  http.post('/api/auth/signup', () => {
    return HttpResponse.json({
      user: mockUser,
      token: 'mock-jwt-token',
    }, { status: 201 })
  }),

  http.post('/api/auth/signout', () => {
    return HttpResponse.json({}, { status: 200 })
  }),

  // Prayer endpoints
  http.get('/api/prayers', () => {
    return HttpResponse.json([mockPrayer])
  }),

  http.post('/api/prayers', () => {
    return HttpResponse.json(mockPrayer, { status: 201 })
  }),

  http.get('/api/prayers/:id', () => {
    return HttpResponse.json(mockPrayer)
  }),

  // Response endpoints
  http.post('/api/prayers/:id/responses', () => {
    return HttpResponse.json(mockPrayerResponse, { status: 201 })
  }),

  // User profile endpoints
  http.get('/api/users/:id', () => {
    return HttpResponse.json(mockUser)
  }),

  http.put('/api/users/:id', () => {
    return HttpResponse.json(mockUser, { status: 200 })
  }),

  // File upload endpoint
  http.post('/api/upload', () => {
    return HttpResponse.json({
      url: 'https://example.com/uploaded-image.jpg',
    }, { status: 200 })
  }),
]

// Setup MSW Server
export const server = setupServer(...handlers)

// Mock Functions for Unit Tests
export const mockFunctions = {
  // Auth functions
  signInWithEmailAndPassword: vi.fn().mockResolvedValue({
    user: mockUser,
  }),
  
  createUserWithEmailAndPassword: vi.fn().mockResolvedValue({
    user: mockUser,
  }),
  
  signOut: vi.fn().mockResolvedValue(undefined),
  
  updateProfile: vi.fn().mockResolvedValue(undefined),
  
  // Firestore functions
  addDoc: vi.fn().mockResolvedValue({
    id: 'new-doc-id',
  }),
  
  updateDoc: vi.fn().mockResolvedValue(undefined),
  
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  
  getDoc: vi.fn().mockResolvedValue({
    exists: () => true,
    data: () => mockPrayer,
  }),
  
  getDocs: vi.fn().mockResolvedValue({
    docs: [
      {
        id: 'prayer-1',
        data: () => mockPrayer,
      },
    ],
  }),
  
  // Storage functions
  uploadBytes: vi.fn().mockResolvedValue({
    ref: {
      getDownloadURL: vi.fn().mockResolvedValue('https://example.com/image.jpg'),
    },
  }),
  
  getDownloadURL: vi.fn().mockResolvedValue('https://example.com/image.jpg'),
}

// Test Utilities
export const createMockUser = (overrides = {}) => ({
  ...mockUser,
  ...overrides,
})

export const createMockPrayer = (overrides = {}) => ({
  ...mockPrayer,
  ...overrides,
})

export const createMockResponse = (overrides = {}) => ({
  ...mockPrayerResponse,
  ...overrides,
})

// Reset all mocks
export const resetMocks = () => {
  vi.clearAllMocks()
  Object.values(mockFunctions).forEach(mock => {
    if (typeof mock === 'function' && mock.mockClear) {
      mock.mockClear()
    }
  })
}

// Setup test environment
export const setupTestEnvironment = () => {
  beforeAll(() => {
    server.listen()
  })

  afterEach(() => {
    server.resetHandlers()
    resetMocks()
  })

  afterAll(() => {
    server.close()
  })
} 