import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { AuthProvider, useAuth } from "../../contexts/AuthContext";

// Create hoisted mock functions
const mockSignInWithPassword = vi.hoisted(() => vi.fn());
const mockSignUp = vi.hoisted(() => vi.fn());
const mockSignOut = vi.hoisted(() => vi.fn());
const mockGetUser = vi.hoisted(() => vi.fn());
const mockGetSession = vi.hoisted(() => vi.fn());
const mockOnAuthStateChange = vi.hoisted(() =>
  vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  }))
);
const mockSignInWithOAuth = vi.hoisted(() => vi.fn());

// Mock Supabase module
vi.mock("../../lib/supabase", () => ({
  supabase: {
    auth: {
      signIn: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
      getUser: mockGetUser,
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithOAuth: mockSignInWithOAuth,
    },
  },
}));

// Test component to access auth context
const TestComponent = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    loginWithOAuth,
    logout,
  } = useAuth();

  return (
    <div>
      <div data-testid="user">{user ? user.email : "no-user"}</div>
      <div data-testid="authenticated">
        {isAuthenticated ? "true" : "false"}
      </div>
      <div data-testid="loading">{isLoading ? "true" : "false"}</div>
      <div data-testid="error">{error || "no-error"}</div>
      <button
        onClick={() =>
          login({ email: "test@example.com", password: "password" })
        }
      >
        Login
      </button>
      <button
        onClick={() =>
          register({
            email: "test@example.com",
            password: "password",
            name: "Test User",
          })
        }
      >
        Register
      </button>
      <button onClick={() => loginWithOAuth("github")}>GitHub OAuth</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

// Wrapper component with providers
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods to reduce noise in tests
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial State", () => {
    it("should start with correct initial state", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("user")).toHaveTextContent("no-user");
        expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
        expect(screen.getByTestId("error")).toHaveTextContent("no-error");
      });
    });

    it("should initialize with existing session", async () => {
      const mockUser = { id: "123", email: "test@example.com" };
      const mockSession = { user: mockUser };

      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("user")).toHaveTextContent(
          "test@example.com"
        );
        expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
      });
    });
  });

  describe("Email/Password Login", () => {
    it("should handle successful login", async () => {
      const mockUser = { id: "123", email: "test@example.com" };
      const mockSession = { user: mockUser };

      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      mockSignInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      fireEvent.click(screen.getByText("Login"));

      await waitFor(() => {
        expect(mockSignInWithPassword).toHaveBeenCalledWith(
          "test@example.com",
          "password"
        );
      });
    });

    it("should handle login error", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      mockSignInWithPassword.mockResolvedValue({
        data: null,
        error: { message: "Invalid credentials" },
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      fireEvent.click(screen.getByText("Login"));

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(
          "Invalid credentials"
        );
      });
    });
  });

  describe("Registration", () => {
    it("should handle successful registration", async () => {
      const mockUser = { id: "123", email: "test@example.com" };
      const mockSession = { user: mockUser };

      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      mockSignUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      fireEvent.click(screen.getByText("Register"));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          "test@example.com",
          "password",
          {
            name: "Test User",
            email: "test@example.com",
          }
        );
      });
    });

    it("should handle registration error", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      mockSignUp.mockResolvedValue({
        data: null,
        error: { message: "Email already exists" },
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      fireEvent.click(screen.getByText("Register"));

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(
          "Email already exists"
        );
      });
    });
  });

  describe("OAuth Login", () => {
    it("should handle OAuth login initiation", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      mockSignInWithOAuth.mockResolvedValue({
        data: { url: "https://github.com/oauth/authorize" },
        error: null,
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      fireEvent.click(screen.getByText("GitHub OAuth"));

      await waitFor(() => {
        expect(mockSignInWithOAuth).toHaveBeenCalledWith({
          provider: "github",
        });
      });
    });

    it("should handle OAuth login error", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      mockSignInWithOAuth.mockResolvedValue({
        data: null,
        error: { message: "OAuth provider not configured" },
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      fireEvent.click(screen.getByText("GitHub OAuth"));

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(
          "OAuth provider not configured"
        );
      });
    });
  });

  describe("Logout", () => {
    it("should handle successful logout", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      mockSignOut.mockResolvedValue({
        error: null,
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      fireEvent.click(screen.getByText("Logout"));

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });

    it("should handle logout error", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      mockSignOut.mockResolvedValue({
        error: { message: "Logout failed" },
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      fireEvent.click(screen.getByText("Logout"));

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });
  });

  describe("Auth State Changes", () => {
    it("should handle auth state change events", async () => {
      const mockCallback = vi.fn();
      mockOnAuthStateChange.mockImplementation((callback) => {
        mockCallback.mockImplementation(callback);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockOnAuthStateChange).toHaveBeenCalled();
      });

      // Simulate auth state change
      const mockUser = { id: "123", email: "test@example.com" };
      mockCallback("SIGNED_IN", { user: mockUser });

      await waitFor(() => {
        expect(screen.getByTestId("user")).toHaveTextContent(
          "test@example.com"
        );
        expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
      });
    });
  });
});
