/**
 * Security Middleware for Firebase Operations
 * Provides input validation, sanitization, and security checks
 */

// Firebase instance will be set by initializeFirebase()
let db = null;

class SecurityMiddleware {
  /**
   * Validate transaction data
   */
  static validateTransaction(transaction) {
    const errors = [];

    // Required fields
    if (!transaction.description?.trim()) {
      errors.push("Description is required");
    }

    if (typeof transaction.amount !== "number" || transaction.amount === 0) {
      errors.push("Amount must be a non-zero number");
    }

    if (Math.abs(transaction.amount) > 1000000) {
      errors.push("Amount cannot exceed $1,000,000");
    }

    // Enhanced date validation to handle different formats
    let transactionDate;
    if (!transaction.date) {
      errors.push("Valid date is required");
    } else {
      try {
        // Handle different date formats
        if (transaction.date instanceof Date) {
          transactionDate = transaction.date;
        } else if (typeof transaction.date === "string") {
          transactionDate = new Date(transaction.date);
        } else if (
          transaction.date &&
          typeof transaction.date.toDate === "function"
        ) {
          // Firebase Timestamp object
          transactionDate = transaction.date.toDate();
        } else if (typeof transaction.date === "number") {
          // Unix timestamp
          transactionDate = new Date(transaction.date);
        } else if (
          transaction.date &&
          typeof transaction.date === "object" &&
          typeof transaction.date.seconds === "number"
        ) {
          // Firebase Timestamp object with seconds property
          transactionDate = new Date(transaction.date.seconds * 1000);
        } else {
          errors.push("Valid date is required");
        }

        // Validate the parsed date
        if (transactionDate && isNaN(transactionDate.getTime())) {
          errors.push("Valid date is required");
        }
      } catch (error) {
        errors.push("Valid date is required");
      }
    }

    // Date validation (only if we have a valid date)
    if (transactionDate && !isNaN(transactionDate.getTime())) {
      const now = new Date();

      // Allow future dates in development mode for testing
      const isDevelopment =
        import.meta.env?.DEV || process.env.NODE_ENV === "development";

      if (transactionDate > now && !isDevelopment) {
        errors.push("Cannot create future transactions");
      }

      if (transactionDate < new Date(now.getFullYear() - 10, 0, 1)) {
        errors.push("Cannot create transactions older than 10 years");
      }
    }

    // Category validation - be more flexible and provide defaults
    const validCategories = [
      "salary",
      "income",
      "deposit",
      "refund",
      "dividend",
      "shopping",
      "groceries",
      "restaurant",
      "transportation",
      "gas",
      "utilities",
      "entertainment",
      "healthcare",
      "insurance",
      "education",
      "travel",
      "subscription",
      "gift",
      "charity",
      "transfer",
      "withdrawal",
      "fee",
      "interest",
      "other",
      "uncategorized",
    ];

    // If no category is provided, don't fail validation - let sanitization handle it
    if (
      transaction.category &&
      !validCategories.includes(transaction.category?.toLowerCase())
    ) {
      // Instead of failing, we'll let sanitization convert it to a default
      console.warn(
        `Unknown category "${transaction.category}" - will be converted to "other"`
      );
    }

    // Description length
    if (transaction.description && transaction.description.length > 500) {
      errors.push("Description too long (max 500 characters)");
    }

    return errors;
  }

  /**
   * Validate account data
   */
  static validateAccount(account) {
    const errors = [];

    if (!account.name?.trim()) {
      errors.push("Account name is required");
    }

    if (account.name && account.name.length > 100) {
      errors.push("Account name too long (max 100 characters)");
    }

    const validTypes = ["checking", "savings", "credit", "investment", "loan"];
    if (!validTypes.includes(account.type?.toLowerCase())) {
      errors.push("Invalid account type");
    }

    if (typeof account.balance !== "number") {
      errors.push("Balance must be a number");
    }

    if (account.balance < -1000000 || account.balance > 1000000) {
      errors.push("Balance must be between -$1,000,000 and $1,000,000");
    }

    return errors;
  }

