# Firebase Setup Guide - Free Cross-Device Sync

## 🆓 **Why Firebase?**

- **Completely FREE** for personal finance apps
- **1GB storage** - enough for years of transactions
- **50,000 reads/day** - more than you'll ever need
- **20,000 writes/day** - plenty for daily use
- **Real-time sync** across all devices
- **Google's infrastructure** - reliable and fast

## 🚀 **Step 1: Create Firebase Project**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `aura-finance` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

## 🔧 **Step 2: Add Web App**

1. In Firebase Console, click the web icon (</>)
2. Enter app nickname: `aura-finance-web`
3. Click "Register app"
4. Copy the config object (you'll need this)

## 🔑 **Step 3: Get Configuration**

You'll get a config like this:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};
```

## 📝 **Step 4: Update Environment Variables**

Add these to your `.env` file:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

## 🔐 **Step 5: Enable Authentication**

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password"
5. Click "Save"

## 📊 **Step 6: Set Up Firestore Database**

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (we'll secure it later)
4. Choose a location (pick closest to you)
5. Click "Done"

## 🛡️ **Step 7: Set Up Security Rules**

In Firestore Database → Rules, replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Users can only access their own transactions
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
    }

    // Users can only access their own accounts
    match /accounts/{accountId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
    }
  }
}
```

## 🎯 **Step 8: Test the Setup**

The Firebase service is already created. You can test it by:

```javascript
import firebaseService from "./services/firebaseService";

// Test registration
const result = await firebaseService.register(
  "test@example.com",
  "password123",
  "Test User"
);
console.log("Registration result:", result);

// Test login
const loginResult = await firebaseService.login(
  "test@example.com",
  "password123"
);
console.log("Login result:", loginResult);
```

## 📱 **Step 9: Cross-Device Sync**

Now your data will automatically sync across devices:

- **Desktop**: Add transaction → Instantly appears on phone
- **Phone**: Update account → Instantly appears on desktop
- **Tablet**: Delete transaction → Instantly removed everywhere

## 💰 **Cost Breakdown**

### **Free Tier Limits:**

- **Storage**: 1GB (≈ 100,000 transactions)
- **Reads**: 50,000/day (≈ 1,667 per hour)
- **Writes**: 20,000/day (≈ 667 per hour)
- **Deletes**: 20,000/day

### **For Personal Finance:**

- **Typical usage**: 10-50 transactions/day
- **Storage needed**: ~1MB/year
- **Reads needed**: ~100/day
- **Writes needed**: ~50/day

**Result**: You'll never hit the free limits! 🎉

## 🔄 **Migration from IndexedDB**

To migrate your existing data:

```javascript
// Export from IndexedDB
const exportData = await firebaseService.exportData();

// Import to Firebase
const importResult = await firebaseService.importData(exportData);
```

## 🚀 **Benefits You Get**

### **Immediate Benefits:**

- ✅ **Cross-device sync** - Data everywhere
- ✅ **Real-time updates** - Instant changes
- ✅ **Data backup** - Never lose data
- ✅ **Offline support** - Works without internet
- ✅ **Free forever** - No monthly costs

### **Advanced Features:**

- 🔄 **Real-time listeners** - Live updates
- 📊 **Query capabilities** - Filter and sort
- 🔐 **Security** - Google-grade protection
- 📱 **Mobile optimized** - Works on all devices

## 🎯 **Next Steps**

1. **Set up Firebase project** (5 minutes)
2. **Update environment variables** (2 minutes)
3. **Test authentication** (3 minutes)
4. **Migrate existing data** (optional)
5. **Enjoy cross-device sync!** 🎉

## 🆘 **Troubleshooting**

### **Common Issues:**

- **Config errors**: Double-check environment variables
- **Auth issues**: Make sure Email/Password is enabled
- **Permission errors**: Check Firestore security rules
- **Network issues**: Check internet connection

### **Support:**

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)

## 🎉 **You're All Set!**

With Firebase, you get enterprise-grade cross-device sync for **$0/month**. Your financial data will be available on all your devices, backed up in the cloud, and synced in real-time.

**No more data isolation between devices!** 🚀
