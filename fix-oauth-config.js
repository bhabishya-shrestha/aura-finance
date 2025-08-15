#!/usr/bin/env node

/**
 * Fix OAuth Configuration Script
 * 
 * This script helps configure OAuth properly for the Aura Finance project.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Fixing OAuth Configuration for Aura Finance');
console.log('==============================================');

// Check if we're in the right directory
if (!fs.existsSync('firebase.json')) {
  console.error('❌ Error: firebase.json not found. Please run this script from the project root.');
  process.exit(1);
}

// Check environment variables
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ Error: .env file not found.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const oauthEnabled = envContent.includes('VITE_ENABLE_OAUTH=true');

if (!oauthEnabled) {
  console.error('❌ Error: VITE_ENABLE_OAUTH=true not found in .env file');
  process.exit(1);
}

console.log('✅ Environment variables are configured correctly');

// Check Firebase project
try {
  console.log('🔍 Checking Firebase project configuration...');
  const projectInfo = execSync('firebase projects:list --json', { encoding: 'utf8' });
  const projects = JSON.parse(projectInfo);
  const currentProject = projects.result.find(p => p.projectId === 'aura-finance-9777a');
  
  if (!currentProject) {
    console.error('❌ Error: aura-finance-9777a project not found');
    process.exit(1);
  }
  
  console.log('✅ Firebase project found:', currentProject.projectId);
} catch (error) {
  console.error('❌ Error checking Firebase project:', error.message);
  process.exit(1);
}

// Check Firebase apps
try {
  console.log('🔍 Checking Firebase apps...');
  const appsInfo = execSync('firebase apps:list --project aura-finance-9777a --json', { encoding: 'utf8' });
  const apps = JSON.parse(appsInfo);
  console.log('✅ Firebase apps found:', apps.result.length);
} catch (error) {
  console.error('❌ Error checking Firebase apps:', error.message);
}

console.log('\n📋 CRITICAL: OAuth Configuration Steps Required');
console.log('===============================================');
console.log('The OAuth is failing because Firebase Console needs to be configured.');
console.log('');
console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
console.log('2. Select project: aura-finance-9777a');
console.log('3. Go to Authentication > Settings > Authorized domains');
console.log('4. Add the following domains:');
console.log('   - localhost');
console.log('   - 127.0.0.1');
console.log('');
console.log('5. Go to Authentication > Sign-in method > Google');
console.log('6. Make sure Google sign-in is ENABLED');
console.log('7. Add the following to Authorized redirect URIs:');
console.log('   - http://localhost:5173');
console.log('   - http://localhost:5173/auth/callback');
console.log('');
console.log('8. Save the changes');
console.log('');
console.log('🔧 Current Environment Check:');
console.log('=============================');
console.log('✅ VITE_ENABLE_OAUTH=true (found in .env)');
console.log('✅ Firebase project: aura-finance-9777a');
console.log('✅ Firebase CLI authenticated');
console.log('❌ Firebase Console OAuth configuration (needs manual setup)');

console.log('\n📝 Next steps:');
console.log('1. Configure Firebase Console as shown above');
console.log('2. Restart the development server: npm run dev');
console.log('3. Test OAuth sign-in in the browser');
console.log('4. Check browser console for debugging information');

console.log('\n🚀 After configuring Firebase Console, OAuth should work!');
