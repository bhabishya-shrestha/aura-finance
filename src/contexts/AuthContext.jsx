import React, { createContext, useContext, useReducer, useEffect } from "react";
import { supabase, auth } from "../lib/supabase";

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
  session: null,
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
        session: action.payload.session,
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
        session: action.payload.session,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        isInitialized: true,
      };

    case AUTH_ACTIONS.LOAD_USER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        session: action.payload.session,
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
        session: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        isInitialized: true,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        session: null,
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
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: AUTH_ACTIONS.LOAD_USER_START });

        // Get initial session
        const {
          data: { session },
          error,
        } = await auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          dispatch({
            type: AUTH_ACTIONS.LOAD_USER_FAILURE,
            payload: error.message,
          });
          return;
        }

        if (session?.user) {
          dispatch({
            type: AUTH_ACTIONS.AUTH_STATE_CHANGED,
            payload: {
              user: session.user,
              session: session,
            },
          });
        } else {
          dispatch({
            type: AUTH_ACTIONS.AUTH_STATE_CHANGED,
            payload: {
              user: null,
              session: null,
            },
          });
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        dispatch({
          type: AUTH_ACTIONS.LOAD_USER_FAILURE,
          payload: error.message,
        });
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);

      dispatch({
        type: AUTH_ACTIONS.AUTH_STATE_CHANGED,
        payload: {
          user: session?.user || null,
          session: session || null,
        },
      });
    });

    // Cleanup subscription
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Login with email/password
  const login = async (credentials) => {
    try {
      console.log("🔐 Attempting login with:", credentials.email);
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      const { data, error } = await auth.signIn(
        credentials.email,
        credentials.password
      );

      if (error) {
        console.error("❌ Login failed:", error);
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: error.message,
        });
        return { success: false, error: error.message };
      }

      console.log("✅ Login successful");
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: data.user,
          session: data.session,
        },
      });

      return { success: true };
    } catch (error) {
      console.error("💥 Login error:", error);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: error.message || "Login failed",
      });
      return { success: false, error: error.message };
    }
  };

  // Register with email/password
  const register = async (userData) => {
    try {
      console.log("📝 Attempting registration with:", userData.email);
      dispatch({ type: AUTH_ACTIONS.REGISTER_START });

      const { data, error } = await auth.signUp(
        userData.email,
        userData.password,
        {
          name: userData.name,
          email: userData.email,
        }
      );

      if (error) {
        console.error("❌ Registration failed:", error);
        dispatch({
          type: AUTH_ACTIONS.REGISTER_FAILURE,
          payload: error.message,
        });
        return { success: false, error: error.message };
      }

      console.log("✅ Registration successful");
      dispatch({
        type: AUTH_ACTIONS.REGISTER_SUCCESS,
        payload: {
          user: data.user,
          session: data.session,
        },
      });

      return { success: true };
    } catch (error) {
      console.error("💥 Registration error:", error);
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: error.message || "Registration failed",
      });
      return { success: false, error: error.message };
    }
  };

  // OAuth login
  const loginWithOAuth = async (provider) => {
    try {
      console.log(`🔐 Attempting OAuth login with: ${provider}`);
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      // Let Supabase handle the redirect automatically
      // The OAuth providers are already configured with the correct Supabase callback URL
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
      });

      if (error) {
        console.error("❌ OAuth login failed:", error);
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: error.message,
        });
        return { success: false, error: error.message };
      }

      console.log("✅ OAuth login initiated");
      return { success: true, data };
    } catch (error) {
      console.error("💥 OAuth login error:", error);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: error.message || "OAuth login failed",
      });
      return { success: false, error: error.message };
    }
  };

  // Logout
  const logout = async () => {
    try {
      console.log("🚪 Logging out...");
      const { error } = await auth.signOut();

      if (error) {
        console.error("❌ Logout failed:", error);
        return { success: false, error: error.message };
      }

      console.log("✅ Logout successful");
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      return { success: true };
    } catch (error) {
      console.error("💥 Logout error:", error);
      return { success: false, error: error.message };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Context value
  const value = {
    ...state,
    login,
    register,
    loginWithOAuth,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Export action types for testing
export { AUTH_ACTIONS };
