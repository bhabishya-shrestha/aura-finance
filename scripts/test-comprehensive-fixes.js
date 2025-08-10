/**
 * Comprehensive test script to verify all security middleware fixes
 */

import SecurityMiddleware from "../src/services/securityMiddleware.js";

async function testComprehensiveFixes() {
  console.log("🧪 Testing comprehensive security middleware fixes...\n");

  const testCases = [
    {
      name: "Valid transaction with Date object",
      transaction: {
        description: "Test transaction",
        amount: 100,
        category: "shopping",
        date: new Date("2024-01-15"),
      },
      expectedErrors: 0,
    },
    {
      name: "Valid transaction with negative amount (expense)",
      transaction: {
        description: "eBay purchase",
        amount: -16.23,
        category: "shopping",
        date: new Date("2024-01-15"),
      },
      expectedErrors: 0,
    },
    {
      name: "Valid transaction with Firebase Timestamp",
      transaction: {
        description: "Amazon purchase",
        amount: 7.57,
        category: "shopping",
        date: { seconds: 1754438400, nanoseconds: 0 },
      },
      expectedErrors: 0,
    },
    {
      name: "Transaction with invalid category",
      transaction: {
        description: "Online purchase",
        amount: 25.99,
        category: "Online Shopping",
        date: new Date("2024-01-15"),
      },
      expectedErrors: 0, // Should be converted to "other"
    },
    {
      name: "Transaction with missing category",
      transaction: {
        description: "Unknown transaction",
        amount: 50,
        date: new Date("2024-01-15"),
      },
      expectedErrors: 0, // Should be converted to "other"
    },
    {
      name: "Transaction with zero amount (should fail)",
      transaction: {
        description: "Invalid transaction",
        amount: 0,
        category: "other",
        date: new Date("2024-01-15"),
      },
      expectedErrors: 1,
    },
    {
      name: "Transaction with missing date (should fail)",
      transaction: {
        description: "Invalid transaction",
        amount: 100,
        category: "other",
      },
      expectedErrors: 1,
    },
    {
      name: "Transaction with invalid date (should fail)",
      transaction: {
        description: "Invalid transaction",
        amount: 100,
        category: "other",
        date: "invalid-date",
      },
      expectedErrors: 1,
    },
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    console.log(`📋 Test: ${testCase.name}`);

    try {
      // Test validation
      const errors = SecurityMiddleware.validateTransaction(
        testCase.transaction
      );
      console.log(
        `  Validation errors: ${errors.length > 0 ? errors.join(", ") : "None"}`
      );

      if (errors.length === testCase.expectedErrors) {
        console.log("  ✅ Validation result as expected");
        passedTests++;
      } else {
        console.log(
          `  ❌ Validation result unexpected - expected ${testCase.expectedErrors} errors, got ${errors.length}`
        );
      }

      // Test sanitization (only for transactions that should pass validation)
      if (testCase.expectedErrors === 0) {
        const sanitized = SecurityMiddleware.sanitizeTransaction(
          testCase.transaction
        );
        console.log(
          `  Original date type: ${typeof testCase.transaction.date}`
        );
        console.log(`  Sanitized date type: ${typeof sanitized.date}`);
        console.log(
          `  Is sanitized date a Date object: ${sanitized.date instanceof Date}`
        );
        console.log(
          `  Original category: ${testCase.transaction.category || "undefined"}`
        );
        console.log(`  Sanitized category: ${sanitized.category}`);

        // Test validation on sanitized data
        const sanitizedErrors =
          SecurityMiddleware.validateTransaction(sanitized);
        if (sanitizedErrors.length === 0) {
          console.log("  ✅ Sanitized validation passed");
        } else {
          console.log(
            `  ❌ Sanitized validation failed: ${sanitizedErrors.join(", ")}`
          );
        }
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }

    console.log(""); // Empty line for readability
  }

  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log("🎉 All comprehensive tests passed!");
  } else {
    console.log("⚠️  Some tests failed. Please review the issues above.");
  }
}

// Run the test
testComprehensiveFixes().catch(console.error);
