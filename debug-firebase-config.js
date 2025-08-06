/**
 * Debug Firebase Configuration
 * Check what values are being loaded from environment variables
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env') });

console.log('🔍 Debugging Firebase Configuration...\n');

// Check each Firebase environment variable
const firebaseVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN', 
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

firebaseVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: NOT FOUND`);
  }
});

console.log('\n📋 Firebase Config Object:');
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

console.log(JSON.stringify(firebaseConfig, null, 2));

// Check for common issues
console.log('\n🔧 Common Issues Check:');
if (!process.env.VITE_FIREBASE_API_KEY) {
  console.log('❌ API Key is missing');
} else if (process.env.VITE_FIREBASE_API_KEY.length < 30) {
  console.log('❌ API Key seems too short');
} else {
  console.log('✅ API Key looks valid');
}

if (!process.env.VITE_FIREBASE_PROJECT_ID) {
  console.log('❌ Project ID is missing');
} else {
  console.log('✅ Project ID found');
}

if (!process.env.VITE_FIREBASE_AUTH_DOMAIN) {
  console.log('❌ Auth Domain is missing');
} else if (!process.env.VITE_FIREBASE_AUTH_DOMAIN.includes('.firebaseapp.com')) {
  console.log('❌ Auth Domain format looks wrong');
} else {
  console.log('✅ Auth Domain looks valid');
} 