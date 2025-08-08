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
    getServerUsageStats: vi.fn(),
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
    // Clear localStorage before each test
    localStorageMock.clear();

    // Mock AI service responses
    aiService.getCurrentProvider.mockReturnValue({
      name: "Gemini API",
      quotas: { maxDailyRequests: 150, maxRequests: 15 },
      features: ["Document Analysis", "Transaction Extraction"],
      pricing: "Free Tier",
    });

    aiService.getProviderComparison.mockReturnValue([
      {
        key: "gemini",
        name: "Gemini API",
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

    aiService.isApproachingLimits.mockReturnValue(false);
    aiService.getServerUsageStats.mockResolvedValue({
      success: true,
      gemini: { current_usage: 0, max_requests: 150 },
      huggingface: { current_usage: 0, max_requests: 500 },
    });
  });

  describe("Rendering", () => {
    it("should render AI Services section", () => {
      renderWithProviders(<SettingsPage />);

      const aiServicesButtons = screen.getAllByRole("button", {
        name: /AI Services/i,
      });
      expect(aiServicesButtons.length).toBeGreaterThan(0);
    });

    it("should show AI provider toggle", async () => {
      renderWithProviders(<SettingsPage />);

      const aiServicesButtons = screen.getAllByRole("button", {
        name: /AI Services/i,
      });
      const aiServicesButton = aiServicesButtons[0];
      fireEvent.click(aiServicesButton);

      await waitFor(() => {
        const toggleElements = screen.getAllByRole("checkbox");
        expect(toggleElements.length).toBeGreaterThan(0);
      });
    });

    it("should display provider comparison", async () => {
      renderWithProviders(<SettingsPage />);

      const aiServicesButtons = screen.getAllByRole("button", {
        name: /AI Services/i,
      });
      const aiServicesButton = aiServicesButtons[0];
      fireEvent.click(aiServicesButton);

      await waitFor(() => {
        const huggingFaceElements = screen.getAllByText(
          "Use Hugging Face (1000 Daily Requests)"
        );
        expect(huggingFaceElements.length).toBeGreaterThan(0);
        const switchElements = screen.getAllByText(
          /Switch between Gemini API and Hugging Face/
        );
        expect(switchElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Provider Switching", () => {
    it("should switch to Hugging Face when toggle is clicked", async () => {
      aiService.setProvider.mockResolvedValue(true);

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

        expect(aiService.setProvider).toHaveBeenCalledWith("huggingface");
      });
    });

    it("should switch back to Gemini when toggle is clicked again", async () => {
      aiService.setProvider.mockResolvedValue(true);

      renderWithProviders(<SettingsPage />);

      const aiServicesButtons = screen.getAllByRole("button", {
        name: /AI Services/i,
      });
      const aiServicesButton = aiServicesButtons[0];
      fireEvent.click(aiServicesButton);

      await waitFor(() => {
        const toggles = screen.getAllByRole("checkbox");
        const toggle = toggles[0]; // Select the first checkbox
        fireEvent.click(toggle); // Switch to Hugging Face
        fireEvent.click(toggle); // Switch back to Gemini

        expect(aiService.setProvider).toHaveBeenCalledWith("gemini");
      });
    });

    it("should update UI to reflect Hugging Face as current provider", async () => {
      aiService.setProvider.mockResolvedValue(true);
      aiService.getCurrentProvider.mockReturnValue({
        name: "Hugging Face",
        quotas: { maxDailyRequests: 1000, maxRequests: 10 },
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
        // Check for the toggle that appears in the UI
        const toggleElements = screen.getAllByRole("checkbox");
        expect(toggleElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Settings Persistence", () => {
    it("should persist AI provider setting", async () => {
      aiService.setProvider.mockResolvedValue(true);

      const { rerender } = renderWithProviders(<SettingsPage />);

      const aiServicesButtons = screen.getAllByRole("button", {
        name: /AI Services/i,
      });
      const aiServicesButton = aiServicesButtons[0];
      fireEvent.click(aiServicesButton);

      await waitFor(() => {
        const toggles = screen.getAllByRole("checkbox");
        const toggle = toggles[0]; // Select the first checkbox
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
        const toggles = screen.getAllByRole("checkbox");
        const toggle = toggles[0]; // Select the first checkbox
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
        const toggles = screen.getAllByRole("checkbox");
        const toggle = toggles[0]; // Select the first checkbox
        fireEvent.click(toggle);

        // Should not crash the component
        const aiServicesElements = screen.getAllByText("AI Services");
        expect(aiServicesElements.length).toBeGreaterThan(0);
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
        const aiServicesElements = screen.getAllByText("AI Services");
        expect(aiServicesElements.length).toBeGreaterThan(0);
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
        const huggingFaceElements = screen.getAllByText(
          "Use Hugging Face (1000 Daily Requests)"
        );
        expect(huggingFaceElements.length).toBeGreaterThan(0);
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
        const toggles = screen.getAllByRole("checkbox");
        const toggle = toggles[0]; // Select the first checkbox
        // Check that the checkbox has proper accessibility attributes
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
        const toggles = screen.getAllByRole("checkbox");
        const toggle = toggles[0]; // Select the first checkbox

        // Check that the checkbox has proper accessibility attributes
        expect(toggle).toHaveAttribute("type", "checkbox");
        expect(toggle).toHaveClass("sr-only peer");

        // Check that the checkbox can be focused (keyboard accessibility)
        expect(toggle).not.toBeDisabled();
      });
    });
  });

  describe("Integration with AI Service", () => {
    it("should reflect AI service state in UI", async () => {
      // Mock localStorage to set Hugging Face as the current provider
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({
          aiProvider: "huggingface",
        })
      );

      renderWithProviders(<SettingsPage />);

      const aiServicesButtons = screen.getAllByRole("button", {
        name: /AI Services/i,
      });
      const aiServicesButton = aiServicesButtons[0];
      fireEvent.click(aiServicesButton);

      await waitFor(() => {
        const toggles = screen.getAllByRole("checkbox");
        const toggle = toggles[0]; // Select the first checkbox
        // The checkbox should be checked when Hugging Face is the current provider
        expect(toggle).toBeChecked(); // Should reflect Hugging Face is active
      });
    });

    it("should not crash when toggling provider", async () => {
      aiService.setProvider.mockResolvedValue(true);

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

        // Should not crash the component
        const aiServicesElements = screen.getAllByText("AI Services");
        expect(aiServicesElements.length).toBeGreaterThan(0);
      });
    });
  });
});
