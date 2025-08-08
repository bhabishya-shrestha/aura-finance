/**
 * Analyze missing transactions to improve accuracy to 100%
 */

// Expected transactions from the image description
const expectedTransactions = [
  { description: "EVEREST FOOD TRUCK 2", amount: 27.96, date: "Pending" },
  { description: "WM SUPERCENTER #475 ROUND ROCK TX", amount: 15.13, date: "08/02/2025" },
  { description: "DOMINO'S 6615 979-695-9912 TX", amount: 27.96, date: "08/02/2025" },
  { description: "BUC-EE'S #35 TEMPLE TX", amount: 2.50, date: "08/02/2025" },
  { description: "TACO BELL #030139 AUSTIN TX", amount: 12.99, date: "08/02/2025" },
  { description: "PAYMENT FROM CHK 7012 CONF#162rrgson", amount: -700.00, date: "08/02/2025" },
  { description: "AMAZON PRIME*BO4WE5D33 Amzn.com/billWA", amount: 15.99, date: "08/02/2025" },
  { description: "DOLLAR TREE ROUND ROCK TX", amount: 1.25, date: "08/02/2025" },
  { description: "McDonalds 26418 151-2670263 TX", amount: 8.99, date: "08/02/2025" },
  { description: "ATI*3806-078190352 ATM.TK CA", amount: 20.00, date: "08/02/2025" },
  { description: "UBER *EATS HELP.UBER.COMCA", amount: 25.50, date: "08/02/2025" },
  { description: "WALMART.COM 800-925-6278 AR", amount: 45.67, date: "08/02/2025" },
  { description: "TESLA SERVICE US 877-7983752 CA", amount: 150.00, date: "08/02/2025" },
  { description: "Perry Brooks Garage Austin TX", amount: 85.00, date: "08/02/2025" },
  { description: "TESLA SUPERCHARGER US 877-7983752 CA", amount: 12.50, date: "08/02/2025" },
  { description: "SIXFLAGS FT SAN ANTOTX 210-697-5000 TX", amount: 75.00, date: "08/02/2025" },
  { description: "WL *STEAM PURCHASE 425-889-9642 WA", amount: 29.99, date: "08/02/2025" },
  { description: "SP LUXE BIDET SAN DIEGO CA", amount: -42.20, date: "08/02/2025" },
  { description: "PAYMENT FROM CHK 7012 CONF#162rrgson", amount: -1487.16, date: "08/02/2025" },
  { description: "AMAZON.COM 800-201-7575 WA", amount: 35.99, date: "08/02/2025" },
  { description: "NETFLIX.COM 866-579-7172 CA", amount: 15.99, date: "08/02/2025" },
  { description: "SPOTIFY USA 866-234-0148 NY", amount: 9.99, date: "08/02/2025" },
  { description: "LYFT *RIDE 24*LYFT.COM CA", amount: 18.50, date: "08/02/2025" },
  { description: "STARBUCKS STORE 10001 AUSTIN TX", amount: 4.75, date: "08/02/2025" },
  { description: "SHELL OIL 57520835 AUSTIN TX", amount: 45.00, date: "08/02/2025" },
  { description: "HEB GROCERY 1234 AUSTIN TX", amount: 67.89, date: "08/02/2025" },
  { description: "TARGET T-1234 AUSTIN TX", amount: 23.45, date: "08/02/2025" },
  { description: "CVS PHARMACY 5678 AUSTIN TX", amount: 12.99, date: "08/02/2025" },
  { description: "CHIPOTLE MEX GR ONLINE TEAN-BANKINGECA", amount: 9.93, date: "08/02/2025" },
  { description: "(OPENAI *CHATGPT SUBSCR OFENALCOM CA", amount: 20.00, date: "08/02/2025" },
  { description: "4M SUPERCENTER #3462 PLANO TX", amount: 39.97, date: "08/02/2025" }
];

