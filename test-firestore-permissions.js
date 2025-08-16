/**
 * Test Firestore Permissions
 * This script tests that all CRUD operations work correctly with the updated Firestore rules
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";

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

async function testFirestorePermissions() {
  console.log("🧪 Testing Firestore Permissions...");

  try {
    // Test 1: Authentication
    console.log("\n1. Testing Authentication...");
    const userCredential = await signInWithEmailAndPassword(
      auth,
      "tarussilver1@gmail.com",
      "testpassword123"
    );
    console.log("✅ Authentication successful:", userCredential.user.uid);

    // Test 2: Create Transaction
    console.log("\n2. Testing Transaction Creation...");
    const transactionData = {
      description: "Test Transaction",
      amount: 100.5,
      category: "test",
      accountId: "test-account",
      date: new Date().toISOString(),
      userId: userCredential.user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const transactionRef = await addDoc(
      collection(db, "transactions"),
      transactionData
    );
    console.log("✅ Transaction created successfully:", transactionRef.id);

    // Test 3: Read Transaction
    console.log("\n3. Testing Transaction Read...");
    const transactionDoc = await getDoc(
      doc(db, "transactions", transactionRef.id)
    );
    if (transactionDoc.exists()) {
      console.log("✅ Transaction read successfully:", transactionDoc.data());
    } else {
      console.log("❌ Transaction not found");
    }

    // Test 4: Update Transaction
    console.log("\n4. Testing Transaction Update...");
    await updateDoc(doc(db, "transactions", transactionRef.id), {
      description: "Updated Test Transaction",
      updatedAt: new Date(),
    });
    console.log("✅ Transaction updated successfully");

    // Test 5: Delete Transaction
    console.log("\n5. Testing Transaction Deletion...");
    await deleteDoc(doc(db, "transactions", transactionRef.id));
    console.log("✅ Transaction deleted successfully");

    // Test 6: Create Account
    console.log("\n6. Testing Account Creation...");
    const accountData = {
      name: "Test Account",
      type: "checking",
      balance: 1000.0,
      userId: userCredential.user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const accountRef = await addDoc(collection(db, "accounts"), accountData);
    console.log("✅ Account created successfully:", accountRef.id);

    // Test 7: Read Account
    console.log("\n7. Testing Account Read...");
    const accountDoc = await getDoc(doc(db, "accounts", accountRef.id));
    if (accountDoc.exists()) {
      console.log("✅ Account read successfully:", accountDoc.data());
    } else {
      console.log("❌ Account not found");
    }

    // Test 8: Update Account
    console.log("\n8. Testing Account Update...");
    await updateDoc(doc(db, "accounts", accountRef.id), {
      name: "Updated Test Account",
      updatedAt: new Date(),
    });
    console.log("✅ Account updated successfully");

    // Test 9: Delete Account
    console.log("\n9. Testing Account Deletion...");
    await deleteDoc(doc(db, "accounts", accountRef.id));
    console.log("✅ Account deleted successfully");

    // Test 10: List User's Transactions
    console.log("\n10. Testing Transaction Listing...");
    const transactionsQuery = query(
      collection(db, "transactions"),
      where("userId", "==", userCredential.user.uid)
    );
    const transactionsSnapshot = await getDocs(transactionsQuery);
    console.log("✅ Found", transactionsSnapshot.size, "transactions for user");

    // Test 11: List User's Accounts
    console.log("\n11. Testing Account Listing...");
    const accountsQuery = query(
      collection(db, "accounts"),
      where("userId", "==", userCredential.user.uid)
    );
    const accountsSnapshot = await getDocs(accountsQuery);
    console.log("✅ Found", accountsSnapshot.size, "accounts for user");

    console.log("\n🎉 All Firestore permission tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
  } finally {
    // Sign out
    await signOut(auth);
    console.log("\n👋 Signed out");
  }
}

// Run the test
testFirestorePermissions();
