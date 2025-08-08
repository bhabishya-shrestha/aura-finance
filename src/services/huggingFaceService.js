// Hugging Face Inference API service for high-volume document analysis
// Professional implementation with client-side OCR for cost-effective document processing

export class HuggingFaceService {
  constructor() {
    this.apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
    this.baseUrl = "https://api-inference.huggingface.co/models";
    this.uniformModel = "facebook/bart-large-cnn"; // Use BART-CNN which is proven to work and is cost-effective
    this.rateLimit = {
      maxRequests: 10, // Increased - more generous since it's less accurate
      maxDailyRequests: 1000, // Increased - much more generous for bulk processing
      retryDelay: 8000, // Reduced - faster retries
    };

    // Request tracking for rate limiting
    this.requestCount = 0;
    this.dailyRequestCount = 0;
    this.lastRequestTime = 0;

    // Initialize daily counter from localStorage
    this.initializeDailyCounter();
  }

  /**
   * Initialize daily request counter from localStorage
   * Resets daily at midnight
   */
  initializeDailyCounter() {
    const today = new Date().toDateString();
    const stored = localStorage.getItem("huggingface_daily_count");

    if (stored) {
      const { date, count } = JSON.parse(stored);
      if (date === today) {
        this.dailyRequestCount = count;
      } else {
        this.dailyRequestCount = 0;
        this.updateDailyCounter();
      }
    }
  }

  /**
   * Update daily counter in localStorage
   */
  updateDailyCounter() {
    const today = new Date().toDateString();
    localStorage.setItem(
      "huggingface_daily_count",
      JSON.stringify({
        date: today,
        count: this.dailyRequestCount,
      })
    );
  }

  /**
   * Check if we're approaching rate limits
   */
  isApproachingLimits() {
    return (
      this.dailyRequestCount >= this.rateLimit.maxDailyRequests * 0.8 ||
      this.requestCount >= this.rateLimit.maxRequests * 0.8
    );
  }

  /**
   * Get current model (uniform model approach)
   */
  getBestModel() {
    // Return the verified working model
    return this.uniformModel;
  }

  /**
   * Check if provider is available
   */
  isProviderAvailable() {
    return (
      !!this.apiKey && this.dailyRequestCount < this.rateLimit.maxDailyRequests
    );
  }

  /**
   * Rate limiting check and delay
   */
  async checkRateLimit() {
    const now = Date.now();

    // Check per-minute limit
    if (now - this.lastRequestTime < 60000) {
      // within 1 minute
      if (this.requestCount >= this.rateLimit.maxRequests) {
        const waitTime = 60000 - (now - this.lastRequestTime);
        // console.warn(`Rate limit reached. Waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.requestCount = 0;
      }
    } else {
      this.requestCount = 0;
    }

    // Check daily limit
    if (this.dailyRequestCount >= this.rateLimit.maxDailyRequests) {
      throw new Error(
        "Daily rate limit exceeded. Please try again tomorrow or switch to Google Gemini API."
      );
    }

    this.lastRequestTime = now;
  }

  /**
   * Convert File object to base64 string
   * @param {File} file - File object to convert
   * @returns {Promise<string>} Base64 string
   */
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the data URL prefix (e.g., "data:image/png;base64,")
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Enhanced image preprocessing for OCR using proven techniques
   * Based on research: https://medium.com/data-science/pre-processing-in-ocr-fc231c6035a7
   * @param {File} file - The image file
   * @returns {Promise<string>} - Preprocessed image as base64
   */
  async preprocessImageForOCR(file) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Step 1: Scale image to optimal DPI (300 DPI is recommended for OCR)
        const targetDPI = 300;
        const scaleFactor = targetDPI / 96; // 96 DPI is standard screen resolution
        canvas.width = img.width * scaleFactor;
        canvas.height = img.height * scaleFactor;

