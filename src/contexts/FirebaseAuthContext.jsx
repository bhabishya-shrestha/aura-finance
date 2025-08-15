import React, { createContext, useContext, useEffect, useReducer } from "react";
import { useNotifications } from "./NotificationContext";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { app } from "../services/firebaseService";

// Action types
const AUTH_ACTIONS = {
  AUTH_STATE_CHANGED: "AUTH_STATE_CHANGED",
  LOGIN_START: "LOGIN_START",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILURE: "LOGIN_FAILURE",
  LOGOUT: "LOGOUT",
  REGISTER_START: "REGISTER_START",
  REGISTER_SUCCESS: "REGISTER_SUCCESS",
  REGISTER_FAILURE: "REGISTER_FAILURE",
  CLEAR_ERROR: "CLEAR_ERROR",
  SET_LOADING: "SET_LOADING",
};

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  isInitialized: false,
};

// Helper function to detect localhost
const isLocalhost = () => {
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.includes("localhost")
  );
};

// Helper function to get Firebase error messages
const getFirebaseErrorMessage = errorCode => {
  const errorMessages = {
    "auth/user-not-found": "No account found with this email address.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/too-many-requests":
      "Too many failed attempts. Please try again later.",
    "auth/network-request-failed":
      "Network error. Please check your connection.",
    "auth/popup-closed-by-user": "Login was cancelled.",
    "auth/cancelled-popup-request": "Login was cancelled.",
    "auth/popup-blocked":
      "Popup was blocked. Please allow popups for this site.",
    "auth/account-exists-with-different-credential":
      "An account already exists with the same email but different sign-in credentials.",
    "auth/operation-not-allowed": "This sign-in method is not enabled.",
    "auth/invalid-credential": "Invalid credentials. Please try again.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/requires-recent-login": "Please log in again to continue.",
    "auth/redirect-cancelled-by-user": "Login was cancelled.",
    "auth/redirect-operation-pending": "Login is already in progress.",
    "auth/timeout": "Login timed out. Please try again.",
    "auth/unauthorized-domain":
      "This domain is not authorized for OAuth sign-in.",
    "auth/unsupported-persistence-type":
      "This browser doesn't support the requested persistence type.",
    "auth/web-storage-unsupported": "This browser doesn't support web storage.",
    "auth/invalid-api-key": "Invalid API key. Please check your configuration.",
    "auth/invalid-app-credential": "Invalid app credential.",
    "auth/invalid-app-id": "Invalid app ID.",
    "auth/invalid-user-token": "Invalid user token.",
    "auth/invalid-tenant-id": "Invalid tenant ID.",
    "auth/tenant-id-mismatch": "Tenant ID mismatch.",
    "auth/operation-not-supported-in-this-environment":
      "This operation is not supported in this environment.",
    "auth/auth-domain-config-required":
      "Auth domain configuration is required.",
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
    "auth/credential-already-in-use":
      "This credential is already associated with another account.",
    "auth/email-change-needs-verification": "Email change needs verification.",
    "auth/missing-iframe-start": "Missing iframe start.",
    "auth/auth/invalid-recaptcha-token": "Invalid reCAPTCHA token.",
    "auth/missing-recaptcha-token": "Missing reCAPTCHA token.",
    "auth/invalid-recaptcha-action": "Invalid reCAPTCHA action.",
    "auth/missing-client-type": "Missing client type.",
    "auth/missing-recaptcha-version": "Missing reCAPTCHA version.",
    "auth/invalid-recaptcha-version": "Invalid reCAPTCHA version.",
    "auth/invalid-req-type": "Invalid request type.",
  };

  return errorMessages[errorCode] || `Authentication error: ${errorCode}`;
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.AUTH_STATE_CHANGED:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: !!action.payload.user,
        isLoading: false,
        isInitialized: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        isInitialized: true,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        isInitialized: true,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isInitialized: true,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    default:
      return state;
  }
};

// Create context
const FirebaseAuthContext = createContext();

// Custom hook to use the auth context
export const useFirebaseAuth = () => {
  const context = useContext(FirebaseAuthContext);
  if (!context) {
    throw new Error(
      "useFirebaseAuth must be used within a FirebaseAuthProvider"
    );
  }
  return context;
};

