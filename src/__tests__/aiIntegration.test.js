import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import aiService from '../services/aiService';

// Mock environment variables
vi.mock('import.meta.env', () => ({
  env: {
    VITE_GEMINI_API_KEY: 'test_gemini_key',
    VITE_HUGGINGFACE_API_KEY: 'test_huggingface_key'
  }
}));

// Mock the individual services
vi.mock('../services/geminiService', () => ({
  default: {
    analyzeImage: vi.fn(),
    extractFromText: vi.fn(),
    convertToTransactions: vi.fn(),
    getProcessingSummary: vi.fn(),
    analyzeTransactions: vi.fn(),
    validateFile: vi.fn(),
    dailyRequestCount: 0,
    requestCount: 0
  }
}));

vi.mock('../services/huggingFaceService', () => ({
  default: {
    analyzeImage: vi.fn(),
    extractFromText: vi.fn(),
    convertToTransactions: vi.fn(),
    getProcessingSummary: vi.fn(),
    analyzeTransactions: vi.fn(),
    validateFile: vi.fn(),
    dailyRequestCount: 0,
    requestCount: 0
  }
}));

describe('AI Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default provider
    aiService.setProvider('gemini');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Provider Switching', () => {
    it('should switch between Gemini and Hugging Face providers', () => {
      expect(aiService.currentProvider).toBe('gemini');
      
      aiService.setProvider('huggingface');
      expect(aiService.currentProvider).toBe('huggingface');
      
      aiService.setProvider('gemini');
      expect(aiService.currentProvider).toBe('gemini');
    });

    it('should provide correct provider information', () => {
      aiService.setProvider('gemini');
      let info = aiService.getCurrentProvider();
      expect(info.name).toBe('Google Gemini API');
      expect(info.quotas.maxDailyRequests).toBe(150);
      
      aiService.setProvider('huggingface');
      info = aiService.getCurrentProvider();
      expect(info.name).toBe('Hugging Face Inference API');
      expect(info.quotas.maxDailyRequests).toBe(500);
    });
  });

  describe('Document Analysis Workflow', () => {
    it('should analyze document using current provider', async () => {
      const mockFile = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' });
      const mockResponse = { 
        success: true, 
        text: 'Coffee Shop - $5.50\nRestaurant - $25.00',
        provider: 'gemini'
      };
      
      const geminiService = await import('../services/geminiService');
      geminiService.default.analyzeImage.mockResolvedValue(mockResponse);
      
      aiService.setProvider('gemini');
      const result = await aiService.analyzeImage(mockFile);
      
      expect(geminiService.default.analyzeImage).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual(mockResponse);
    });

    it('should extract transactions from analyzed text', async () => {
      const mockText = 'Coffee Shop - $5.50\nRestaurant - $25.00';
      const mockTransactions = [
        { date: '2024-01-15', description: 'Coffee Shop', amount: 5.50, type: 'expense', category: 'Food' }
      ];
      
      const geminiService = await import('../services/geminiService');
      geminiService.default.extractFromText.mockResolvedValue({ transactions: mockTransactions });
      
      aiService.setProvider('gemini');
      const result = await aiService.extractFromText(mockText);
      
      expect(geminiService.default.extractFromText).toHaveBeenCalledWith(mockText);
      expect(result.transactions).toEqual(mockTransactions);
    });
  });

  describe('Fallback Mechanism', () => {
    it('should fallback from Gemini to Hugging Face on error', async () => {
      const mockFile = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' });
      const mockResponse = { success: true, text: 'fallback response', provider: 'huggingface' };
      
      const geminiService = await import('../services/geminiService');
      const huggingFaceService = await import('../services/huggingFaceService');
      
      geminiService.default.analyzeImage.mockRejectedValue(new Error('Gemini quota exceeded'));
      huggingFaceService.default.analyzeImage.mockResolvedValue(mockResponse);
      
      aiService.setProvider('gemini');
      const result = await aiService.analyzeImage(mockFile);
      
      expect(geminiService.default.analyzeImage).toHaveBeenCalledWith(mockFile);
      expect(huggingFaceService.default.analyzeImage).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual(mockResponse);
      expect(aiService.currentProvider).toBe('huggingface');
    });

    it('should fallback from Hugging Face to Gemini on error', async () => {
      const mockFile = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' });
      const mockResponse = { success: true, text: 'fallback response', provider: 'gemini' };
      
      const geminiService = await import('../services/geminiService');
      const huggingFaceService = await import('../services/huggingFaceService');
      
      huggingFaceService.default.analyzeImage.mockRejectedValue(new Error('Hugging Face error'));
      geminiService.default.analyzeImage.mockResolvedValue(mockResponse);
      
      aiService.setProvider('huggingface');
      const result = await aiService.analyzeImage(mockFile);
      
      expect(huggingFaceService.default.analyzeImage).toHaveBeenCalledWith(mockFile);
      expect(geminiService.default.analyzeImage).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual(mockResponse);
      expect(aiService.currentProvider).toBe('gemini');
    });
  });

  describe('Rate Limit Monitoring', () => {
    it('should detect approaching limits for Gemini', () => {
      aiService.setProvider('gemini');
      
      const geminiService = require('../services/geminiService');
      geminiService.default.dailyRequestCount = 120; // 80% of 150
      geminiService.default.requestCount = 12; // 80% of 15
      
      const limits = aiService.isApproachingLimits();
      
      expect(limits.daily).toBe(true);
      expect(limits.minute).toBe(true);
      expect(limits.dailyUsage).toBe(120);
      expect(limits.minuteUsage).toBe(12);
    });

    it('should detect approaching limits for Hugging Face', () => {
      aiService.setProvider('huggingface');
      
      const huggingFaceService = require('../services/huggingFaceService');
      huggingFaceService.default.dailyRequestCount = 400; // 80% of 500
      huggingFaceService.default.requestCount = 4; // 80% of 5
      
      const limits = aiService.isApproachingLimits();
      
      expect(limits.daily).toBe(true);
      expect(limits.minute).toBe(true);
      expect(limits.dailyUsage).toBe(400);
      expect(limits.minuteUsage).toBe(4);
    });
  });

  describe('Provider Comparison', () => {
    it('should return accurate provider comparison', () => {
      const comparison = aiService.getProviderComparison();
      
      expect(comparison).toHaveLength(2);
      
      const gemini = comparison.find(p => p.key === 'gemini');
      const huggingface = comparison.find(p => p.key === 'huggingface');
      
      expect(gemini).toBeDefined();
      expect(gemini.name).toBe('Google Gemini API');
      expect(gemini.quotas.maxDailyRequests).toBe(150);
      expect(gemini.available).toBe(true);
      
      expect(huggingface).toBeDefined();
      expect(huggingface.name).toBe('Hugging Face Inference API');
      expect(huggingface.quotas.maxDailyRequests).toBe(500);
      expect(huggingface.available).toBe(true);
    });
  });

  describe('Complete Workflow', () => {
    it('should handle complete document processing with provider switching', async () => {
      const mockFile = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' });
      const mockImageResponse = { success: true, text: 'extracted text', provider: 'huggingface' };
      const mockTransactionResponse = { transactions: [{ id: 1, description: 'Coffee Shop', amount: 5.50 }] };
      
      const geminiService = await import('../services/geminiService');
      const huggingFaceService = await import('../services/huggingFaceService');
      
      // Start with Gemini, but it fails
      geminiService.default.analyzeImage.mockRejectedValue(new Error('Gemini failed'));
      huggingFaceService.default.analyzeImage.mockResolvedValue(mockImageResponse);
      huggingFaceService.default.extractFromText.mockResolvedValue(mockTransactionResponse);
      
      aiService.setProvider('gemini');
      
      // This should trigger fallback to Hugging Face
      const imageResult = await aiService.analyzeImage(mockFile);
      expect(imageResult).toEqual(mockImageResponse);
      expect(aiService.currentProvider).toBe('huggingface');
      
      // Now extract transactions using Hugging Face
      const transactionResult = await aiService.extractFromText('test text');
      expect(transactionResult).toEqual(mockTransactionResponse);
    });
  });

  describe('Error Handling', () => {
    it('should handle provider unavailability gracefully', () => {
      expect(aiService.isProviderAvailable('gemini')).toBe(true);
      expect(aiService.isProviderAvailable('huggingface')).toBe(true);
      expect(aiService.isProviderAvailable('unknown')).toBe(false);
    });

    it('should warn for unknown provider', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      aiService.setProvider('unknown');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'AI Service: Unknown provider unknown, keeping current provider'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Settings Integration', () => {
    it('should provide rate limit information for settings UI', () => {
      aiService.setProvider('gemini');
      let info = aiService.getRateLimitInfo();
      expect(info.provider).toBe('gemini');
      expect(info.providerName).toBe('Google Gemini API');
      
      aiService.setProvider('huggingface');
      info = aiService.getRateLimitInfo();
      expect(info.provider).toBe('huggingface');
      expect(info.providerName).toBe('Hugging Face Inference API');
    });
  });
}); 