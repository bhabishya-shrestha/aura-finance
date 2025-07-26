import db from "../database";
import { v4 as uuidv4 } from "uuid";

// JWT-like token generation for local use
const generateToken = (payload) => {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payloadEncoded = btoa(JSON.stringify(payload));
  const signature = btoa(
    JSON.stringify({ timestamp: Date.now(), nonce: uuidv4() })
  );
  return `${header}.${payloadEncoded}.${signature}`;
};

// Password hashing using Web Crypto API
const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

// Verify password
const verifyPassword = async (password, hash) => {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
};

// Local Authentication Service
export const localAuthService = {
  // Register a new user
  register: async (userData) => {
    try {
      // Log for development purposes only
      if (import.meta.env.DEV) {
        console.log("🔧 Registering user:", userData.email);
      }

      // Check if user already exists
      const existingUser = await db.users
        .where("email")
        .equals(userData.email)
        .first();

      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      // Hash password
      const passwordHash = await hashPassword(userData.password);

      // Create user
      const user = await db.users.add({
        email: userData.email.toLowerCase(),
        name: userData.name,
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Log for development purposes only
      if (import.meta.env.DEV) {
        console.log("🔧 User created with ID:", user);
      }

      // Generate session token
      const token = generateToken({
        userId: user,
        email: userData.email,
        name: userData.name,
        type: "local",
      });

      // Log for development purposes only
      if (import.meta.env.DEV) {
        console.log("🔧 Token generated:", token.substring(0, 50) + "...");
      }

      // Store session
      await db.sessions.add({
        userId: user,
        token,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: new Date(),
      });

      // Get user data (without password)
      const createdUser = await db.users.get(user);

      return {
        success: true,
        data: {
          user: {
            id: createdUser.id,
            email: createdUser.email,
            name: createdUser.name,
            createdAt: createdUser.createdAt,
          },
          token,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      // Find user by email
      const user = await db.users
        .where("email")
        .equals(credentials.email.toLowerCase())
        .first();

      if (!user) {
        throw new Error("Invalid email or password");
      }

      // Verify password
      const isValidPassword = await verifyPassword(
        credentials.password,
        user.passwordHash
      );
      if (!isValidPassword) {
        throw new Error("Invalid email or password");
      }

      // Generate session token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        type: "local",
      });

      // Store session
      await db.sessions.add({
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: new Date(),
      });

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
          },
          token,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Get current user from token
  getCurrentUser: async (token) => {
    try {
      if (!token) {
        throw new Error("No token provided");
      }

      // Find session by token
      const session = await db.sessions.where("token").equals(token).first();

      if (!session) {
        throw new Error("Invalid session");
      }

      // Check if session is expired
      if (new Date() > new Date(session.expiresAt)) {
        await db.sessions.delete(session.id);
        throw new Error("Session expired");
      }

      // Get user data
      const user = await db.users.get(session.userId);
      if (!user) {
        throw new Error("User not found");
      }

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Logout user
  logout: async (token) => {
    try {
      if (token) {
        // Remove session
        const session = await db.sessions.where("token").equals(token).first();

        if (session) {
          await db.sessions.delete(session.id);
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Refresh token
  refreshToken: async (token) => {
    try {
      const session = await db.sessions.where("token").equals(token).first();

      if (!session) {
        throw new Error("Invalid session");
      }

      // Generate new token
      const user = await db.users.get(session.userId);
      const newToken = generateToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        type: "local",
      });

      // Update session
      await db.sessions.update(session.id, {
        token: newToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      });

      return {
        success: true,
        data: {
          token: newToken,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Clean up expired sessions
  cleanupExpiredSessions: async () => {
    try {
      const expiredSessions = await db.sessions
        .where("expiresAt")
        .below(new Date())
        .toArray();

      for (const session of expiredSessions) {
        await db.sessions.delete(session.id);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

// Token management utilities
export const tokenManager = {
  getToken: () => localStorage.getItem("authToken"),
  setToken: (token) => localStorage.setItem("authToken", token),
  removeToken: () => localStorage.removeItem("authToken"),
  isTokenValid: (token) => {
    if (!token) return false;
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return false;

      const payload = JSON.parse(atob(parts[1]));
      return payload && payload.userId;
    } catch {
      return false;
    }
  },
};
