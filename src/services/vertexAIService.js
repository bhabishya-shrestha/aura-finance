// Vertex AI service for high-volume document analysis
// Provides significantly higher quotas compared to free Gemini API

class VertexAIService {
  constructor() {
    this.projectId = import.meta.env.VITE_GCP_PROJECT_ID;
    this.location = import.meta.env.VITE_GCP_LOCATION || 'us-central1';
    this.model = 'gemini-1.5-flash';
    this.apiEndpoint = `https://${this.location}-aiplatform.googleapis.com`;
    
    // Vertex AI has much higher quotas
    this.rateLimit = {
      maxRequests: 300, // 300 per minute (much higher than free tier)
      timeWindow: 60000, // 1 minute in milliseconds
      maxDailyRequests: 10000, // 10k daily requests (vs 150 for free tier)
    };

    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.dailyRequestCount = 0;
    this.lastDailyReset = new Date().toDateString();

    if (!this.projectId) {
      console.warn('Vertex AI: GCP Project ID not configured. AI features will be disabled.');
    }
  }

  // Get authentication token for Vertex AI
  async getAuthToken() {
    try {
      // For production, you'd use proper GCP authentication
      // For now, we'll use API key approach (you can upgrade to service account later)
      const apiKey = import.meta.env.VITE_GCP_API_KEY;
      if (!apiKey) {
        throw new Error('GCP API key not configured');
      }
      return apiKey;
    } catch (error) {
      throw new Error('Failed to authenticate with Vertex AI: ' + error.message);
    }
  }

  // Rate limiting check with higher limits
  checkRateLimit() {
    const now = Date.now();
    const today = new Date().toDateString();

    // Reset daily counter if it's a new day
    if (today !== this.lastDailyReset) {
      this.dailyRequestCount = 0;
      this.lastDailyReset = today;
    }

    // Reset minute counter if time window has passed
    if (now - this.lastRequestTime > this.rateLimit.timeWindow) {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }

    // Check daily limit
    if (this.dailyRequestCount >= this.rateLimit.maxDailyRequests) {
      throw new Error(
        `Daily limit exceeded. Maximum ${this.rateLimit.maxDailyRequests} requests per day allowed.`
      );
    }

    // Check minute limit
    if (this.requestCount >= this.rateLimit.maxRequests) {
      throw new Error(
        `Rate limit exceeded. Maximum ${this.rateLimit.maxRequests} requests per minute allowed.`
      );
    }

    this.requestCount++;
    this.dailyRequestCount++;
  }

  // Enhanced file validation
  validateFile(file) {
    const maxSize = 32 * 1024 * 1024; // 32MB for Vertex AI
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/heic",
      "image/heif",
      "application/pdf",
      "text/csv",
    ];

