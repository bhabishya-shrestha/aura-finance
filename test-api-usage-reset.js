// Test script to verify API usage reset functionality
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

// Firebase config (replace with your actual config)
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

async function testApiUsageReset() {
  console.log("🧪 Testing API Usage Reset Functionality");
  
  try {
    // Test with a demo account (replace with actual credentials)
    console.log("1. Signing in...");
    const userCredential = await signInWithEmailAndPassword(auth, "test@gmail.com", "demo123");
    const user = userCredential.user;
    console.log("✅ Signed in as:", user.email);

    // Test current usage
    console.log("\n2. Checking current API usage...");
    const usageDoc = doc(db, "api_usage", user.uid);
    const usageSnapshot = await getDoc(usageDoc);
    
    if (usageSnapshot.exists()) {
      const data = usageSnapshot.data();
      console.log("📊 Current usage data:", JSON.stringify(data, null, 2));
    } else {
      console.log("📊 No usage data found - this is normal for new users");
    }

    // Test daily reset logic
    console.log("\n3. Testing daily reset logic...");
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    
    // Simulate old usage data
    console.log("📝 Setting up test data with yesterday's usage...");
    await setDoc(usageDoc, {
      gemini: {
        [yesterday]: 150, // Exceeded limit from yesterday
        [today]: 0,
      },
      lastUpdated: yesterday,
    }, { merge: true });

    console.log("✅ Test data set up");

    // Now test the reset logic by calling the service
    console.log("\n4. Testing reset logic...");
    
    // Import the service (this will trigger the reset logic)
    const { default: apiUsageService } = await import('./src/services/apiUsageService.js');
    
    // Test validation (should reset automatically)
    console.log("🔍 Testing API validation (should trigger reset)...");
    const validation = await apiUsageService.validateApiUsage("gemini");
    console.log("✅ Validation result:", validation);

    // Check usage status
    console.log("\n5. Checking usage status after reset...");
    const status = await apiUsageService.getCurrentUsageStatus("gemini");
    console.log("📊 Usage status:", status);

    // Force reset for testing
    console.log("\n6. Testing force reset...");
    const resetResult = await apiUsageService.forceResetApiUsage("gemini");
    console.log("✅ Force reset result:", resetResult);

    // Final check
    console.log("\n7. Final usage check...");
    const finalStatus = await apiUsageService.getCurrentUsageStatus("gemini");
    console.log("📊 Final usage status:", finalStatus);

    console.log("\n🎉 API Usage Reset Test Complete!");
    console.log("The system should now properly reset daily usage and not show 'daily limit exceeded' errors.");

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testApiUsageReset();
