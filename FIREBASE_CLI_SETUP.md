# 🔧 Firebase CLI & Admin SDK Setup Guide

## 🎯 **Immediate Fix (Use This First)**

**Run this in your browser console to fix the current issue:**

```javascript
// Quick Firebase fix - run this in browser console
console.log("🚀 Uploading missing transactions to Firebase...");

// Get store and transactions
const store = window.__ZUSTAND_STORE__ || window.store;
const transactions = store.getState().transactions || [];
console.log(`📊 Found ${transactions.length} local transactions`);

// Import Firebase service
const firebaseService = (await import("../src/services/firebaseService.js")).default;

// Get Firebase transactions for comparison
const firebaseResult = await firebaseService.getTransactions();
const firebaseTransactions = firebaseResult.success ? firebaseResult.data || [] : [];
console.log(`📊 Found ${firebaseTransactions.length} Firebase transactions`);

// Find missing ones
const localIds = new Set(transactions.map(t => t.id));
const firebaseIds = new Set(firebaseTransactions.map(t => t.id));
const missing = transactions.filter(t => !firebaseIds.has(t.id));

console.log(`📤 Uploading ${missing.length} missing transactions...`);

// Upload them
for (const transaction of missing) {
  try {
    const result = await firebaseService.addTransaction(transaction);
    if (result.success) {
      console.log(`✅ Uploaded: ${transaction.description}`);
    } else {
      console.log(`❌ Failed: ${transaction.description}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${transaction.description}`);
  }
}

console.log("🎉 Done! Try updating categories again.");
```

## 🛠️ **Firebase CLI Setup (For Future Use)**

### **Step 1: Install Google Cloud CLI**

**Windows:**
```bash
# Download from: https://cloud.google.com/sdk/docs/install
# Or use winget:
winget install Google.CloudSDK
```

**macOS:**
```bash
# Using Homebrew
brew install google-cloud-sdk

# Or download from: https://cloud.google.com/sdk/docs/install
```

**Linux:**
```bash
# Download from: https://cloud.google.com/sdk/docs/install
# Or use package manager
```

### **Step 2: Authenticate with Google Cloud**

```bash
# Initialize gcloud
gcloud init

# Login with your Google account
gcloud auth login

# Set up application default credentials
gcloud auth application-default login

# Set the project
gcloud config set project aura-finance-9777a
```

### **Step 3: Verify Firebase CLI Access**

```bash
# Check if you can access Firebase
firebase projects:list

# Check current project
firebase use

# Test Firestore access
firebase firestore:rules:get
```

### **Step 4: Run Firebase Fix Scripts**

Once authenticated, you can run:

```bash
# Analyze Firebase data
node scripts/direct-firebase-fix.cjs

# Create import data
node scripts/firebase-cli-fix.cjs

# Start Firebase emulator
firebase emulators:start --only firestore
```

## 🔐 **Alternative: Service Account Key**

If you prefer using a service account key:

### **Step 1: Create Service Account**

1. Go to [Firebase Console](https://console.firebase.google.com/project/aura-finance-9777a/settings/serviceaccounts/adminsdk)
2. Click "Generate new private key"
3. Download the JSON file
4. Save it as `serviceAccountKey.json` in your project root

### **Step 2: Use Service Account**

The scripts will automatically detect and use the service account key.

## 📊 **Firebase Console Access**

You can also manually manage data through the Firebase Console:

1. **Go to**: https://console.firebase.google.com/project/aura-finance-9777a/firestore
2. **Navigate to**: Firestore Database
3. **Check collections**: `transactions` and `accounts`
4. **Add missing documents** manually

## 🎯 **Current Issue Summary**

**Problem**: Transactions exist locally but not in Firebase
**Error**: `No document to update: projects/aura-finance-9777a/databases/(default)/documents/transactions/1754581509914v13fxvh8f`

**Solution**: Upload missing transactions to Firebase using the browser script above.

## 🔄 **Prevention**

To prevent this in the future:

1. **Use the updated `firebaseService.js`** (already fixed)
2. **Ensure proper sync** between local and Firebase data
3. **Monitor sync status** in the app

## 📝 **Files Created**

- `scripts/firebase-cli-fix.cjs` - Firebase CLI analysis script
- `scripts/direct-firebase-fix.cjs` - Direct Firebase Admin SDK fix
- `firebase-import-data.json` - Sample data for manual import
- `FIREBASE_CLI_SETUP.md` - This setup guide

---

**💡 Start with the browser script above for immediate fix, then set up Firebase CLI for future management.**
