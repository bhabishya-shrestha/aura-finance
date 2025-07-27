import Dexie from "dexie";

// Initialize Dexie database
const db = new Dexie("AuraFinanceDB");

// Define database schema
db.version(2).stores({
  users: "++id, email, name, passwordHash, createdAt, updatedAt",
  sessions: "++id, userId, token, expiresAt, createdAt",
  transactions: "++id, date, description, amount, category, accountId, userId",
  accounts: "++id, name, type, balance, userId",
});

// Initialize with some sample data for demonstration
export const initializeDatabase = async () => {
  try {
    // Check if we already have data
    const transactionCount = await db.transactions.count();

    if (transactionCount === 0) {
      // Add sample accounts (will be associated with user when they register)
      await db.accounts.bulkAdd([
        {
          name: "Bank of America Checking",
          type: "checking",
          balance: 0,
          userId: null,
        },
        {
          name: "Bank of America Credit Card",
          type: "credit",
          balance: 0,
          userId: null,
        },
        { name: "Savings Account", type: "savings", balance: 0, userId: null },
      ]);

      // Add sample transactions (will be associated with user when they register)
      await db.transactions.bulkAdd([
        {
          date: new Date("2024-01-15"),
          description: "Grocery Store",
          amount: -85.5,
          category: "Groceries",
          accountId: 1,
          userId: null,
        },
        {
          date: new Date("2024-01-14"),
          description: "Gas Station",
          amount: -45.0,
          category: "Transport",
          accountId: 1,
          userId: null,
        },
        {
          date: new Date("2024-01-13"),
          description: "Salary Deposit",
          amount: 2500.0,
          category: "Income",
          accountId: 1,
          userId: null,
        },
      ]);
    }
  } catch (error) {
    // Log error for development, could be replaced with proper error handling
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error("Error initializing database:", error);
    }
  }
};

export default db;
