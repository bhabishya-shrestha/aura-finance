import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import apiUsageService from "../services/apiUsageService";

// Mock Supabase
vi.mock("../lib/supabase.js", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

// Mock the supabase module
const mockSupabase = await import("../lib/supabase.js");

describe("ApiUsageService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with correct provider configurations", () => {
      expect(apiUsageService.providers.gemini).toEqual({
        maxDailyRequests: 150,
        approachingLimitThreshold: 120,
      });
      expect(apiUsageService.providers.huggingface).toEqual({
        maxDailyRequests: 500,
        approachingLimitThreshold: 400,
      });
    });
  });

  describe("validateApiUsage", () => {
    it("should validate API usage successfully", async () => {
      // Mock authenticated user
      mockSupabase.supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      });

      // Mock successful validation
      mockSupabase.supabase.rpc.mockResolvedValue({
        data: {
          can_proceed: true,
          current_usage: 50,
          max_requests: 150,
          remaining_requests: 100,
          provider: "gemini",
          daily_date: "2024-01-15",
        },
        error: null,
      });

      const result = await apiUsageService.validateApiUsage("gemini");

      expect(result.success).toBe(true);
      expect(result.can_proceed).toBe(true);
      expect(result.current_usage).toBe(50);
      expect(result.max_requests).toBe(150);
      expect(result.remaining_requests).toBe(100);
      expect(result.approachingLimit).toBe(false);
    });

    it("should handle limit exceeded", async () => {
      // Mock authenticated user
      mockSupabase.supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      });

      // Mock limit exceeded
      mockSupabase.supabase.rpc.mockResolvedValue({
        data: {
          can_proceed: false,
          current_usage: 150,
          max_requests: 150,
          remaining_requests: 0,
          provider: "gemini",
          daily_date: "2024-01-15",
        },
        error: null,
      });

      const result = await apiUsageService.validateApiUsage("gemini");

      expect(result.success).toBe(true);
      expect(result.can_proceed).toBe(false);
      expect(result.current_usage).toBe(150);
      expect(result.remaining_requests).toBe(0);
    });

    it("should handle unauthenticated user", async () => {
      // Mock unauthenticated user
      mockSupabase.supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const result = await apiUsageService.validateApiUsage("gemini");

      expect(result.success).toBe(false);
      expect(result.error).toBe("User not authenticated");
      expect(result.can_proceed).toBe(false);
    });

    it("should handle invalid provider", async () => {
      // Mock authenticated user
      mockSupabase.supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      });

      const result = await apiUsageService.validateApiUsage("invalid");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid provider: invalid");
      expect(result.can_proceed).toBe(false);
    });

    it("should handle API errors", async () => {
      // Mock authenticated user
      mockSupabase.supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      });

      // Mock API error
      mockSupabase.supabase.rpc.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      const result = await apiUsageService.validateApiUsage("gemini");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to validate API usage");
      expect(result.can_proceed).toBe(false);
    });
  });

  describe("incrementApiUsage", () => {
    it("should increment API usage successfully", async () => {
      // Mock authenticated user
      mockSupabase.supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      });

      // Mock successful increment
      mockSupabase.supabase.rpc.mockResolvedValue({
        data: true,
        error: null,
      });

      const result = await apiUsageService.incrementApiUsage("gemini");

      expect(result).toBe(true);
      expect(mockSupabase.supabase.rpc).toHaveBeenCalledWith(
        "increment_api_usage",
        {
          p_user_id: "test-user-id",
          p_provider: "gemini",
        }
      );
    });

    it("should handle increment failure", async () => {
      // Mock authenticated user
      mockSupabase.supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      });

      // Mock increment failure
      mockSupabase.supabase.rpc.mockResolvedValue({
        data: false,
        error: null,
      });

      const result = await apiUsageService.incrementApiUsage("gemini");

      expect(result).toBe(false);
    });

    it("should handle API errors during increment", async () => {
      // Mock authenticated user
      mockSupabase.supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      });

      // Mock API error
      mockSupabase.supabase.rpc.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      const result = await apiUsageService.incrementApiUsage("gemini");

      expect(result).toBe(false);
    });
  });

  describe("getUserApiUsageStats", () => {
    it("should get user API usage stats successfully", async () => {
      // Mock authenticated user
      mockSupabase.supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      });

      // Mock successful stats retrieval
      mockSupabase.supabase.rpc.mockResolvedValue({
        data: {
          gemini: {
            current_usage: 75,
            max_requests: 150,
            remaining_requests: 75,
            approaching_limit: false,
          },
          huggingface: {
            current_usage: 200,
            max_requests: 500,
            remaining_requests: 300,
            approaching_limit: false,
          },
          daily_date: "2024-01-15",
        },
        error: null,
      });

      const result = await apiUsageService.getUserApiUsageStats();

      expect(result.success).toBe(true);
      expect(result.gemini.current_usage).toBe(75);
      expect(result.gemini.max_requests).toBe(150);
      expect(result.huggingface.current_usage).toBe(200);
      expect(result.huggingface.max_requests).toBe(500);
    });

    it("should handle API errors during stats retrieval", async () => {
      // Mock authenticated user
      mockSupabase.supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      });

      // Mock API error
      mockSupabase.supabase.rpc.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      const result = await apiUsageService.getUserApiUsageStats();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to get usage statistics");
      expect(result.gemini.current_usage).toBe(0);
      expect(result.huggingface.current_usage).toBe(0);
    });
  });

  describe("getDailyApiUsage", () => {
    it("should get daily API usage successfully", async () => {
      // Mock authenticated user
      mockSupabase.supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      });

      // Mock successful usage retrieval
      mockSupabase.supabase.rpc.mockResolvedValue({
        data: 42,
        error: null,
      });

      const result = await apiUsageService.getDailyApiUsage("gemini");

      expect(result).toBe(42);
    });

    it("should return 0 for unauthenticated user", async () => {
      // Mock unauthenticated user
      mockSupabase.supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const result = await apiUsageService.getDailyApiUsage("gemini");

      expect(result).toBe(0);
    });

    it("should return 0 for invalid provider", async () => {
      // Mock authenticated user
      mockSupabase.supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      });

      const result = await apiUsageService.getDailyApiUsage("invalid");

      expect(result).toBe(0);
    });
  });

  describe("isApproachingLimit", () => {
    it("should detect approaching limit", async () => {
      // Mock authenticated user
      mockSupabase.supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      });

      // Mock usage at threshold
      mockSupabase.supabase.rpc.mockResolvedValue({
        data: 120, // At threshold for Gemini
        error: null,
      });

      const result = await apiUsageService.isApproachingLimit("gemini");

      expect(result).toBe(true);
    });

    it("should not detect approaching limit when usage is low", async () => {
      // Mock authenticated user
      mockSupabase.supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      });

      // Mock low usage
      mockSupabase.supabase.rpc.mockResolvedValue({
        data: 50, // Below threshold
        error: null,
      });

      const result = await apiUsageService.isApproachingLimit("gemini");

      expect(result).toBe(false);
    });
  });

  describe("hasExceededLimit", () => {
    it("should detect exceeded limit", async () => {
      // Mock authenticated user
      mockSupabase.supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      });

      // Mock usage at limit
      mockSupabase.supabase.rpc.mockResolvedValue({
        data: 150, // At limit for Gemini
        error: null,
      });

      const result = await apiUsageService.hasExceededLimit("gemini");

      expect(result).toBe(true);
    });

    it("should not detect exceeded limit when usage is below limit", async () => {
      // Mock authenticated user
      mockSupabase.supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      });

      // Mock usage below limit
      mockSupabase.supabase.rpc.mockResolvedValue({
        data: 100, // Below limit
        error: null,
      });

      const result = await apiUsageService.hasExceededLimit("gemini");

      expect(result).toBe(false);
    });
  });

  describe("Provider Configuration", () => {
    it("should get provider configuration", () => {
      const config = apiUsageService.getProviderConfig("gemini");
      expect(config).toEqual({
        maxDailyRequests: 150,
        approachingLimitThreshold: 120,
      });
    });

    it("should return null for invalid provider", () => {
      const config = apiUsageService.getProviderConfig("invalid");
      expect(config).toBeNull();
    });

    it("should get all provider configurations", () => {
      const configs = apiUsageService.getAllProviderConfigs();
      expect(configs).toHaveProperty("gemini");
      expect(configs).toHaveProperty("huggingface");
      expect(configs.gemini.maxDailyRequests).toBe(150);
      expect(configs.huggingface.maxDailyRequests).toBe(500);
    });
  });
});
