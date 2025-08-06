/**
 * Auth Bridge Service
 * Bridges Supabase OAuth users to Firebase for cross-device sync
 */

import { supabase } from "../lib/supabase";
import firebaseService from "./firebaseService";

class AuthBridgeService {
  constructor() {
    this.isLinked = false;
    this.firebaseUser = null;
  }

  /**
   * Initialize the auth bridge
   */
  async initialize() {
    try {
      // Check if user is authenticated with Supabase
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        console.log("🔗 Auth bridge: Supabase user found:", session.user.email);
        await this.linkToFirebase(session.user);
      }
    } catch (error) {
      console.log("Auth bridge initialization error:", error.message);
    }
  }

  /**
   * Link Supabase user to Firebase
   */
  async linkToFirebase(supabaseUser) {
    try {
      const email = supabaseUser.email;

      // Check if Firebase user exists with same email
      let firebaseUser = await firebaseService.getCurrentUser();

      if (!firebaseUser) {
        // Try to sign in with Firebase using same email
        // We'll use a temporary password based on the user's ID
        const tempPassword = this.generateTempPassword(supabaseUser.id);

        try {
          // Try to sign in first (in case user was created before)
          const loginResult = await firebaseService.login(
            email,
            tempPassword
          );
          if (loginResult.success) {
            firebaseUser = loginResult.user;
            console.log("🔗 Auth bridge: Firebase login successful");
          }
        } catch (error) {
          // User doesn't exist, create new Firebase account
          console.log(
            "🔗 Auth bridge: Creating Firebase account for existing Supabase user"
          );
          const registerResult = await firebaseService.register(
            email,
            tempPassword,
            supabaseUser.user_metadata?.full_name || supabaseUser.email
          );
          if (registerResult.success) {
            firebaseUser = registerResult.user;
            console.log("🔗 Auth bridge: Firebase account created");
          }
        }
      }

      if (firebaseUser) {
        this.firebaseUser = firebaseUser;
        this.isLinked = true;
        console.log("🔗 Auth bridge: Successfully linked Supabase to Firebase");

        // Initialize sync for this user
        await this.initializeSync();
      }
    } catch (error) {
      console.error("🔗 Auth bridge: Error linking to Firebase:", error);
    }
  }

  /**
   * Generate a temporary password for Firebase
   */
  generateTempPassword(supabaseUserId) {
    // Create a deterministic password based on Supabase user ID
    // This ensures the same user always gets the same Firebase account
    const hash = this.simpleHash(supabaseUserId);
    return `aura_${hash}_${supabaseUserId.slice(0, 8)}`;
  }

  /**
   * Simple hash function for deterministic password generation
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Initialize sync for the linked user
   */
  async initializeSync() {
    try {
      // Import the sync service dynamically to avoid circular dependencies
      const { default: firebaseSync } = await import("./firebaseSync.js");
      await firebaseSync.initialize();
    } catch (error) {
      console.error("🔗 Auth bridge: Error initializing sync:", error);
    }
  }

  /**
   * Get sync status for the bridge
   */
  getSyncStatus() {
    return {
      isLinked: this.isLinked,
      firebaseUser: this.firebaseUser,
      supabaseUser: null, // Will be populated when needed
    };
  }

  /**
   * Check if user has cross-device sync enabled
   */
  async hasCrossDeviceSync() {
    return this.isLinked && this.firebaseUser !== null;
  }

  /**
   * Get user's sync information
   */
  async getUserSyncInfo() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const supabaseUser = session?.user;

      return {
        supabaseUser: supabaseUser
          ? {
              id: supabaseUser.id,
              email: supabaseUser.email,
              provider: supabaseUser.app_metadata?.provider || "email",
            }
          : null,
        firebaseUser: this.firebaseUser
          ? {
              uid: this.firebaseUser.uid,
              email: this.firebaseUser.email,
            }
          : null,
        isLinked: this.isLinked,
        hasCrossDeviceSync: await this.hasCrossDeviceSync(),
      };
    } catch (error) {
      console.error("Error getting user sync info:", error);
      return {
        supabaseUser: null,
        firebaseUser: null,
        isLinked: false,
        hasCrossDeviceSync: false,
      };
    }
  }
}

// Create singleton instance
const authBridge = new AuthBridgeService();

export default authBridge;
