import React, { createContext, useContext, useEffect, useReducer } from "react";
import { supabase } from "../lib/supabase";

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
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          dispatch({
            type: AUTH_ACTIONS.LOGIN_FAILURE,
            payload: error.message,
          });
          return;
        }

        if (session?.user) {
          dispatch({
            type: AUTH_ACTIONS.AUTH_STATE_CHANGED,
            payload: { user: session.user, session: session },
          });
        } else {
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } catch (error) {
        dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: error.message });
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        dispatch({
          type: AUTH_ACTIONS.AUTH_STATE_CHANGED,
          payload: { user: session.user, session: session },
        });
      } else if (event === "SIGNED_OUT") {
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Login with email/password
  const login = async credentials => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: error.message,
        });
        return { success: false, error: error.message };
      }

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: data.user,
          session: data.session,
        },
      });

      return { success: true };
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: error.message || "Login failed",
      });
      return { success: false, error: error.message };
    }
  };

  // Register with email/password
  const register = async userData => {
    try {
      dispatch({ type: AUTH_ACTIONS.REGISTER_START });

      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            full_name: userData.name,
          },
        },
      });

      if (error) {
        dispatch({
          type: AUTH_ACTIONS.REGISTER_FAILURE,
          payload: error.message,
        });
        return { success: false, error: error.message };
      }

      dispatch({
        type: AUTH_ACTIONS.REGISTER_SUCCESS,
        payload: {
          user: data.user,
          session: data.session,
        },
      });

      return { success: true };
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: error.message || "Registration failed",
      });
      return { success: false, error: error.message };
    }
  };

  // OAuth login
  const loginWithOAuth = async provider => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      // Dynamically determine the correct redirect URL based on current domain
      const currentOrigin = window.location.origin;
      const redirectTo = `${currentOrigin}/auth/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: redirectTo,
        },
      });

      if (error) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: error.message,
        });
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
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
      // First try to sign out with global scope
      const { error } = await supabase.auth.signOut({ scope: 'global' });

      if (error) {
        // If global scope fails, try local scope
        if (error.message.includes('403') || error.message.includes('Forbidden')) {
          console.warn('Global signout failed, trying local scope:', error.message);
          const { error: localError } = await supabase.auth.signOut({ scope: 'local' });
          
          if (localError) {
            console.error('Local signout also failed:', localError.message);
            return { success: false, error: localError.message };
          }
        } else {
          return { success: false, error: error.message };
        }
      }

      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, we should still clear the local state
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
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
