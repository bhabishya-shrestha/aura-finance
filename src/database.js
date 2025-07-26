import Dexie from "dexie";

// Initialize Dexie database
const db = new Dexie("AuraFinanceDB");

// Define database schema
db.version(1).stores({
  transactions: "++id, date, description, amount, category, accountId",
  accounts: "++id, name, type, balance",
});

// Initialize with some sample data for demonstration
export const initializeDatabase = async () => {
  try {
    // Check if we already have data
    const transactionCount = await db.transactions.count();

    if (transactionCount === 0) {
      // Add sample accounts
      await db.accounts.bulkAdd([
        { name: "Bank of America Checking", type: "checking", balance: 0 },
        { name: "Bank of America Credit Card", type: "credit", balance: 0 },
        { name: "Savings Account", type: "savings", balance: 0 },
      ]);

      // Add sample transactions
      await db.transactions.bulkAdd([
        {
          date: new Date("2024-01-15"),
          description: "Grocery Store",
          amount: -85.5,
          category: "Groceries",
          accountId: 1,
        },
        {
          date: new Date("2024-01-14"),
          description: "Gas Station",
          amount: -45.0,
          category: "Transport",
          accountId: 1,
        },
        {
          date: new Date("2024-01-13"),
          description: "Salary Deposit",
          amount: 2500.0,
          category: "Income",
          accountId: 1,
        },
      ]);
    }
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};

export default db;
