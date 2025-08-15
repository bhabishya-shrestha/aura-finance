/**
 * Localhost Configuration Utility
 *
 * This utility helps with localhost-specific configurations and debugging
 * for Firebase Auth and OAuth issues.
 */

// Check if we're running on localhost
export const isLocalhost = () => {
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.includes("localhost")
  );
};

// Get the current environment info
export const getEnvironmentInfo = () => {
  return {
    hostname: window.location.hostname,
    port: window.location.port,
    protocol: window.location.protocol,
    url: window.location.href,
    isLocalhost: isLocalhost(),
    userAgent: navigator.userAgent,
  };
};

// Check Firebase configuration for localhost
export const validateFirebaseConfig = () => {
  const config = {
    apiKey: import.meta.env?.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env?.VITE_FIREBASE_APP_ID,
  };

  const issues = [];

  // Check required fields
  const requiredFields = ["apiKey", "authDomain", "projectId"];
  requiredFields.forEach(field => {
    if (!config[field]) {
      issues.push(`Missing required Firebase config: ${field}`);
    }
  });

  // Check auth domain for localhost
  if (isLocalhost() && config.authDomain) {
    if (!config.authDomain.includes("firebaseapp.com")) {
      issues.push(
        "Invalid auth domain for localhost - should end with firebaseapp.com"
      );
    }
  }

  // Check OAuth configuration
  const oauthEnabled = import.meta.env?.VITE_ENABLE_OAUTH === "true";
  if (!oauthEnabled) {
    issues.push("OAuth is not enabled (VITE_ENABLE_OAUTH should be true)");
  }

  return {
    config,
    issues,
    isValid: issues.length === 0,
  };
};

// Get localhost-specific OAuth redirect URLs
export const getLocalhostOAuthUrls = () => {
  if (!isLocalhost()) {
    return null;
  }

  const port = window.location.port || "5173";
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;

  return {
    redirectUrl: `${protocol}//${hostname}:${port}`,
    callbackUrl: `${protocol}//${hostname}:${port}/auth/callback`,
    authorizedDomains: [
      hostname,
      `${hostname}:${port}`,
      "localhost",
      "127.0.0.1",
    ],
  };
};

// Validate OAuth redirect configuration
export const validateOAuthRedirectConfig = () => {
  const issues = [];
  const recommendations = [];

  if (isLocalhost()) {
    const oauthUrls = getLocalhostOAuthUrls();

    recommendations.push(
      "For localhost development, ensure the following are configured in Firebase Console:"
    );
    recommendations.push(
      "1. Go to Firebase Console > Authentication > Settings > Authorized domains"
    );
    recommendations.push("   - Add: localhost");
    recommendations.push("   - Add: 127.0.0.1");
    recommendations.push(
      "2. Go to Firebase Console > Authentication > Sign-in method > Google"
    );
    recommendations.push("   - Add to Authorized redirect URIs:");
    recommendations.push(`     * ${oauthUrls.redirectUrl}`);
    recommendations.push(`     * ${oauthUrls.callbackUrl}`);
    recommendations.push("3. Ensure VITE_ENABLE_OAUTH=true in your .env file");
  } else {
    const domain = window.location.hostname;
    recommendations.push(
      "For production, ensure the following are configured in Firebase Console:"
    );
    recommendations.push(
      "1. Go to Firebase Console > Authentication > Settings > Authorized domains"
    );
    recommendations.push(`   - Add: ${domain}`);
    recommendations.push(
      "2. Go to Firebase Console > Authentication > Sign-in method > Google"
    );
    recommendations.push("   - Add to Authorized redirect URIs:");
    recommendations.push(`     * https://${domain}`);
    recommendations.push(`     * https://${domain}/auth/callback`);
  }

  return {
    issues,
    recommendations,
    isValid: issues.length === 0,
  };
};

