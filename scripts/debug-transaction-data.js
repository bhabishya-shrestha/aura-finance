/**
 * Debug script to examine transaction data causing validation errors
 */

import { openDB } from "idb";
import SecurityMiddleware from "../src/services/securityMiddleware.js";

async function debugTransactionData() {
  console.log("🔍 Debugging transaction data...\n");

  try {
    // Open IndexedDB
    const db = await openDB("aura-finance-db", 1);

    // Get all transactions from local storage
    const transactions = await db.getAll("transactions");
    console.log(
      `📊 Found ${transactions.length} transactions in local storage\n`
    );

    // Examine each transaction's date field
    let validDates = 0;
    let invalidDates = 0;
    let missingDates = 0;

    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      console.log(`Transaction ${i + 1} (ID: ${transaction.id}):`);
      console.log(`  Description: ${transaction.description}`);
      console.log(`  Amount: ${transaction.amount}`);
      console.log(`  Date field: ${JSON.stringify(transaction.date)}`);
      console.log(`  Date type: ${typeof transaction.date}`);

      if (transaction.date) {
        if (transaction.date instanceof Date) {
          console.log(
            `  ✅ Valid Date object: ${transaction.date.toISOString()}`
          );
          validDates++;
        } else if (typeof transaction.date === "string") {
          const parsedDate = new Date(transaction.date);
          if (isNaN(parsedDate.getTime())) {
            console.log(`  ❌ Invalid date string: ${transaction.date}`);
            invalidDates++;
          } else {
            console.log(
              `  ✅ Valid date string: ${transaction.date} -> ${parsedDate.toISOString()}`
            );
            validDates++;
          }
        } else if (typeof transaction.date === "number") {
          const parsedDate = new Date(transaction.date);
          if (isNaN(parsedDate.getTime())) {
            console.log(`  ❌ Invalid timestamp: ${transaction.date}`);
            invalidDates++;
          } else {
            console.log(
              `  ✅ Valid timestamp: ${transaction.date} -> ${parsedDate.toISOString()}`
            );
            validDates++;
          }
        } else if (
          transaction.date &&
          typeof transaction.date.toDate === "function"
        ) {
          console.log(
            `  ✅ Firebase Timestamp: ${transaction.date.toDate().toISOString()}`
          );
          validDates++;
        } else {
          console.log(`  ❌ Unknown date format: ${typeof transaction.date}`);
          invalidDates++;
        }
      } else {
        console.log(`  ❌ Missing date field`);
        missingDates++;
      }

      // Test validation
      try {
        const errors = SecurityMiddleware.validateTransaction(transaction);
        if (errors.length > 0) {
          console.log(`  ❌ Validation errors: ${errors.join(", ")}`);
        } else {
          console.log(`  ✅ Validation passed`);
        }
      } catch (error) {
        console.log(`  ❌ Validation exception: ${error.message}`);
      }

      console.log(""); // Empty line for readability
    }

    console.log("📈 Summary:");
    console.log(`  Valid dates: ${validDates}`);
    console.log(`  Invalid dates: ${invalidDates}`);
    console.log(`  Missing dates: ${missingDates}`);
    console.log(`  Total transactions: ${transactions.length}`);

    // Test sanitization on problematic transactions
    console.log("\n🧹 Testing sanitization on transactions with issues...");

    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];

      // Check if this transaction has date issues
      let hasDateIssues = false;
      if (!transaction.date) {
        hasDateIssues = true;
      } else if (
        typeof transaction.date === "string" &&
        isNaN(new Date(transaction.date).getTime())
      ) {
        hasDateIssues = true;
      } else if (
        typeof transaction.date === "number" &&
        isNaN(new Date(transaction.date).getTime())
      ) {
        hasDateIssues = true;
      }

      if (hasDateIssues) {
        console.log(`\nTesting sanitization on transaction ${i + 1}:`);
        console.log(`  Original date: ${JSON.stringify(transaction.date)}`);

        try {
          const sanitized = SecurityMiddleware.sanitizeTransaction(transaction);
          console.log(
            `  Sanitized date: ${sanitized.date instanceof Date ? sanitized.date.toISOString() : JSON.stringify(sanitized.date)}`
          );
          console.log(`  Sanitized date type: ${typeof sanitized.date}`);

          // Test validation on sanitized data
          const errors = SecurityMiddleware.validateTransaction(sanitized);
          if (errors.length > 0) {
            console.log(
              `  ❌ Still has validation errors: ${errors.join(", ")}`
            );
          } else {
            console.log(`  ✅ Sanitization fixed validation issues`);
          }
        } catch (error) {
          console.log(`  ❌ Sanitization failed: ${error.message}`);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error debugging transaction data:", error);
  }
}

// Run the debug script
debugTransactionData().catch(console.error);
