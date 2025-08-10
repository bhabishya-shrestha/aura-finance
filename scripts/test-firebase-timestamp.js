/**
 * Test script to verify Firebase Timestamp validation
 */

import SecurityMiddleware from "../src/services/securityMiddleware.js";

async function testFirebaseTimestamp() {
  console.log("🧪 Testing Firebase Timestamp validation...\n");

  // Test case: Firebase Timestamp object with seconds property
  const firebaseTimestamp = {
    seconds: 1754438400,
    nanoseconds: 0,
  };

  const transaction = {
    description: "Test transaction",
    amount: 54,
    category: "other",
    date: firebaseTimestamp,
  };

  console.log("📅 Test: Firebase Timestamp object");
  console.log(`  Date object:`, firebaseTimestamp);
  console.log(`  Date type: ${typeof firebaseTimestamp}`);
  console.log(
    `  Has seconds property: ${typeof firebaseTimestamp.seconds === "number"}`
  );

  try {
    // Test validation
    const errors = SecurityMiddleware.validateTransaction(transaction);
    console.log(
      `  Validation errors: ${errors.length > 0 ? errors.join(", ") : "None"}`
    );

    if (errors.length === 0) {
      console.log("  ✅ Validation passed");
    } else {
      console.log("  ❌ Validation failed");
    }

    // Test sanitization
    const sanitized = SecurityMiddleware.sanitizeTransaction(transaction);
    console.log(
      `  Sanitized date: ${sanitized.date instanceof Date ? sanitized.date.toISOString() : JSON.stringify(sanitized.date)}`
    );
    console.log(`  Sanitized date type: ${typeof sanitized.date}`);
    console.log(`  Is Date instance: ${sanitized.date instanceof Date}`);

    // Test validation on sanitized data
    const sanitizedErrors = SecurityMiddleware.validateTransaction(sanitized);
    console.log(
      `  Sanitized validation errors: ${sanitizedErrors.length > 0 ? sanitizedErrors.join(", ") : "None"}`
    );

    if (sanitizedErrors.length === 0) {
      console.log("  ✅ Sanitized validation passed");
    } else {
      console.log("  ❌ Sanitized validation failed");
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }

  console.log("\n🎉 Firebase Timestamp test completed!");
}

// Run the test
testFirebaseTimestamp().catch(console.error);
