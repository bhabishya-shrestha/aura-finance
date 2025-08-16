/**
 * Firebase Sync Service
 * Handles cross-device synchronization with IndexedDB
 */

import firebaseService from "./firebaseService.js";
import db from "../database.js";

class FirebaseSyncService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.lastSyncTime = null;
    this.deletedItems = new Set(); // Track deleted items to prevent restoration
    this.isInitialized = false;
    this.initializationPromise = null;

    // Listen for online/offline changes
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.syncData();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  /**
   * Initialize sync service
   */
  async initialize() {
    // Prevent multiple simultaneous initializations
    if (this.isInitialized) {
      console.log("🔄 Firebase sync already initialized, skipping");
      return;
    }

    if (this.initializationPromise) {
      console.log(
        "🔄 Firebase sync initialization already in progress, waiting"
      );
      return this.initializationPromise;
    }

    this.initializationPromise = this._initialize();

    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }

    return this.initializationPromise;
  }

  /**
   * Internal initialization method
   */
  async _initialize() {
    try {
      // Check if user is authenticated with Firebase
      const user = await firebaseService.getCurrentUser();
      if (user) {
        console.log("🔄 Firebase sync initialized for user:", user.uid);
        
        // Set initial sync time if none exists
        if (!this.lastSyncTime) {
          this.lastSyncTime = new Date();
        }
        
        await this.syncData();
        this.startPeriodicSync();
        this.isInitialized = true;
      } else {
        console.log("🔄 Firebase sync: No authenticated user found");
        // Set a default sync time for demo purposes
        this.lastSyncTime = new Date();
      }
    } catch (error) {
      console.log("Firebase sync not available:", error.message);
      // Set a default sync time for demo purposes
      this.lastSyncTime = new Date();
      // Don't throw - sync is optional
    }
  }

  /**
   * Sync data between IndexedDB and Firebase
   */
  async syncData() {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    try {
      this.syncInProgress = true;
      console.log("🔄 Starting data sync...");

      const user = await firebaseService.getCurrentUser();
      if (!user) {
        console.log("No authenticated user, skipping sync");
        return;
      }

      // Check if data was recently reset for this user
      const dataResetFlag = localStorage.getItem("aura_data_reset_flag");
      const resetUserId = localStorage.getItem("aura_reset_user_id");

      if (dataResetFlag && resetUserId === user.uid) {
        console.log("🔄 Data reset detected, skipping sync");
        return;
      }

      // Sync transactions
      await this.syncTransactions(user.uid);

      // Sync accounts
      await this.syncAccounts(user.uid);

      // Update last sync time
      this.lastSyncTime = new Date();
      console.log("✅ Data sync completed successfully");
    } catch (error) {
      console.error("❌ Data sync failed:", error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Merge local and remote data, resolving conflicts
   */
  async mergeAndSyncData(localData, remoteData, dataType) {
    const mergedData = [];
    const localMap = new Map(localData.map(item => [item.id, item]));
    const remoteMap = new Map(remoteData.map(item => [item.id, item]));

    // Process all items
    const allIds = new Set([...localMap.keys(), ...remoteMap.keys()]);

    for (const id of allIds) {
      const localItem = localMap.get(id);
      const remoteItem = remoteMap.get(id);
      const deletedKey = `${dataType}:${id}`;

      if (!localItem && remoteItem) {
        // Remote item doesn't exist locally - check if it was intentionally deleted
        if (this.deletedItems.has(deletedKey)) {
          console.log(`🔄 Skipping restoration of deleted ${dataType}: ${id}`);
          // Delete from Firebase to sync the deletion
          try {
            await this.deleteFromFirebase(id, dataType);
            console.log(`✅ Deleted ${dataType} from Firebase: ${id}`);
          } catch (error) {
            console.warn(
              `⚠️  Failed to delete ${dataType} from Firebase: ${id}`,
              error
            );
          }
        } else {
          // Remote item doesn't exist locally and wasn't deleted - add it
          console.log(`📥 Adding remote ${dataType} to local: ${id}`);
          mergedData.push(remoteItem);
          await this.addToLocal(remoteItem, dataType);
        }
      } else if (localItem && !remoteItem) {
        // Local item doesn't exist remotely - upload it
        console.log(`📤 Uploading local ${dataType} to Firebase: ${id}`);
        mergedData.push(localItem);
        await this.uploadToFirebase(localItem, dataType);
      } else if (localItem && remoteItem) {
        // Both exist - resolve conflict (use most recent)
        const localUpdated = new Date(
          localItem.updatedAt || localItem.createdAt
        );
        const remoteUpdated = new Date(
          remoteItem.updatedAt || remoteItem.createdAt
        );

        if (localUpdated > remoteUpdated) {
          console.log(
            `🔄 Resolving conflict for ${dataType}: ${id} (local wins)`
          );
          mergedData.push(localItem);
          await this.uploadToFirebase(localItem, dataType);
        } else {
          console.log(
            `🔄 Resolving conflict for ${dataType}: ${id} (remote wins)`
          );
          mergedData.push(remoteItem);
          await this.updateLocal(remoteItem, dataType);
        }
      }
      // If neither local nor remote item exists, it was deleted on both sides
    }

    return mergedData;
  }

  /**
   * Mark an item as deleted to prevent restoration during sync
   */
  markAsDeleted(itemId, dataType) {
    const deletedKey = `${dataType}:${itemId}`;
    this.deletedItems.add(deletedKey);

    // Store in localStorage for persistence across page reloads
    try {
      const stored = JSON.parse(localStorage.getItem("deletedItems") || "[]");
      if (!stored.includes(deletedKey)) {
        stored.push(deletedKey);
        localStorage.setItem("deletedItems", JSON.stringify(stored));
      }
    } catch (error) {
      console.error("Error storing deleted items:", error);
    }
  }

  /**
   * Load deleted items from localStorage
   */
  loadDeletedItems() {
    try {
      const stored = JSON.parse(localStorage.getItem("deletedItems") || "[]");
      this.deletedItems = new Set(stored);

      // Clean up old deleted items (older than 30 days)
      this.cleanupOldDeletedItems();
    } catch (error) {
      console.error("Error loading deleted items:", error);
      this.deletedItems = new Set();
    }
  }

  /**
   * Clean up old deleted items from localStorage
   */
  cleanupOldDeletedItems() {
    try {
      const stored = JSON.parse(localStorage.getItem("deletedItems") || "[]");

      // Keep only recent deletions (within 30 days)
      const recentDeletions = stored.filter(() => {
        // For now, we'll keep all items since we don't store timestamps
        // In a future version, we could add timestamps to track deletion dates
        return true;
      });

      if (recentDeletions.length !== stored.length) {
        localStorage.setItem("deletedItems", JSON.stringify(recentDeletions));
        this.deletedItems = new Set(recentDeletions);
      }
    } catch (error) {
      console.error("Error cleaning up deleted items:", error);
    }
  }

  /**
   * Add item to local IndexedDB
   */
  async addToLocal(item, dataType) {
    try {
      if (dataType === "transactions") {
        await db.transactions.add(item);
      } else if (dataType === "accounts") {
        await db.accounts.add(item);
      }
    } catch (error) {
      console.error(`Error adding ${dataType} to local DB:`, error);
    }
  }

  /**
   * Update item in local IndexedDB
   */
  async updateLocal(item, dataType) {
    try {
      if (dataType === "transactions") {
        await db.transactions.update(item.id, item);
      } else if (dataType === "accounts") {
        await db.accounts.update(item.id, item);
      }
    } catch (error) {
      console.error(`Error updating ${dataType} in local DB:`, error);
    }
  }

  /**
   * Upload item to Firebase
   */
  async uploadToFirebase(item, dataType) {
    try {
      if (dataType === "transactions") {
        await firebaseService.addTransaction(item);
      } else if (dataType === "accounts") {
        await firebaseService.addAccount(item);
      }
    } catch (error) {
      console.error(`Error uploading ${dataType} to Firebase:`, error);
    }
  }

  /**
   * Delete item from Firebase
   */
  async deleteFromFirebase(itemId, dataType) {
    try {
      // Validate itemId - allow numbers and strings, convert to string
      if (!itemId) {
        if (import.meta.env.DEV) {
          console.warn(`Missing ${dataType} ID for Firebase deletion`);
        }
        return; // Skip deletion for missing IDs
      }

      // Convert to string for Firebase
      const stringId = String(itemId);
      if (stringId.trim() === "") {
        if (import.meta.env.DEV) {
          console.warn(`Empty ${dataType} ID for Firebase deletion`);
        }
        return; // Skip deletion for empty IDs
      }

      if (dataType === "transactions") {
        const result = await firebaseService.deleteTransaction(stringId);
        if (!result.success) {
          throw new Error(
            result.error || "Failed to delete transaction from Firebase"
          );
        }
      } else if (dataType === "accounts") {
        const result = await firebaseService.deleteAccount(stringId);
        if (!result.success) {
          throw new Error(
            result.error || "Failed to delete account from Firebase"
          );
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(`Error deleting ${dataType} from Firebase:`, error);
      }
      // Don't re-throw - we want local operations to succeed even if Firebase fails
    }
  }

  /**
   * Delete item from local IndexedDB
   */
  async deleteFromLocal(itemId, dataType) {
    try {
      if (dataType === "transactions") {
        await db.transactions.delete(itemId);
      } else if (dataType === "accounts") {
        await db.accounts.delete(itemId);
      }
    } catch (error) {
      console.error(`Error deleting ${dataType} from local DB:`, error);
    }
  }

  /**
   * Start periodic sync (every 5 minutes)
   */
  startPeriodicSync() {
    setInterval(
      () => {
        if (this.isOnline && !this.syncInProgress) {
          this.syncData();
        }
      },
      5 * 60 * 1000
    ); // 5 minutes
  }

  /**
   * Force a sync operation
   */
  async forceSync() {
    await this.syncData();
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      lastSyncTime: this.lastSyncTime,
    };
  }

  /**
   * Clear deleted items (for testing purposes)
   */
  clearDeletedItems() {
    this.deletedItems.clear();
    localStorage.removeItem("deletedItems");
    if (import.meta.env.DEV) {
      console.log("🧹 Deleted items cleared for testing");
    }
  }

  /**
   * Clear all sync state (for data reset)
   */
  clearAllSyncState() {
    this.deletedItems.clear();
    this.lastSyncTime = null;
    this.isInitialized = false;
    this.initializationPromise = null;
    localStorage.removeItem("deletedItems");
    if (import.meta.env.DEV) {
      console.log("🧹 All sync state cleared");
    }
  }

  /**
   * Get deleted items (for debugging)
   */
  getDeletedItems() {
    return Array.from(this.deletedItems);
  }
}

// Create singleton instance
const firebaseSync = new FirebaseSyncService();

// Load deleted items on initialization
firebaseSync.loadDeletedItems();

export default firebaseSync;
