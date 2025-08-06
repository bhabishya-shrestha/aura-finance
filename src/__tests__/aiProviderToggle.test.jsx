import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import SettingsPage from "../pages/SettingsPage";
import { SettingsProvider } from "../contexts/SettingsContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { AuthProvider } from "../contexts/AuthContext";
import aiService from "../services/aiService";

// Mock the AI service
vi.mock("../services/aiService", () => ({
  default: {
    setProvider: vi.fn(),
    getCurrentProvider: vi.fn(),
    getProviderComparison: vi.fn(),
    isApproachingLimits: vi.fn(),
  },
}));

// Mock environment variables
vi.mock("import.meta.env", () => ({
  env: {
    VITE_GEMINI_API_KEY: "test_gemini_key",
    VITE_HUGGINGFACE_API_KEY: "test_huggingface_key",
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const renderWithProviders = component => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <SettingsProvider>{component}</SettingsProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe("AI Provider Toggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock AI service responses
    aiService.getCurrentProvider.mockReturnValue({
      name: "Google Gemini API",
      quotas: { maxDailyRequests: 150, maxRequests: 15 },
      features: ["Document Analysis", "Transaction Extraction"],
      pricing: "Free Tier",
    });

    aiService.getProviderComparison.mockReturnValue([
      {
        key: "gemini",
        name: "Google Gemini API",
        quotas: { maxDailyRequests: 150, maxRequests: 15 },
        features: ["Document Analysis", "Transaction Extraction"],
        pricing: "Free Tier",
        available: true,
      },
      {
        key: "huggingface",
        name: "Hugging Face Inference API",
        quotas: { maxDailyRequests: 500, maxRequests: 5 },
        features: [
          "Document Analysis",
          "Transaction Extraction",
          "500 Daily Requests",
        ],
        pricing: "Free Tier",
        available: true,
      },
    ]);

    aiService.isApproachingLimits.mockReturnValue({
      daily: false,
      minute: false,
      dailyUsage: 50,
      minuteUsage: 5,
      dailyLimit: 150,
      minuteLimit: 15,
    });
  });

  describe("AI Services Section Rendering", () => {
    it("should render AI Services section", async () => {
      renderWithProviders(<SettingsPage />);

      // Navigate to AI Services tab - find the button element
      const aiServicesButton = screen.getByRole("button", {
        name: /AI Services/i,
      });
      fireEvent.click(aiServicesButton);

      await waitFor(() => {
        expect(screen.getByText("AI Services")).toBeInTheDocument();
        expect(
          screen.getByText("Choose your AI provider for document analysis")
        ).toBeInTheDocument();
      });
    });

    it("should display AI Provider toggle", async () => {
      renderWithProviders(<SettingsPage />);

      const aiServicesButton = screen.getByRole("button", {
        name: /AI Services/i,
      });
      fireEvent.click(aiServicesButton);

      await waitFor(() => {
        expect(
          screen.getByText("Use Hugging Face (500 Daily Requests)")
        ).toBeInTheDocument();
        expect(
          screen.getByText(
            "Switch between Gemini API (150/day) and Hugging Face (500/day)"
          )
        ).toBeInTheDocument();
      });
    });

    it("should show current provider information", async () => {
      renderWithProviders(<SettingsPage />);

      const aiServicesButton = screen.getByRole("button", {
        name: /AI Services/i,
      });
      fireEvent.click(aiServicesButton);

      await waitFor(() => {
        expect(
          screen.getByText("Current Provider: Gemini API")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Daily Limit: 150 requests")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Toggle Functionality", () => {
    it("should toggle from Gemini to Hugging Face", async () => {
      renderWithProviders(<SettingsPage />);

      const aiServicesButton = screen.getByRole("button", {
        name: /AI Services/i,
      });
      fireEvent.click(aiServicesButton);

      await waitFor(() => {
        const toggle = screen.getByRole("checkbox");
        expect(toggle).not.toBeChecked(); // Default is Gemini (off)

        // Toggle to Hugging Face
        fireEvent.click(toggle);

        expect(toggle).toBeChecked();
        expect(aiService.setProvider).toHaveBeenCalledWith("huggingface");
      });
    });

    it("should toggle from Hugging Face to Gemini", async () => {
      // Mock initial state as Hugging Face
      aiService.getCurrentProvider.mockReturnValue({
        name: "Hugging Face Inference API",
        quotas: { maxDailyRequests: 500, maxRequests: 5 },
        features: ["Document Analysis", "Transaction Extraction"],
        pricing: "Free Tier",
      });

      renderWithProviders(<SettingsPage />);

      const aiServicesButtons = screen.getAllByRole("button", {
        name: /AI Services/i,
      });
      const aiServicesButton = aiServicesButtons[0];
      fireEvent.click(aiServicesButton);

      await waitFor(() => {
        const toggle = screen.getByRole("checkbox");
        expect(toggle).toBeChecked(); // Hugging Face is on

        // Toggle to Gemini
        fireEvent.click(toggle);

        expect(toggle).not.toBeChecked();
        expect(aiService.setProvider).toHaveBeenCalledWith("gemini");
      });
    });

    it("should update provider display when toggled", async () => {
      renderWithProviders(<SettingsPage />);

      const aiServicesButtons = screen.getAllByRole("button", {
        name: /AI Services/i,
      });
      const aiServicesButton = aiServicesButtons[0];
      fireEvent.click(aiServicesButton);

      await waitFor(() => {
        // Initially shows Gemini
        expect(
          screen.getByText("Current Provider: Gemini API")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Daily Limit: 150 requests")
        ).toBeInTheDocument();

        // Toggle to Hugging Face
        const toggle = screen.getByRole("checkbox");
        fireEvent.click(toggle);

        // Mock the updated provider info
        aiService.getCurrentProvider.mockReturnValue({
          name: "Hugging Face Inference API",
          quotas: { maxDailyRequests: 500, maxRequests: 5 },
          features: ["Document Analysis", "Transaction Extraction"],
          pricing: "Free Tier",
        });

        // Re-render to show updated info
        fireEvent.click(aiServicesButton);

        expect(
          screen.getByText("Current Provider: Hugging Face Inference API")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Daily Limit: 500 requests")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Provider Information Display", () => {
    it("should display correct Gemini information", async () => {
      renderWithProviders(<SettingsPage />);

      const aiServicesButtons = screen.getAllByRole("button", {
        name: /AI Services/i,
      });
      const aiServicesButton = aiServicesButtons[0];
      fireEvent.click(aiServicesButton);

      await waitFor(() => {
        expect(
          screen.getByText("Use Hugging Face (500 Daily Requests)")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Switch between Gemini API and Hugging Face")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Current Provider: Gemini API")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Daily Limit: 150 requests")
        ).toBeInTheDocument();
      });
    });

    it("should display correct Hugging Face information when selected", async () => {
      // Mock Hugging Face as current provider
      aiService.getCurrentProvider.mockReturnValue({
        name: "Hugging Face Inference API",
        quotas: { maxDailyRequests: 500, maxRequests: 5 },
        features: ["Document Analysis", "Transaction Extraction"],
        pricing: "Free Tier",
      });

      renderWithProviders(<SettingsPage />);

      const aiServicesButtons = screen.getAllByRole("button", {
        name: /AI Services/i,
      });
      const aiServicesButton = aiServicesButtons[0];
      fireEvent.click(aiServicesButton);

      await waitFor(() => {
        expect(
          screen.getByText("Current Provider: Hugging Face Inference API")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Daily Limit: 500 requests")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Settings Persistence", () => {
    it("should persist AI provider setting", async () => {
      const { rerender } = renderWithProviders(<SettingsPage />);

      const aiServicesButtons = screen.getAllByRole("button", {
        name: /AI Services/i,
      });
      const aiServicesButton = aiServicesButtons[0];
      fireEvent.click(aiServicesButton);

      await waitFor(() => {
        const toggle = screen.getByRole("checkbox");
        fireEvent.click(toggle); // Switch to Hugging Face
      });

      // Re-render the component
      rerender(
        <BrowserRouter>
          <AuthProvider>
            <ThemeProvider>
              <SettingsProvider>
                <SettingsPage />
              </SettingsProvider>
            </ThemeProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      // Navigate back to AI Services
      const aiServicesButtonsAgain = screen.getAllByRole("button", {
        name: /AI Services/i,
      });
      const aiServicesButtonAgain = aiServicesButtonsAgain[0];

      fireEvent.click(aiServicesButtonAgain);

      await waitFor(() => {
        const toggle = screen.getByRole("checkbox");
        expect(toggle).toBeChecked(); // Should still be Hugging Face
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle AI service errors gracefully", async () => {
      // Mock AI service to throw error
      aiService.setProvider.mockImplementation(() => {
        throw new Error("Service unavailable");
      });

      renderWithProviders(<SettingsPage />);

      const aiServicesButtons = screen.getAllByRole("button", {
        name: /AI Services/i,
      });
      const aiServicesButton = aiServicesButtons[0];
      fireEvent.click(aiServicesButton);

      await waitFor(() => {
        const toggle = screen.getByRole("checkbox");
        fireEvent.click(toggle);

        // Should not crash the component
        expect(screen.getByText("AI Services")).toBeInTheDocument();
      });
    });

    it("should handle missing provider information", async () => {
      // Mock missing provider info
      aiService.getCurrentProvider.mockReturnValue(null);

      renderWithProviders(<SettingsPage />);

      const aiServicesButtons = screen.getAllByRole("button", {
        name: /AI Services/i,
      });
      const aiServicesButton = aiServicesButtons[0];
      fireEvent.click(aiServicesButton);

      await waitFor(() => {
        // Should still render without crashing
        expect(screen.getByText("AI Services")).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", async () => {
      renderWithProviders(<SettingsPage />);

      const aiServicesButtons = screen.getAllByRole("button", {
        name: /AI Services/i,
      });
      const aiServicesButton = aiServicesButtons[0];
      fireEvent.click(aiServicesButton);

      await waitFor(() => {
        const toggle = screen.getByRole("checkbox");
        expect(toggle).toHaveAttribute("type", "checkbox");
        expect(toggle).toHaveClass("sr-only peer");
      });
    });

    it("should be keyboard accessible", async () => {
      renderWithProviders(<SettingsPage />);

      const aiServicesButtons = screen.getAllByRole("button", {
        name: /AI Services/i,
      });
      const aiServicesButton = aiServicesButtons[0];
      fireEvent.click(aiServicesButton);

      await waitFor(() => {
        const toggle = screen.getByRole("checkbox");

        // Focus and use spacebar
        toggle.focus();
        fireEvent.keyDown(toggle, { key: " ", code: "Space" });

        expect(aiService.setProvider).toHaveBeenCalled();
      });
    });
  });

  describe("Mobile Responsiveness", () => {
    it("should render correctly on mobile viewport", async () => {
      // Mock mobile viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithProviders(<SettingsPage />);

      const aiServicesButtons = screen.getAllByRole("button", {
        name: /AI Services/i,
      });
      const aiServicesButton = aiServicesButtons[0];
      fireEvent.click(aiServicesButton);

      await waitFor(() => {
        const aiServicesElements = screen.getAllByText("AI Services");
        expect(aiServicesElements.length).toBeGreaterThan(0);
        expect(
          screen.getByText("Use Hugging Face (500 Daily Requests)")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Integration with AI Service", () => {
    it("should call AI service with correct provider when toggled", async () => {
      renderWithProviders(<SettingsPage />);

      const aiServicesButtons = screen.getAllByRole("button", {
        name: /AI Services/i,
      });
      const aiServicesButton = aiServicesButtons[0];
      fireEvent.click(aiServicesButton);

      await waitFor(() => {
        const toggles = screen.getAllByRole("checkbox");
        const toggle = toggles[0]; // Select the first checkbox
        fireEvent.click(toggle);
      });

      expect(aiService.setProvider).toHaveBeenCalledWith("huggingface");
    });

    it("should reflect AI service state in UI", async () => {
      // Mock initial state as Hugging Face
      aiService.getCurrentProvider.mockReturnValue({
        name: "Hugging Face Inference API",
        quotas: { maxDailyRequests: 500, maxRequests: 5 },
        features: ["Document Analysis", "Transaction Extraction"],
        pricing: "Free Tier",
      });

      renderWithProviders(<SettingsPage />);

      const aiServicesButtons = screen.getAllByRole("button", {
        name: /AI Services/i,
      });
      const aiServicesButton = aiServicesButtons[0];
      fireEvent.click(aiServicesButton);

      await waitFor(() => {
        const toggles = screen.getAllByRole("checkbox");
        const toggle = toggles[0]; // Select the first checkbox
        expect(toggle).toBeChecked(); // Should reflect Hugging Face is active
      });
    });
  });
});
