// Test file to verify authentication system
import { localAuthService } from "./services/localAuth";
import { initializeDatabase } from "./database";

// Test the authentication system
async function testAuth() {
  try {
    console.log("🧪 Testing Authentication System...");

    // Initialize database
    await initializeDatabase();
    console.log("✅ Database initialized");

    // Test registration
    const registerResult = await localAuthService.register({
      name: "Test User",
      email: "test@example.com",
      password: "TestPassword123",
    });

    console.log("Registration result:", registerResult);

    if (registerResult.success) {
      console.log("✅ Registration successful");

      // Test login
      const loginResult = await localAuthService.login({
        email: "test@example.com",
        password: "TestPassword123",
      });

      console.log("Login result:", loginResult);

      if (loginResult.success) {
        console.log("✅ Login successful");

        // Test token validation
        const userResult = await localAuthService.getCurrentUser(
          loginResult.data.token
        );
        console.log("User validation result:", userResult);

        if (userResult.success) {
          console.log("✅ Token validation successful");
        }
      }
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run test if this file is executed directly
if (typeof window !== "undefined") {
  // Browser environment
  window.testAuth = testAuth;
  console.log("🔧 Test function available as window.testAuth()");
} else {
  // Node environment
  testAuth();
}
