/**
 * Comprehensive Firestore Permissions Test
 * Tests all collections and operations to ensure permissions are working correctly
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC_ICx4SVrBqBni6XI4hKAlVddzycQbyY0",
  authDomain: "aura-finance-9777a.firebaseapp.com",
  projectId: "aura-finance-9777a",
  storageBucket: "aura-finance-9777a.appspot.com",
  messagingSenderId: "5775045267",
  appId: "1:5775045267:web:5560ff93790423c1629366"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testFirestorePermissions() {
  console.log("🔍 Comprehensive Firestore Permissions Test");
  console.log("=" .repeat(50));
  
  try {
    // 1. Test authentication
    console.log("\n1. Testing Authentication...");
    const userCredential = await signInWithEmailAndPassword(auth, "test@gmail.com", "demo123");
    const user = userCredential.user;
    console.log("✅ Authenticated as:", user.email);
    console.log("   User ID:", user.uid);

    // 2. Test API Usage Collection (should work)
    console.log("\n2. Testing API Usage Collection...");
    try {
      const apiUsageDoc = doc(db, "api_usage", user.uid);
      const apiUsageSnapshot = await getDoc(apiUsageDoc);
      console.log("✅ API Usage read successful");
      console.log("   Document exists:", apiUsageSnapshot.exists());
      
      // Test write
      const today = new Date().toISOString().split("T")[0];
      await setDoc(apiUsageDoc, {
        test: {
          [today]: 1,
        },
        lastUpdated: today,
      }, { merge: true });
      console.log("✅ API Usage write successful");
      
      // Clean up test data
      await setDoc(apiUsageDoc, {
        test: {
          [today]: 0,
        },
      }, { merge: true });
      console.log("✅ API Usage cleanup successful");
    } catch (error) {
      console.error("❌ API Usage test failed:", error.message);
    }

    // 3. Test Users Collection (should work)
    console.log("\n3. Testing Users Collection...");
    try {
      const userDoc = doc(db, "users", user.uid);
      const userSnapshot = await getDoc(userDoc);
      console.log("✅ Users read successful");
      console.log("   Document exists:", userSnapshot.exists());
      
      if (!userSnapshot.exists()) {
        // Create user profile
        await setDoc(userDoc, {
          email: user.email,
          name: user.displayName || user.email,
          createdAt: new Date().toISOString(),
        });
        console.log("✅ User profile created");
      }
    } catch (error) {
      console.error("❌ Users test failed:", error.message);
    }

    // 4. Test Transactions Collection (should work)
    console.log("\n4. Testing Transactions Collection...");
    try {
      const testTransactionId = `test-${Date.now()}`;
      const transactionDoc = doc(db, "transactions", testTransactionId);
      
      await setDoc(transactionDoc, {
        userId: user.uid,
        amount: 100,
        description: "Test transaction",
        date: new Date().toISOString(),
      });
      console.log("✅ Transaction write successful");
      
      const transactionSnapshot = await getDoc(transactionDoc);
      console.log("✅ Transaction read successful");
      console.log("   Transaction data:", transactionSnapshot.data());
    } catch (error) {
      console.error("❌ Transactions test failed:", error.message);
    }

    // 5. Test Accounts Collection (should work)
    console.log("\n5. Testing Accounts Collection...");
    try {
      const testAccountId = `test-${Date.now()}`;
      const accountDoc = doc(db, "accounts", testAccountId);
      
      await setDoc(accountDoc, {
        userId: user.uid,
        name: "Test Account",
        type: "checking",
        balance: 1000,
      });
      console.log("✅ Account write successful");
      
      const accountSnapshot = await getDoc(accountDoc);
      console.log("✅ Account read successful");
      console.log("   Account data:", accountSnapshot.data());
    } catch (error) {
      console.error("❌ Accounts test failed:", error.message);
    }

    // 6. Test Health Check Collection (should work for read)
    console.log("\n6. Testing Health Check Collection...");
    try {
      const healthDoc = doc(db, "_health_check", "test");
      const healthSnapshot = await getDoc(healthDoc);
      console.log("✅ Health check read successful");
      console.log("   Document exists:", healthSnapshot.exists());
    } catch (error) {
      console.error("❌ Health check test failed:", error.message);
    }

    // 7. Test Forbidden Collections (should fail)
    console.log("\n7. Testing Forbidden Collections...");
    try {
      const forbiddenDoc = doc(db, "forbidden", "test");
      await getDoc(forbiddenDoc);
      console.error("❌ Forbidden collection access should have failed");
    } catch (error) {
      console.log("✅ Forbidden collection correctly blocked:", error.message);
    }

    // 8. Test Cross-User Access (should fail)
    console.log("\n8. Testing Cross-User Access...");
    try {
      const otherUserDoc = doc(db, "users", "other-user-id");
      await getDoc(otherUserDoc);
      console.error("❌ Cross-user access should have failed");
    } catch (error) {
      console.log("✅ Cross-user access correctly blocked:", error.message);
    }

    // 9. Test API Usage Service Integration
    console.log("\n9. Testing API Usage Service Integration...");
    try {
      const { default: apiUsageService } = await import('./src/services/apiUsageService.js');
      
      // Test validation
      const validation = await apiUsageService.validateApiUsage("gemini");
      console.log("✅ API Usage validation successful");
      console.log("   Validation result:", validation);
      
      // Test increment
      const incrementResult = await apiUsageService.incrementApiUsage("gemini");
      console.log("✅ API Usage increment successful");
      console.log("   Increment result:", incrementResult);
      
      // Test service health
      const health = apiUsageService.getServiceHealth();
      console.log("✅ Service health check successful");
      console.log("   Health status:", health);
    } catch (error) {
      console.error("❌ API Usage Service test failed:", error.message);
    }

    console.log("\n🎉 All Firestore Permissions Tests Completed!");
    console.log("The system should now work correctly with proper permissions.");

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testFirestorePermissions();
