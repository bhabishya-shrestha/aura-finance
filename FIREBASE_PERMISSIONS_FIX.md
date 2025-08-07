# Firebase Permissions Fix Guide

## Problem

The Firebase security rules are currently too restrictive, preventing delete operations and breaking cross-platform data synchronization.

## Solution

Deploy the new Firebase security rules that allow authenticated users to perform all CRUD operations on their own data.

## Step-by-Step Instructions

### 1. Install Firebase CLI (if not already installed)

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

### 3. Verify your Firebase project

Make sure the project ID in `.firebaserc` matches your actual Firebase project:

```json
{
  "projects": {
    "default": "aura-finance-9777a"
  }
}
```

### 4. Deploy the new security rules

Run the deployment script:

```bash
node deploy-firebase-rules.js
```

Or manually deploy:

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

### 5. Verify the deployment

Check the Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Firestore Database → Rules
4. Verify the new rules are deployed

## What the New Rules Allow

### ✅ Allowed Operations

- **Read**: Users can read their own transactions and accounts
- **Write**: Users can create and update their own data
- **Delete**: Users can delete their own transactions and accounts
- **Cross-platform sync**: Data syncs properly between devices

### 🔒 Security Features

- **Authentication required**: All operations require user authentication
- **Data isolation**: Users can only access their own data
- **User ID validation**: Operations are restricted to the authenticated user's data

## Testing the Fix

### 1. Test Account Deletion

1. Create an account in the app
2. Try to delete the account
3. Verify it's deleted from both local storage and Firebase
4. Refresh the page - the account should remain deleted

### 2. Test Transaction Deletion

1. Create a transaction
2. Try to delete the transaction
3. Verify it's deleted from both local storage and Firebase
4. Refresh the page - the transaction should remain deleted

### 3. Test Cross-Device Sync

1. Add data on one device
2. Check if it appears on another device
3. Delete data on one device
4. Verify it's deleted on the other device

## Troubleshooting

### If deployment fails:

1. **Check Firebase CLI installation**: `firebase --version`
2. **Check authentication**: `firebase projects:list`
3. **Verify project ID**: Check `.firebaserc` file
4. **Check permissions**: Ensure you have admin access to the Firebase project

### If rules don't work:

1. **Wait for propagation**: Rules can take a few minutes to propagate
2. **Clear browser cache**: Clear local storage and refresh
3. **Check Firebase Console**: Verify rules are deployed correctly
4. **Check authentication**: Ensure user is properly authenticated

### If sync still doesn't work:

1. **Check network connectivity**: Ensure devices are online
2. **Check Firebase quotas**: Verify you haven't exceeded free tier limits
3. **Check console errors**: Look for Firebase-related errors in browser console
4. **Test with simple data**: Try with minimal data to isolate issues

## Security Rules Explanation

```javascript
// Users can perform all operations on their own transactions
match /transactions/{transactionId} {
  allow read, write, delete: if request.auth != null &&
    request.auth.uid == resource.data.userId;
  allow create: if request.auth != null &&
    request.auth.uid == request.resource.data.userId;
}
```

This rule ensures:

- Only authenticated users can access data
- Users can only access their own data (matching `userId`)
- All CRUD operations (Create, Read, Update, Delete) are allowed
- Data is properly isolated between users

## Next Steps

After deploying the rules:

1. Test all delete operations in the app
2. Verify cross-device synchronization works
3. Monitor Firebase usage in the console
4. Consider setting up Firebase Analytics for better monitoring

## Support

If you continue to have issues:

1. Check the Firebase Console for error logs
2. Review the browser console for client-side errors
3. Verify your Firebase project configuration
4. Ensure all environment variables are set correctly
