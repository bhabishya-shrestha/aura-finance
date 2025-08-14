import React, { createContext, useContext, useEffect, useReducer } from "react";
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
  LOAD_USER_START: "LOAD_USER_START",
  LOAD_USER_SUCCESS: "LOAD_USER_SUCCESS",
  LOAD_USER_FAILURE: "LOAD_USER_FAILURE",
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

    case AUTH_ACTIONS.LOAD_USER_SUCCESS:
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
    case AUTH_ACTIONS.LOAD_USER_FAILURE:
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

// Provider component
export const FirebaseAuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // Listen for auth state changes
  useEffect(() => {
    let unsubscribe;

    const initializeAuth = async () => {
      // Handle redirect result first
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // User successfully signed in via redirect
          console.log("Redirect sign-in successful:", result.user.email);
          
          // Check if user profile exists, create if not
          const userDoc = await getDoc(doc(db, "users", result.user.uid));
          
          if (!userDoc.exists()) {
            const userProfile = {
              email: result.user.email,
              name: result.user.displayName || result.user.email,
              photoURL: result.user.photoURL,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            await setDoc(doc(db, "users", result.user.uid), userProfile);
          } else {
            // Update existing profile with latest info
            const userProfile = {
              email: result.user.email,
              name: result.user.displayName || result.user.email,
              photoURL: result.user.photoURL,
              updatedAt: new Date().toISOString(),
            };

            await setDoc(doc(db, "users", result.user.uid), userProfile, { merge: true });
          }
        }
      } catch (error) {
        console.error("Error handling redirect result:", error);
      }

      // Set up auth state listener
      unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
        if (firebaseUser) {
          // User is signed in
          try {
            // Get user profile from Firestore
            const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
            let userProfile = null;

            if (userDoc.exists()) {
              userProfile = userDoc.data();
            } else {
              // Create user profile if it doesn't exist
              const userProfile = {
                email: firebaseUser.email,
                name: firebaseUser.displayName || firebaseUser.email,
                photoURL: firebaseUser.photoURL,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              await setDoc(doc(db, "users", firebaseUser.uid), userProfile);
            }

            const user = {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name:
                userProfile?.name ||
                firebaseUser.displayName ||
                firebaseUser.email,
              photoURL: firebaseUser.photoURL,
              ...userProfile,
            };

            dispatch({
              type: AUTH_ACTIONS.AUTH_STATE_CHANGED,
              payload: { user },
            });
          } catch (error) {
            console.error("Error loading user profile:", error);
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
          // User is signed out
          dispatch({
            type: AUTH_ACTIONS.AUTH_STATE_CHANGED,
            payload: { user: null },
          });
        }
      });
    };

    initializeAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [auth, db]);

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

  // Sign in with Google
  const signInWithGoogle = async () => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
      // Note: The page will redirect to Google, then back to our app
      // The auth state change listener will handle the rest
      return { success: true };
    } catch (error) {
      const errorMessage = getFirebaseErrorMessage(error.code);
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

  // Set loading
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

// Helper function to get user-friendly error messages
const getFirebaseErrorMessage = errorCode => {
  switch (errorCode) {
    case "auth/user-not-found":
      return "No account found with this email address.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password should be at least 6 characters long.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled.";
    case "auth/popup-blocked":
      return "Sign-in popup was blocked. Please allow popups for this site.";
    case "auth/cancelled-popup-request":
      return "Sign-in was cancelled.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection.";
    default:
      return "An error occurred. Please try again.";
  }
};
