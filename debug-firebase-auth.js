/**
 * Debug Firebase Authentication
 * This script checks the current authentication state and tests basic operations
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
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

async function debugFirebaseAuth() {
  console.log("🔍 Debugging Firebase Authentication...");
  
  // Check current auth state
  console.log("\n1. Current Auth State:");
  console.log("Auth currentUser:", auth.currentUser);
  console.log("Auth currentUser?.uid:", auth.currentUser?.uid);
  console.log("Auth currentUser?.email:", auth.currentUser?.email);
  
  // Set up auth state listener
  console.log("\n2. Setting up auth state listener...");
  onAuthStateChanged(auth, (user) => {
    console.log("🔄 Auth state changed:");
    console.log("User:", user);
    console.log("User UID:", user?.uid);
    console.log("User email:", user?.email);
    
    if (user) {
      // Test reading transactions
      testReadTransactions(user.uid);
    }
  });
}

async function testReadTransactions(userId) {
  console.log("\n3. Testing transaction read for user:", userId);
  
  try {
    const transactionsQuery = query(
      collection(db, "transactions"),
      where("userId", "==", userId)
    );
    
    const transactionsSnapshot = await getDocs(transactionsQuery);
    console.log("✅ Found", transactionsSnapshot.size, "transactions for user");
    
    if (transactionsSnapshot.size > 0) {
      const firstTransaction = transactionsSnapshot.docs[0].data();
      console.log("📄 First transaction data:", firstTransaction);
      console.log("🔍 Transaction userId:", firstTransaction.userId);
      console.log("🔍 Expected userId:", userId);
      console.log("🔍 Match:", firstTransaction.userId === userId);
    }
    
    // Also check for transactions without userId
    const allTransactionsQuery = query(collection(db, "transactions"));
    const allTransactionsSnapshot = await getDocs(allTransactionsQuery);
    console.log("📊 Total transactions in database:", allTransactionsSnapshot.size);
    
    const transactionsWithoutUserId = allTransactionsSnapshot.docs.filter(
      doc => !doc.data().userId
    );
    console.log("⚠️ Transactions without userId:", transactionsWithoutUserId.length);
    
    if (transactionsWithoutUserId.length > 0) {
      console.log("❌ Found transactions without userId:");
      transactionsWithoutUserId.forEach((doc, index) => {
        console.log(`  ${index + 1}. ID: ${doc.id}, Data:`, doc.data());
      });
    }
    
  } catch (error) {
    console.error("❌ Error reading transactions:", error);
  }
}

// Run the debug
debugFirebaseAuth();
