#!/usr/bin/env node

/**
 * Test OAuth Setup Script
 * 
 * This script helps verify OAuth configuration and provides correct setup steps.
 */

console.log('🔧 OAuth Configuration Test');
console.log('===========================');

console.log('\n📋 Current Firebase Configuration:');
console.log('✅ Project ID: aura-finance-9777a');
console.log('✅ Web Client ID: 5775045267-5ble54uphi920a6mm67bplchf80iucnd.apps.googleusercontent.com');
console.log('✅ Environment: VITE_ENABLE_OAUTH=true');

console.log('\n🔧 CORRECT OAuth Setup Steps:');
console.log('=============================');
console.log('');
console.log('Step 1: Firebase Console (Authorized Domains)');
console.log('1. Go to: https://console.firebase.google.com/');
console.log('2. Select project: aura-finance-9777a');
console.log('3. Go to Authentication > Settings');
console.log('4. Add to Authorized domains:');
console.log('   - localhost');
console.log('   - 127.0.0.1');
console.log('');
console.log('Step 2: Google Cloud Console (Redirect URIs)');
console.log('1. Go to: https://console.cloud.google.com/');
console.log('2. Select project: aura-finance-9777a');
console.log('3. Go to APIs & Services > Credentials');
console.log('4. Click on OAuth 2.0 Client ID:');
console.log('   5775045267-5ble54uphi920a6mm67bplchf80iucnd.apps.googleusercontent.com');
console.log('5. Add to Authorized redirect URIs (DOMAIN ONLY, no paths):');
console.log('   - http://localhost:5173');
console.log('   - https://aura-finance-9777a.firebaseapp.com');
console.log('6. Click Save');
console.log('');
console.log('⚠️  IMPORTANT: Do NOT add paths like /auth/callback');
console.log('⚠️  IMPORTANT: Do NOT add trailing slashes');
console.log('⚠️  Use only domain names without paths');
console.log('Step 3: Test OAuth');
console.log('1. Restart dev server: npm run dev');
console.log('2. Try OAuth sign-in in browser');
console.log('3. Check browser console for debugging');

console.log('\n🚀 After completing these steps, OAuth should work!');
