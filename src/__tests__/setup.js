import "@testing-library/jest-dom";

// Mock environment variables for tests
import { vi } from "vitest";

// Mock Supabase environment variables
vi.mock("import.meta.env", () => ({
  env: {
    VITE_SUPABASE_URL: "https://test.supabase.co",
    VITE_SUPABASE_ANON_KEY: "test_anon_key",
    VITE_GEMINI_API_KEY: "test_gemini_key",
    VITE_HUGGINGFACE_API_KEY: "test_huggingface_key",
  },
}));

// Mock the Supabase client
vi.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(),
              })),
            })),
            update: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(),
              })),
            })),
            delete: vi.fn(),
          })),
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              eq: vi.fn(() => ({
                insert: vi.fn(() => ({
                  select: vi.fn(() => ({
                    single: vi.fn(),
                  })),
                })),
                update: vi.fn(() => ({
                  select: vi.fn(() => ({
                    single: vi.fn(),
                  })),
                })),
                delete: vi.fn(),
              })),
            })),
          })),
          lte: vi.fn(() => ({
            eq: vi.fn(() => ({
              insert: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(),
                })),
              })),
              update: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(),
                })),
              })),
              delete: vi.fn(),
            })),
          })),
        })),
      })),
    })),
  },
  auth: {
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
  db: {
    getAccounts: vi.fn(),
    createAccount: vi.fn(),
    updateAccount: vi.fn(),
    deleteAccount: vi.fn(),
    getTransactions: vi.fn(),
    createTransaction: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
    getCategories: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
}));

// Mock the database module to avoid IndexedDB issues
vi.mock("../database", () => ({
  default: {
    transactions: {
      toArray: vi.fn().mockResolvedValue([]),
      orderBy: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      }),
    },
    accounts: {
      toArray: vi.fn().mockResolvedValue([]),
    },
  },
}));