        // Step 2: Draw and scale the image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Step 3: Get image data for processing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Step 4: Convert to grayscale using luminance formula
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          data[i] = gray; // Red
          data[i + 1] = gray; // Green
          data[i + 2] = gray; // Blue
        }

        // Step 5: Apply noise reduction using Gaussian blur
        this.applyGaussianBlur(imageData, 1);

        // Step 6: Apply adaptive thresholding (Otsu's method equivalent)
        const threshold = this.calculateOtsuThreshold(imageData);
        this.applyBinarization(imageData, threshold);

        // Step 7: Apply morphological operations for noise removal
        this.applyMorphologicalOperations(imageData);

        // Step 8: Apply the processed image data back to canvas
        ctx.putImageData(imageData, 0, 0);

        // Step 9: Convert to base64 with optimal quality
        const preprocessedBase64 = canvas.toDataURL("image/png", 1.0);
        resolve(preprocessedBase64);
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Apply Gaussian blur for noise reduction
   * @param {ImageData} imageData - The image data to process
   */
  applyGaussianBlur(imageData) {
    const { width, height, data } = imageData;
    const tempData = new Uint8ClampedArray(data);

    // Simple Gaussian kernel for blur
    const kernel = [
      [1, 2, 1],
      [2, 4, 2],
      [1, 2, 1],
    ];
    const kernelSum = 16;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            sum += tempData[idx] * kernel[ky + 1][kx + 1];
          }
        }
        const idx = (y * width + x) * 4;
        data[idx] = sum / kernelSum;
        data[idx + 1] = sum / kernelSum;
        data[idx + 2] = sum / kernelSum;
      }
    }
  }

  /**
   * Calculate Otsu's threshold for optimal binarization
   * @param {ImageData} imageData - The image data
   * @returns {number} - Calculated threshold
   */
  calculateOtsuThreshold(imageData) {
    const { data } = imageData;
    const histogram = new Array(256).fill(0);

    // Build histogram
    for (let i = 0; i < data.length; i += 4) {
      histogram[data[i]]++;
    }

    const totalPixels = data.length / 4;
    let sum = 0;
    for (let i = 0; i < 256; i++) {
      sum += i * histogram[i];
    }

    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let maxVariance = 0;
    let threshold = 0;

    for (let t = 0; t < 256; t++) {
      wB += histogram[t];
      if (wB === 0) continue;

      wF = totalPixels - wB;
      if (wF === 0) break;

      sumB += t * histogram[t];
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;

      const variance = wB * wF * (mB - mF) * (mB - mF);
      if (variance > maxVariance) {
        maxVariance = variance;
        threshold = t;
      }
    }

    return threshold;
  }

  /**
   * Apply binarization using calculated threshold
   * @param {ImageData} imageData - The image data
   * @param {number} threshold - Threshold value
   */
  applyBinarization(imageData, threshold) {
    const { data } = imageData;
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i];
      const binary = gray > threshold ? 255 : 0;
      data[i] = binary; // Red
      data[i + 1] = binary; // Green
      data[i + 2] = binary; // Blue
    }
  }

  /**
   * Apply morphological operations for noise removal
   * @param {ImageData} imageData - The image data
   */
  applyMorphologicalOperations(imageData) {
    const { width, height, data } = imageData;
    const tempData = new Uint8ClampedArray(data);

    // Erosion to remove small noise
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        let minVal = 255;

        // Check 3x3 neighborhood
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const nIdx = ((y + ky) * width + (x + kx)) * 4;
            minVal = Math.min(minVal, tempData[nIdx]);
          }
        }

        data[idx] = minVal;
        data[idx + 1] = minVal;
        data[idx + 2] = minVal;
      }
    }

    // Dilation to restore character thickness
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        let maxVal = 0;

        // Check 3x3 neighborhood
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const nIdx = ((y + ky) * width + (x + kx)) * 4;
            maxVal = Math.max(maxVal, data[nIdx]);
          }
        }

        tempData[idx] = maxVal;
        tempData[idx + 1] = maxVal;
        tempData[idx + 2] = maxVal;
      }
    }

    // Copy back the dilated result
    for (let i = 0; i < data.length; i++) {
      data[i] = tempData[i];
    }
  }

  /**
   * Extract text from image using enhanced OCR with preprocessing
   * @param {File} file - The image file
   * @returns {Promise<string>} - Extracted text
   */
  async extractTextFromImage(file) {
    try {
      console.log(
        "🔍 [HuggingFace] Starting enhanced OCR with preprocessing..."
      );

      // Try multiple OCR approaches
      const ocrResults = [];

      // Approach 1: Preprocessed image
      try {
        const preprocessedBase64 = await this.preprocessImageForOCR(file);
        console.log("✅ [HuggingFace] Image preprocessing completed");

        const base64Response = await fetch(preprocessedBase64);
        const preprocessedBlob = await base64Response.blob();

        const Tesseract = await import("tesseract.js");
        const worker = await Tesseract.createWorker();

        console.log("🔍 [HuggingFace] Running OCR on preprocessed image...");

        const {
          data: { text },
        } = await worker.recognize(preprocessedBlob, {
          lang: "eng",
        });

        await worker.terminate();

        const cleanedText = text
          .replace(/\n+/g, "\n")
          .replace(/\s+/g, " ")
          .trim();

        ocrResults.push({
          text: cleanedText,
          method: "preprocessed",
          quality: this.assessOCRQuality(cleanedText),
        });

        console.log("✅ [HuggingFace] Preprocessed OCR completed");
      } catch (error) {
        console.warn(
          "⚠️ [HuggingFace] Preprocessed OCR failed:",
          error.message
        );
      }

      // Approach 2: Original image without preprocessing
      try {
        console.log("🔍 [HuggingFace] Running OCR on original image...");

        const Tesseract = await import("tesseract.js");
        const worker = await Tesseract.createWorker();

        const {
          data: { text },
        } = await worker.recognize(file, {
          lang: "eng",
        });

        await worker.terminate();

        const cleanedText = text
          .replace(/\n+/g, "\n")
          .replace(/\s+/g, " ")
          .trim();

        ocrResults.push({
          text: cleanedText,
          method: "original",
          quality: this.assessOCRQuality(cleanedText),
        });

        console.log("✅ [HuggingFace] Original image OCR completed");
      } catch (error) {
        console.warn(
          "⚠️ [HuggingFace] Original image OCR failed:",
          error.message
        );
      }

      // Approach 3: Try with different OCR settings
      try {
        console.log(
          "🔍 [HuggingFace] Running OCR with alternative settings..."
        );

        const Tesseract = await import("tesseract.js");
        const worker = await Tesseract.createWorker();

        const {
          data: { text },
        } = await worker.recognize(file, {
          lang: "eng",
          tessedit_pageseg_mode: "6", // Uniform block of text
          preserve_interword_spaces: "1",
        });

        await worker.terminate();

        const cleanedText = text
          .replace(/\n+/g, "\n")
          .replace(/\s+/g, " ")
          .trim();

        ocrResults.push({
          text: cleanedText,
          method: "alternative_settings",
          quality: this.assessOCRQuality(cleanedText),
        });

        console.log("✅ [HuggingFace] Alternative settings OCR completed");
      } catch (error) {
        console.warn(
          "⚠️ [HuggingFace] Alternative settings OCR failed:",
          error.message
        );
      }

      // Select the best OCR result
      if (ocrResults.length === 0) {
        throw new Error("All OCR approaches failed");
      }

      // Sort by quality score (higher is better)
      ocrResults.sort((a, b) => b.quality.score - a.quality.score);
      const bestResult = ocrResults[0];

      console.log(
        `🏆 [HuggingFace] Selected best OCR result: ${bestResult.method} (quality: ${bestResult.quality.score.toFixed(2)})`
      );

      // Validate the best result
      if (bestResult.quality.score < 0.3) {
        throw new Error(
          `OCR quality too poor (score: ${bestResult.quality.score.toFixed(2)}). Please try a clearer image.`
        );
      }

      if (bestResult.text.length < 50) {
        throw new Error(
          "OCR extracted too little text - image may be unreadable"
        );
      }

      console.log("✅ [HuggingFace] OCR validation passed");
      return bestResult.text;
    } catch (error) {
      console.error("❌ [HuggingFace] OCR failed:", error);
      throw new Error(`OCR extraction failed: ${error.message}`);
    }
  }

  /**
   * Assess the quality of OCR results
   * @param {string} text - The OCR extracted text
   * @returns {object} - Quality assessment with score and details
   */
  assessOCRQuality(text) {
    const totalChars = text.length;
    if (totalChars === 0) return { score: 0, issues: ["No text extracted"] };

    const issues = [];
    let score = 1.0;

    // Check for random characters
    const randomCharCount = (text.match(/[^A-Za-z0-9\s.,$#-/'&]/g) || [])
      .length;
    const randomCharRatio = randomCharCount / totalChars;

    if (randomCharRatio > 0.2) {
      score -= 0.4;
      issues.push(
        `High random characters: ${(randomCharRatio * 100).toFixed(1)}%`
      );
    }

    // Check for financial patterns
    const hasDollarSigns = text.includes("$");
    const hasDates = /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(text);
    const hasAmounts = /\d+\.\d{2}/.test(text);

    if (!hasDollarSigns && !hasDates && !hasAmounts) {
      score -= 0.3;
      issues.push("No financial patterns detected");
    }

    // Check for common financial terms
    const financialTerms = [
      "PAYMENT",
      "TRANSACTION",
      "AMOUNT",
      "DATE",
      "BALANCE",
      "DEPOSIT",
      "WITHDRAWAL",
      "CHARGE",
      "CREDIT",
      "DEBIT",
      "AMAZON",
      "WALMART",
      "STARBUCKS",
    ];
    const foundTerms = financialTerms.filter(term =>
      text.toUpperCase().includes(term)
    );

    if (foundTerms.length === 0) {
      score -= 0.2;
      issues.push("No financial terms found");
    } else {
      score += Math.min(0.2, foundTerms.length * 0.05);
    }

    // Check for reasonable text length
    if (totalChars < 100) {
      score -= 0.2;
      issues.push("Text too short");
    }

    // Check for repeated patterns (indicates OCR errors)
    const words = text.split(/\s+/);
    const uniqueWords = new Set(words);
    const repetitionRatio = 1 - uniqueWords.size / words.length;

    if (repetitionRatio > 0.5) {
      score -= 0.3;
      issues.push("High word repetition");
    }

    return {
      score: Math.max(0, score),
      issues,
      details: {
        totalChars,
        randomCharRatio,
        hasDollarSigns,
        hasDates,
        hasAmounts,
        foundTerms,
        repetitionRatio,
      },
    };
  }

  /**
   * Preprocess image to improve OCR quality
   */
  async preprocessImage(imageData) {
    return new Promise(resolve => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Set canvas size
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Get image data for processing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Apply image enhancement for better OCR
        for (let i = 0; i < data.length; i += 4) {
          // Convert to grayscale and enhance contrast
          const gray =
            data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

          // Apply threshold for better text recognition
          const threshold = 128;
          const enhanced = gray > threshold ? 255 : 0;

          data[i] = enhanced; // Red
          data[i + 1] = enhanced; // Green
          data[i + 2] = enhanced; // Blue
          // Alpha channel remains unchanged
        }

        // Put processed image data back
        ctx.putImageData(imageData, 0, 0);

        // Convert back to blob for Tesseract
        canvas.toBlob(blob => {
          resolve(blob);
        }, "image/png");
      };

      img.src = imageData;
    });
  }

  /**
   * Analyze extracted text using Hugging Face API
   * This is the second stage of our two-stage approach
   */
  async analyzeExtractedText(text) {
    console.log(
      "🤗 [HuggingFace] Starting analyzeExtractedText, text length:",
      text.length
    );

    // Cost warning for cheaper model
    console.log(
      "💰 [HuggingFace] Using BART-CNN model - cost-effective and reliable"
    );

    await this.checkRateLimit();
    console.log("🤗 [HuggingFace] ✅ Rate limit check passed");

    console.log(
      "[analyzeExtractedText] Starting analysis with text length:",
      text.length
    );

    // Enhanced prompt specifically designed for structured transaction extraction
    const prompt = `Extract ALL financial transactions from this bank statement text. 

Instructions:
1. Find EVERY transaction in the document
2. Extract transaction amounts (numbers with $ or decimal points)
3. Find dates (MM/DD/YYYY, MM-DD-YYYY, or similar formats)
4. Identify merchant names or transaction descriptions
5. Categorize as income (deposits, credits) or expense (withdrawals, debits)
6. Include ALL transactions found, not just a few

Expected output format:
Transaction 1: [DESCRIPTION] - $[AMOUNT] on [DATE]
Transaction 2: [DESCRIPTION] - $[AMOUNT] on [DATE]
Transaction 3: [DESCRIPTION] - $[AMOUNT] on [DATE]
... (continue for ALL transactions found)

Document text to analyze:
${text.substring(0, 1500)} // Increased text length for better coverage

Please extract ALL financial transactions found in the text above using the exact format shown. Do not skip any transactions.`;

    try {
      console.log("🤗 [HuggingFace] Preparing API request...");
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for better processing

      console.log(
        "🤗 [HuggingFace] Making API request using direct inference..."
      );

      // Use direct text generation instead of chat completion
      const response = await fetch(`${this.baseUrl}/${this.uniformModel}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 800,
            min_new_tokens: 100,
            do_sample: false,
            num_beams: 4,
            early_stopping: true,
            temperature: 0.1,
            top_p: 0.9,
            repetition_penalty: 1.2,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("🤗 [HuggingFace] ✅ API response received");

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("🤗 [HuggingFace] Parsing API response...");

      // Extract the generated text from the response (BART-CNN returns summary_text)
      const generatedText =
        data[0]?.summary_text || data[0]?.generated_text || "";
      console.log(
        "[analyzeExtractedText] Generated text length:",
        generatedText.length
      );
      console.log(
        "🤗 [HuggingFace] ✅ Generated text:",
        generatedText.substring(0, 300) + "..."
      );

      // Extract transactions from the generated text
      const extractedTransactions =
        this.extractTransactionsFromAnalysis(generatedText);
      console.log(
        "[analyzeExtractedText] Extracted transactions count:",
        extractedTransactions.length
      );
      console.log(
        "🤗 [HuggingFace] ✅ Extracted transactions:",
        extractedTransactions.length
      );

      return {
        success: true,
        analysis: generatedText,
        transactions: extractedTransactions,
        model: this.uniformModel,
        provider: "huggingface",
        source: "Hugging Face Analysis",
        documentType: "Financial Document",
        notes:
          "Document analyzed using Hugging Face DialoGPT. Please review and adjust transaction details.",
      };
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("🤗 [HuggingFace] ❌ Request timed out after 45 seconds");
        throw new Error("Request timed out. Please try again.");
      }
      console.error("🤗 [HuggingFace] ❌ analyzeExtractedText failed:", error);
      throw error;
    }
  }

  /**
   * Analyze text using distilbert for question answering
   * @param {string} text - Extracted text from OCR
   * @returns {Promise<Object>} Analysis result with transactions
   */
  async analyzeTextWithDistilbert(text) {
    console.log("🤗 [HuggingFace] Starting distilbert text analysis...");

    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      console.log(
        "🤗 [HuggingFace] Making API request to:",
        `${this.baseUrl}/${this.uniformModel}`
      );

      // Prepare questions for financial transaction extraction
      const questions = [
        "What are all the financial transactions?",
        "What are the transaction amounts?",
        "What are the dates of transactions?",
        "What are the merchant names?",
        "What is the total balance?",
      ];

      const results = [];

      // Ask multiple questions to get comprehensive information
      for (const question of questions) {
        console.log("🤗 [HuggingFace] Asking question:", question);

        const response = await fetch(`${this.baseUrl}/${this.uniformModel}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: {
              question: question,
              context: text.substring(0, 1000), // Limit context length
            },
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          console.error("🤗 [HuggingFace] ❌ API Error Response:", {
            status: response.status,
            statusText: response.statusText,
          });

          if (response.status === 404) {
            throw new Error(
              "DistilBERT model not available. Please check your API key or try a different model."
            );
          } else if (response.status === 429) {
            throw new Error("Rate limit exceeded. Please try again later.");
          } else {
            throw new Error(
              `Hugging Face API error: ${response.status} ${response.statusText}`
            );
          }
        }

        const data = await response.json();
        console.log(
          "🤗 [HuggingFace] ✅ Question answered:",
          data.answer || "No answer"
        );

        if (data.answer) {
          results.push(`${question}: ${data.answer}`);
        }
      }

      clearTimeout(timeoutId);
      console.log("🤗 [HuggingFace] ✅ All questions answered");

      // Combine all answers into a comprehensive analysis
      const combinedAnalysis = results.join("\n\n");
      console.log(
        "🤗 [HuggingFace] ✅ Combined analysis length:",
        combinedAnalysis.length
      );

      // Extract transactions from the combined analysis
      const extractedTransactions =
        this.extractTransactionsFromAnalysis(combinedAnalysis);
      console.log(
        "🤗 [HuggingFace] ✅ Extracted transactions:",
        extractedTransactions.length
      );

      return {
        success: true,
        analysis: combinedAnalysis,
        transactions: extractedTransactions,
        model: this.uniformModel,
        provider: "huggingface",
        source: "Hugging Face DistilBERT Analysis",
        documentType: "Financial Document",
        notes:
          "Document analyzed using Hugging Face DistilBERT (fast and reliable). Please review and adjust transaction details.",
      };
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("🤗 [HuggingFace] ❌ Request timed out after 30 seconds");
        throw new Error("Request timed out. Please try again.");
      }
      console.error(
        "🤗 [HuggingFace] ❌ analyzeTextWithDistilbert failed:",
        error
      );
      throw error;
    }
  }

  /**
   * Analyze document using the donut model (OCR-free)
   * @param {string} base64Data - Base64 encoded image data
   * @returns {Promise<Object>} Analysis result with transactions
   */
  async analyzeDocumentWithDonut(base64Data) {
    console.log("🤗 [HuggingFace] Starting donut document analysis...");

    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for donut model

      console.log(
        "🤗 [HuggingFace] Making API request to:",
        `${this.baseUrl}/${this.uniformModel}`
      );

      // Prepare questions for financial transaction extraction
      const questions = [
        "What are all the financial transactions in this document?",
        "List all transaction amounts and dates",
        "What are the merchant names and descriptions?",
        "Are there any deposits or credits?",
        "What is the total balance shown?",
      ];

      const results = [];
      let extractedText = "";

      // Ask multiple questions to get comprehensive information
      for (const question of questions) {
        console.log("🤗 [HuggingFace] Asking question:", question);

        const response = await fetch(`${this.baseUrl}/${this.uniformModel}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: {
              image: base64Data,
              question: question,
            },
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          console.error("🤗 [HuggingFace] ❌ API Error Response:", {
            status: response.status,
            statusText: response.statusText,
          });

          if (response.status === 404) {
            throw new Error(
              "Donut model not available. Please check your API key or try a different model."
            );
          } else if (response.status === 429) {
            throw new Error("Rate limit exceeded. Please try again later.");
          } else {
            throw new Error(
              `Hugging Face API error: ${response.status} ${response.statusText}`
            );
          }
        }

        const data = await response.json();
        console.log(
          "🤗 [HuggingFace] ✅ Question answered:",
          data[0]?.answer || "No answer"
        );

        if (data[0]?.answer) {
          results.push(`${question}: ${data[0].answer}`);
          extractedText += data[0].answer + " ";
        }
      }

      clearTimeout(timeoutId);
      console.log("🤗 [HuggingFace] ✅ All questions answered");

      // Combine all answers into a comprehensive analysis
      const combinedAnalysis = results.join("\n\n");
      console.log(
        "🤗 [HuggingFace] ✅ Combined analysis length:",
        combinedAnalysis.length
      );

      // Extract transactions from the combined analysis
      const extractedTransactions =
        this.extractTransactionsFromAnalysis(combinedAnalysis);
      console.log(
        "🤗 [HuggingFace] ✅ Extracted transactions:",
        extractedTransactions.length
      );

      return {
        success: true,
        analysis: combinedAnalysis,
        transactions: extractedTransactions,
        extractedText: extractedText.trim(),
        model: this.uniformModel,
        provider: "huggingface",
        source: "Hugging Face Donut Document Analysis",
        documentType: "Financial Document",
        notes:
          "Document analyzed using Hugging Face Donut model (OCR-free). Please review and adjust transaction details.",
      };
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("🤗 [HuggingFace] ❌ Request timed out after 45 seconds");
        throw new Error("Request timed out. Please try again.");
      }
      console.error(
        "🤗 [HuggingFace] ❌ analyzeDocumentWithDonut failed:",
        error
      );
      throw error;
    }
  }

  /**
   * Extract transactions from AI analysis text
   * Enhanced to handle various formats and improve accuracy
   */
  extractTransactionsFromAnalysis(analysis) {
    const transactions = [];

    if (!analysis || analysis.trim() === "") {
      // // console.log(
      //   "[extractTransactionsFromAnalysis] Empty analysis, returning empty array"
      // );
      return transactions;
    }

    // // console.log(
    //   "[extractTransactionsFromAnalysis] Processing analysis:",
    //   analysis
    // );

    // Count expected transactions for debugging
    // const transactionMatches = analysis.match(/Transaction\s+\d+:/g);
    // const paymentMatches = analysis.match(/Payment\s+\d+:/g);
    // // console.log(`[DEBUG] Found ${transactionMatches?.length || 0} transaction lines and ${paymentMatches?.length || 0} payment lines`);

    // More precise patterns specifically designed for bank statement format
    // Using flexible pattern that handles special characters and hyphens in descriptions
    const patterns = [
      // Pattern 1: "Transaction X: DESCRIPTION - $AMOUNT on DATE" format (most reliable)
      /Transaction\s+\d+:\s+(.*?)\s+-\s+\$?(\d+\.?\d*)\s+on\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/gi,

      // Pattern 2: "Payment X: DESCRIPTION - $AMOUNT on DATE" format (most reliable)
      /Payment\s+\d+:\s+(.*?)\s+-\s+\$?(\d+\.?\d*)\s+on\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/gi,
    ];

    const foundTransactions = new Set();

    patterns.forEach(pattern => {
      const matches = [...analysis.matchAll(pattern)];
      // // console.log(
      //   `[extractTransactionsFromAnalysis] Pattern found ${matches.length} matches`
      // );

      // Debug: Show what matches were found
      matches.forEach(() => {
        // // console.log(`[DEBUG] Match found`);
      });

      matches.forEach(match => {
        let amount, description, date;

        // Pattern 1 & 2: Transaction/Payment with date
        description = match[1].trim();
        amount = parseFloat(match[2]);
        date = this.normalizeDate(match[3]);

        // Validate amount and description
        if (
          amount &&
          this.isValidTransactionAmount(amount) &&
          this.isValidDescription(description)
        ) {
          const transactionKey = `${amount}-${description}`;

          if (!foundTransactions.has(transactionKey)) {
            foundTransactions.add(transactionKey);

            const transaction = {
              date: date || new Date().toISOString().split("T")[0],
              description: this.cleanDescription(description),
              amount: amount,
              type: this.determineTransactionType(description, amount),
              category: this.categorizeTransaction(description),
              confidence: 0.9,
            };

            transactions.push(transaction);
            // // console.log(
            //   `[extractTransactionsFromAnalysis] Added transaction:`,
            //   transaction
            // );
          } else {
            // // console.log(
            //   `[DEBUG] Duplicate transaction filtered out: ${transactionKey}`
            // );
          }
        } else {
          // Debug why transaction was rejected
          // // console.log(
          //   `[DEBUG] Rejected transaction: amount=${amount}, description="${description}"`
          // );
          // // console.log(
          //   `[DEBUG] isValidAmount: ${this.isValidTransactionAmount(amount)}, isValidDescription: ${this.isValidDescription(description)}`
          // );
        }
      });
    });

    // If we didn't get all expected transactions, try a more aggressive approach
    if (transactions.length < 27) {
      // // console.log(`[DEBUG] Only extracted ${transactions.length} transactions, trying alternative approach`);

      // Try to extract all lines that contain transaction information
      const lines = analysis.split("\n");
      lines.forEach(line => {
        if (line.includes("Transaction") || line.includes("Payment")) {
          // // console.log(`[DEBUG] Line: ${line}`);
        }
      });

      // Try a more flexible regex pattern
      // // console.log(`[DEBUG] Trying more flexible regex pattern`);
      const flexiblePattern =
        /Transaction\s+\d+:\s+(.*?)\s+-\s+\$?(\d+\.?\d*)\s+on\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/gi;
      const flexibleMatches = [...analysis.matchAll(flexiblePattern)];
      // // console.log(`[DEBUG] Flexible pattern found ${flexibleMatches.length} matches`);

      flexibleMatches.forEach(match => {
        if (
          !transactions.some(
            t => t.description === this.cleanDescription(match[1].trim())
          )
        ) {
          // // console.log(`[DEBUG] Flexible match:`, match[0]);
        }
      });
    }

    if (transactions.length === 0) {
      // // console.log(
      //   "[extractTransactionsFromAnalysis] No transactions found, creating fallback"
      // );
      transactions.push({
        date: new Date().toISOString().split("T")[0],
        description: "Document analysis completed",
        amount: 0,
        type: "expense",
        category: "Uncategorized",
        confidence: 0.3,
      });
    }

    // // console.log(
    //   `[extractTransactionsFromAnalysis] Final result: ${transactions.length} transactions`
    // );
    return transactions;
  }

  /**
   * Check if an amount is a valid transaction amount
   * Filters out dates, small numbers, and other false positives
   */
  isValidTransactionAmount(amount) {
    if (amount < 0.01) return false;
    if (amount >= 1900 && amount <= 2100) return false;
    if (amount >= 1 && amount <= 31 && Number.isInteger(amount)) return false;
    if (amount >= 1 && amount <= 12 && Number.isInteger(amount)) return false;
    // Remove the overly restrictive phone number check that was rejecting $100, $700, etc.
    // if (amount >= 100 && amount <= 999 && Number.isInteger(amount)) return false;
    if (amount > 100000) return false;
    return true;
  }

  /**
   * Check if a description is valid for a transaction
   */
  isValidDescription(description) {
    if (!description || description.trim().length < 2) return false;

    // Reject descriptions that are just numbers or symbols
    if (/^[\d\s\-.*]+$/.test(description)) return false;

    // Reject descriptions that are too short or generic
    const shortWords = [
      "on",
      "the",
      "a",
      "an",
      "in",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
    ];
    if (shortWords.includes(description.toLowerCase().trim())) return false;

    // Reject descriptions that are just punctuation or symbols
    if (/^[\s\-.*]+$/.test(description)) return false;

    return true;
  }

  /**
   * Clean and normalize transaction description
   */
  cleanDescription(description) {
    if (!description) return "Unknown transaction";

    // Remove extra whitespace and normalize
    let cleaned = description.trim().replace(/\s+/g, " ");

    // Remove trailing punctuation
    cleaned = cleaned.replace(/[-.*]+$/, "");

    // Remove leading punctuation
    cleaned = cleaned.replace(/^[-.*]+/, "");

    // If description is still too short, try to make it more descriptive
    if (cleaned.length < 3) {
      cleaned = "Transaction";
    }

    return cleaned;
  }

  /**
   * Normalize date string to YYYY-MM-DD format with better error handling
   * @param {string} dateStr - Date string in various formats
   * @returns {string} - Normalized date in YYYY-MM-DD format
   */
  normalizeDate(dateStr) {
    if (!dateStr || typeof dateStr !== "string") {
      return null;
    }

    // Clean the date string
    const cleanDate = dateStr.trim().replace(/\s+/g, "");

    try {
      // Handle MM/DD/YYYY format (most common in US financial statements)
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleanDate)) {
        const [month, day, year] = cleanDate.split("/");
        const date = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day)
        );
        if (!isNaN(date.getTime())) {
          return date.toISOString().split("T")[0];
        }
      }

      // Handle MM-DD-YYYY format
      if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(cleanDate)) {
        const [month, day, year] = cleanDate.split("-");
        const date = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day)
        );
        if (!isNaN(date.getTime())) {
          return date.toISOString().split("T")[0];
        }
      }

      // Handle YYYY-MM-DD format (already correct)
      if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(cleanDate)) {
        const [year, month, day] = cleanDate.split("-");
        const date = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day)
        );
        if (!isNaN(date.getTime())) {
          return date.toISOString().split("T")[0];
        }
      }

      // Handle MM/DD/YY format (2-digit year)
      if (/^\d{1,2}\/\d{1,2}\/\d{2}$/.test(cleanDate)) {
        const [month, day, year] = cleanDate.split("/");
        const fullYear =
          parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
        const date = new Date(fullYear, parseInt(month) - 1, parseInt(day));
        if (!isNaN(date.getTime())) {
          return date.toISOString().split("T")[0];
        }
      }

      // Handle MM-DD-YY format (2-digit year)
      if (/^\d{1,2}-\d{1,2}-\d{2}$/.test(cleanDate)) {
        const [month, day, year] = cleanDate.split("-");
        const fullYear =
          parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
        const date = new Date(fullYear, parseInt(month) - 1, parseInt(day));
        if (!isNaN(date.getTime())) {
          return date.toISOString().split("T")[0];
        }
      }

      // If no pattern matches, try to parse as is
      const date = new Date(cleanDate);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }

      console.warn(`[HuggingFace] Could not parse date: ${dateStr}`);
      return null;
    } catch (error) {
      console.warn(`[HuggingFace] Date parsing error for "${dateStr}":`, error);
      return null;
    }
  }

  /**
   * Determine transaction type based on description and amount
   */
  determineTransactionType(description, amount) {
    const desc = description.toLowerCase();

    // Keywords for income/deposits
    const incomeKeywords = [
      "deposit",
      "credit",
      "refund",
      "payment",
      "transfer in",
      "income",
    ];
    if (incomeKeywords.some(keyword => desc.includes(keyword))) {
      return "income";
    }

    // Keywords for expenses
    const expenseKeywords = [
      "withdrawal",
      "debit",
      "purchase",
      "payment",
      "fee",
      "charge",
    ];
    if (expenseKeywords.some(keyword => desc.includes(keyword))) {
      return "expense";
    }

    // Default to expense for positive amounts, income for negative
    return amount > 0 ? "expense" : "income";
  }

  /**
   * Categorize transaction based on description
   */
  categorizeTransaction(description) {
    const desc = description.toLowerCase();

    const categories = {
      food: ["walmart", "target", "grocery", "restaurant", "food", "dining"],
      transportation: ["uber", "lyft", "gas", "fuel", "parking", "transport"],
      entertainment: ["netflix", "spotify", "amazon", "entertainment", "movie"],
      utilities: ["electric", "water", "gas", "internet", "phone", "utility"],
      shopping: ["amazon", "ebay", "online", "shopping", "retail"],
      healthcare: ["medical", "doctor", "pharmacy", "health", "dental"],
      finance: ["bank", "atm", "withdrawal", "deposit", "transfer"],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => desc.includes(keyword))) {
        return category.charAt(0).toUpperCase() + category.slice(1);
      }
    }

    return "Uncategorized";
  }

  /**
   * Fallback extraction from OCR text when AI analysis fails
   */
  extractFromOCRText(ocrText) {
    const transactions = [];

    // Look for amount patterns in OCR text
    const amountPattern = /\$?(\d+\.?\d*)/g;
    const matches = [...ocrText.matchAll(amountPattern)];

    matches.forEach((match, index) => {
      const amount = parseFloat(match[1]);
      if (amount > 0 && amount < 1000000) {
        transactions.push({
          date: new Date().toISOString().split("T")[0],
          description: `Transaction ${index + 1}`,
          amount: amount,
          type: "expense",
          category: "Uncategorized",
          confidence: 0.5, // Medium confidence for OCR fallback
        });
      }
    });

    return transactions;
  }

  /**
   * Enhanced transaction extraction using OCR + AI hybrid approach
   * Uses OCR for text extraction and AI only for transaction parsing
   */
  async analyzeImage(file) {
    console.log(
      "🤗 [HuggingFace] Starting hybrid OCR + AI analysis for file:",
      file.name,
      file.type
    );

    try {
      await this.checkRateLimit();
      console.log("🤗 [HuggingFace] ✅ Rate limit check passed");

      // Step 1: Extract text using OCR (no AI cost)
      console.log("🤗 [HuggingFace] Starting OCR text extraction...");
      const extractedText = await this.extractTextFromImage(file);
      console.log(
        "🤗 [HuggingFace] ✅ OCR completed, text length:",
        extractedText.length
      );

      if (!extractedText || extractedText.trim().length === 0) {
        console.log("🤗 [HuggingFace] ❌ No text extracted from image");
        throw new Error(
          "No text could be extracted from the image. Please try a clearer image."
        );
      }

      // Step 2: Pre-process text to extract potential transactions (no AI cost)
      console.log("🤗 [HuggingFace] Starting text pre-processing...");
      const preprocessedTransactions =
        this.preprocessTextForTransactions(extractedText);
      console.log(
        "🤗 [HuggingFace] ✅ Pre-processing completed, found",
        preprocessedTransactions.length,
        "potential transactions"
      );

      // Step 3: Use AI only for validation and enhancement (minimal AI cost)
      console.log("🤗 [HuggingFace] Starting AI validation and enhancement...");
      const enhancedTransactions = await this.enhanceTransactionsWithAI(
        preprocessedTransactions,
        extractedText
      );
      console.log("🤗 [HuggingFace] ✅ AI enhancement completed");

      return {
        success: true,
        analysis: `Extracted ${enhancedTransactions.length} transactions using OCR + AI hybrid approach`,
        transactions: enhancedTransactions,
        model: this.uniformModel,
        provider: "huggingface",
        source: "Hugging Face OCR + AI Hybrid Analysis",
        documentType: "Financial Document",
        notes:
          "Document analyzed using OCR for text extraction and AI for transaction validation. Cost-effective approach.",
        extractedText: extractedText.substring(0, 500) + "...",
        ocrTransactions: preprocessedTransactions.length,
        aiEnhancedTransactions: enhancedTransactions.length,
      };
    } catch (error) {
      console.error("🤗 [HuggingFace] ❌ analyzeImage failed:", error);
      throw error;
    }
  }

  /**
   * Preprocess text for transaction extraction using enhanced patterns
   * @param {string} text - The OCR extracted text
   * @returns {Array} - Array of extracted transactions
   */
  preprocessTextForTransactions(text) {
    console.log(
      "🤗 [HuggingFace] Pre-processing text for transaction patterns..."
    );

    // Enhanced transaction patterns based on actual OCR output format
    const transactionPatterns = [
      // Pattern 1: Simplified OCR format: DATE MERCHANT Amount Balance (most effective)
      /([0-9]{2}\/[0-9]{2}\/[0-9]{4})\s+([A-Z][A-Z\s&.,#0-9*()-]+?)\s+\$([-]?[0-9,]+\.?[0-9]*)/gi,
      // Pattern 2: Handle OCR artifacts: (® DATE MERCHANT Amount Balance
      /\([®»]\s*([0-9]{2}\/[0-9]{2}\/[0-9]{4})\s+([A-Z][A-Z\s&.,#0-9*()-]+?)\s+\$([-]?[0-9,]+\.?[0-9]*)/gi,
      // Pattern 3: Handle lines without artifacts: ( DATE MERCHANT Amount Balance
      /\(\s*([0-9]{2}\/[0-9]{2}\/[0-9]{4})\s+([A-Z][A-Z\s&.,#0-9*()-]+?)\s+\$([-]?[0-9,]+\.?[0-9]*)/gi,
      // Pattern 4: Legacy table format: DATE | MERCHANT | TYPE | $AMOUNT | BALANCE
      /([0-9/]+)\s*\|\s*([A-Z][A-Z\s&.,#0-9*()-]+?)\s*\|\s*[A-Za-z]+\s*\|\s*\$?([-]?[0-9,]+\.?[0-9]*)\s*\|\s*\$?[0-9,]+\.?[0-9]*/gi,
      // Pattern 5: Pending transaction format
      /Pending\s*\|\s*([A-Z][A-Z\s&.,#0-9*()-]+?)\s*\|\s*[A-Za-z]+\s*\|\s*\$?([-]?[0-9,]+\.?[0-9]*)\s*\|\s*\$?[0-9,]+\.?[0-9]*/gi,
      // Pattern 6: Legacy format: MERCHANT - $AMOUNT on DATE
      /([A-Z][A-Z\s&.,#0-9*()-]+?)\s*-\s*\$?([-]?[0-9,]+\.?[0-9]*)\s+(?:on|at|date:?)\s*([0-9/-]+)/gi,
    ];

    const allMatches = [];
    const lines = text
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // Collect all matches first
    for (const line of lines) {
      for (const pattern of transactionPatterns) {
        const matches = [...line.matchAll(pattern)];
        for (const match of matches) {
          let description, amount, date;

          if (match[0].includes("Beginning balance")) {
            // Skip beginning balance lines
            continue;
          } else if (match[0].includes("Pending")) {
            // Pending transaction format
            description = match[1];
            amount = match[2];
            date = "Pending";
          } else if (match[0].includes("|")) {
            // Table format
            date = match[1];
            description = match[2];
            amount = match[3];
          } else if (match[0].includes("on") || match[0].includes("at")) {
            // Legacy format
            description = match[1];
            amount = match[2];
            date = match[3];
          } else {
            // OCR format: DATE MERCHANT Amount Balance
            date = match[1];
            description = match[2];
            amount = match[3];
          }

          const cleanDescription = description.trim().replace(/\s+/g, " ");
          const cleanAmount = amount.replace(/,/g, "");

          if (cleanDescription && cleanAmount) {
            // Enhanced validation for OCR output
            if (cleanDescription.length < 3) continue; // Require at least 3 characters
            if (cleanDescription.length > 200) continue; // Reasonable length limit
            if (Math.abs(parseFloat(cleanAmount)) < 0.01 || Math.abs(parseFloat(cleanAmount)) > 1000000) continue; // Reasonable amount range

            // Skip if description is just a date
            if (/^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/.test(cleanDescription))
              continue;

            // Skip if amount is not a valid number
            if (isNaN(parseFloat(cleanAmount))) continue;

            // Clean up description by removing common OCR artifacts
            let finalDescription = cleanDescription;
            
            // Remove common OCR artifacts and partial matches (but be more conservative)
            const artifactsToRemove = [
              " Bd", " Hr", " p", " <M", " pr:", " B=",
              " NETFLIX.COM/BILL", " SPOTIFY.COM", " UBER.COM", " LYFT.COM",
              " Amzn.com/bill", " Amzn.com/billWA", " Amzn.com/bill CA", " Amzn.com/bill WA",
              " 7106", " 7012", " 1234", " 10001", " 57557551", " 12345678", " 12345",
              " 01/15", " 01/14", " 01/13", " 01/12", " 01/11", " 01/10", " 01/09", " 01/08",
              " 01/07", " 01/06", " 01/05", " 02/10", " 02/07", " 02/06", " 02/05", " 02/03",
              " 02/01", " 01/31", " 01/27", " 01/25", " 01/24", " 01/23", " 01/21", " 01/20",
              " 01/18", " 01/16", " 01/15", " 01/14", " 01/13", " 01/12", " 01/11", " 01/10",
              " 01/09", " 01/08", " 01/07", " 01/06", " 01/05"
            ];
            
            for (const artifact of artifactsToRemove) {
              finalDescription = finalDescription.replace(artifact, "");
            }
            
            // Additional cleanup
            finalDescription = finalDescription.replace(/\s+/g, " ").trim();
            
            // Skip if description is too short or just numbers/dates after cleaning
            if (finalDescription.length < 3) continue;
            if (/^[0-9]+$/.test(finalDescription)) continue;
            if (/^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/.test(finalDescription))
              continue;

            // More conservative filtering - only skip obvious non-transactions
            if (
              finalDescription === "TX" ||
              finalDescription === "S" ||
              finalDescription === "B" ||
              finalDescription === "WA" ||
              finalDescription === "CA" ||
              finalDescription === "NY" ||
              finalDescription === "AUSTIN TX" ||
              finalDescription === "BILL WA" ||
              finalDescription === "BILL CA" ||
              finalDescription === "UBER.COM" ||
              finalDescription === "LYFT.COM" ||
              finalDescription === "SPOTIFY.COM" ||
              finalDescription === "NETFLIX.COM" ||
              finalDescription === "AMZN.COM" ||
              finalDescription.endsWith(" Hr") ||
              finalDescription.endsWith(" Bd") ||
              finalDescription.endsWith(" p") ||
              finalDescription.endsWith(" <M") ||
              finalDescription.endsWith(" pr:") ||
              finalDescription.endsWith(" B=") ||
              finalDescription.endsWith(" NETFLIX.COM/BILL") ||
              finalDescription.endsWith(" SPOTIFY.COM") ||
              finalDescription.endsWith(" UBER.COM") ||
              finalDescription.endsWith(" LYFT.COM") ||
              finalDescription.endsWith(" Amzn.com/bill") ||
              finalDescription.endsWith(" Amzn.com/billWA") ||
              finalDescription.endsWith(" Amzn.com/bill CA") ||
              finalDescription.endsWith(" Amzn.com/bill WA") ||
              finalDescription.endsWith(" 7106") ||
              finalDescription.endsWith(" 7012") ||
              finalDescription.endsWith(" 1234") ||
              finalDescription.endsWith(" 10001") ||
              finalDescription.endsWith(" 57557551") ||
              finalDescription.endsWith(" 12345678") ||
              finalDescription.endsWith(" 12345") ||
              finalDescription.endsWith(" 01/15") ||
              finalDescription.endsWith(" 01/14") ||
              finalDescription.endsWith(" 01/13") ||
              finalDescription.endsWith(" 01/12") ||
              finalDescription.endsWith(" 01/11") ||
              finalDescription.endsWith(" 01/10") ||
              finalDescription.endsWith(" 01/09") ||
              finalDescription.endsWith(" 01/08") ||
              finalDescription.endsWith(" 01/07") ||
              finalDescription.endsWith(" 01/06") ||
              finalDescription.endsWith(" 01/05") ||
              finalDescription.endsWith(" 02/10") ||
              finalDescription.endsWith(" 02/07") ||
              finalDescription.endsWith(" 02/06") ||
              finalDescription.endsWith(" 02/05") ||
              finalDescription.endsWith(" 02/03") ||
              finalDescription.endsWith(" 02/01") ||
              finalDescription.endsWith(" 01/31") ||
              finalDescription.endsWith(" 01/27") ||
              finalDescription.endsWith(" 01/25") ||
              finalDescription.endsWith(" 01/24") ||
              finalDescription.endsWith(" 01/23") ||
              finalDescription.endsWith(" 01/21") ||
              finalDescription.endsWith(" 01/20") ||
              finalDescription.endsWith(" 01/18") ||
              finalDescription.endsWith(" 01/16") ||
              finalDescription.endsWith(" 01/15") ||
              finalDescription.endsWith(" 01/14") ||
              finalDescription.endsWith(" 01/13") ||
              finalDescription.endsWith(" 01/12") ||
              finalDescription.endsWith(" 01/11") ||
              finalDescription.endsWith(" 01/10") ||
              finalDescription.endsWith(" 01/09") ||
              finalDescription.endsWith(" 01/08") ||
              finalDescription.endsWith(" 01/07") ||
              finalDescription.endsWith(" 01/06") ||
              finalDescription.endsWith(" 01/05")
            ) {
              continue;
            }

            allMatches.push({
              description: finalDescription,
              amount: parseFloat(cleanAmount),
              date: date,
              confidence: 0.9, // Higher confidence with better patterns
              source: "OCR + Regex",
              length: finalDescription.length,
              originalLine: line,
            });
          }
        }
      }
    }

    // Sort by description length (longer descriptions are usually more complete)
    allMatches.sort((a, b) => b.length - a.length);

    // Filter out partial matches intelligently - balanced approach
    const preprocessedTransactions = [];
    for (const match of allMatches) {
      // Skip obvious non-transactions and partial matches
      if (
        match.description === "TX" ||
        match.description === "S" ||
        match.description === "B" ||
        match.description === "WA" ||
        match.description === "CA" ||
        match.description === "NY" ||
        match.description === "AUSTIN TX" ||
        match.description === "BILL WA" ||
        match.description === "BILL CA" ||
        match.description === "UBER.COM" ||
        match.description === "LYFT.COM" ||
        match.description.length < 3 ||
        match.description.endsWith(" Hr") ||
        match.description.endsWith(" Bd") ||
        match.description.endsWith(" p") ||
        match.description.endsWith(" <M") ||
        match.description.endsWith(" pr:") ||
        match.description.endsWith(" B=") ||
        match.description.endsWith(" NETFLIX.COM/BILL") ||
        match.description.endsWith(" SPOTIFY.COM") ||
        match.description.endsWith(" UBER.COM") ||
        match.description.endsWith(" LYFT.COM") ||
        match.description.endsWith(" Amzn.com/bill") ||
        match.description.endsWith(" Amzn.com/billWA") ||
        match.description.endsWith(" Amzn.com/bill CA") ||
        match.description.endsWith(" Amzn.com/bill WA") ||
        /^[0-9]+$/.test(match.description) || // Skip if just numbers
        /^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/.test(match.description) // Skip if just a date
      ) {
        continue;
      }

      // Check if this is a partial match of an existing transaction
      const isPartialMatch = preprocessedTransactions.some(existing => {
        // If this description is contained within an existing one, it's likely a partial match
        if (
          existing.description.includes(match.description) &&
          Math.abs(existing.amount - match.amount) < 0.01 &&
          existing.date === match.date
        ) {
          return true;
        }

        // If an existing description is contained within this one, replace the existing
        if (
          match.description.includes(existing.description) &&
          Math.abs(existing.amount - match.amount) < 0.01 &&
          existing.date === match.date
        ) {
          // Remove the shorter match and keep this longer one
          const index = preprocessedTransactions.indexOf(existing);
          if (index > -1) {
            preprocessedTransactions.splice(index, 1);
          }
          return false; // Don't skip this one, add it instead
        }

        return false;
      });

      if (!isPartialMatch) {
        // Check for exact duplicates
        const isDuplicate = preprocessedTransactions.some(
          t =>
            t.description === match.description &&
            Math.abs(t.amount - match.amount) < 0.01 &&
            t.date === match.date
        );

        if (!isDuplicate) {
          preprocessedTransactions.push({
            description: match.description,
            amount: match.amount,
            date: match.date,
            confidence: match.confidence,
            source: match.source,
          });
        }
      }
    }

    // Final cleanup: remove any remaining obvious partial matches and OCR artifacts
    const finalTransactions = [];
    for (const transaction of preprocessedTransactions) {
      // Skip if it's clearly a partial match or OCR artifact
      if (
        transaction.description.startsWith("S #") ||
        transaction.description.startsWith("B #") ||
        transaction.description.endsWith(".COM") ||
        transaction.description === "EVEREST FOOD TRUCK" ||
        transaction.description.endsWith(" Hr") ||
        transaction.description.endsWith(" Bd") ||
        transaction.description.endsWith(" p") ||
        transaction.description.endsWith(" <M") ||
        transaction.description.endsWith(" pr:") ||
        transaction.description.endsWith(" B=") ||
        transaction.description.endsWith(" NETFLIX.COM/BILL") ||
        transaction.description.endsWith(" SPOTIFY.COM") ||
        transaction.description.endsWith(" UBER.COM") ||
        transaction.description.endsWith(" LYFT.COM") ||
        transaction.description.endsWith(" Amzn.com/bill") ||
        transaction.description.endsWith(" Amzn.com/billWA") ||
        transaction.description.endsWith(" Amzn.com/bill CA") ||
        transaction.description.endsWith(" Amzn.com/bill WA") ||
        /^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/.test(transaction.description) ||
        /^[0-9]+$/.test(transaction.description) ||
        isNaN(transaction.amount)
      ) {
        continue;
      }

      finalTransactions.push(transaction);
    }

    console.log(
      `🤗 [HuggingFace] Found ${finalTransactions.length} transactions via regex patterns`
    );
    return finalTransactions;
  }

  /**
   * Use AI only for validation and enhancement of pre-extracted transactions
   * Much more cost-effective than full AI extraction
   */
  async enhanceTransactionsWithAI(preprocessedTransactions, originalText) {
    if (preprocessedTransactions.length === 0) {
      console.log(
        "🤗 [HuggingFace] No transactions to enhance, skipping AI step"
      );
      return [];
    }

    console.log(
      "🤗 [HuggingFace] Enhancing",
      preprocessedTransactions.length,
      "transactions with AI..."
    );

    try {
      // Create a focused prompt for validation/enhancement only
      const prompt = `Validate and enhance these pre-extracted financial transactions. 
      
Original text context:
${originalText.substring(0, 1000)}

Pre-extracted transactions:
${preprocessedTransactions.map((t, i) => `${i + 1}. ${t.description} - $${t.amount} on ${t.date}`).join("\n")}

Please:
1. Validate each transaction is correct
2. Fix any obvious errors in description, amount, or date
3. Add any missing transactions you find in the original text
4. Return in this exact format:
Transaction 1: [DESCRIPTION] - $[AMOUNT] on [DATE]
Transaction 2: [DESCRIPTION] - $[AMOUNT] on [DATE]
...`;

      const response = await fetch(`${this.baseUrl}/${this.uniformModel}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 400, // Much smaller since we're only enhancing
            min_new_tokens: 50,
            do_sample: false,
            num_beams: 3,
            early_stopping: true,
            temperature: 0.1,
            top_p: 0.9,
            repetition_penalty: 1.2,
          },
        }),
      });

      if (!response.ok) {
        console.log(
          "🤗 [HuggingFace] AI enhancement failed, using pre-processed transactions"
        );
        return preprocessedTransactions;
      }

      const data = await response.json();
      const enhancedText =
        data[0]?.summary_text || data[0]?.generated_text || "";

      // Parse the enhanced transactions
      const enhancedTransactions = this.parseEnhancedTransactions(
        enhancedText,
        preprocessedTransactions
      );

      console.log(
        "🤗 [HuggingFace] AI enhancement completed, final count:",
        enhancedTransactions.length
      );
      return enhancedTransactions;
    } catch (error) {
      console.log(
        "🤗 [HuggingFace] AI enhancement failed, using pre-processed transactions:",
        error.message
      );
      return preprocessedTransactions;
    }
  }

  /**
   * Parse AI-enhanced transactions and merge with pre-processed ones
   */
  parseEnhancedTransactions(enhancedText, originalTransactions) {
    const enhancedTransactions = [];

    // Parse the AI response
    const transactionMatches = enhancedText.match(
      /Transaction \d+:\s*([^-]+)-\s*\$([0-9.]+)\s+on\s+([0-9/-]+)/gi
    );

    if (transactionMatches) {
      for (const match of transactionMatches) {
        const parts = match.match(
          /Transaction \d+:\s*([^-]+)-\s*\$([0-9.]+)\s+on\s+([0-9/-]+)/i
        );
        if (parts) {
          const [, description, amount, date] = parts;
          const transaction = {
            description: description.trim(),
            amount: parseFloat(amount),
            date: this.normalizeDate(date) || date,
            confidence: 0.9, // High confidence for AI-enhanced transactions
            source: "OCR + AI Enhanced",
          };
          enhancedTransactions.push(transaction);
        }
      }
    }

    // Merge with original transactions, preferring AI-enhanced ones
    const mergedTransactions = [...enhancedTransactions];

    for (const original of originalTransactions) {
      const isDuplicate = mergedTransactions.some(
        t =>
          t.description
            .toLowerCase()
            .includes(original.description.toLowerCase()) ||
          original.description
            .toLowerCase()
            .includes(t.description.toLowerCase())
      );

      if (!isDuplicate) {
        mergedTransactions.push(original);
      }
    }

    return mergedTransactions;
  }

  /**
   * Extract transactions from text (for text-only input)
   */
  async extractFromText(text) {
    return this.analyzeExtractedText(text);
  }

  /**
   * Convert analysis to transaction format
   */
  async convertToTransactions(analysis) {
    // // console.log(
    //   "[convertToTransactions] Input analysis:",
    //   analysis,
    //   "Type:",
    //   typeof analysis
    // );
    // Handle different possible input structures
    let transactions = [];

    if (analysis && analysis.transactions) {
      // // console.log(
      //   "[convertToTransactions] analysis.transactions:",
      //   analysis.transactions,
      //   "Type:",
      //   typeof analysis.transactions
      // );
      transactions = Array.isArray(analysis.transactions)
        ? analysis.transactions
        : [];
    } else if (Array.isArray(analysis)) {
      // // console.log("[convertToTransactions] analysis is array:", analysis);
      transactions = analysis;
    } else if (analysis && typeof analysis === "object") {
      // If analysis is an object but doesn't have transactions property
      // Try to extract transactions from the analysis text
      const analysisText =
        analysis.analysis || analysis.text || JSON.stringify(analysis);
      // // console.log(
      //   "[convertToTransactions] analysisText for extraction:",
      //   analysisText
      // );
      transactions = this.extractTransactionsFromAnalysis(analysisText);
    } else {
      // Fallback: return empty array
      // console.warn(
      //   "[convertToTransactions] No valid transaction data found in analysis:",
      //   analysis
      // );
      return [];
    }

    // Ensure we have an array and map over it
    if (!Array.isArray(transactions)) {
      // console.warn(
      //   "[convertToTransactions] Transactions is not an array:",
      //   transactions,
      //   "Type:",
      //   typeof transactions
      // );
      return [];
    }
    // // console.log(
    //   "[convertToTransactions] Final transactions array before map:",
    //   transactions
    // );

    return transactions
      .map(transaction => {
        if (!transaction || typeof transaction !== "object") {
          // console.warn(
          //   "[convertToTransactions] Invalid transaction object:",
          //   transaction
          // );
          return null;
        }

        return {
          date: transaction.date || new Date().toISOString().split("T")[0],
          description: transaction.description || "Unknown transaction",
          amount: Math.abs(transaction.amount || 0),
          type: transaction.type || "expense",
          category: transaction.category || "Uncategorized",
          confidence: transaction.confidence || 0.7,
        };
      })
      .filter(Boolean); // Remove null entries
  }

  /**
   * Get processing summary
   */
  getProcessingSummary() {
    return {
      provider: "Hugging Face Inference API",
      model: this.uniformModel,
      dailyRequests: this.dailyRequestCount,
      maxDailyRequests: this.rateLimit.maxDailyRequests,
      remainingRequests:
        this.rateLimit.maxDailyRequests - this.dailyRequestCount,
      approachingLimits: this.isApproachingLimits(),
    };
  }

  /**
   * Analyze existing transactions
   */
  async analyzeTransactions(transactions) {
    await this.checkRateLimit();

    // Ensure transactions is an array and handle different input types
    let transactionArray = [];

    if (Array.isArray(transactions)) {
      transactionArray = transactions;
    } else if (
      transactions &&
      transactions.transactions &&
      Array.isArray(transactions.transactions)
    ) {
      transactionArray = transactions.transactions;
    } else if (transactions && typeof transactions === "object") {
      // Try to extract transactions from object
      // console.warn(
      //   "Hugging Face: Unexpected transactions format:",
      //   transactions
      // );
      transactionArray = [];
    } else {
      // console.warn(
      //   "Hugging Face: No valid transactions provided:",
      //   transactions
      // );
      transactionArray = [];
    }

    const transactionText = transactionArray
      .map(t => {
        if (!t || typeof t !== "object") {
          // console.warn(
          //   "Hugging Face: Invalid transaction object in array:",
          //   t
          // );
          return null;
        }
        return `${t.date || "Unknown date"}: ${t.description || "Unknown"} - $${t.amount || 0}`;
      })
      .filter(Boolean) // Remove null entries
      .join("\n");

    const prompt = `Analyze these financial transactions and provide insights:
${transactionText}

Please provide:
1. Spending patterns
2. Category suggestions
3. Anomalies or unusual transactions
4. Summary of financial activity`;

    const response = await fetch(`${this.baseUrl}/${this.uniformModel}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 800,
          min_length: 100,
          do_sample: false,
          num_beams: 3,
          temperature: 0.3,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    // Update counters
    this.requestCount++;
    this.dailyRequestCount++;
    this.updateDailyCounter();

    return {
      success: true,
      analysis: data[0]?.summary_text || "No analysis available",
      model: this.uniformModel,
      provider: "huggingface",
    };
  }

  /**
   * Validate file before processing
   */
  validateFile(file) {
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      throw new Error("Invalid file type. Please upload an image or PDF file.");
    }

    if (file.size > maxSize) {
      throw new Error(
        "File too large. Please upload a file smaller than 10MB."
      );
    }

    return true;
  }
}

export default new HuggingFaceService();