// Provider component
export const FirebaseAuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { showSuccess, showInfo } = useNotifications();

  const auth = getAuth(app);
  const db = getFirestore(app);

  // Listen for auth state changes
  useEffect(() => {
    console.log("🔐 Setting up Firebase Auth listener...");

    let unsubscribe = null;

    // Handle OAuth redirect result first
    const handleRedirectResult = async () => {
      try {
        console.log("🔄 Checking for OAuth redirect result...");
        const result = await getRedirectResult(auth);
        if (result) {
          console.log("✅ OAuth redirect result received:", result.user.email);
          showSuccess("Successfully signed in with Google!");

          // Clear any URL parameters that might have been added during OAuth
          if (
            window.location.search.includes("state=") ||
            window.location.search.includes("code=")
          ) {
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );
          }
        } else {
          console.log("ℹ️ No OAuth redirect result found");
        }
      } catch (error) {
        console.error("❌ Error handling redirect result:", error);
      }
    };

    // Handle redirect result first, then set up auth state listener
    handleRedirectResult().then(() => {
      unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
        if (firebaseUser) {
          console.log("🔄 Auth state changed:", firebaseUser.email);

          try {
            // Check if user profile exists in Firestore
            const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

            if (!userDoc.exists()) {
              // Create new user profile
              console.log("📝 Creating new user profile...");
              const userProfile = {
                email: firebaseUser.email,
                name: firebaseUser.displayName || firebaseUser.email,
                photoURL: firebaseUser.photoURL,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              try {
                await setDoc(doc(db, "users", firebaseUser.uid), userProfile);
                console.log("✅ User profile created successfully");
                showSuccess("Profile created successfully!");
              } catch (profileError) {
                console.warn(
                  "⚠️ Could not create user profile, continuing with basic auth:",
                  profileError.message
                );
                // Note: showWarning is not available, using console.warn instead
              }
            } else {
              // Update existing profile if there are changes
              const existingProfile = userDoc.data();
              const hasChanges =
                existingProfile.email !== firebaseUser.email ||
                existingProfile.name !==
                  (firebaseUser.displayName || firebaseUser.email) ||
                existingProfile.photoURL !== firebaseUser.photoURL;

              if (hasChanges) {
                console.log("📝 Updating existing user profile...");
                const updatedProfile = {
                  ...existingProfile,
                  email: firebaseUser.email,
                  name: firebaseUser.displayName || firebaseUser.email,
                  photoURL: firebaseUser.photoURL,
                  updatedAt: new Date().toISOString(),
                };

                try {
                  await setDoc(
                    doc(db, "users", firebaseUser.uid),
                    updatedProfile
                  );
                  console.log("✅ User profile updated successfully");
                  showInfo("Profile updated successfully!");
                } catch (profileError) {
                  console.warn(
                    "⚠️ Could not update user profile, continuing with basic auth:",
                    profileError.message
                  );
                  // Note: showWarning is not available, using console.warn instead
                }
              } else {
                console.log(
                  "✅ User profile already up to date, no changes needed"
                );
              }
            }

            const user = {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || firebaseUser.email,
              photoURL: firebaseUser.photoURL,
            };

            console.log("✅ User authenticated:", user.email);
            dispatch({
              type: AUTH_ACTIONS.AUTH_STATE_CHANGED,
              payload: { user },
            });
          } catch (error) {
            console.error("❌ Error handling user profile:", error);
            // Still dispatch auth state change with basic user info
            const user = {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || firebaseUser.email,
              photoURL: firebaseUser.photoURL,
            };
            dispatch({
              type: AUTH_ACTIONS.AUTH_STATE_CHANGED,
              payload: { user },
            });
          }
        } else {
          console.log("👋 User signed out");
          dispatch({
            type: AUTH_ACTIONS.AUTH_STATE_CHANGED,
            payload: { user: null },
          });
        }
      });
    });

    // Return cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [auth, db, showSuccess, showInfo]);

  // Login with email and password
  const login = async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = {
        id: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName || userCredential.user.email,
        photoURL: userCredential.user.photoURL,
      };

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user },
      });

      return { success: true, user };
    } catch (error) {
      const errorMessage = getFirebaseErrorMessage(error.code);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Register with email and password
  const register = async (email, password, name) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Create user profile in Firestore
      const userProfile = {
        email,
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", userCredential.user.uid), userProfile);

      const user = {
        id: userCredential.user.uid,
        email: userCredential.user.email,
        name,
        photoURL: userCredential.user.photoURL,
      };

      dispatch({
        type: AUTH_ACTIONS.REGISTER_SUCCESS,
        payload: { user },
      });

      return { success: true, user };
    } catch (error) {
      const errorMessage = getFirebaseErrorMessage(error.code);
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Sign in with Google (using redirect to avoid CORS issues)
  const signInWithGoogle = async () => {
    console.log("🚀 Starting Google OAuth sign-in...");
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      // Check if OAuth is enabled
      const oauthEnabled = import.meta.env?.VITE_ENABLE_OAUTH === "true";
      console.log("🔍 OAuth Environment Check:", {
        VITE_ENABLE_OAUTH: import.meta.env?.VITE_ENABLE_OAUTH,
        oauthEnabled: oauthEnabled,
        envType: typeof import.meta.env?.VITE_ENABLE_OAUTH,
      });

      if (!oauthEnabled) {
        throw new Error(
          "OAuth is not enabled. Please check your configuration."
        );
      }

      // Check if we're on localhost and provide specific guidance
      if (isLocalhost()) {
        console.log(
          "🏠 Running on localhost - checking OAuth configuration..."
        );
        const authDomain = import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN;
        if (!authDomain || !authDomain.includes("firebaseapp.com")) {
          throw new Error(
            "Invalid Firebase auth domain configuration for localhost."
          );
        }
      }

      const provider = new GoogleAuthProvider();
      provider.addScope("email");
      provider.addScope("profile");
      provider.setCustomParameters({
        prompt: "select_account",
        // Use Firebase's default auth handler
        redirect_uri: "https://aura-finance-9777a.firebaseapp.com/__/auth/handler"
      });

      console.log("🔐 OAuth Provider configured with Firebase default auth handler");
      console.log("📋 Using redirect URI: https://aura-finance-9777a.firebaseapp.com/__/auth/handler");

      // Use redirect instead of popup to avoid CORS issues
      console.log("📱 Calling signInWithRedirect...");
      await signInWithRedirect(auth, provider);

      console.log(
        "✅ signInWithRedirect completed - user should be redirected to Google"
      );
      showInfo("Redirecting to Google for authentication...");
      // The auth state change listener will handle the rest after redirect
      return { success: true };
    } catch (error) {
      console.error("❌ Google OAuth error:", error);
      const errorMessage = getFirebaseErrorMessage(error.code) || error.message;
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: "Failed to logout" };
    }
  };

  // Reset password
  const resetPassword = async email => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      const errorMessage = getFirebaseErrorMessage(error.code);
      return { success: false, error: errorMessage };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Set loading state
  const setLoading = loading => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: loading });
  };

  const value = {
    ...state,
    login,
    register,
    signInWithGoogle,
    logout,
    resetPassword,
    clearError,
    setLoading,
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
};
