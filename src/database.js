import Dexie from "dexie";

// Initialize Dexie database
const db = new Dexie("AuraFinanceDB");

// Define database schema
db.version(2).stores({
  users: "++id, email, name, passwordHash, createdAt, updatedAt",
  sessions: "++id, userId, token, expiresAt, createdAt",
  transactions: "++id, date, description, amount, category, accountId, userId",
  accounts: "++id, name, type, balance, initialBalance, lastBalanceUpdate, userId",
});

// Initialize database without sample data
export const initializeDatabase = async () => {
  try {
    // Clean up any existing test data
    await cleanupTestData();
  } catch (error) {
    // Log error for development, could be replaced with proper error handling
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error("Error initializing database:", error);
    }
  }
};

// Clean up test/sample data
export const cleanupTestData = async () => {
  try {
    // Remove test transactions
    const testTransactions = await db.transactions
      .where("description")
      .anyOf(["Grocery Store", "Gas Station", "Salary Deposit"])
      .toArray();

    if (testTransactions.length > 0) {
      await db.transactions.bulkDelete(testTransactions.map(t => t.id));
    }

    // Remove test accounts
    const testAccounts = await db.accounts
      .where("name")
      .anyOf([
        "Bank of America Checking",
        "Bank of America Credit Card",
        "Savings Account",
      ])
      .toArray();

    if (testAccounts.length > 0) {
      await db.accounts.bulkDelete(testAccounts.map(a => a.id));
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error("Error cleaning up test data:", error);
    }
  }
};

export default db;