    if (file.size > maxSize) {
      throw new Error("File size too large. Maximum 32MB allowed for Vertex AI.");
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "File type not supported. Please upload an image (JPG, PNG, GIF, WebP, HEIC) or PDF."
      );
    }
  }

  // Convert file to base64
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        try {
          const base64 = reader.result.split(",")[1];
          resolve(base64);
        } catch (error) {
          reject(new Error("Failed to process file. Please try again."));
        }
      };
      reader.onerror = () =>
        reject(new Error("Failed to read file. Please try again."));
    });
  }

  // Get MIME type for file
  getMimeType(file) {
    const mimeTypes = {
      "image/jpeg": "image/jpeg",
      "image/png": "image/png",
      "image/gif": "image/gif",
      "image/webp": "image/webp",
      "image/heic": "image/heic",
      "image/heif": "image/heif",
      "application/pdf": "application/pdf",
    };
    return mimeTypes[file.type] || "application/octet-stream";
  }

  // Analyze image/document using Vertex AI
  async analyzeImage(file) {
    try {
      this.checkRateLimit();
      this.validateFile(file);

      const authToken = await this.getAuthToken();
      const base64Data = await this.fileToBase64(file);
      const mimeType = this.getMimeType(file);

      const url = `${this.apiEndpoint}/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.model}:generateContent`;

      const prompt = `Analyze this financial document (bank statement, credit card statement, or transaction list) and extract all financial transactions. 

For each transaction, provide:
- Date (in YYYY-MM-DD format)
- Description (merchant name or transaction description)
- Amount (positive for income/deposits, negative for expenses/withdrawals)
- Category (if identifiable)

Return the data in this exact JSON format:
{
  "transactions": [
    {
      "date": "2024-01-15",
      "description": "WALMART",
      "amount": -45.67,
      "category": "Shopping"
    }
  ],
  "summary": {
    "totalTransactions": 10,
    "totalIncome": 2500.00,
    "totalExpenses": -1200.50,
    "dateRange": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    }
  }
}

If you cannot identify a transaction clearly, omit it. Only include transactions you are confident about.`;

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generation_config: {
          temperature: 0.1,
          top_p: 0.8,
          top_k: 40,
          max_output_tokens: 8192,
        },
        safety_settings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Vertex AI API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`
        );
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response from Vertex AI');
      }

      const content = data.candidates[0].content.parts[0].text;
      
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in Vertex AI response');
      }

      const result = JSON.parse(jsonMatch[0]);
      
      return {
        transactions: result.transactions || [],
        summary: result.summary || {},
        model: 'vertex-ai-gemini-1.5-flash',
        confidence: 'high',
        processingTime: Date.now(),
      };

    } catch (error) {
      console.error('Vertex AI analysis error:', error);
      throw new Error(`Vertex AI analysis failed: ${error.message}`);
    }
  }

  // Extract transactions from text (for CSV processing)
  extractFromText(text) {
    try {
      // Use Vertex AI to analyze text content
      const lines = text.split('\n').filter(line => line.trim());
      const transactionText = lines.join('\n');
      
      // For text analysis, we'll use a simpler approach
      // In production, you could make another API call to Vertex AI
      return this.parseCSVText(transactionText);
    } catch (error) {
      throw new Error(`Failed to extract transactions from text: ${error.message}`);
    }
  }

  // Parse CSV text content
  parseCSVText(text) {
    const lines = text.split('\n').filter(line => line.trim());
    const transactions = [];
    
    for (let i = 1; i < lines.length; i++) { // Skip header
      const line = lines[i];
      const parts = line.split(',').map(part => part.trim().replace(/"/g, ''));
      
      if (parts.length >= 3) {
        const [date, description, amount] = parts;
        
        if (date && description && amount) {
          const parsedAmount = parseFloat(amount.replace(/[$,]/g, ''));
          
          if (!isNaN(parsedAmount)) {
            transactions.push({
              date: this.parseDate(date),
              description: description,
              amount: parsedAmount,
              category: this.categorizeTransaction(description),
            });
          }
        }
      }
    }
    
    return transactions;
  }

  // Parse date with smart detection
  parseDate(dateStr) {
    try {
      // Try various date formats
      const formats = [
        'MM/DD/YYYY',
        'MM-DD-YYYY',
        'YYYY-MM-DD',
        'MM/DD/YY',
        'MM-DD-YY',
      ];
      
      for (const format of formats) {
        const parsed = this.parseDateWithFormat(dateStr, format);
        if (parsed) return parsed;
      }
      
      // Fallback to current date
      return new Date().toISOString().split('T')[0];
    } catch (error) {
      return new Date().toISOString().split('T')[0];
    }
  }

  parseDateWithFormat(dateStr, format) {
    try {
      const parts = dateStr.split(/[\/\-]/);
      if (parts.length !== 3) return null;
      
      let year, month, day;
      
      if (format === 'MM/DD/YYYY' || format === 'MM-DD-YYYY') {
        [month, day, year] = parts;
      } else if (format === 'YYYY-MM-DD') {
        [year, month, day] = parts;
      } else if (format === 'MM/DD/YY' || format === 'MM-DD-YY') {
        [month, day, year] = parts;
        year = '20' + year; // Assume 20xx
      }
      
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toISOString().split('T')[0];
    } catch (error) {
      return null;
    }
  }

  // Categorize transaction based on description
  categorizeTransaction(description) {
    const desc = description.toLowerCase();
    
    const categories = {
      'food': ['restaurant', 'cafe', 'starbucks', 'mcdonalds', 'subway', 'pizza', 'burger', 'food', 'dining'],
      'shopping': ['walmart', 'target', 'amazon', 'costco', 'shop', 'store', 'retail'],
      'transportation': ['uber', 'lyft', 'taxi', 'gas', 'fuel', 'parking', 'metro', 'bus'],
      'entertainment': ['netflix', 'spotify', 'movie', 'theater', 'concert', 'game'],
      'utilities': ['electric', 'water', 'gas', 'internet', 'phone', 'cable'],
      'healthcare': ['doctor', 'pharmacy', 'medical', 'hospital', 'dental'],
      'income': ['deposit', 'salary', 'payroll', 'refund', 'credit'],
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => desc.includes(keyword))) {
        return category;
      }
    }
    
    return 'other';
  }

  // Convert Vertex AI response to transactions
  convertToTransactions(vertexResponse) {
    if (!vertexResponse.transactions || !Array.isArray(vertexResponse.transactions)) {
      return [];
    }

    return vertexResponse.transactions.map((transaction, index) => ({
      id: Date.now() + index,
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount,
      category: transaction.category || 'other',
      selected: true,
    }));
  }

  // Get processing summary
  getProcessingSummary(vertexResponse) {
    return {
      documentType: "AI Analysis",
      source: "Vertex AI",
      confidence: vertexResponse.confidence || "high",
      quality: "excellent",
      transactionCount: vertexResponse.transactions?.length || 0,
      model: vertexResponse.model || "vertex-ai-gemini-1.5-flash",
      dateRange: vertexResponse.summary?.dateRange || null,
    };
  }

  // Analyze transactions for account suggestions
  async analyzeTransactions(transactionTexts, prompt) {
    try {
      this.checkRateLimit();
      const authToken = await this.getAuthToken();

      const url = `${this.apiEndpoint}/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.model}:generateContent`;

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt + "\n\nTransactions:\n" + transactionTexts.join('\n')
              }
            ]
          }
        ],
        generation_config: {
          temperature: 0.3,
          top_p: 0.8,
          top_k: 40,
          max_output_tokens: 2048,
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Vertex AI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;

    } catch (error) {
      console.error('Vertex AI transaction analysis error:', error);
      throw new Error(`Vertex AI analysis failed: ${error.message}`);
    }
  }
}

export default new VertexAIService(); 