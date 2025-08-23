/**
 * Firebase Sync Service Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import firebaseSync from '../services/firebaseSync';

// Mock Firebase service
vi.mock('../services/firebaseService', () => ({
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
vi.mock('../database', () => ({
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

describe('Firebase Sync Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
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

  describe('getSyncStatus', () => {
    it('should return sync status', () => {
      const status = firebaseSync.getSyncStatus();
      
      expect(status).toHaveProperty('isOnline');
      expect(status).toHaveProperty('syncInProgress');
      expect(status).toHaveProperty('lastSyncTime');
      expect(typeof status.isOnline).toBe('boolean');
      expect(typeof status.syncInProgress).toBe('boolean');
    });
  });

  describe('markAsDeleted', () => {
    it('should mark item as deleted', () => {
      const itemId = 'test-123';
      const dataType = 'transactions';
      
      firebaseSync.markAsDeleted(itemId, dataType);
      
      const deletedItems = firebaseSync.getDeletedItems();
      expect(deletedItems).toContain(`${dataType}:${itemId}`);
    });
  });

  describe('clearDeletedItems', () => {
    it('should clear deleted items', () => {
      // Add some deleted items first
      firebaseSync.markAsDeleted('test-1', 'transactions');
      firebaseSync.markAsDeleted('test-2', 'accounts');
      
      expect(firebaseSync.getDeletedItems()).toHaveLength(2);
      
      firebaseSync.clearDeletedItems();
      
      expect(firebaseSync.getDeletedItems()).toHaveLength(0);
    });
  });

  describe('clearAllSyncState', () => {
    it('should clear all sync state', () => {
      // Add some deleted items first
      firebaseSync.markAsDeleted('test-1', 'transactions');
      
      expect(firebaseSync.getDeletedItems()).toHaveLength(1);
      
      firebaseSync.clearAllSyncState();
      
      expect(firebaseSync.getDeletedItems()).toHaveLength(0);
    });
  });
});
