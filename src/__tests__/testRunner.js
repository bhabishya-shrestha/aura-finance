// Test Runner Configuration
// This file ensures all tests are run with proper mocking to avoid real API calls

import { beforeAll, afterAll, vi, expect } from "vitest";

// Global test setup to ensure no real API calls are made
beforeAll(() => {
  // Mock fetch globally to prevent any real HTTP requests
  global.fetch = vi.fn();

  // Mock console methods to avoid noise in test output
  global.console = {
    ...console,
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
  };

  // Ensure environment variables are mocked
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    import.meta.env.VITE_GEMINI_API_KEY = "test_gemini_key";
  }
  if (!import.meta.env.VITE_HUGGINGFACE_API_KEY) {
    import.meta.env.VITE_HUGGINGFACE_API_KEY = "test_huggingface_key";
  }
});

afterAll(() => {
  // Clean up any global mocks
  vi.restoreAllMocks();
});

// Export test utilities
export const createMockResponse = (data, ok = true) => ({
  ok,
  json: async () => data,
  statusText: ok ? "OK" : "Error",
});

export const createMockError = message => {
  const error = new Error(message);
  error.name = "MockError";
  return error;
};

// Test data factories
export const createMockTransaction = (overrides = {}) => ({
  date: "2024-01-15",
  description: "Test Transaction",
  amount: 10.0,
  type: "expense",
  category: "Test",
  ...overrides,
});

export const createMockFile = (
  content = "test",
  name = "test.jpg",
  type = "image/jpeg"
) => {
  return new File([content], name, { type });
};

// Mock service instances for testing
export const createMockHuggingFaceService = async () => {
  const service = new (
    await import("../services/huggingFaceService")
  ).default();

  // Mock all async methods
  service.analyzeImage = vi.fn();
  service.extractTransactions = vi.fn();
  service.analyzeTransactions = vi.fn();

  return service;
};

export const createMockGeminiService = async () => {
  const service = new (await import("../services/geminiService")).default();

  // Mock all async methods
  service.analyzeImage = vi.fn();
  service.extractFromText = vi.fn();
  service.analyzeTransactions = vi.fn();

  return service;
};

// Test assertions
export const expectNoRealApiCalls = () => {
  expect(global.fetch).not.toHaveBeenCalled();
};

export const expectMockedApiCall = expectedUrl => {
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining(expectedUrl),
    expect.any(Object)
  );
};
