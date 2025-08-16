/**
 * Debug Local Database
 * This script helps debug and clear the local IndexedDB database
 */

import { debugDatabaseState, forceClearAllData } from "./src/database.js";

async function debugLocalDatabase() {
  console.log("🔍 Debugging Local Database...");

  try {
    // Check current database state
    console.log("\n1. Current Database State:");
    await debugDatabaseState();

    // Ask user if they want to clear all data
    console.log("\n2. Options:");
    console.log("   - Check database state (already done above)");
    console.log(
      "   - Clear all local data (this will remove ALL transactions and accounts)"
    );
    console.log("   - Exit");

    // For now, let's just show the state
    // In a real scenario, you'd want user input
    console.log("\n3. To clear all local data, uncomment the line below:");
    console.log("   await forceClearAllData();");

    // Uncomment this line to clear all local data:
    // await forceClearAllData();
  } catch (error) {
    console.error("❌ Error debugging database:", error);
  }
}

// Run the debug
debugLocalDatabase();
