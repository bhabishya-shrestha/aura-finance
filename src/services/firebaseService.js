/**
 * Firebase Service for Free Cross-Device Sync
 *
 * This service provides free cross-device synchronization using Firebase Firestore.
 * Free tier includes: 1GB storage, 50K reads/day, 20K writes/day
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import SecurityMiddleware from "./securityMiddleware.js";

// Firebase configuration (you'll get this from Firebase Console)
const firebaseConfig = {
  // Replace with your Firebase config
  apiKey:
    import.meta.env?.VITE_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
  authDomain:
    import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN ||
    process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:
    import.meta.env?.VITE_FIREBASE_PROJECT_ID ||
    process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:
    import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET ||
    process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:
    import.meta.env?.VITE_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID,
  // Disable hosted configuration loading
  measurementId: undefined,
};

// Initialize Firebase
console.log("🔥 Initializing Firebase with config:", {
  apiKey: firebaseConfig.apiKey ? "***" : "missing",
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId ? "***" : "missing",
});

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

console.log("✅ Firebase initialized successfully");
console.log("🔐 Auth instance:", auth);
console.log("🗄️ Firestore instance:", db);

// Export app for use in other modules
export { app };

// Initialize security middleware with the Firestore instance
SecurityMiddleware.initializeFirebase(db).catch(error => {
  console.warn("Security middleware initialization failed:", error.message);
});

class FirebaseService {
  constructor() {
    this.currentUser = null;
    this.transactionUnsubscribe = null;
    this.accountUnsubscribe = null;
    this.setupAuthListener();
  }

  // Setup authentication listener
  setupAuthListener() {
    onAuthStateChanged(auth, user => {
      console.log(
        "🔄 Firebase Auth state changed:",
        user ? user.email : "signed out"
      );
      this.currentUser = user;
      if (user) {
        console.log("✅ User signed in:", user.email, "UID:", user.uid);
      } else {
        console.log("👋 User signed out");
      }
    });
  }

  // Authentication methods
  async register(email, password, name) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Create user profile
      await this.createUserProfile(user.uid, { email, name });

      return { success: true, user };
    } catch (error) {
      console.error("Registration error:", error);
      // Throw the error so the auth bridge can handle it properly
      throw error;
    }
  }

  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error("Login error:", error);
      // Throw the error so the auth bridge can handle it properly
      throw error;
    }
  }

  async logout() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: error.message };
    }
  }

  // User profile management
  async createUserProfile(userId, userData) {
    try {
      await setDoc(doc(db, "users", userId), {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      console.error("Create user profile error:", error);
      return { success: false, error: error.message };
    }
  }

  async getUserProfile(userId) {
    try {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { success: true, data: docSnap.data() };
      } else {
        return { success: false, error: "User not found" };
      }
    } catch (error) {
      console.error("Get user profile error:", error);
      return { success: false, error: error.message };
    }
  }

  // Transaction management
  async addTransaction(transactionData) {
    if (!this.currentUser) {
      return { success: false, error: "User not authenticated" };
    }

    try {
      // Security validation and sanitization
      const transactionWithUser = {
        ...transactionData,
        userId: this.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Validate and sanitize data
      const sanitizedData = await SecurityMiddleware.validateAndSanitize(
        transactionWithUser,
        "transaction",
        this.currentUser.uid
      );

      // Remove any undefined values that might have slipped through
      const cleanData = Object.fromEntries(
        Object.entries(sanitizedData).filter(([, value]) => value !== undefined)
      );

      // Check rate limiting
      if (
        !SecurityMiddleware.checkRateLimit(this.currentUser.uid, "transactions")
      ) {
        await SecurityMiddleware.logSecurityEvent(
          this.currentUser.uid,
          "rate_limit_exceeded",
          {
            operation: "addTransaction",
          }
        );
        return {
          success: false,
          error: "Rate limit exceeded. Please wait before trying again.",
        };
      }

      // Check for suspicious activity
      const isSuspicious = await SecurityMiddleware.checkSuspiciousActivity(
        this.currentUser.uid,
        "addTransaction",
        sanitizedData
      );

      if (isSuspicious) {
        console.warn(
          "Suspicious activity detected during transaction creation"
        );
      }

      const docRef = await addDoc(collection(db, "transactions"), cleanData);

      // Log successful operation
      await SecurityMiddleware.logSecurityEvent(
        this.currentUser.uid,
        "transaction_created",
        {
          transactionId: docRef.id,
          amount: sanitizedData.amount,
          category: sanitizedData.category,
        }
      );

      return {
        success: true,
        data: { ...cleanData, id: docRef.id },
      };
    } catch (error) {
      console.error("Add transaction error:", error);
      return { success: false, error: error.message };
    }
  }

  async getTransactionsSimple() {
    // Check if user is authenticated
    if (!this.currentUser) {
      return { success: false, error: "User not authenticated" };
    }

    try {
      // Simple query without ordering
      const q = query(
        collection(db, "transactions"),
        where("userId", "==", this.currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const transactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { success: true, data: transactions };
    } catch (error) {
      console.error("Get transactions simple error:", error);
      return { success: false, error: error.message };
    }
  }

  async getTransactions(filters = {}) {
    // Check if user is authenticated
    if (!this.currentUser) {
      return { success: false, error: "User not authenticated" };
    }

    try {
      let q = query(
        collection(db, "transactions"),
        where("userId", "==", this.currentUser.uid)
      );

      // Apply filters
      if (filters.accountId) {
        q = query(q, where("accountId", "==", filters.accountId));
      }
      if (filters.startDate) {
        q = query(q, where("date", ">=", filters.startDate));
      }
      if (filters.endDate) {
        q = query(q, where("date", "<=", filters.endDate));
      }

      // Order by date (newest first)
      q = query(q, orderBy("date", "desc"));

      const querySnapshot = await getDocs(q);
      const transactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { success: true, data: transactions };
    } catch (error) {
      console.error("Get transactions error:", error);
      return { success: false, error: error.message };
    }
  }

  async updateTransaction(transactionId, updates) {
    // Check if user is authenticated
    if (!this.currentUser) {
      return { success: false, error: "User not authenticated" };
    }

    try {
      const docRef = doc(db, "transactions", transactionId);

      // Check if the document exists first
      const docSnapshot = await getDoc(docRef);

      if (!docSnapshot.exists()) {
        // Document doesn't exist in Firebase, create it instead
        console.log(
          `Transaction ${transactionId} doesn't exist in Firebase, creating it...`
        );

        // Get the full transaction data from local store
        const { default: db } = await import("../database.js");
        const localTransaction = await db.transactions.get(transactionId);

        if (localTransaction) {
          // Create the document with full data plus updates
          const transactionData = {
            ...localTransaction,
            ...updates,
            userId: this.currentUser.uid,
            updatedAt: serverTimestamp(),
          };

          // Clean the data by removing undefined values
          const cleanTransactionData = Object.fromEntries(
            Object.entries(transactionData).filter(
              ([, value]) => value !== undefined
            )
          );

          await setDoc(docRef, cleanTransactionData);
          console.log(`✅ Created transaction ${transactionId} in Firebase`);
          return { success: true, created: true };
        } else {
          console.warn(`Transaction ${transactionId} not found locally either`);
          return { success: false, error: "Transaction not found locally" };
        }
      } else {
        // Document exists, update it
        // Clean the updates by removing undefined values
        const cleanUpdates = Object.fromEntries(
          Object.entries(updates).filter(([, value]) => value !== undefined)
        );

        await updateDoc(docRef, {
          ...cleanUpdates,
          updatedAt: serverTimestamp(),
        });

        console.log(`✅ Updated transaction ${transactionId} in Firebase`);
        return { success: true, updated: true };
      }
    } catch (error) {
      console.error("Update transaction error:", error);
      return { success: false, error: error.message };
    }
  }

  async deleteTransaction(transactionId) {
    // Check if user is authenticated
    if (!this.currentUser) {
      console.error("❌ Delete transaction failed: User not authenticated");
      return { success: false, error: "User not authenticated" };
    }

    console.log("🔐 Attempting to delete transaction:", transactionId);
    console.log("👤 Current user:", this.currentUser.uid);

    try {
      // Direct deletion without checking ownership first (rules will handle this)
      const transactionDoc = doc(db, "transactions", transactionId);

      // Try to delete directly - if it doesn't exist or user doesn't have permission,
      // Firebase will throw an error that we can handle
      await deleteDoc(transactionDoc);
      console.log("✅ Transaction deleted successfully from Firebase");

      return { success: true };
    } catch (error) {
      console.error("❌ Delete transaction error:", error);

      // If document doesn't exist, consider it a successful deletion
      if (error.code === "not-found" || error.message.includes("not found")) {
        console.log("✅ Transaction doesn't exist, considering it deleted");
        return { success: true };
      }

      return { success: false, error: error.message };
    }
  }

  // Account management
  async addAccount(accountData) {
    if (!this.currentUser) {
      return { success: false, error: "User not authenticated" };
    }

    try {
      const accountWithUser = {
        ...accountData,
        userId: this.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Remove any undefined values that might have slipped through
      const cleanData = Object.fromEntries(
        Object.entries(accountWithUser).filter(
          ([, value]) => value !== undefined
        )
      );

      const docRef = await addDoc(collection(db, "accounts"), cleanData);

      return {
        success: true,
        data: { ...cleanData, id: docRef.id },
      };
    } catch (error) {
      console.error("Add account error:", error);
      return { success: false, error: error.message };
    }
  }

  async getAccounts() {
    // Check if user is authenticated
    if (!this.currentUser) {
      return { success: false, error: "User not authenticated" };
    }

    try {
      const q = query(
        collection(db, "accounts"),
        where("userId", "==", this.currentUser.uid),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const accounts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { success: true, data: accounts };
    } catch (error) {
      console.error("Get accounts error:", error);
      return { success: false, error: error.message };
    }
  }

  async updateAccount(accountId, updates) {
    if (!this.currentUser) {
      return { success: false, error: "User not authenticated" };
    }

    try {
      const docRef = doc(db, "accounts", accountId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      console.error("Update account error:", error);
      return { success: false, error: error.message };
    }
  }

  async deleteAccount(accountId) {
    if (!this.currentUser) {
      return { success: false, error: "User not authenticated" };
    }

    try {
      const accountDoc = doc(db, "accounts", accountId);
      await deleteDoc(accountDoc);
      return { success: true };
    } catch (error) {
      console.error("Delete account error:", error);

      // If document doesn't exist, consider it a successful deletion
      if (error.code === "not-found" || error.message.includes("not found")) {
        return { success: true };
      }

      return { success: false, error: error.message };
    }
  }

  // Real-time listeners
  subscribeToTransactions(callback) {
    if (!this.currentUser) {
      return null;
    }

    // Unsubscribe from previous listener if exists
    if (this.transactionUnsubscribe) {
      this.transactionUnsubscribe();
    }

    const q = query(
      collection(db, "transactions"),
      where("userId", "==", this.currentUser.uid),
      orderBy("date", "desc")
    );

    this.transactionUnsubscribe = onSnapshot(q, snapshot => {
      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(transactions);
    });

    return this.transactionUnsubscribe;
  }

  subscribeToAccounts(callback) {
    if (!this.currentUser) {
      return null;
    }

    // Unsubscribe from previous listener if exists
    if (this.accountUnsubscribe) {
      this.accountUnsubscribe();
    }

    const q = query(
      collection(db, "accounts"),
      where("userId", "==", this.currentUser.uid),
      orderBy("createdAt", "desc")
    );

    this.accountUnsubscribe = onSnapshot(q, snapshot => {
      const accounts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(accounts);
    });

    return this.accountUnsubscribe;
  }

  // Unsubscribe methods
  unsubscribeFromTransactions() {
    if (this.transactionUnsubscribe) {
      this.transactionUnsubscribe();
      this.transactionUnsubscribe = null;
    }
  }

  unsubscribeFromAccounts() {
    if (this.accountUnsubscribe) {
      this.accountUnsubscribe();
      this.accountUnsubscribe = null;
    }
  }

  // Data export/import
  async exportData() {
    if (!this.currentUser) {
      return { success: false, error: "User not authenticated" };
    }

    try {
      const [transactionsResult, accountsResult] = await Promise.all([
        this.getTransactions(),
        this.getAccounts(),
      ]);

      if (!transactionsResult.success || !accountsResult.success) {
        throw new Error("Failed to fetch data");
      }

      const exportData = {
        transactions: transactionsResult.data,
        accounts: accountsResult.data,
        exportedAt: new Date().toISOString(),
      };

      return { success: true, data: exportData };
    } catch (error) {
      console.error("Export data error:", error);
      return { success: false, error: error.message };
    }
  }

  async importData(importData) {
    if (!this.currentUser) {
      return { success: false, error: "User not authenticated" };
    }

    try {
      const { transactions, accounts } = importData;
      const results = [];

      // Import accounts first
      for (const account of accounts) {
        const { id, ...accountData } = account;
        const result = await this.addAccount(accountData);
        results.push({ type: "account", originalId: id, result });
      }

      // Import transactions
      for (const transaction of transactions) {
        const { id, ...transactionData } = transaction;
        const result = await this.addTransaction(transactionData);
        results.push({ type: "transaction", originalId: id, result });
      }

      return { success: true, data: results };
    } catch (error) {
      console.error("Import data error:", error);
      return { success: false, error: error.message };
    }
  }

  // Get current user
  getCurrentUser() {
    // Get the current user from Firebase Auth directly
    const currentUser = auth.currentUser;
    console.log("🔍 getCurrentUser() called:");
    console.log("  auth.currentUser:", currentUser);
    console.log("  this.currentUser:", this.currentUser);
    console.log("  Returning:", currentUser);
    return currentUser;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser;
  }
}

// Create and export singleton instance
const firebaseService = new FirebaseService();
export default firebaseService;
