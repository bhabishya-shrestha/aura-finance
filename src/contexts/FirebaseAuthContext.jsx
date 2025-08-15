import React, { createContext, useContext, useEffect, useReducer } from "react";
import { useNotifications } from "./NotificationContext";
import authService, { AuthError } from "../services/authService";

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
  INITIALIZATION_START: "INITIALIZATION_START",
  INITIALIZATION_SUCCESS: "INITIALIZATION_SUCCESS",
  INITIALIZATION_FAILURE: "INITIALIZATION_FAILURE",
};

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  error: null,
  oauthConfig: null,
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.INITIALIZATION_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.INITIALIZATION_SUCCESS:
      return {
        ...state,
        isLoading: false,
        isInitialized: true,
        oauthConfig: action.payload.oauthConfig,
        error: null,
      };

    case AUTH_ACTIONS.INITIALIZATION_FAILURE:
      return {
        ...state,
        isLoading: false,
        isInitialized: true,
        error: action.payload,
      };

    case AUTH_ACTIONS.AUTH_STATE_CHANGED:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: !!action.payload.user,
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
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
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
  const { showSuccess, showError, showInfo } = useNotifications();

  // Initialize auth service
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: AUTH_ACTIONS.INITIALIZATION_START });

        console.log("🔐 Initializing Firebase Auth Context...");

        // Initialize the auth service
        await authService.initialize();

        // Get OAuth configuration
        const oauthConfig = authService.getOAuthConfig();

        // Set up auth state listener
        const unsubscribe = authService.onAuthStateChanged(user => {
          console.log(
            "🔄 Auth state changed in context:",
            user?.email || "signed out"
          );

          dispatch({
            type: AUTH_ACTIONS.AUTH_STATE_CHANGED,
            payload: { user },
          });

          if (user) {
            showSuccess(`Welcome back, ${user.name}!`);
          }
        });

        dispatch({
          type: AUTH_ACTIONS.INITIALIZATION_SUCCESS,
          payload: { oauthConfig },
        });

        console.log("✅ Firebase Auth Context initialized successfully");

        // Return cleanup function
        return unsubscribe;
      } catch (error) {
        console.error("❌ Failed to initialize Firebase Auth Context:", error);

        const errorMessage =
          error instanceof AuthError
            ? error.message
            : "Failed to initialize authentication service";

        dispatch({
          type: AUTH_ACTIONS.INITIALIZATION_FAILURE,
          payload: errorMessage,
        });

        showError(errorMessage);
      }
    };

    initializeAuth();
  }, [showSuccess, showError, showInfo]);

  // Login with email and password
  const login = async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const result = await authService.signInWithEmail(email, password);

      if (result.success) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user: result.user },
        });

        return { success: true, user: result.user };
      } else {
        throw new Error("Login failed");
      }
    } catch (error) {
      console.error("❌ Login error:", error);

      const errorMessage =
        error instanceof AuthError
          ? error.message
          : "Login failed. Please try again.";

      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage,
      });

      showError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Register with email and password
  const register = async (email, password, name) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });

    try {
      const result = await authService.registerWithEmail(email, password, name);

      if (result.success) {
        dispatch({
          type: AUTH_ACTIONS.REGISTER_SUCCESS,
          payload: { user: result.user },
        });

        return { success: true, user: result.user };
      } else {
        throw new Error("Registration failed");
      }
    } catch (error) {
      console.error("❌ Registration error:", error);

      const errorMessage =
        error instanceof AuthError
          ? error.message
          : "Registration failed. Please try again.";

      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: errorMessage,
      });

      showError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Sign in with Google OAuth
  const signInWithGoogle = async () => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      // Check if OAuth is available
      if (!authService.isOAuthAvailable()) {
        const oauthConfig = authService.getOAuthConfig();
        const errorMessage = oauthConfig.issues.join("; ");

        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: errorMessage,
        });

        showError(errorMessage);
        return { success: false, error: errorMessage };
      }

      console.log("🚀 Starting Google OAuth sign-in...");
      showInfo("Redirecting to Google for authentication...");

      const result = await authService.signInWithGoogle();

      if (result.success) {
        // The auth state listener will handle the success case
        return { success: true };
      } else {
        throw new Error("OAuth sign-in failed");
      }
    } catch (error) {
      console.error("❌ Google OAuth error:", error);

      const errorMessage =
        error instanceof AuthError
          ? error.message
          : "Google sign-in failed. Please try again.";

      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage,
      });

      showError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout
  const logout = async () => {
    try {
      const result = await authService.signOut();

      if (result.success) {
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
        showSuccess("Successfully signed out");
        return { success: true };
      } else {
        throw new Error("Logout failed");
      }
    } catch (error) {
      console.error("❌ Logout error:", error);

      const errorMessage =
        error instanceof AuthError
          ? error.message
          : "Failed to sign out. Please try again.";

      showError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Reset password
  const resetPassword = async email => {
    try {
      const result = await authService.resetPassword(email);

      if (result.success) {
        showSuccess("Password reset email sent successfully");
        return { success: true };
      } else {
        throw new Error("Password reset failed");
      }
    } catch (error) {
      console.error("❌ Password reset error:", error);

      const errorMessage =
        error instanceof AuthError
          ? error.message
          : "Failed to send password reset email. Please try again.";

      showError(errorMessage);
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

  // Get OAuth configuration
  const getOAuthConfig = () => {
    return authService.getOAuthConfig();
  };

  // Check if OAuth is available
  const isOAuthAvailable = () => {
    return authService.isOAuthAvailable();
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
    getOAuthConfig,
    isOAuthAvailable,
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
};