  /**
   * Validate user data
   */
  static validateUser(user) {
    const errors = [];

    if (!user.email?.trim()) {
      errors.push("Email is required");
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (user.email && !emailRegex.test(user.email)) {
      errors.push("Invalid email format");
    }

    if (!user.name?.trim()) {
      errors.push("Name is required");
    }

    if (user.name && user.name.length > 100) {
      errors.push("Name too long (max 100 characters)");
    }

    return errors;
  }

  /**
   * Sanitize input to prevent XSS and injection attacks
   */
  static sanitizeInput(input) {
    if (typeof input === "string") {
      return input
        .trim()
        .replace(/[<>]/g, "") // Remove < and > to prevent XSS
        .replace(/javascript:/gi, "") // Remove javascript: protocol
        .replace(/on\w+=/gi, "") // Remove event handlers
        .substring(0, 1000); // Limit length
    }
    return input;
  }

  /**
   * Sanitize transaction data
   */
  static sanitizeTransaction(transaction) {
    // Ensure date is properly formatted for Firebase
    let sanitizedDate = transaction.date;
    if (sanitizedDate) {
      try {
        if (sanitizedDate instanceof Date) {
          // Already a Date object, keep as is
        } else if (typeof sanitizedDate === "string") {
          sanitizedDate = new Date(sanitizedDate);
        } else if (
          sanitizedDate &&
          typeof sanitizedDate.toDate === "function"
        ) {
          // Firebase Timestamp object, convert to Date
          sanitizedDate = sanitizedDate.toDate();
        } else if (typeof sanitizedDate === "number") {
          // Unix timestamp, convert to Date
          sanitizedDate = new Date(sanitizedDate);
        } else if (
          sanitizedDate &&
          typeof sanitizedDate === "object" &&
          typeof sanitizedDate.seconds === "number"
        ) {
          // Firebase Timestamp object with seconds property, convert to Date
          sanitizedDate = new Date(sanitizedDate.seconds * 1000);
        }

        // Validate the date
        if (isNaN(sanitizedDate.getTime())) {
          sanitizedDate = new Date(); // Fallback to current date
        }
      } catch (error) {
        sanitizedDate = new Date(); // Fallback to current date
      }
    }

    // Ensure category is valid or provide default
    let sanitizedCategory = transaction.category;
    const validCategories = [
      "salary",
      "income",
      "deposit",
      "refund",
      "dividend",
      "shopping",
      "groceries",
      "restaurant",
      "transportation",
      "gas",
      "utilities",
      "entertainment",
      "healthcare",
      "insurance",
      "education",
      "travel",
      "subscription",
      "gift",
      "charity",
      "transfer",
      "withdrawal",
      "fee",
      "interest",
      "other",
      "uncategorized",
    ];

    if (
      !sanitizedCategory ||
      !validCategories.includes(sanitizedCategory.toLowerCase())
    ) {
      sanitizedCategory = "other"; // Default category
    }

    return {
      ...transaction,
      date: sanitizedDate,
      category: sanitizedCategory,
      description: this.sanitizeInput(transaction.description),
      note: transaction.note ? this.sanitizeInput(transaction.note) : undefined,
      tags: transaction.tags
        ? transaction.tags.map(tag => this.sanitizeInput(tag))
        : undefined,
    };
  }

  /**
   * Sanitize account data
   */
  static sanitizeAccount(account) {
    return {
      ...account,
      name: this.sanitizeInput(account.name),
      institution: account.institution
        ? this.sanitizeInput(account.institution)
        : undefined,
      accountNumber: account.accountNumber
        ? this.sanitizeInput(account.accountNumber)
        : undefined,
    };
  }

  /**
   * Sanitize user data
   */
  static sanitizeUser(user) {
    return {
      ...user,
      name: this.sanitizeInput(user.name),
      email: this.sanitizeInput(user.email),
    };
  }

  /**
   * Validate user ownership
   */
  static validateUserOwnership(userId, currentUserId) {
    return userId === currentUserId;
  }

  /**
   * Check if user has permission to access resource
   */
  static hasPermission(resource, currentUserId) {
    return resource && resource.userId === currentUserId;
  }

  /**
   * Log security event
   */
  static async logSecurityEvent(userId, event, details = {}) {
    try {
      // Only log if Firebase is initialized
      if (!db) {
        console.warn("Firebase not initialized, skipping security log");
        return;
      }

      // Load Firebase modules dynamically only when needed
      let firebaseFirestore;
      try {
        firebaseFirestore = await import("firebase/firestore");
      } catch (error) {
        console.warn("Firebase Firestore not available:", error.message);
        return;
      }

      const securityLog = {
        userId,
        event,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        details,
        ipAddress: await this.getClientIP(),
      };

      await firebaseFirestore.addDoc(
        firebaseFirestore.collection(db, "security_logs"),
        securityLog
      );
    } catch (error) {
      console.error("Failed to log security event:", error);
    }
  }

  /**
   * Get client IP (placeholder - would be implemented with backend)
   */
  static async getClientIP() {
    // In a real app, you'd get this from your backend or use a service
    return "unknown";
  }

  /**
   * Initialize Firebase connection when app is ready
   */
  static async initializeFirebase(firestoreInstance = null) {
    try {
      if (firestoreInstance) {
        db = firestoreInstance;
        console.log(
          "Security middleware: Firebase initialized with provided instance"
        );
      } else {
        // Load Firebase modules dynamically only when needed
        try {
          const firebaseApp = await import("firebase/app");
          const firebaseFirestore = await import("firebase/firestore");

          const apps = firebaseApp.getApps();
          if (apps.length > 0 && !db) {
            db = firebaseFirestore.getFirestore();
            console.log("Security middleware: Firebase initialized");
          }
        } catch (appsError) {
          console.warn("Firebase apps not available yet:", appsError.message);
        }
      }
    } catch (error) {
      console.warn(
        "Security middleware: Failed to initialize Firebase:",
        error.message
      );
    }
  }

  /**
   * Rate limiting check
   */
  static checkRateLimit(userId, operation) {
    const now = Date.now();
    const key = `rate_limit:${userId}:${operation}`;

    // Get existing rate limit data from localStorage
    const rateLimitData = JSON.parse(
      localStorage.getItem(key) || '{"count": 0, "resetTime": 0}'
    );

    // Reset if time window has passed
    if (now > rateLimitData.resetTime) {
      rateLimitData.count = 0;
      rateLimitData.resetTime = now + 60000; // 1 minute window
    }

    // Check limits
    const limits = {
      transactions: 100, // 100 requests per minute
      accounts: 50, // 50 requests per minute
      auth: 10, // 10 auth attempts per minute
      sync: 30, // 30 sync operations per minute
    };

    const limit = limits[operation] || 100;

    if (rateLimitData.count >= limit) {
      return false;
    }

    // Increment count
    rateLimitData.count++;
    localStorage.setItem(key, JSON.stringify(rateLimitData));

    return true;
  }

  /**
   * Validate and sanitize data before Firebase operations
   */
  static async validateAndSanitize(data, type, currentUserId) {
    const errors = [];

    // Validate user ownership
    if (
      data.userId &&
      !this.validateUserOwnership(data.userId, currentUserId)
    ) {
      errors.push("Unauthorized access to user data");
    }

    // Type-specific validation
    switch (type) {
      case "transaction":
        errors.push(...this.validateTransaction(data));
        break;
      case "account":
        errors.push(...this.validateAccount(data));
        break;
      case "user":
        errors.push(...this.validateUser(data));
        break;
      default:
        errors.push("Invalid data type");
    }

    if (errors.length > 0) {
      // Log validation failure
      await this.logSecurityEvent(currentUserId, "validation_failed", {
        type,
        errors,
        data: JSON.stringify(data),
      });

      throw new Error(`Validation failed: ${errors.join(", ")}`);
    }

    // Sanitize data
    let sanitizedData;
    switch (type) {
      case "transaction":
        sanitizedData = this.sanitizeTransaction(data);
        break;
      case "account":
        sanitizedData = this.sanitizeAccount(data);
        break;
      case "user":
        sanitizedData = this.sanitizeUser(data);
        break;
      default:
        sanitizedData = data;
    }

    return sanitizedData;
  }

  /**
   * Check for suspicious activity
   */
  static async checkSuspiciousActivity(userId, operation, data) {
    const suspiciousPatterns = [
      // Rapid operations
      {
        type: "rapid_operations",
        check: () => !this.checkRateLimit(userId, operation),
      },

      // Large amounts
      { type: "large_amount", check: () => data.amount > 100000 },

      // Unusual categories
      {
        type: "unusual_category",
        check: () => {
          const unusualCategories = ["test", "debug", "admin", "system"];
          return unusualCategories.includes(data.category?.toLowerCase());
        },
      },

      // Future dates
      {
        type: "future_date",
        check: () => {
          if (data.date) {
            return new Date(data.date) > new Date();
          }
          return false;
        },
      },
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.check()) {
        await this.logSecurityEvent(userId, "suspicious_activity", {
          pattern: pattern.type,
          operation,
          data: JSON.stringify(data),
        });

        return true;
      }
    }

    return false;
  }
}

export default SecurityMiddleware;
