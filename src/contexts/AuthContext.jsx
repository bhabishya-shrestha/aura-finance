import React, { createContext, useContext, useReducer, useEffect } from "react";
import { localAuthService, tokenManager } from "../services/localAuth";

// Action types
const AUTH_ACTIONS = {
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
};

// Initial state
const initialState = {
  user: null,
  token: tokenManager.getToken(),
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false,
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
    case AUTH_ACTIONS.LOAD_USER_START:
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
        token: action.payload.token,
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
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        isInitialized: true,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
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

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (state.token && !state.isInitialized) {
        try {
          dispatch({ type: AUTH_ACTIONS.LOAD_USER_START });
          const response = await localAuthService.getCurrentUser(state.token);

          if (response.success) {
            dispatch({
              type: AUTH_ACTIONS.LOAD_USER_SUCCESS,
              payload: { user: response.data.user },
            });
          } else {
            // Token is invalid, clear it
            tokenManager.removeToken();
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
          }
        } catch (error) {
          console.error("Failed to load user:", error);
          tokenManager.removeToken();
          dispatch({
            type: AUTH_ACTIONS.LOAD_USER_FAILURE,
            payload: error.message,
          });
        }
      } else if (!state.token) {
        dispatch({ type: AUTH_ACTIONS.LOAD_USER_FAILURE, payload: null });
      }
    };

    loadUser();
  }, [state.token, state.isInitialized]);

  // Login function
  const login = async (credentials) => {
    try {
      console.log("🔐 Attempting login with:", credentials.email);
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      const response = await localAuthService.login(credentials);

      console.log("🔐 Login response:", response);

      if (response.success) {
        tokenManager.setToken(response.data.token);
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: response.data.user,
            token: response.data.token,
          },
        });
        console.log("✅ Login successful");
        return { success: true };
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: response.error || "Login failed",
        });
        console.log("❌ Login failed:", response.error);
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error("💥 Login error:", error);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: error.message || "Login failed",
      });
      return { success: false, error: error.message };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      console.log("📝 Attempting registration with:", userData.email);
      dispatch({ type: AUTH_ACTIONS.REGISTER_START });
      const response = await localAuthService.register(userData);

      console.log("📝 Registration response:", response);

      if (response.success) {
        tokenManager.setToken(response.data.token);
        dispatch({
          type: AUTH_ACTIONS.REGISTER_SUCCESS,
          payload: {
            user: response.data.user,
            token: response.data.token,
          },
        });
        console.log("✅ Registration successful");
        return { success: true };
      } else {
        dispatch({
          type: AUTH_ACTIONS.REGISTER_FAILURE,
          payload: response.error || "Registration failed",
        });
        console.log("❌ Registration failed:", response.error);
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error("💥 Registration error:", error);
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: error.message || "Registration failed",
      });
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = async () => {
    await localAuthService.logout(state.token);
    tokenManager.removeToken();
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Context value
  const value = {
    ...state,
    login,
    register,
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
