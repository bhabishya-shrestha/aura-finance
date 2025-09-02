/**
 * Firebase Sync Service
 * Handles cross-device synchronization with IndexedDB
 */

import firebaseService from "./firebaseService.js";
import db from "../database.js";
import { logger } from "../config/environment.js";

class FirebaseSyncService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.lastSyncTime = null;
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
      logger.sync("Firebase sync already initialized, skipping");
      return;
    }

    if (this.initializationPromise) {
      logger.sync("Firebase sync initialization already in progress, waiting");
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
        logger.sync("Firebase sync initialized for user:", user.uid);

        // Set initial sync time if none exists
        if (!this.lastSyncTime) {
          this.lastSyncTime = new Date();
        }

        await this.syncData();
        this.startPeriodicSync();
        this.isInitialized = true;
      } else {
        logger.sync("Firebase sync: No authenticated user found");
        // Set a default sync time for demo purposes
        this.lastSyncTime = new Date();
      }
    } catch (error) {
      logger.warn("Firebase sync not available:", error.message);
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
      logger.sync("Starting data sync...");

      const user = await firebaseService.getCurrentUser();
      if (!user) {
        logger.sync("No authenticated user, skipping sync");
        return;
      }

      // Check if data was recently reset for this user
      const dataResetFlag = localStorage.getItem("aura_data_reset_flag");
      const resetUserId = localStorage.getItem("aura_reset_user_id");

      if (dataResetFlag && resetUserId === user.uid) {
        logger.sync("Data reset detected, skipping sync");
        return;
      }

      // Sync transactions
      await this.syncTransactions(user.uid);

      // Sync accounts
      await this.syncAccounts(user.uid);

      // Update last sync time
      this.lastSyncTime = new Date();
      logger.sync("Data sync completed successfully");
    } catch (error) {
      logger.error("Data sync failed:", error);
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

      if (!localItem && remoteItem) {
        // Remote item exists in Firebase but not locally
        // Since Firebase is the source of truth, add it locally
        console.log(`📥 Adding remote ${dataType} to local: ${id}`);
        mergedData.push(remoteItem);
        await this.addToLocal(remoteItem, dataType);
      } else if (localItem && !remoteItem) {
        // Local item exists but not in Firebase
        // Since Firebase is the source of truth, this item should be deleted locally
        console.log(`🗑️ Local ${dataType} not in Firebase, removing: ${id}`);
        await this.removeFromLocal(id, dataType);
        // Don't add to merged data since it's been deleted
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
   * Remove item from local IndexedDB (alias for deleteFromLocal for clarity)
   */
  async removeFromLocal(itemId, dataType) {
    return this.deleteFromLocal(itemId, dataType);
  }

  /**
   * Sync transactions between IndexedDB and Firebase
   */
  async syncTransactions(userId) {
    try {
      console.log("🔄 Syncing transactions for user:", userId);

      // Get local transactions from IndexedDB
      const localTransactions = await db.transactions.toArray();
      console.log(`📊 Found ${localTransactions.length} local transactions`);

      // Get remote transactions from Firebase
      const remoteResult = await firebaseService.getTransactionsSimple();
      if (!remoteResult.success) {
        console.warn(
          "⚠️ Failed to get remote transactions:",
          remoteResult.error
        );
        return;
      }

      const remoteTransactions = remoteResult.data || [];
      console.log(`☁️ Found ${remoteTransactions.length} remote transactions`);

      // Merge and sync data
      const mergedTransactions = await this.mergeAndSyncData(
        localTransactions,
        remoteTransactions,
        "transactions"
      );

      console.log(
        `✅ Transaction sync completed. Total: ${mergedTransactions.length}`
      );
    } catch (error) {
      console.error("❌ Transaction sync failed:", error);
    }
  }

  /**
   * Sync accounts between IndexedDB and Firebase
   */
  async syncAccounts(userId) {
    try {
      console.log("🔄 Syncing accounts for user:", userId);

      // Get local accounts from IndexedDB
      const localAccounts = await db.accounts.toArray();
      console.log(`📊 Found ${localAccounts.length} local accounts`);

      // Get remote accounts from Firebase
      const remoteResult = await firebaseService.getAccounts();
      if (!remoteResult.success) {
        console.warn("⚠️ Failed to get remote accounts:", remoteResult.error);
        return;
      }

      const remoteAccounts = remoteResult.data || [];
      console.log(`☁️ Found ${remoteAccounts.length} remote accounts`);

      // Merge and sync data
      const mergedAccounts = await this.mergeAndSyncData(
        localAccounts,
        remoteAccounts,
        "accounts"
      );

      console.log(`✅ Account sync completed. Total: ${mergedAccounts.length}`);
    } catch (error) {
      console.error("❌ Account sync failed:", error);
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
   * Clear all sync state (for data reset)
   */
  clearAllSyncState() {
    this.lastSyncTime = null;
    this.isInitialized = false;
    this.initializationPromise = null;
    if (import.meta.env.DEV) {
      console.log("🧹 All sync state cleared");
    }
  }
}

// Create singleton instance
const firebaseSync = new FirebaseSyncService();

export default firebaseSync;
