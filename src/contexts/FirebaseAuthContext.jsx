import React, { createContext, useContext, useEffect, useReducer } from "react";
import { useNotifications } from "./NotificationContext";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { app } from "../services/firebaseService";
import firebaseSync from "../services/firebaseSync";

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

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.AUTH_STATE_CHANGED: {
      console.log(
        "🔄 AUTH_STATE_CHANGED reducer called with payload:",
        action.payload
      );
      const newState = {
        ...state,
        user: action.payload.user,
        isAuthenticated: !!action.payload.user,
        isLoading: false,
        isInitialized: true,
        error: null,
      };
      console.log("🔄 New auth state:", newState);
      return newState;
    }

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

// Firebase error message helper
const getFirebaseErrorMessage = errorCode => {
  const errorMessages = {
    "auth/user-not-found": "No account found with this email address.",
    "auth/wrong-password": "Incorrect password.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/operation-not-allowed": "This sign-in method is not enabled.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/too-many-requests":
      "Too many failed attempts. Please try again later.",
    "auth/network-request-failed":
      "Network error. Please check your connection.",
  };
  return errorMessages[errorCode] || "An error occurred. Please try again.";
};

// Create context
const FirebaseAuthContext = createContext();

// Provider component
export const FirebaseAuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const { showSuccess, showInfo } = useNotifications();

  // Listen for auth state changes
  useEffect(() => {
    console.log("🔐 Setting up Firebase Auth listener...");

    const toTitleCase = str =>
      (str || "")
        .replace(/[-_.]+/g, " ")
        .split(" ")
        .filter(Boolean)
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");

    const getEmailPrefixName = email => toTitleCase((email || "").split("@")[0]);

    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      console.log(
        "🔄 Auth state changed:",
        firebaseUser ? firebaseUser.email : "signed out"
      );

      if (firebaseUser) {
        try {
          // Get or create user profile
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          let profileData = null;

          if (!userDoc.exists()) {
            console.log(
              "📝 Creating new user profile for:",
              firebaseUser.email
            );
            const userProfile = {
              email: firebaseUser.email,
              name:
                firebaseUser.displayName || getEmailPrefixName(firebaseUser.email),
              photoURL: firebaseUser.photoURL,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            try {
              await setDoc(doc(db, "users", firebaseUser.uid), userProfile);
              console.log("✅ User profile created successfully");
              showSuccess("Profile created successfully!");
              console.log("🔔 Success notification should be shown");
            } catch (profileError) {
              console.warn(
                "⚠️ Could not create user profile, continuing with basic auth:",
                profileError.message
              );
            }
          } else {
            // Only update if there are actual changes to avoid unnecessary writes
            const existingProfile = userDoc.data();
            profileData = existingProfile;
            const normalizedDesiredName =
              firebaseUser.displayName ||
              (existingProfile.name && !existingProfile.name.includes("@")
                ? existingProfile.name
                : getEmailPrefixName(firebaseUser.email));

            const hasChanges =
              existingProfile.email !== firebaseUser.email ||
              existingProfile.name !== normalizedDesiredName ||
              existingProfile.photoURL !== firebaseUser.photoURL;

            if (hasChanges) {
              console.log("📝 Updating existing user profile with changes...");
              const userProfile = {
                email: firebaseUser.email,
                name: normalizedDesiredName,
                photoURL: firebaseUser.photoURL,
                updatedAt: new Date().toISOString(),
              };

              try {
                await setDoc(doc(db, "users", firebaseUser.uid), userProfile, {
                  merge: true,
                });
                console.log("✅ User profile updated successfully");
                showInfo("Profile updated successfully!");
              } catch (profileError) {
                console.warn(
                  "⚠️ Could not update user profile, continuing with basic auth:",
                  profileError.message
                );
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
            // Prefer normalized profile name; fallback to displayName or email prefix
            name:
              (profileData && !profileData.name?.includes("@")
                ? profileData.name
                : null) ||
              firebaseUser.displayName ||
              getEmailPrefixName(firebaseUser.email),
            photoURL: firebaseUser.photoURL,
          };

          console.log("✅ User authenticated:", user.email);
          console.log("🔄 Dispatching AUTH_STATE_CHANGED with user:", user);
          dispatch({
            type: AUTH_ACTIONS.AUTH_STATE_CHANGED,
            payload: { user },
          });
          console.log("✅ AUTH_STATE_CHANGED dispatched");

          // Initialize sync service for authenticated user
          try {
            console.log("🔄 Initializing Firebase sync service...");
            await firebaseSync.initialize();
            console.log("✅ Firebase sync service initialized");
          } catch (syncError) {
            console.warn(
              "⚠️ Firebase sync initialization failed:",
              syncError.message
            );
          }
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

    return () => unsubscribe();
  }, [auth, db, showSuccess, showInfo]);

  // Login with email and password
  const login = async (email, password) => {
    console.log("🚀 Firebase login attempt for:", email);
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      console.log("🔐 Calling Firebase signInWithEmailAndPassword...");
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log(
        "✅ Firebase authentication successful:",
        userCredential.user.email
      );

      const user = {
        id: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName || userCredential.user.email,
        photoURL: userCredential.user.photoURL,
      };

      console.log("👤 Dispatching login success with user:", user);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user },
      });

      return { success: true, user };
    } catch (error) {
      console.error("❌ Firebase login error:", error);
      const errorMessage = getFirebaseErrorMessage(error.code);
      console.log("📝 Dispatching login failure with error:", errorMessage);
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

  // Set loading
  const setLoading = loading => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: loading });
  };

  const value = {
    ...state,
    login,
    register,
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
