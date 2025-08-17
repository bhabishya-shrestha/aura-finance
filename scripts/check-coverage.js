#!/usr/bin/env node

/**
 * Coverage Check Script
 * Ensures test coverage meets minimum thresholds
 */

import fs from "fs";
import path from "path";

const COVERAGE_THRESHOLDS = {
  statements: 80,
  branches: 70,
  functions: 80,
  lines: 80,
};

function checkCoverage() {
  try {
    // Read coverage report
    const coveragePath = path.join(
      process.cwd(),
      "coverage",
      "coverage-summary.json"
    );

    if (!fs.existsSync(coveragePath)) {
      console.error(
        "❌ Coverage report not found. Run tests with coverage first."
      );
      process.exit(1);
    }

    const coverage = JSON.parse(fs.readFileSync(coveragePath, "utf8"));
    const total = coverage.total;

    console.log("📊 Coverage Report:");
    console.log("==================");

    let allPassed = true;

    // Check each metric
    Object.entries(COVERAGE_THRESHOLDS).forEach(([metric, threshold]) => {
      const actual = total[metric].pct;
      const passed = actual >= threshold;

      const status = passed ? "✅" : "❌";
      console.log(`${status} ${metric}: ${actual}% (threshold: ${threshold}%)`);

      if (!passed) {
        allPassed = false;
      }
    });

    console.log("\n📈 Overall Coverage:");
    console.log(`   Total: ${total.lines.pct}%`);
    console.log(
      `   Covered: ${total.lines.covered}/${total.lines.total} lines`
    );

    if (!allPassed) {
      console.error("\n❌ Coverage thresholds not met!");
      console.error("Please add more tests to improve coverage.");
      process.exit(1);
    } else {
      console.log("\n✅ All coverage thresholds met!");
    }
  } catch (error) {
    console.error("❌ Error checking coverage:", error.message);
    process.exit(1);
  }
}

// Run the check
checkCoverage();
