/**
 * Test script to verify security middleware fixes
 * Tests date validation and Firebase permissions
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import SecurityMiddleware from '../src/services/securityMiddleware.js';

// Firebase config (use your actual config)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

async function testSecurityFixes() {
  console.log('🧪 Testing security middleware fixes...\n');

  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    // Initialize security middleware with Firebase instance
    await SecurityMiddleware.initializeFirebase(db);

    // Test 1: Date validation with different formats
    console.log('📅 Test 1: Date validation with different formats');
    
    const testCases = [
      {
        name: 'Date object',
        date: new Date('2024-01-15'),
        expected: true
      },
      {
        name: 'Date string',
        date: '2024-01-15',
        expected: true
      },
      {
        name: 'Unix timestamp',
        date: 1705276800000, // 2024-01-15
        expected: true
      },
      {
        name: 'Invalid date string',
        date: 'invalid-date',
        expected: false
      },
      {
        name: 'Null date',
        date: null,
        expected: false
      }
    ];

    for (const testCase of testCases) {
      const transaction = {
        description: 'Test transaction',
        amount: 100,
        category: 'other',
        date: testCase.date
      };

      try {
        const errors = SecurityMiddleware.validateTransaction(transaction);
        const passed = errors.length === 0;
        console.log(`  ${passed ? '✅' : '❌'} ${testCase.name}: ${passed ? 'PASSED' : 'FAILED'}`);
        if (!passed) {
          console.log(`    Errors: ${errors.join(', ')}`);
        }
      } catch (error) {
        console.log(`  ❌ ${testCase.name}: ERROR - ${error.message}`);
      }
    }

    // Test 2: Transaction sanitization
    console.log('\n🧹 Test 2: Transaction sanitization');
    
    const testTransaction = {
      description: '<script>alert("xss")</script>Test transaction',
      amount: 100,
      category: 'other',
      date: '2024-01-15',
      note: 'Test note with <script> tags'
    };

    try {
      const sanitized = SecurityMiddleware.sanitizeTransaction(testTransaction);
      console.log('  ✅ Sanitization completed');
      console.log(`    Original description: ${testTransaction.description}`);
      console.log(`    Sanitized description: ${sanitized.description}`);
      console.log(`    Date type: ${sanitized.date instanceof Date ? 'Date object' : typeof sanitized.date}`);
    } catch (error) {
      console.log(`  ❌ Sanitization failed: ${error.message}`);
    }

    // Test 3: Firebase permissions (if authenticated)
    console.log('\n🔐 Test 3: Firebase permissions');
    
    try {
      // Try to sign in with test credentials
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        'test@aura-finance.com', 
        'testpassword123'
      );
      
      console.log(`  ✅ Authenticated as: ${userCredential.user.email}`);
      
      // Test security logging
      await SecurityMiddleware.logSecurityEvent(
        userCredential.user.uid,
        'test_event',
        { test: true, timestamp: new Date().toISOString() }
      );
      
      console.log('  ✅ Security event logged successfully');
      
      // Test transaction creation
      const testTransactionData = {
        description: 'Test transaction from script',
        amount: 50,
        category: 'other',
        date: new Date()
      };

      const sanitizedData = await SecurityMiddleware.validateAndSanitize(
        { ...testTransactionData, userId: userCredential.user.uid },
        'transaction',
        userCredential.user.uid
      );

      console.log('  ✅ Transaction validation and sanitization passed');
      console.log(`    Sanitized date type: ${sanitizedData.date instanceof Date ? 'Date object' : typeof sanitizedData.date}`);

    } catch (error) {
      console.log(`  ❌ Authentication or permission test failed: ${error.message}`);
    }

    console.log('\n🎉 Security middleware tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSecurityFixes().catch(console.error);
