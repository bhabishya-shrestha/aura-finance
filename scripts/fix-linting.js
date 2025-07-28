#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// const srcDir = path.join(__dirname, "..", "src");

// Files to process
const filesToProcess = [
  "src/App.jsx",
  "src/__tests__/auth/AuthContext.test.jsx",
  "src/components/Accounts.jsx",
  "src/components/AddTransaction.jsx",
  "src/components/ConnectedAccounts.jsx",
  "src/components/Dashboard.jsx",
  "src/components/Header.jsx",
  "src/components/LoadingSpinner.jsx",
  "src/components/MobileHeader.jsx",
  "src/components/MobileNav.jsx",
  "src/components/NetWorth.jsx",
  "src/components/PlaidLink.jsx",
  "src/components/RecentTransactions.jsx",
  "src/components/SearchBar.jsx",
  "src/components/Sidebar.jsx",
  "src/components/StatementImporter.jsx",
  "src/components/auth/LoginForm.jsx",
  "src/components/auth/RegisterForm.jsx",
  "src/contexts/AuthContext.jsx",
  "src/contexts/SettingsContext.jsx",
  "src/contexts/ThemeContext.jsx",
  "src/pages/AccountsPage.jsx",
  "src/pages/AnalyticsPage.jsx",
  "src/pages/AuthCallbackPage.jsx",
  "src/pages/AuthPage.jsx",
  "src/pages/DashboardPage.jsx",
  "src/pages/ReportsPage.jsx",
  "src/pages/SettingsPage.jsx",
  "src/pages/TransactionsPage.jsx",
];

// Unused imports to remove
const unusedImports = {
  "src/components/ConnectedAccounts.jsx": [
    "CreditCard",
    "DollarSign",
    "Calendar",
  ],
  "src/components/Header.jsx": ["Monitor"],
  "src/components/MobileNav.jsx": ["User"],
  "src/components/PlaidLink.jsx": ["RefreshCw"],
  "src/components/Sidebar.jsx": ["Menu", "X", "PieChart"],
  "src/pages/AnalyticsPage.jsx": ["LineChart", "Line"],
  "src/pages/ReportsPage.jsx": ["Filter", "CalendarDays"],
  "src/pages/SettingsPage.jsx": ["Trash2"],
  "src/pages/TransactionsPage.jsx": ["Filter"],
};

function removeUnusedImports(content, filePath) {
  const unused = unusedImports[filePath] || [];

  // Remove unused React import if it's the only React import
  if (content.includes("import React") && !content.includes("React.")) {
    content = content.replace(/import React[^;]*;?\n?/g, "");
  }

  // Remove specific unused imports
  unused.forEach(importName => {
    const regex = new RegExp(`\\b${importName}\\b\\s*,?\\s*`, "g");
    content = content.replace(regex, "");
  });

  // Clean up empty import statements
  content = content.replace(/import\s*{\s*}\s*from\s*['"][^'"]*['"];?\n?/g, "");
  content = content.replace(
    /import\s*{\s*,\s*}\s*from\s*['"][^'"]*['"];?\n?/g,
    ""
  );

  return content;
}

function processFile(filePath) {
  try {
    const fullPath = path.join(__dirname, "..", filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, "utf8");
    const originalContent = content;

    content = removeUnusedImports(content, filePath);

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed: ${filePath}`);
    } else {
      console.log(`⏭️  No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

console.log("🔧 Fixing linting issues...\n");

filesToProcess.forEach(processFile);

console.log("\n✨ Linting fixes completed!");
console.log('Run "npm run lint" to check remaining issues.');
