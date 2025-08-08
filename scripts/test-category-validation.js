/**
 * Test script to verify category validation and sanitization
 */

import SecurityMiddleware from "../src/services/securityMiddleware.js";

async function testCategoryValidation() {
  console.log("🧪 Testing category validation and sanitization...\n");

  const testCases = [
    {
      name: "Valid category",
      category: "shopping",
      expected: "shopping",
    },
    {
      name: "Valid category (uppercase)",
      category: "SHOPPING",
      expected: "shopping",
    },
    {
      name: "Invalid category",
      category: "amazon",
      expected: "other",
    },
    {
      name: "Missing category",
      category: null,
      expected: "other",
    },
    {
      name: "Empty category",
      category: "",
      expected: "other",
    },
    {
      name: "Undefined category",
      category: undefined,
      expected: "other",
    },
  ];

  for (const testCase of testCases) {
    console.log(`📋 Test: ${testCase.name}`);

    const transaction = {
      description: "Test transaction",
      amount: 100,
      category: testCase.category,
      date: new Date("2024-01-15"),
    };

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
      console.log(`  Original category: ${transaction.category}`);
      console.log(`  Sanitized category: ${sanitized.category}`);

      if (sanitized.category === testCase.expected) {
        console.log("  ✅ Sanitization correct");
      } else {
        console.log(
          `  ❌ Sanitization incorrect - expected ${testCase.expected}, got ${sanitized.category}`
        );
      }

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

    console.log(""); // Empty line for readability
  }

  console.log("🎉 Category validation test completed!");
}

// Run the test
testCategoryValidation().catch(console.error);
