import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LoginForm from "../../../components/auth/LoginForm";
import * as AuthContext from "../../../contexts/AuthContext";

// Mock the auth context
const mockLogin = vi.fn();
const mockClearError = vi.fn();

vi.mock("../../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    AuthContext.useAuth.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
      clearError: mockClearError,
    });
  });

  it("renders login form with all required elements", () => {
    render(<LoginForm onSwitchToRegister={vi.fn()} />);

    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    expect(
      screen.getByText("Sign in to your Aura Finance account")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
  });

  it("shows validation errors for empty fields", async () => {
    render(<LoginForm onSwitchToRegister={vi.fn()} />);

    const submitButton = screen.getByRole("button", { name: "Sign In" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Email is required")).toBeInTheDocument();
      expect(screen.getByText("Password is required")).toBeInTheDocument();
    });
  });

  it("shows validation error for invalid email", async () => {
    render(<LoginForm onSwitchToRegister={vi.fn()} />);

    const emailInput = screen.getByLabelText("Email Address");
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });

    const submitButton = screen.getByRole("button", { name: "Sign In" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Please enter a valid email address")
      ).toBeInTheDocument();
    });
  });

  it("shows validation error for short password", async () => {
    render(<LoginForm onSwitchToRegister={vi.fn()} />);

    const passwordInput = screen.getByLabelText("Password");
    fireEvent.change(passwordInput, { target: { value: "123" } });

    const submitButton = screen.getByRole("button", { name: "Sign In" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Password must be at least 6 characters")
      ).toBeInTheDocument();
    });
  });

  it("calls login function with correct data when form is valid", async () => {
    mockLogin.mockResolvedValue({ success: true });

    render(<LoginForm onSwitchToRegister={vi.fn()} />);

    const emailInput = screen.getByLabelText("Email Address");
    const passwordInput = screen.getByLabelText("Password");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const submitButton = screen.getByRole("button", { name: "Sign In" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("toggles password visibility", () => {
    render(<LoginForm onSwitchToRegister={vi.fn()} />);

    const passwordInput = screen.getByLabelText("Password");
    const toggleButton = screen.getByLabelText("Show password");

    expect(passwordInput).toHaveAttribute("type", "password");

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Hide password")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Hide password"));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("clears field errors when user starts typing", async () => {
    render(<LoginForm onSwitchToRegister={vi.fn()} />);

    const emailInput = screen.getByLabelText("Email Address");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    // Submit empty form to show errors
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText("Email is required")).toBeInTheDocument();
    });

    // Start typing to clear error
    fireEvent.change(emailInput, { target: { value: "test" } });
    await waitFor(() => {
      expect(screen.queryByText("Email is required")).not.toBeInTheDocument();
    });
  });

  it("calls onSwitchToRegister when register link is clicked", () => {
    const mockSwitchToRegister = vi.fn();
    render(<LoginForm onSwitchToRegister={mockSwitchToRegister} />);

    const registerLink = screen.getByText("Create one now");
    fireEvent.click(registerLink);

    expect(mockSwitchToRegister).toHaveBeenCalled();
  });

  it("shows loading state when isLoading is true", () => {
    AuthContext.useAuth.mockReturnValue({
      login: mockLogin,
      isLoading: true,
      error: null,
      clearError: mockClearError,
    });

    render(<LoginForm onSwitchToRegister={vi.fn()} />);

    expect(screen.getByText("Signing In...")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Signing In..." })
    ).toBeDisabled();
  });

  it("displays error message when auth error exists", () => {
    AuthContext.useAuth.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: "Invalid credentials",
      clearError: mockClearError,
    });

    render(<LoginForm onSwitchToRegister={vi.fn()} />);

    expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
  });

  it("clears auth error when user starts typing", async () => {
    AuthContext.useAuth.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: "Invalid credentials",
      clearError: mockClearError,
    });

    render(<LoginForm onSwitchToRegister={vi.fn()} />);

    const emailInput = screen.getByLabelText("Email Address");
    fireEvent.change(emailInput, { target: { value: "test" } });

    expect(mockClearError).toHaveBeenCalled();
  });
});
