import db from '../src/database.js';

// Sample transactions for testing analytics
const sampleTransactions = [
  // This week (August 1-3, 2025)
  {
    id: Date.now() + 1,
    description: 'Grocery Shopping',
    amount: -150.00,
    category: 'Food & Dining',
    date: new Date('2025-08-01T10:00:00.000Z'),
    accountId: 1754085000405,
    userId: null
  },
  {
    id: Date.now() + 2,
    description: 'Salary Payment',
    amount: 5000.00,
    category: 'Income',
    date: new Date('2025-08-02T09:00:00.000Z'),
    accountId: 1754085000405,
    userId: null
  },
  {
    id: Date.now() + 3,
    description: 'Gas Station',
    amount: -45.00,
    category: 'Transportation',
    date: new Date('2025-08-03T14:00:00.000Z'),
    accountId: 1754085000405,
    userId: null
  },
  
  // This month (August 2025)
  {
    id: Date.now() + 4,
    description: 'Restaurant Dinner',
    amount: -85.00,
    category: 'Food & Dining',
    date: new Date('2025-08-05T19:00:00.000Z'),
    accountId: 1754085000405,
    userId: null
  },
  {
    id: Date.now() + 5,
    description: 'Movie Tickets',
    amount: -25.00,
    category: 'Entertainment',
    date: new Date('2025-08-10T20:00:00.000Z'),
    accountId: 1754085000405,
    userId: null
  },
  
  // This year (2025) - July
  {
    id: Date.now() + 6,
    description: 'July Shopping',
    amount: -120.00,
    category: 'Shopping',
    date: new Date('2025-07-15T12:00:00.000Z'),
    accountId: 1754085000405,
    userId: null
  },
  {
    id: Date.now() + 7,
    description: 'July Income',
    amount: 3000.00,
    category: 'Income',
    date: new Date('2025-07-20T09:00:00.000Z'),
    accountId: 1754085000405,
    userId: null
  },
  
  // This year (2025) - March
  {
    id: Date.now() + 8,
    description: 'March Utilities',
    amount: -75.00,
    category: 'Utilities',
    date: new Date('2025-03-15T10:00:00.000Z'),
    accountId: 1754085000405,
    userId: null
  },
  
  // Last year (2024) - should not appear in "This Year"
  {
    id: Date.now() + 9,
    description: 'Old Transaction',
    amount: -100.00,
    category: 'Shopping',
    date: new Date('2024-12-15T12:00:00.000Z'),
    accountId: 1754085000405,
    userId: null
  }
];

async function addSampleTransactions() {
  try {
    console.log('Adding sample transactions...');
    
    // Clear existing transactions (optional - comment out if you want to keep existing ones)
    // await db.transactions.clear();
    
    // Add sample transactions
    for (const transaction of sampleTransactions) {
      await db.transactions.add(transaction);
    }
    
    console.log(`✅ Added ${sampleTransactions.length} sample transactions`);
    console.log('\nSample transactions added:');
    console.log('- This Week (Aug 1-3): 3 transactions');
    console.log('- This Month (August): 5 transactions');
    console.log('- This Year (2025): 8 transactions');
    console.log('- All Time: 9 transactions');
    
    console.log('\nYou can now test the analytics page with different time ranges!');
    
  } catch (error) {
    console.error('Error adding sample transactions:', error);
  } finally {
    await db.close();
  }
}

// Run the script
addSampleTransactions(); 