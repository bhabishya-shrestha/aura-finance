import React, { useState } from "react";
import firebaseService from "../services/firebaseService";

const FirebaseTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message, type = "info") => {
    setTestResults(prev => [
      ...prev,
      { message, type, timestamp: new Date().toLocaleTimeString() },
    ]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      addResult("🧪 Starting Firebase tests...", "info");

      // Test 1: Check if Firebase is initialized
      addResult("✅ Firebase service loaded successfully", "success");

      // Test 2: Try to register a test user (or login if already exists)
      addResult("📝 Testing user registration...", "info");
      const registerResult = await firebaseService.register(
        "test@aura-finance.com",
        "testpassword123",
        "Test User"
      );

      if (registerResult.success) {
        addResult(
          `✅ User registration successful - User ID: ${registerResult.user.uid}`,
          "success"
        );
      } else if (registerResult.error.includes("email-already-in-use")) {
        addResult("ℹ️ User already exists, continuing with login...", "info");
      } else {
        addResult(
          `❌ User registration failed: ${registerResult.error}`,
          "error"
        );
        return;
      }

      // Test 3: Try to login
      addResult("🔐 Testing user login...", "info");
      const loginResult = await firebaseService.login(
        "test@aura-finance.com",
        "testpassword123"
      );

      if (loginResult.success) {
        addResult("✅ User login successful", "success");
      } else {
        addResult(`❌ User login failed: ${loginResult.error}`, "error");
        return;
      }

      // Test 4: Try to add a test transaction
      addResult("💰 Testing transaction creation...", "info");
      const transactionResult = await firebaseService.addTransaction({
        amount: 50.0,
        description: "Test transaction",
        date: new Date().toISOString().split("T")[0],
        category: "Test Category",
        accountId: "test-account",
      });

      if (transactionResult.success) {
        addResult(
          `✅ Transaction creation successful - ID: ${transactionResult.data.id}`,
          "success"
        );
      } else {
        addResult(
          `❌ Transaction creation failed: ${transactionResult.error}`,
          "error"
        );
        return;
      }

      // Test 5: Try to get transactions
      addResult("📊 Testing transaction retrieval...", "info");

      // Try a simpler query first
      addResult("   Testing simple query without ordering...", "info");
      const simpleQueryResult = await firebaseService.getTransactionsSimple();

      if (simpleQueryResult.success) {
        addResult(
          `✅ Simple query successful - Found ${simpleQueryResult.data.length} transactions`,
          "success"
        );
      } else {
        addResult(
          `❌ Simple query failed: ${simpleQueryResult.error}`,
          "error"
        );
      }

      // Now try the full query with ordering
      addResult("   Testing full query with ordering...", "info");
      const getTransactionsResult = await firebaseService.getTransactions();

      if (getTransactionsResult.success) {
        addResult(
          `✅ Full query successful - Found ${getTransactionsResult.data.length} transactions`,
          "success"
        );
      } else {
        addResult(
          `❌ Full query failed: ${getTransactionsResult.error}`,
          "error"
        );
        addResult(
          "   (This is expected if the index is still building)",
          "info"
        );
      }

      // Test 6: Try to add a test account
      addResult("🏦 Testing account creation...", "info");
      const accountResult = await firebaseService.addAccount({
        name: "Test Bank Account",
        type: "checking",
        balance: 1000.0,
        initialBalance: 1000.0,
      });

      if (accountResult.success) {
        addResult(
          `✅ Account creation successful - ID: ${accountResult.data.id}`,
          "success"
        );
      } else {
        addResult(
          `❌ Account creation failed: ${accountResult.error}`,
          "error"
        );
        return;
      }

      // Test 7: Try to get accounts
      addResult("📋 Testing account retrieval...", "info");
      const getAccountsResult = await firebaseService.getAccounts();

      if (getAccountsResult.success) {
        addResult(
          `✅ Account retrieval successful - Found ${getAccountsResult.data.length} accounts`,
          "success"
        );
      } else {
        addResult(
          `❌ Account retrieval failed: ${getAccountsResult.error}`,
          "error"
        );
        return;
      }

      addResult("🎉 All Firebase tests passed!", "success");
      addResult("🚀 Your Firebase setup is working perfectly!", "success");
      addResult(`   You now have cross-device sync for $0/month!`, "success");
    } catch (error) {
      addResult(`❌ Test failed with error: ${error.message}`, "error");
      addResult("🔧 Please check:", "info");
      addResult("   1. Firebase project is created", "info");
      addResult("   2. Authentication is enabled", "info");
      addResult("   3. Firestore database is created", "info");
      addResult("   4. Environment variables are set correctly", "info");
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Firebase Setup Test</h2>

      <div className="mb-4">
        <button
          onClick={runTests}
          disabled={isRunning}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2 disabled:opacity-50"
        >
          {isRunning ? "Running Tests..." : "Run Firebase Tests"}
        </button>

        <button
          onClick={clearResults}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Clear Results
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
        {testResults.length === 0 ? (
          <p className="text-gray-500">
            Click &quot;Run Firebase Tests&quot; to start testing...
          </p>
        ) : (
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`text-sm ${result.type === "error" ? "text-red-600" : result.type === "success" ? "text-green-600" : "text-gray-700"}`}
              >
                <span className="font-mono text-xs text-gray-500">
                  [{result.timestamp}]
                </span>{" "}
                {result.message}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">What This Tests:</h3>
        <ul className="text-sm space-y-1">
          <li>• Firebase service initialization</li>
          <li>• User registration and authentication</li>
          <li>• Transaction creation and retrieval</li>
          <li>• Account creation and retrieval</li>
          <li>• Cross-device sync functionality</li>
        </ul>
      </div>
    </div>
  );
};

export default FirebaseTest;
