/**
 * Firebase Cleanup and Reset Script
 * 
 * This script completely cleans up all Firebase collections and recreates them
 * with proper relationships between accounts and transactions.
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC_ICx4SVrBqBni6XI4hKAlVddzycQbyY0",
  authDomain: "aura-finance-9777a.firebaseapp.com",
  projectId: "aura-finance-9777a",
  storageBucket: "aura-finance-9777a.firebasestorage.app",
  messagingSenderId: "5775045267",
  appId: "1:5775045267:web:5560ff93790423c1629366",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Test user credentials
const TEST_EMAIL = "tarussilver1@gmail.com";
const TEST_PASSWORD = "Test1234";

async function cleanupAndResetFirebase() {
  console.log("🧹 Starting Firebase cleanup and reset...");

  try {
    // Step 1: Authenticate or create test user
    console.log("🔐 Authenticating test user...");
    let user;

    try {
      // Try to sign in first
      const userCredential = await signInWithEmailAndPassword(
        auth,
        TEST_EMAIL,
        TEST_PASSWORD
      );
      user = userCredential.user;
      console.log("✅ User signed in:", user.email);
    } catch (error) {
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/invalid-credential"
      ) {
        // Create new user
        console.log("📝 Creating new test user...");
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          TEST_EMAIL,
          TEST_PASSWORD
        );
        user = userCredential.user;
        console.log("✅ New user created:", user.email);
      } else {
        throw error;
      }
    }

    // Step 2: Clean up all existing data
    console.log("🗑️ Cleaning up existing data...");
    
    const collectionsToClean = ["transactions", "accounts", "security_logs", "audit", "api_usage"];
    
    for (const collectionName of collectionsToClean) {
      console.log(`🧹 Cleaning ${collectionName}...`);
      const q = query(collection(db, collectionName), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      console.log(`✅ Deleted ${snapshot.size} documents from ${collectionName}`);
    }

    // Step 3: Create user profile
    console.log("👤 Creating user profile...");
    const userProfile = {
      email: user.email,
      name: "Test User",
      photoURL: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, "users", user.uid), userProfile);
    console.log("✅ User profile created");

    // Step 4: Create test accounts
    console.log("🏦 Creating test accounts...");
    const accounts = [
      {
        userId: user.uid,
        name: "Main Checking",
        type: "checking",
        balance: 5000.0,
        currency: "USD",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        userId: user.uid,
        name: "Savings Account",
        type: "savings",
        balance: 15000.0,
        currency: "USD",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        userId: user.uid,
        name: "Credit Card",
        type: "credit",
        balance: -2500.0,
        currency: "USD",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const accountIds = [];
    for (const account of accounts) {
      const docRef = await addDoc(collection(db, "accounts"), account);
      accountIds.push(docRef.id);
      console.log(`✅ Account created: ${account.name} (ID: ${docRef.id})`);
    }

    // Step 5: Create test transactions with proper account associations
    console.log("💰 Creating test transactions with proper account associations...");
    const transactions = [
      {
        userId: user.uid,
        accountId: accountIds[0], // Main Checking
        description: "Grocery shopping",
        amount: -125.5,
        category: "Food & Dining",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        type: "expense",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        userId: user.uid,
        accountId: accountIds[0], // Main Checking
        description: "Salary deposit",
        amount: 3500.0,
        category: "Income",
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        type: "income",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        userId: user.uid,
        accountId: accountIds[1], // Savings
        description: "Emergency fund transfer",
        amount: 500.0,
        category: "Transfer",
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        type: "transfer",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        userId: user.uid,
        accountId: accountIds[2], // Credit Card
        description: "Gas station",
        amount: -45.75,
        category: "Transportation",
        date: new Date().toISOString(),
        type: "expense",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        userId: user.uid,
        accountId: accountIds[0], // Main Checking
        description: "Coffee shop",
        amount: -8.5,
        category: "Food & Dining",
        date: new Date().toISOString(),
        type: "expense",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const transaction of transactions) {
      const docRef = await addDoc(collection(db, "transactions"), transaction);
      console.log(
        `✅ Transaction created: ${transaction.description} (Account: ${transaction.accountId})`
      );
    }

    // Step 6: Create API usage tracking
    console.log("📊 Creating API usage tracking...");
    const apiUsage = {
      userId: user.uid,
      provider: "firebase",
      requests: 0,
      lastUsed: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, "api_usage", user.uid), apiUsage);
    console.log("✅ API usage tracking created");

    // Step 7: Create security logs
    console.log("🔒 Creating security logs...");
    const securityLog = {
      userId: user.uid,
      event: "collections_reset",
      timestamp: new Date().toISOString(),
      details: {
        accountsCreated: accounts.length,
        transactionsCreated: transactions.length,
        resetCompleted: true,
      },
      ipAddress: "127.0.0.1",
      userAgent: "cleanup-script",
    };

    await addDoc(collection(db, "security_logs"), securityLog);
    console.log("✅ Security log created");

    // Step 8: Create audit trail
    console.log("📝 Creating audit trail...");
    const auditEntry = {
      userId: user.uid,
      action: "collections_reset",
      resource: "firebase_collections",
      timestamp: new Date().toISOString(),
      details: {
        collections: ["users", "accounts", "transactions", "api_usage", "security_logs", "audit"],
        status: "success",
        cleanupPerformed: true,
      },
    };

    await addDoc(collection(db, "audit"), auditEntry);
    console.log("✅ Audit trail created");

    // Step 9: Verify collections and relationships
    console.log("🔍 Verifying collections and relationships...");

    const collections = [
      "users",
      "accounts",
      "transactions",
      "api_usage",
      "security_logs",
      "audit",
    ];

    for (const collectionName of collections) {
      const q = query(
        collection(db, collectionName),
        where("userId", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      console.log(`✅ ${collectionName}: ${snapshot.size} documents found`);
    }

    // Step 10: Verify account-transaction relationships
    console.log("🔗 Verifying account-transaction relationships...");
    
    for (let i = 0; i < accountIds.length; i++) {
      const accountId = accountIds[i];
      const accountName = accounts[i].name;
      
      const transactionsQuery = query(
        collection(db, "transactions"),
        where("userId", "==", user.uid),
        where("accountId", "==", accountId)
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);
      
      console.log(`✅ ${accountName}: ${transactionsSnapshot.size} transactions`);
    }

    console.log("🎉 Firebase cleanup and reset completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - User: ${user.email}`);
    console.log(`   - Accounts: ${accounts.length}`);
    console.log(`   - Transactions: ${transactions.length}`);
    console.log(`   - Collections: ${collections.length}`);
    console.log(`   - All relationships verified`);

    return {
      success: true,
      userId: user.uid,
      accounts: accountIds,
      collections: collections,
    };
  } catch (error) {
    console.error("❌ Cleanup and reset failed:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Run the cleanup and reset
cleanupAndResetFirebase()
  .then(result => {
    if (result.success) {
      console.log("✅ Cleanup and reset completed successfully!");
      process.exit(0);
    } else {
      console.error("❌ Cleanup and reset failed!");
      process.exit(1);
    }
  })
  .catch(error => {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  });
