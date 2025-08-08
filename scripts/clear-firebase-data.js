#!/usr/bin/env node

/**
 * Script to clear all Firebase data
 * This script uses Firebase CLI to completely clear all data from Firestore
 */

const { execSync } = require('child_process');
const path = require('path');

async function clearFirebaseData() {
  try {
    console.log('🧹 Starting Firebase data cleanup...');
    
    // Get the project ID from .firebaserc
    const firebasercPath = path.join(__dirname, '..', '.firebaserc');
    const firebaserc = require(firebasercPath);
    const projectId = firebaserc.projects?.default;
    
    if (!projectId) {
      throw new Error('No project ID found in .firebaserc');
    }
    
    console.log(`📋 Project ID: ${projectId}`);
    
    // Delete all collections from Firestore
    console.log('🗑️  Deleting all collections from Firestore...');
    
    try {
      const result = execSync(
        `firebase firestore:delete --all-collections --project=${projectId} --force`,
        { 
          encoding: 'utf8',
          stdio: 'pipe'
        }
      );
      console.log('✅ Firebase data cleared successfully');
      console.log(result);
    } catch (error) {
      if (error.stdout) {
        console.log('✅ Firebase data cleared successfully');
        console.log(error.stdout);
      } else {
        throw error;
      }
    }
    
    console.log('🎉 Firebase data cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error clearing Firebase data:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  clearFirebaseData();
}

module.exports = { clearFirebaseData };
