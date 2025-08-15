// Debug script for localhost login issues
console.log("🔍 Debugging localhost login issues...");

// Check environment variables
console.log("\n📋 Environment Variables:");
console.log("- VITE_FIREBASE_API_KEY:", import.meta.env?.VITE_FIREBASE_API_KEY ? "✅ Set" : "❌ Missing");
console.log("- VITE_FIREBASE_AUTH_DOMAIN:", import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "❌ Missing");
console.log("- VITE_FIREBASE_PROJECT_ID:", import.meta.env?.VITE_FIREBASE_PROJECT_ID || "❌ Missing");
console.log("- VITE_ENABLE_OAUTH:", import.meta.env?.VITE_ENABLE_OAUTH || "❌ Missing");

// Check current URL and environment
console.log("\n🌐 Current Environment:");
console.log("- Current URL:", window.location.href);
console.log("- Hostname:", window.location.hostname);
console.log("- Protocol:", window.location.protocol);
console.log("- Port:", window.location.port);

// Check if we're on localhost
const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.hostname.includes('localhost');

console.log("- Is localhost:", isLocalhost);

// Check Firebase configuration
console.log("\n🔥 Firebase Configuration:");
try {
  const firebaseConfig = {
    apiKey: import.meta.env?.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env?.VITE_FIREBASE_APP_ID,
  };

  console.log("- Config object:", firebaseConfig);
  
  // Check for missing required fields
  const requiredFields = ['apiKey', 'authDomain', 'projectId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
  
  if (missingFields.length > 0) {
    console.log("❌ Missing required Firebase config fields:", missingFields);
  } else {
    console.log("✅ All required Firebase config fields present");
  }

  // Check auth domain for localhost issues
  if (firebaseConfig.authDomain) {
    console.log("- Auth domain:", firebaseConfig.authDomain);
    if (isLocalhost && !firebaseConfig.authDomain.includes('localhost')) {
      console.log("⚠️  Warning: On localhost but auth domain doesn't include localhost");
    }
  }

} catch (error) {
  console.error("❌ Error checking Firebase config:", error);
}

// Check OAuth configuration
console.log("\n🔐 OAuth Configuration:");
console.log("- VITE_ENABLE_OAUTH:", import.meta.env?.VITE_ENABLE_OAUTH);
console.log("- VITE_GOOGLE_CLIENT_ID:", import.meta.env?.VITE_GOOGLE_CLIENT_ID ? "✅ Set" : "❌ Missing");

// Common localhost issues
console.log("\n🚨 Common Localhost Issues:");
console.log("1. Missing .env file with Firebase config");
console.log("2. Firebase auth domain not configured for localhost");
console.log("3. OAuth redirect URLs not configured for localhost");
console.log("4. CORS issues with Firebase Auth");
console.log("5. Environment variables not loaded properly");

console.log("\n💡 Recommendations:");
if (isLocalhost) {
  console.log("- Ensure .env file exists with Firebase config");
  console.log("- Check Firebase Console > Authentication > Settings > Authorized domains");
  console.log("- Add 'localhost' to authorized domains");
  console.log("- Verify OAuth redirect URLs include localhost:5173");
  console.log("- Check browser console for CORS errors");
}
