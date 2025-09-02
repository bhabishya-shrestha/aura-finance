/**
 * Firebase Sync Service Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import firebaseSync from "../services/firebaseSync";

// Mock Firebase service
vi.mock("../services/firebaseService", () => ({
  default: {
    getCurrentUser: vi.fn(),
    getTransactionsSimple: vi.fn(),
    getAccounts: vi.fn(),
    addTransaction: vi.fn(),
    addAccount: vi.fn(),
    deleteTransaction: vi.fn(),
    deleteAccount: vi.fn(),
  },
}));

// Mock IndexedDB
vi.mock("../database", () => ({
  default: {
    transactions: {
      toArray: vi.fn(),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    accounts: {
      toArray: vi.fn(),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("Firebase Sync Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock navigator.onLine
    Object.defineProperty(navigator, "onLine", {
      value: true,
      writable: true,
    });
    // Clear sync state before each test
    firebaseSync.clearAllSyncState();
  });

  afterEach(() => {
    // Clear localStorage
    localStorage.clear();
    // Clear sync state after each test
    firebaseSync.clearAllSyncState();
  });

  describe("getSyncStatus", () => {
    it("should return sync status", () => {
      const status = firebaseSync.getSyncStatus();

      expect(status).toHaveProperty("isOnline");
      expect(status).toHaveProperty("syncInProgress");
      expect(status).toHaveProperty("lastSyncTime");
      expect(typeof status.isOnline).toBe("boolean");
      expect(typeof status.syncInProgress).toBe("boolean");
    });
  });

  describe("clearAllSyncState", () => {
    it("should clear all sync state", () => {
      // Test that the method exists and works
      expect(() => firebaseSync.clearAllSyncState()).not.toThrow();

      const status = firebaseSync.getSyncStatus();
      expect(status.lastSyncTime).toBeNull();
    });
  });

  describe("forceSync", () => {
    it("should have forceSync method", () => {
      expect(typeof firebaseSync.forceSync).toBe("function");
    });
  });

  describe("initialization", () => {
    it("should have initialize method", () => {
      expect(typeof firebaseSync.initialize).toBe("function");
    });
  });
});