// Debug function to log all relevant information
export const debugLocalhostAuth = () => {
  console.log("🔍 Localhost Auth Debug Information:");
  console.log("=====================================");

  const envInfo = getEnvironmentInfo();
  console.log("🌐 Environment:", envInfo);

  const firebaseValidation = validateFirebaseConfig();
  console.log("🔥 Firebase Config:", firebaseValidation.config);

  const oauthValidation = validateOAuthRedirectConfig();
  console.log("🔐 OAuth Redirect Config:", oauthValidation);

  if (firebaseValidation.issues.length > 0) {
    console.log("❌ Firebase issues found:");
    firebaseValidation.issues.forEach(issue => console.log(`  - ${issue}`));
  } else {
    console.log("✅ Firebase configuration is valid");
  }

  if (oauthValidation.recommendations.length > 0) {
    console.log("💡 OAuth Configuration Recommendations:");
    oauthValidation.recommendations.forEach(rec => console.log(`  ${rec}`));
  }

  if (isLocalhost()) {
    const oauthUrls = getLocalhostOAuthUrls();
    console.log("🔐 OAuth URLs for localhost:", oauthUrls);

    console.log("💡 Localhost-specific recommendations:");
    console.log(
      "  1. Ensure Firebase Console > Authentication > Settings > Authorized domains includes:"
    );
    console.log("     - localhost");
    console.log("     - 127.0.0.1");
    console.log("  2. Check OAuth redirect URLs in Firebase Console include:");
    console.log(`     - ${oauthUrls.redirectUrl}`);
    console.log(`     - ${oauthUrls.callbackUrl}`);
    console.log("  3. Verify .env file has correct Firebase configuration");
    console.log("  4. Check browser console for CORS errors");
    console.log("  5. Ensure VITE_ENABLE_OAUTH=true in .env file");
  }

  return {
    environment: envInfo,
    firebase: firebaseValidation,
    oauth: oauthValidation,
    oauthUrls: isLocalhost() ? getLocalhostOAuthUrls() : null,
  };
};

// Check for common localhost issues
export const checkCommonLocalhostIssues = () => {
  const issues = [];

  if (!isLocalhost()) {
    return issues;
  }

  // Check if .env file exists (this would be done at build time)
  if (!import.meta.env?.VITE_FIREBASE_API_KEY) {
    issues.push("Missing VITE_FIREBASE_API_KEY - check if .env file exists");
  }

  // Check OAuth enablement
  if (import.meta.env?.VITE_ENABLE_OAUTH !== "true") {
    issues.push("OAuth not enabled - set VITE_ENABLE_OAUTH=true in .env");
  }

  // Check auth domain
  const authDomain = import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN;
  if (!authDomain || !authDomain.includes("firebaseapp.com")) {
    issues.push("Invalid auth domain - should be your-project.firebaseapp.com");
  }

  return issues;
};

// Get troubleshooting steps for localhost
export const getLocalhostTroubleshootingSteps = () => {
  if (!isLocalhost()) {
    return [];
  }

  return [
    {
      step: 1,
      title: "Check Environment Variables",
      description:
        "Ensure .env file exists with correct Firebase configuration",
      check: () => !!import.meta.env?.VITE_FIREBASE_API_KEY,
    },
    {
      step: 2,
      title: "Verify OAuth is Enabled",
      description: "Set VITE_ENABLE_OAUTH=true in .env file",
      check: () => import.meta.env?.VITE_ENABLE_OAUTH === "true",
    },
    {
      step: 3,
      title: "Check Firebase Console Settings",
      description: "Add localhost to authorized domains in Firebase Console",
      check: () => true, // This can't be checked programmatically
    },
    {
      step: 4,
      title: "Verify OAuth Redirect URLs",
      description:
        "Add localhost:5173 to OAuth redirect URLs in Firebase Console",
      check: () => true, // This can't be checked programmatically
    },
    {
      step: 5,
      title: "Check Browser Console",
      description: "Look for CORS errors or authentication errors",
      check: () => true, // This can't be checked programmatically
    },
  ];
};
