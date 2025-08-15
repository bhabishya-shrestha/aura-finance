/**
 * Professional Authentication Service
 * Handles Firebase Authentication with OAuth support for both local and production
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

// Environment configuration
const ENV_CONFIG = {
  development: {
    authDomain: "aura-finance-9777a.firebaseapp.com",
    redirectUri: "http://localhost:5173",
  },
  production: {
    authDomain: "aura-finance-9777a.firebaseapp.com",
    redirectUri: "https://aura-finance-6ixvujwgp-bhabishya-shresthas-projects.vercel.app",
  },
};

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Environment detection
const isLocalhost = () => {
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.includes("localhost")
  );
};

const getEnvironment = () => {
  return isLocalhost() ? "development" : "production";
};

const getConfig = () => {
  return ENV_CONFIG[getEnvironment()];
};

// Error handling
class AuthError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.details = details;
  }
}

const getErrorMessage = (errorCode) => {
  const errorMessages = {
    "auth/user-not-found": "No account found with this email address.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/too-many-requests": "Too many failed attempts. Please try again later.",
    "auth/network-request-failed": "Network error. Please check your connection.",
    "auth/popup-closed-by-user": "Login was cancelled.",
    "auth/cancelled-popup-request": "Login was cancelled.",
    "auth/popup-blocked": "Popup was blocked. Please allow popups for this site.",
    "auth/account-exists-with-different-credential": "An account already exists with the same email but different sign-in credentials.",
    "auth/operation-not-allowed": "This sign-in method is not enabled.",
    "auth/invalid-credential": "Invalid credentials. Please try again.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/requires-recent-login": "Please log in again to continue.",
    "auth/redirect-cancelled-by-user": "Login was cancelled.",
    "auth/redirect-operation-pending": "Login is already in progress.",
    "auth/timeout": "Login timed out. Please try again.",
    "auth/unauthorized-domain": "This domain is not authorized for OAuth sign-in.",
    "auth/unsupported-persistence-type": "This browser doesn't support the requested persistence type.",
    "auth/web-storage-unsupported": "This browser doesn't support web storage.",
    "auth/invalid-api-key": "Invalid API key. Please check your configuration.",
    "auth/invalid-app-credential": "Invalid app credential.",
    "auth/invalid-app-id": "Invalid app ID.",
    "auth/invalid-user-token": "Invalid user token.",
    "auth/invalid-tenant-id": "Invalid tenant ID.",
    "auth/tenant-id-mismatch": "Tenant ID mismatch.",
    "auth/operation-not-supported-in-this-environment": "This operation is not supported in this environment.",
    "auth/auth-domain-config-required": "Auth domain configuration is required.",
    "auth/missing-app-credential": "Missing app credential.",
    "auth/missing-verification-code": "Missing verification code.",
    "auth/missing-verification-id": "Missing verification ID.",
    "auth/quota-exceeded": "Quota exceeded.",
    "auth/retry-phone-auth": "Retry phone authentication.",
    "auth/session-expired": "Session expired. Please log in again.",
    "auth/unsupported-first-factor": "Unsupported first factor.",
    "auth/unsupported-tenant-operation": "Unsupported tenant operation.",
    "auth/unverified-email": "Please verify your email address.",
    "auth/user-token-expired": "User token expired.",
    "auth/web-api-not-available": "Web API not available.",
    "auth/expired-action-code": "Action code expired.",
    "auth/invalid-action-code": "Invalid action code.",
    "auth/missing-action-code": "Missing action code.",
    "auth/credential-already-in-use": "This credential is already associated with another account.",
    "auth/email-change-needs-verification": "Email change needs verification.",
    "auth/missing-iframe-start": "Missing iframe start.",
    "auth/invalid-recaptcha-token": "Invalid reCAPTCHA token.",
    "auth/missing-recaptcha-token": "Missing reCAPTCHA token.",
    "auth/invalid-recaptcha-action": "Invalid reCAPTCHA action.",
    "auth/missing-client-type": "Missing client type.",
    "auth/missing-recaptcha-version": "Missing reCAPTCHA version.",
    "auth/invalid-recaptcha-version": "Invalid reCAPTCHA version.",
    "auth/invalid-req-type": "Invalid request type.",
  };

  return errorMessages[errorCode] || `Authentication error: ${errorCode}`;
};

// User profile management
const createUserProfile = async (userId, userData) => {
  try {
    const userProfile = {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, "users", userId), userProfile);
    return { success: true };
  } catch (error) {
    console.error("Failed to create user profile:", error);
    throw new AuthError("PROFILE_CREATION_FAILED", "Failed to create user profile", { originalError: error });
  }
};

const updateUserProfile = async (userId, updates) => {
  try {
    const updatedProfile = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, "users", userId), updatedProfile, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Failed to update user profile:", error);
    throw new AuthError("PROFILE_UPDATE_FAILED", "Failed to update user profile", { originalError: error });
  }
};

const getUserProfile = async (userId) => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: false, error: "User profile not found" };
    }
  } catch (error) {
    console.error("Failed to get user profile:", error);
    throw new AuthError("PROFILE_FETCH_FAILED", "Failed to get user profile", { originalError: error });
  }
};

// OAuth configuration validation
const validateOAuthConfig = () => {
  const config = getConfig();
  const issues = [];

  // Check if OAuth is enabled
  if (import.meta.env.VITE_ENABLE_OAUTH !== "true") {
    issues.push("OAuth is not enabled. Set VITE_ENABLE_OAUTH=true in your environment variables.");
  }

  // Check Firebase configuration
  if (!import.meta.env.VITE_FIREBASE_API_KEY) {
    issues.push("Firebase API key is missing.");
  }

  if (!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) {
    issues.push("Firebase auth domain is missing.");
  }

  if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    issues.push("Firebase project ID is missing.");
  }

  return {
    isValid: issues.length === 0,
    issues,
    config,
    environment: getEnvironment(),
  };
};

// Google OAuth provider setup
const createGoogleProvider = () => {
  const config = getConfig();
  const provider = new GoogleAuthProvider();
  
  // Add scopes
  provider.addScope("email");
  provider.addScope("profile");
  
  // Set custom parameters
  provider.setCustomParameters({
    prompt: "select_account",
    // Use Firebase's default auth handler for production
    redirect_uri: config.authDomain + "/__/auth/handler",
  });

  return provider;
};

// Main authentication service
class AuthService {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = new Set();
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  // Initialize the auth service
  async initialize() {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = new Promise(async (resolve, reject) => {
      try {
        console.log("🔐 Initializing Auth Service...");
        
        // Validate OAuth configuration
        const oauthValidation = validateOAuthConfig();
        console.log("🔍 OAuth Configuration:", oauthValidation);
        
        if (!oauthValidation.isValid) {
          console.warn("⚠️ OAuth configuration issues:", oauthValidation.issues);
        }

        // Handle OAuth redirect result
        await this.handleRedirectResult();

        // Set up auth state listener
        this.setupAuthStateListener();

        this.isInitialized = true;
        console.log("✅ Auth Service initialized successfully");
        resolve();
      } catch (error) {
        console.error("❌ Failed to initialize Auth Service:", error);
        reject(error);
      }
    });

    return this.initializationPromise;
  }

  // Handle OAuth redirect result
  async handleRedirectResult() {
    try {
      console.log("🔄 Checking for OAuth redirect result...");
      const result = await getRedirectResult(auth);
      
      if (result) {
        console.log("✅ OAuth redirect result received:", result.user.email);
        
        // Create or update user profile
        const userData = {
          email: result.user.email,
          name: result.user.displayName || result.user.email,
          photoURL: result.user.photoURL,
        };

        await createUserProfile(result.user.uid, userData);
        
        // Clear URL parameters
        if (window.location.search.includes("state=") || window.location.search.includes("code=")) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        return { success: true, user: result.user };
      } else {
        console.log("ℹ️ No OAuth redirect result found");
        return { success: false };
      }
    } catch (error) {
      console.error("❌ Error handling redirect result:", error);
      throw new AuthError("REDIRECT_HANDLING_FAILED", "Failed to handle OAuth redirect", { originalError: error });
    }
  }

  // Set up auth state listener
  setupAuthStateListener() {
    onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log("🔄 Auth state changed - User signed in:", firebaseUser.email);
          
          // Get or create user profile
          const profileResult = await getUserProfile(firebaseUser.uid);
          
          if (!profileResult.success) {
            // Create new profile
            const userData = {
              email: firebaseUser.email,
              name: firebaseUser.displayName || firebaseUser.email,
              photoURL: firebaseUser.photoURL,
            };
            await createUserProfile(firebaseUser.uid, userData);
          }

          this.currentUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email,
            photoURL: firebaseUser.photoURL,
          };
        } else {
          console.log("👋 Auth state changed - User signed out");
          this.currentUser = null;
        }

        // Notify listeners
        this.authStateListeners.forEach(listener => {
          try {
            listener(this.currentUser);
          } catch (error) {
            console.error("Error in auth state listener:", error);
          }
        });
      } catch (error) {
        console.error("❌ Error in auth state listener:", error);
      }
    });
  }

  // Sign in with Google OAuth
  async signInWithGoogle() {
    try {
      console.log("🚀 Starting Google OAuth sign-in...");
      
      // Validate configuration
      const oauthValidation = validateOAuthConfig();
      if (!oauthValidation.isValid) {
        throw new AuthError("OAUTH_CONFIG_INVALID", oauthValidation.issues.join("; "));
      }

      // Create Google provider
      const provider = createGoogleProvider();
      console.log("🔐 Google provider configured for environment:", oauthValidation.environment);

      // Sign in with redirect
      await signInWithRedirect(auth, provider);
      console.log("✅ Redirect initiated successfully");
      
      return { success: true };
    } catch (error) {
      console.error("❌ Google OAuth error:", error);
      
      if (error instanceof AuthError) {
        throw error;
      }
      
      const errorMessage = getErrorMessage(error.code) || error.message;
      throw new AuthError("OAUTH_SIGNIN_FAILED", errorMessage, { originalError: error });
    }
  }

  // Sign in with email and password
  async signInWithEmail(email, password) {
    try {
      console.log("🔐 Signing in with email:", email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get or create user profile
      const profileResult = await getUserProfile(user.uid);
      if (!profileResult.success) {
        const userData = {
          email: user.email,
          name: user.displayName || user.email,
          photoURL: user.photoURL,
        };
        await createUserProfile(user.uid, userData);
      }

      return { success: true, user };
    } catch (error) {
      console.error("❌ Email sign-in error:", error);
      const errorMessage = getErrorMessage(error.code) || error.message;
      throw new AuthError("EMAIL_SIGNIN_FAILED", errorMessage, { originalError: error });
    }
  }

  // Register with email and password
  async registerWithEmail(email, password, name) {
    try {
      console.log("📝 Registering new user:", email);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user profile
      const userData = {
        email,
        name,
        photoURL: user.photoURL,
      };
      await createUserProfile(user.uid, userData);

      return { success: true, user };
    } catch (error) {
      console.error("❌ Registration error:", error);
      const errorMessage = getErrorMessage(error.code) || error.message;
      throw new AuthError("REGISTRATION_FAILED", errorMessage, { originalError: error });
    }
  }

  // Sign out
  async signOut() {
    try {
      console.log("🚪 Signing out user");
      await signOut(auth);
      this.currentUser = null;
      return { success: true };
    } catch (error) {
      console.error("❌ Sign out error:", error);
      throw new AuthError("SIGNOUT_FAILED", "Failed to sign out", { originalError: error });
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      console.log("🔄 Sending password reset email to:", email);
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error("❌ Password reset error:", error);
      const errorMessage = getErrorMessage(error.code) || error.message;
      throw new AuthError("PASSWORD_RESET_FAILED", errorMessage, { originalError: error });
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser;
  }

  // Add auth state listener
  onAuthStateChanged(listener) {
    this.authStateListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.authStateListeners.delete(listener);
    };
  }

  // Get OAuth configuration status
  getOAuthConfig() {
    return validateOAuthConfig();
  }

  // Check if OAuth is available
  isOAuthAvailable() {
    const config = validateOAuthConfig();
    return config.isValid && import.meta.env.VITE_ENABLE_OAUTH === "true";
  }

  // Get Firebase instances for other services
  getFirebaseInstances() {
    return { app, auth, db };
  }
}

// Create and export singleton instance
const authService = new AuthService();

export default authService;
export { AuthError, getErrorMessage };
