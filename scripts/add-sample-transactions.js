import db from "../src/database.js";

// Sample transactions for testing analytics
const sampleTransactions = [
  // This week (recent past dates)
  {
    id: Date.now() + 1,
    description: "Grocery Shopping",
    amount: -150.0,
    category: "groceries",
    date: new Date("2024-12-01T10:00:00.000Z"),
    accountId: 1754085000405,
    userId: null,
  },
  {
    id: Date.now() + 2,
    description: "Salary Payment",
    amount: 5000.0,
    category: "salary",
    date: new Date("2024-12-02T09:00:00.000Z"),
    accountId: 1754085000405,
    userId: null,
  },
  {
    id: Date.now() + 3,
    description: "Gas Station",
    amount: -45.0,
    category: "gas",
    date: new Date("2024-12-03T14:00:00.000Z"),
    accountId: 1754085000405,
    userId: null,
  },

  // This month (December 2024)
  {
    id: Date.now() + 4,
    description: "Restaurant Dinner",
    amount: -85.0,
    category: "restaurant",
    date: new Date("2024-12-05T19:00:00.000Z"),
    accountId: 1754085000405,
    userId: null,
  },
  {
    id: Date.now() + 5,
    description: "Movie Tickets",
    amount: -25.0,
    category: "entertainment",
    date: new Date("2024-12-10T20:00:00.000Z"),
    accountId: 1754085000405,
    userId: null,
  },

  // This year (2024) - November
  {
    id: Date.now() + 6,
    description: "November Shopping",
    amount: -120.0,
    category: "shopping",
    date: new Date("2024-11-15T12:00:00.000Z"),
    accountId: 1754085000405,
    userId: null,
  },
  {
    id: Date.now() + 7,
    description: "November Income",
    amount: 3000.0,
    category: "income",
    date: new Date("2024-11-20T09:00:00.000Z"),
    accountId: 1754085000405,
    userId: null,
  },

  // This year (2024) - March
  {
    id: Date.now() + 8,
    description: "March Utilities",
    amount: -75.0,
    category: "utilities",
    date: new Date("2024-03-15T10:00:00.000Z"),
    accountId: 1754085000405,
    userId: null,
  },

  // Last year (2023) - should not appear in "This Year"
  {
    id: Date.now() + 9,
    description: "Old Transaction",
    amount: -100.0,
    category: "shopping",
    date: new Date("2023-12-15T12:00:00.000Z"),
    accountId: 1754085000405,
    userId: null,
  },
];

async function addSampleTransactions() {
  try {
    console.log("Adding sample transactions...");

    // Clear existing transactions (optional - comment out if you want to keep existing ones)
    // await db.transactions.clear();

    // Add sample transactions
    for (const transaction of sampleTransactions) {
      await db.transactions.add(transaction);
    }

    console.log(`✅ Added ${sampleTransactions.length} sample transactions`);
    console.log("\nSample transactions added:");
    console.log("- This Week (Aug 1-3): 3 transactions");
    console.log("- This Month (August): 5 transactions");
    console.log("- This Year (2025): 8 transactions");
    console.log("- All Time: 9 transactions");

    console.log(
      "\nYou can now test the analytics page with different time ranges!"
    );
  } catch (error) {
    console.error("Error adding sample transactions:", error);
  } finally {
    await db.close();
  }
}

// Run the script
addSampleTransactions();