// Actual extracted transactions from the test
const actualTransactions = [
  { description: "SIXFLAGS FT SAN ANTOTX 210-697-5000 TX", amount: 75, date: "08/02/2025" },
  { description: "CHIPOTLE MEX GR ONLINE TEAN-BANKINGECA", amount: 9.93, date: "08/02/2025" },
  { description: "WM SUPERCENTER #475 ROUND ROCK TX", amount: 15.13, date: "08/02/2025" },
  { description: "TESLA SUPERCHARGER US 877-7983752", amount: 12.5, date: "08/02/2025" },
  { description: "WL *STEAM PURCHASE 425-889-9642", amount: 29.99, date: "08/02/2025" },
  { description: "McDonalds 26418 151-2670263 TX", amount: 8.99, date: "08/02/2025" },
  { description: "Perry Brooks Garage Austin TX", amount: 85, date: "08/02/2025" },
  { description: "TESLA SERVICE US 877-7983752", amount: 150, date: "08/02/2025" },
  { description: "UBER *EATS HELP.UBER.COMCA", amount: 25.5, date: "08/02/2025" },
  { description: "DOLLAR TREE ROUND ROCK TX", amount: 1.25, date: "08/02/2025" },
  { description: "ATI*3806-078190352 ATM.TK", amount: 20, date: "08/02/2025" },
  { description: "WALMART.COM 800-925-6278", amount: 45.67, date: "08/02/2025" },
  { description: "NETFLIX.COM 866-579-7172", amount: 15.99, date: "08/02/2025" },
  { description: "SPOTIFY USA 866-234-0148", amount: 9.99, date: "08/02/2025" },
  { description: "AMAZON.COM 800-201-7575", amount: 35.99, date: "08/02/2025" },
  { description: "EVEREST FOOD TRUCK 2", amount: 27.96, date: "Pending" },
  { description: "SHELL OIL 57520835", amount: 45, date: "08/02/2025" },
  { description: "TACO BELL #030139", amount: 12.99, date: "08/02/2025" },
  { description: "CVS PHARMACY 5678", amount: 12.99, date: "08/02/2025" },
  { description: "STARBUCKS STORE", amount: 4.75, date: "08/02/2025" },
  { description: "HEB GROCERY", amount: 67.89, date: "08/02/2025" },
  { description: "TARGET", amount: 23.45, date: "08/02/2025" }
];

function analyzeMissingTransactions() {
  console.log("🔍 Analyzing Missing Transactions");
  console.log("=" .repeat(60));
  
  console.log("📊 Expected Transactions:", expectedTransactions.length);
  console.log("📋 Actual Transactions:", actualTransactions.length);
  
  // Find missing transactions
  const missingTransactions = [];
  const foundTransactions = [];
  
  for (const expected of expectedTransactions) {
    const found = actualTransactions.find(actual => 
      Math.abs(actual.amount - expected.amount) < 0.01 &&
      actual.date === expected.date &&
      (actual.description.includes(expected.description.split(' ')[0]) || 
       expected.description.includes(actual.description.split(' ')[0]))
    );
    
    if (found) {
      foundTransactions.push({
        expected: expected.description,
        actual: found.description,
        amount: expected.amount,
        date: expected.date,
        match: found.description === expected.description ? "EXACT" : "PARTIAL"
      });
    } else {
      missingTransactions.push(expected);
    }
  }
  
  console.log("\n✅ Found Transactions:", foundTransactions.length);
  console.log("❌ Missing Transactions:", missingTransactions.length);
  
  console.log("\n📋 Missing Transactions:");
  missingTransactions.forEach((transaction, index) => {
    console.log(`${index + 1}. ${transaction.description} | $${transaction.amount} | ${transaction.date}`);
  });
  
  console.log("\n📋 Found Transactions (with match quality):");
  foundTransactions.forEach((transaction, index) => {
    console.log(`${index + 1}. Expected: "${transaction.expected}"`);
    console.log(`   Actual:   "${transaction.actual}"`);
    console.log(`   Match:    ${transaction.match}`);
    console.log(`   Amount:   $${transaction.amount} | ${transaction.date}`);
    console.log("");
  });
  
  // Analyze why transactions are missing
  console.log("\n🔍 Analysis of Missing Transactions:");
  console.log("-" .repeat(50));
  
  for (const missing of missingTransactions) {
    console.log(`\n❌ Missing: ${missing.description}`);
    console.log(`   Amount: $${missing.amount} | Date: ${missing.date}`);
    
    // Check if it's a payment (negative amount)
    if (missing.amount < 0) {
      console.log("   💡 Issue: Negative amount (payment) - may need special handling");
    }
    
    // Check if it has special characters
    if (missing.description.includes('(') || missing.description.includes('*')) {
      console.log("   💡 Issue: Contains special characters - may need regex adjustment");
    }
    
    // Check if it's a duplicate
    const duplicates = expectedTransactions.filter(t => 
      t !== missing && 
      Math.abs(t.amount - missing.amount) < 0.01 &&
      t.date === missing.date
    );
    if (duplicates.length > 0) {
      console.log("   💡 Issue: Potential duplicate transaction");
    }
    
    // Check if description is too long
    if (missing.description.length > 50) {
      console.log("   💡 Issue: Long description - may be truncated by regex");
    }
  }
  
  // Calculate accuracy
  const accuracy = (foundTransactions.length / expectedTransactions.length) * 100;
  console.log(`\n🎯 Overall Accuracy: ${accuracy.toFixed(1)}%`);
  
  if (accuracy >= 95) {
    console.log("✅ EXCELLENT: Ready for production!");
  } else if (accuracy >= 90) {
    console.log("🟡 GOOD: Minor improvements needed");
  } else if (accuracy >= 80) {
    console.log("🟠 FAIR: Significant improvements needed");
  } else {
    console.log("🔴 NEEDS WORK: Major improvements needed");
  }
}

// Run the analysis
analyzeMissingTransactions();
