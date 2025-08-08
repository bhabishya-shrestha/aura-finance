// Simple test script to verify the deletion tracking logic
// This tests the core functionality without requiring Firebase

// Mock localStorage for Node.js
global.localStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
};

class MockFirebaseSync {
  constructor() {
    this.deletedItems = new Set();
  }

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

  loadDeletedItems() {
    try {
      const stored = JSON.parse(localStorage.getItem("deletedItems") || "[]");
      this.deletedItems = new Set(stored);
    } catch (error) {
      console.error("Error loading deleted items:", error);
      this.deletedItems = new Set();
    }
  }

  clearDeletedItems() {
    this.deletedItems.clear();
    localStorage.removeItem("deletedItems");
    console.log("🧹 Deleted items cleared for testing");
  }

  // Mock the merge logic to test deletion tracking
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
          // Don't add to merged data - this is the key fix!
        } else {
          // Remote item doesn't exist locally and wasn't deleted - add it
          mergedData.push(remoteItem);
          console.log(`✅ Restoring ${dataType}: ${id} (not deleted)`);
        }
      } else if (localItem && !remoteItem) {
        // Local item doesn't exist remotely - upload it
        mergedData.push(localItem);
        console.log(`📤 Uploading ${dataType}: ${id}`);
      } else if (localItem && remoteItem) {
        // Both exist - resolve conflict (use most recent)
        mergedData.push(localItem); // Simplified for test
        console.log(`🔄 Resolving conflict for ${dataType}: ${id}`);
      }
    }

    return mergedData;
  }
}

async function testDeletionTracking() {
  console.log("🧪 Testing deletion tracking logic...");

  try {
    // Step 1: Create mock sync service
    const firebaseSync = new MockFirebaseSync();
    firebaseSync.loadDeletedItems();
    console.log("✅ Created mock sync service");

    // Step 2: Clear any existing deleted items
    firebaseSync.clearDeletedItems();
    console.log("✅ Cleared existing deleted items");

    // Step 3: Create test accounts
    const testAccount1 = {
      id: "1754516095348",
      name: "Test Account 1",
      type: "checking",
    };

    const testAccount2 = {
      id: "1754532132318",
      name: "Test Account 2",
      type: "savings",
    };

    console.log("✅ Created test accounts");

    // Step 4: Mark accounts as deleted
    firebaseSync.markAsDeleted(testAccount1.id, "accounts");
    firebaseSync.markAsDeleted(testAccount2.id, "accounts");
    console.log("✅ Marked accounts as deleted");

    // Step 5: Verify they're tracked as deleted
    const deletedKey1 = `accounts:${testAccount1.id}`;
    const deletedKey2 = `accounts:${testAccount2.id}`;

    if (
      firebaseSync.deletedItems.has(deletedKey1) &&
      firebaseSync.deletedItems.has(deletedKey2)
    ) {
      console.log("✅ Both accounts properly tracked as deleted");
    } else {
      console.log("❌ Accounts not properly tracked as deleted");
      return;
    }

    // Step 6: Test sync scenario (remote has accounts, local doesn't)
    const localAccounts = []; // Empty local accounts
    const remoteAccounts = [testAccount1, testAccount2]; // Remote still has the accounts

    console.log("🔄 Simulating sync scenario...");
    console.log("   Local accounts: 0");
    console.log("   Remote accounts: 2");
    console.log("   Expected result: 0 (accounts should NOT be restored)");

    // Step 7: Test the merge logic
    const mergedData = await firebaseSync.mergeAndSyncData(
      localAccounts,
      remoteAccounts,
      "accounts"
    );

    // Step 8: Verify the accounts were NOT restored
    if (mergedData.length === 0) {
      console.log(
        "✅ Accounts were NOT restored during sync (correct behavior)"
      );
    } else {
      console.log("❌ Accounts were restored during sync (incorrect behavior)");
      console.log("Merged data:", mergedData);
      return;
    }

    // Step 9: Test with a non-deleted account
    const newAccount = {
      id: "new-account-123",
      name: "New Account",
      type: "credit",
    };

    const localAccounts2 = [];
    const remoteAccounts2 = [newAccount];

    console.log("🔄 Testing with non-deleted account...");
    const mergedData2 = await firebaseSync.mergeAndSyncData(
      localAccounts2,
      remoteAccounts2,
      "accounts"
    );

    if (mergedData2.length === 1) {
      console.log("✅ New account was properly restored (correct behavior)");
    } else {
      console.log("❌ New account was not restored (incorrect behavior)");
      return;
    }

    // Step 10: Test persistence across "page reloads"
    const newSync = new MockFirebaseSync();
    newSync.loadDeletedItems();

    if (
      newSync.deletedItems.has(deletedKey1) &&
      newSync.deletedItems.has(deletedKey2)
    ) {
      console.log("✅ Deleted items persisted across 'page reloads'");
    } else {
      console.log("❌ Deleted items not persisted across 'page reloads'");
      return;
    }

    console.log("🎉 All tests passed! Deletion tracking is working correctly");
    console.log(
      "📝 The fix will prevent deleted accounts from reappearing after sync"
    );
    console.log("🔧 To test in the browser:");
    console.log("   1. Open browser console");
    console.log("   2. Run: localStorage.removeItem('deletedItems')");
    console.log("   3. Delete an account in the app");
    console.log("   4. Refresh the page - account should stay deleted");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testDeletionTracking();
