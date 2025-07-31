import { rest } from 'msw'
import { setupServer } from 'msw/node'

// Firebase Auth Mock
export const mockFirebaseAuth = {
  currentUser: null,
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  confirmPasswordReset: jest.fn(),
  verifyPasswordResetCode: jest.fn(),
}

// Firestore Mock
export const mockFirestore = {
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(),
}

// Firebase Storage Mock
export const mockFirebaseStorage = {
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn(),
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
  rest.post('/api/auth/signin', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: mockUser,
        token: 'mock-jwt-token',
      })
    )
  }),

  rest.post('/api/auth/signup', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        user: mockUser,
        token: 'mock-jwt-token',
      })
    )
  }),

  rest.post('/api/auth/signout', (req, res, ctx) => {
    return res(ctx.status(200))
  }),

  // Prayer endpoints
  rest.get('/api/prayers', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([mockPrayer])
    )
  }),

  rest.post('/api/prayers', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json(mockPrayer)
    )
  }),

  rest.get('/api/prayers/:id', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockPrayer)
    )
  }),

  // Response endpoints
  rest.post('/api/prayers/:id/responses', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json(mockPrayerResponse)
    )
  }),

  // User profile endpoints
  rest.get('/api/users/:id', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockUser)
    )
  }),

  rest.put('/api/users/:id', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockUser)
    )
  }),

  // File upload endpoint
  rest.post('/api/upload', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        url: 'https://example.com/uploaded-image.jpg',
      })
    )
  }),
]

// Setup MSW Server
export const server = setupServer(...handlers)

// Mock Functions for Unit Tests
export const mockFunctions = {
  // Auth functions
  signInWithEmailAndPassword: jest.fn().mockResolvedValue({
    user: mockUser,
  }),
  
  createUserWithEmailAndPassword: jest.fn().mockResolvedValue({
    user: mockUser,
  }),
  
  signOut: jest.fn().mockResolvedValue(undefined),
  
  updateProfile: jest.fn().mockResolvedValue(undefined),
  
  // Firestore functions
  addDoc: jest.fn().mockResolvedValue({
    id: 'new-doc-id',
  }),
  
  updateDoc: jest.fn().mockResolvedValue(undefined),
  
  deleteDoc: jest.fn().mockResolvedValue(undefined),
  
  getDoc: jest.fn().mockResolvedValue({
    exists: () => true,
    data: () => mockPrayer,
  }),
  
  getDocs: jest.fn().mockResolvedValue({
    docs: [
      {
        id: 'prayer-1',
        data: () => mockPrayer,
      },
    ],
  }),
  
  // Storage functions
  uploadBytes: jest.fn().mockResolvedValue({
    ref: {
      getDownloadURL: jest.fn().mockResolvedValue('https://example.com/image.jpg'),
    },
  }),
  
  getDownloadURL: jest.fn().mockResolvedValue('https://example.com/image.jpg'),
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
  jest.clearAllMocks()
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