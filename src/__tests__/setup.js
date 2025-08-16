/**
 * Test Setup File
 * Configures the testing environment for all tests
 */

import "@testing-library/jest-dom";
import { vi, beforeEach, afterEach } from "vitest";

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock PerformanceObserver
global.PerformanceObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock localStorage with actual storage
const localStorageMock = {
  store: {},
  getItem: vi.fn((key) => {
    return localStorageMock.store[key] || null;
  }),
  setItem: vi.fn((key, value) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: vi.fn((key) => {
    delete localStorageMock.store[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {};
  }),
};
global.localStorage = localStorageMock;

// Mock sessionStorage with actual storage
const sessionStorageMock = {
  store: {},
  getItem: vi.fn((key) => {
    return sessionStorageMock.store[key] || null;
  }),
  setItem: vi.fn((key, value) => {
    sessionStorageMock.store[key] = value;
  }),
  removeItem: vi.fn((key) => {
    delete sessionStorageMock.store[key];
  }),
  clear: vi.fn(() => {
    sessionStorageMock.store = {};
  }),
};
global.sessionStorage = sessionStorageMock;

// Mock console methods in tests
const originalConsole = { ...console };
beforeEach(() => {
  // Suppress console.warn and console.error in tests unless explicitly needed
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  // Restore console methods
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;

  // Clear all mocks
  vi.clearAllMocks();

  // Clear localStorage and sessionStorage
  localStorageMock.clear();
  sessionStorageMock.clear();
});

// Mock fetch
global.fetch = vi.fn();

// Mock Firebase
vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({})),
}));

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
}));

// Mock Dexie
vi.mock("../database", () => ({
  default: {
    transactions: {
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      toArray: vi.fn(),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      bulkDelete: vi.fn(),
      clear: vi.fn(),
    },
    accounts: {
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      toArray: vi.fn(),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
    },
  },
  initializeDatabase: vi.fn(),
}));

// Mock services
vi.mock("../services/localAuth", () => ({
  tokenManager: {
    getToken: vi.fn(),
    setToken: vi.fn(),
    removeToken: vi.fn(),
  },
}));

vi.mock("../services/performanceService", () => ({
  performanceMonitor: {
    measureFunction: vi.fn((name, fn) => fn()),
    recordMetric: vi.fn(),
    initialize: vi.fn(),
  },
}));

vi.mock("../services/errorHandlingService", () => ({
  default: {
    logError: vi.fn(),
    handleServiceFailure: vi.fn(),
    shouldDisableService: vi.fn(),
    getServiceHealth: vi.fn(),
    resetServiceErrors: vi.fn(),
  },
}));

// Mock utils
vi.mock("../utils/duplicateDetector", () => ({
  checkTransactionDuplicate: vi.fn().mockReturnValue({
    isDuplicate: true,
    confidence: 1.0,
    matches: {
      date: true,
      amount: true,
      description: true,
      category: true,
    },
    existingTransaction: {},
  }),
  findDuplicateTransactions: vi.fn().mockReturnValue({
    duplicates: [],
    nonDuplicates: [],
    summary: {
      total: 0,
      duplicates: 0,
      nonDuplicates: 0,
      duplicatePercentage: 0,
    },
  }),
  groupDuplicatesByConfidence: vi.fn().mockReturnValue({
    high: [],
    medium: [],
    low: [],
    all: [],
  }),
  getDuplicateReason: vi.fn().mockReturnValue("same date, same amount (high confidence)"),
}));

// Mock React Router
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: "/test" }),
  };
});

// Mock Zustand stores
vi.mock("../store", () => ({
  default: vi.fn(() => ({
    transactions: [],
    accounts: [],
    isLoading: false,
    loadTransactions: vi.fn(),
    loadAccounts: vi.fn(),
    addTransaction: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
    addAccount: vi.fn(),
    updateAccount: vi.fn(),
    deleteAccount: vi.fn(),
    setUpdateNotification: vi.fn(),
    lastUpdateNotification: null,
  })),
}));

// Mock hooks
vi.mock("../hooks/useMobileViewport", () => ({
  useMobileViewport: () => ({
    isMobile: false,
    updateViewportHeight: vi.fn(),
  }),
}));

// Global test utilities
global.testUtils = {
  // Helper to wait for async operations
  waitFor: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to create mock user
  createMockUser: (overrides = {}) => ({
    uid: "test-user-id",
    email: "test@example.com",
    displayName: "Test User",
    ...overrides,
  }),

  // Helper to create mock transaction
  createMockTransaction: (overrides = {}) => ({
    id: "test-transaction-id",
    description: "Test Transaction",
    amount: 100,
    date: "2024-01-01",
    category: "Food",
    accountId: "test-account-id",
    ...overrides,
  }),

  // Helper to create mock account
  createMockAccount: (overrides = {}) => ({
    id: "test-account-id",
    name: "Test Account",
    type: "checking",
    balance: 1000,
    ...overrides,
  }),
};

// Suppress specific warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  // Suppress React 18 StrictMode warnings in tests
  if (args[0]?.includes?.("StrictMode") || args[0]?.includes?.("findDOMNode")) {
    return;
  }
  originalWarn(...args);
};
