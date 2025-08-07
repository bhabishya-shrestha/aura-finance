import Dexie from "dexie";

// Initialize Dexie database
const db = new Dexie("AuraFinanceDB");

// Define database schema
db.version(3).stores({
  users: "++id, email, name, passwordHash, createdAt, updatedAt",
  sessions: "++id, userId, token, expiresAt, createdAt",
  transactions: "++id, date, description, amount, category, accountId, userId",
  accounts:
    "++id, name, type, balance, initialBalance, lastBalanceUpdate, userId",
});

// Initialize database without sample data
let isInitialized = false;

export const initializeDatabase = async () => {
  if (isInitialized) {
    return; // Already initialized
  }

  try {
    // Clean up any existing test data
    await cleanupTestData();
    isInitialized = true;
  } catch (error) {
    // Log error for development, could be replaced with proper error handling
    if (import.meta.env.DEV) {
      console.error("Error initializing database:", error);
    }
  }
};

// Clean up test/sample data
export const cleanupTestData = async () => {
  try {
    if (import.meta.env.DEV) {
      console.log("Starting test data cleanup...");
    }

    // Remove test transactions with various patterns
    const testTransactionPatterns = [
      "Grocery Store",
      "Gas Station",
      "Salary Deposit",
      "Grocery Shopping",
      "Salary Payment",
      "Restaurant Dinner",
      "Movie Tickets",
      "July Shopping",
      "July Income",
      "March Utilities",
      "Old Transaction",
      "Test Transaction",
      "Sample Transaction",
    ];

    const testTransactions = await db.transactions
      .where("description")
      .anyOf(testTransactionPatterns)
      .toArray();

    if (testTransactions.length > 0) {
      if (import.meta.env.DEV) {
        console.log(
          `Found ${testTransactions.length} test transactions to delete`
        );
      }
      await db.transactions.bulkDelete(testTransactions.map(t => t.id));
      if (import.meta.env.DEV) {
        console.log("Test transactions deleted successfully");
      }
    }

    // Remove test accounts with various patterns
    const testAccountPatterns = [
      "Bank of America Checking",
      "Bank of America Credit Card",
      "Savings Account",
      "Test Account",
      "Sample Account",
      "Demo Account",
    ];

    const testAccounts = await db.accounts
      .where("name")
      .anyOf(testAccountPatterns)
      .toArray();

    if (testAccounts.length > 0) {
      if (import.meta.env.DEV) {
        console.log(`Found ${testAccounts.length} test accounts to delete`);
      }
      await db.accounts.bulkDelete(testAccounts.map(a => a.id));
      if (import.meta.env.DEV) {
        console.log("Test accounts deleted successfully");
      }
    }

    // Also check for transactions with demo user ID
    const demoTransactions = await db.transactions
      .where("userId")
      .equals("demo")
      .toArray();

    if (demoTransactions.length > 0) {
      if (import.meta.env.DEV) {
        console.log(
          `Found ${demoTransactions.length} demo transactions to delete`
        );
      }
      await db.transactions.bulkDelete(demoTransactions.map(t => t.id));
      if (import.meta.env.DEV) {
        console.log("Demo transactions deleted successfully");
      }
    }

    // Check for demo accounts
    const demoAccounts = await db.accounts
      .where("userId")
      .equals("demo")
      .toArray();

    if (demoAccounts.length > 0) {
      if (import.meta.env.DEV) {
        console.log(`Found ${demoAccounts.length} demo accounts to delete`);
      }
      await db.accounts.bulkDelete(demoAccounts.map(a => a.id));
      if (import.meta.env.DEV) {
        console.log("Demo accounts deleted successfully");
      }
    }

    if (import.meta.env.DEV) {
      console.log("Test data cleanup completed");
    }
  } catch (error) {
    // Only log in development and only if it's not a schema-related error
    if (import.meta.env.DEV && !error.message?.includes("Schema")) {
      console.warn(
        "Note: Some test data cleanup operations were skipped:",
        error.message
      );
    }
  }
};

// Force clear all data (for debugging and testing)
export const forceClearAllData = async () => {
  try {
    if (import.meta.env.DEV) {
      console.log("Force clearing all data...");
    }

    // Clear all transactions
    const allTransactions = await db.transactions.toArray();
    if (allTransactions.length > 0) {
      await db.transactions.bulkDelete(allTransactions.map(t => t.id));
      if (import.meta.env.DEV) {
        console.log(`Deleted ${allTransactions.length} transactions`);
      }
    }

    // Clear all accounts
    const allAccounts = await db.accounts.toArray();
    if (allAccounts.length > 0) {
      await db.accounts.bulkDelete(allAccounts.map(a => a.id));
      if (import.meta.env.DEV) {
        console.log(`Deleted ${allAccounts.length} accounts`);
      }
    }

    if (import.meta.env.DEV) {
      console.log("All data cleared successfully");
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Error force clearing data:", error);
    }
    throw error;
  }
};

// Debug function to check database state
export const debugDatabaseState = async () => {
  try {
    const allTransactions = await db.transactions.toArray();
    const allAccounts = await db.accounts.toArray();

    console.log("=== Database State ===");
    console.log(`Total transactions: ${allTransactions.length}`);
    console.log(`Total accounts: ${allAccounts.length}`);

    if (allTransactions.length > 0) {
      console.log("Sample transactions:");
      allTransactions.slice(0, 5).forEach(t => {
        console.log(`- ${t.description} (${t.amount}) - User: ${t.userId}`);
      });
    }

    if (allAccounts.length > 0) {
      console.log("Sample accounts:");
      allAccounts.slice(0, 5).forEach(a => {
        console.log(`- ${a.name} (${a.type}) - User: ${a.userId}`);
      });
    }

    console.log("=====================");
  } catch (error) {
    console.error("Error debugging database state:", error);
  }
};

export default db;
