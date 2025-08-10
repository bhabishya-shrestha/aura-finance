/**
 * Test script to verify date validation fixes
 * Tests the enhanced date validation in security middleware
 */

import SecurityMiddleware from "../src/services/securityMiddleware.js";

async function testDateValidation() {
  console.log("🧪 Testing date validation fixes...\n");

  // Test 1: Date validation with different formats
  console.log("📅 Test 1: Date validation with different formats");

  const testCases = [
    {
      name: "Date object",
      date: new Date("2024-01-15"),
      expected: true,
    },
    {
      name: "Date string (ISO format)",
      date: "2024-01-15T00:00:00.000Z",
      expected: true,
    },
    {
      name: "Date string (simple format)",
      date: "2024-01-15",
      expected: true,
    },
    {
      name: "Unix timestamp",
      date: 1705276800000, // 2024-01-15
      expected: true,
    },
    {
      name: "Invalid date string",
      date: "invalid-date",
      expected: false,
    },
    {
      name: "Null date",
      date: null,
      expected: false,
    },
    {
      name: "Undefined date",
      date: undefined,
      expected: false,
    },
    {
      name: "Empty string date",
      date: "",
      expected: false,
    },
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    const transaction = {
      description: "Test transaction",
      amount: 100,
      category: "other",
      date: testCase.date,
    };

    try {
      const errors = SecurityMiddleware.validateTransaction(transaction);
      const passed = errors.length === 0;

      if (passed === testCase.expected) {
        console.log(`  ✅ ${testCase.name}: PASSED`);
        passedTests++;
      } else {
        console.log(`  ❌ ${testCase.name}: FAILED`);
        console.log(`    Expected: ${testCase.expected}, Got: ${passed}`);
        if (errors.length > 0) {
          console.log(`    Errors: ${errors.join(", ")}`);
        }
      }
    } catch (error) {
      console.log(`  ❌ ${testCase.name}: ERROR - ${error.message}`);
    }
  }

  // Test 2: Transaction sanitization
  console.log("\n🧹 Test 2: Transaction sanitization");

  const sanitizationTests = [
    {
      name: "String date to Date object",
      input: {
        description: "Test transaction",
        amount: 100,
        category: "other",
        date: "2024-01-15",
      },
    },
    {
      name: "Unix timestamp to Date object",
      input: {
        description: "Test transaction",
        amount: 100,
        category: "other",
        date: 1705276800000,
      },
    },
    {
      name: "XSS sanitization",
      input: {
        description: '<script>alert("xss")</script>Test transaction',
        amount: 100,
        category: "other",
        date: new Date("2024-01-15"),
        note: "Test note with <script> tags",
      },
    },
  ];

  for (const test of sanitizationTests) {
    try {
      const sanitized = SecurityMiddleware.sanitizeTransaction(test.input);
      console.log(`  ✅ ${test.name}: PASSED`);
      console.log(
        `    Date type: ${sanitized.date instanceof Date ? "Date object" : typeof sanitized.date}`
      );
      console.log(
        `    Description sanitized: ${sanitized.description !== test.input.description}`
      );
    } catch (error) {
      console.log(`  ❌ ${test.name}: FAILED - ${error.message}`);
    }
  }

  // Test 3: Edge cases
  console.log("\n🔍 Test 3: Edge cases");

  const edgeCases = [
    {
      name: "Future date",
      date: new Date(Date.now() + 86400000), // Tomorrow
      expected: false,
    },
    {
      name: "Very old date",
      date: new Date("2010-01-01"),
      expected: false,
    },
    {
      name: "Current date",
      date: new Date(),
      expected: true,
    },
  ];

  for (const testCase of edgeCases) {
    const transaction = {
      description: "Test transaction",
      amount: 100,
      category: "other",
      date: testCase.date,
    };

    try {
      const errors = SecurityMiddleware.validateTransaction(transaction);
      const passed = errors.length === 0;

      if (passed === testCase.expected) {
        console.log(`  ✅ ${testCase.name}: PASSED`);
        passedTests++;
      } else {
        console.log(`  ❌ ${testCase.name}: FAILED`);
        console.log(`    Expected: ${testCase.expected}, Got: ${passed}`);
        if (errors.length > 0) {
          console.log(`    Errors: ${errors.join(", ")}`);
        }
      }
    } catch (error) {
      console.log(`  ❌ ${testCase.name}: ERROR - ${error.message}`);
    }
  }

  totalTests += edgeCases.length;

  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log("🎉 All date validation tests passed!");
  } else {
    console.log("⚠️  Some tests failed. Please review the issues above.");
  }
}

// Run the test
testDateValidation().catch(console.error);
