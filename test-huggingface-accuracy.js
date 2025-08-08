/**
 * Test script to evaluate Hugging Face pipeline accuracy with test1.png
 */

import { HuggingFaceService } from './src/services/huggingFaceService.js';
import fs from 'fs';
import path from 'path';

async function testHuggingFaceAccuracy() {
  console.log("🧪 Testing Hugging Face Pipeline Accuracy with test1.png");
  console.log("=" .repeat(70));
  
  try {
    // Check if test1.png exists
    const testImagePath = path.join(process.cwd(), 'src/assets/test1.png');
    if (!fs.existsSync(testImagePath)) {
      console.log("❌ test1.png not found at:", testImagePath);
      return;
    }
    
    console.log("✅ Found test1.png");
    console.log("📁 File size:", fs.statSync(testImagePath).size, "bytes");
    
    // Initialize Hugging Face service
    const huggingFaceService = new HuggingFaceService();
    
    // Read the image file
    const imageBuffer = fs.readFileSync(testImagePath);
    const file = new File([imageBuffer], 'test1.png', { type: 'image/png' });
    
    console.log("\n🔍 Step 1: Testing OCR Text Extraction");
    console.log("-" .repeat(50));
    
    // Test OCR text extraction
    const startTime = Date.now();
    const extractedText = await huggingFaceService.extractTextFromImage(file);
    const ocrTime = Date.now() - startTime;
    
    console.log("⏱️ OCR Processing Time:", ocrTime, "ms");
    console.log("📝 Extracted Text Length:", extractedText.length, "characters");
    console.log("\n📄 Sample of Extracted Text:");
    console.log(extractedText.substring(0, 500) + "...");
    
    console.log("\n🔍 Step 2: Testing Transaction Extraction");
    console.log("-" .repeat(50));
    
    // Test transaction extraction
    const startTime2 = Date.now();
    const transactions = huggingFaceService.preprocessTextForTransactions(extractedText);
    const extractionTime = Date.now() - startTime2;
    
    console.log("⏱️ Transaction Extraction Time:", extractionTime, "ms");
    console.log("📋 Extracted Transactions:", transactions.length);
    
    console.log("\n📄 Sample Transactions:");
    transactions.slice(0, 10).forEach((transaction, index) => {
      console.log(`${index + 1}. ${transaction.description} | $${transaction.amount} | ${transaction.date}`);
    });
    
    console.log("\n🔍 Step 3: Full Pipeline Test");
    console.log("-" .repeat(50));
    
    // Test full pipeline
    const startTime3 = Date.now();
    const result = await huggingFaceService.analyzeImage(file);
    const totalTime = Date.now() - startTime3;
    
    console.log("⏱️ Total Pipeline Time:", totalTime, "ms");
    console.log("✅ Success:", result.success);
    console.log("📊 Analysis:", result.analysis);
    console.log("🤖 Model:", result.model);
    console.log("🔗 Provider:", result.provider);
    console.log("📝 Document Type:", result.documentType);
    console.log("📋 OCR Transactions:", result.ocrTransactions);
    console.log("🤖 AI Enhanced Transactions:", result.aiEnhancedTransactions);
    
    console.log("\n📄 Final Transactions:");
    result.transactions.slice(0, 10).forEach((transaction, index) => {
      console.log(`${index + 1}. ${transaction.description} | $${transaction.amount} | ${transaction.date} | ${transaction.confidence}`);
    });
    
    // Calculate accuracy metrics
    console.log("\n🔍 Step 4: Accuracy Analysis");
    console.log("-" .repeat(50));
    
    // Based on the image description, we expect around 25-27 transactions
    const expectedTransactions = 27; // From the image description
    const successRate = (result.transactions.length / expectedTransactions) * 100;
    
    console.log("🎯 Expected Transactions:", expectedTransactions);
    console.log("📋 Actual Transactions:", result.transactions.length);
    console.log("📊 Success Rate:", successRate.toFixed(1) + "%");
    
    if (successRate >= 95) {
      console.log("✅ EXCELLENT: Success rate is 95% or higher!");
    } else if (successRate >= 80) {
      console.log("🟡 GOOD: Success rate is 80% or higher");
    } else if (successRate >= 60) {
      console.log("🟠 FAIR: Success rate is 60% or higher");
    } else {
      console.log("🔴 NEEDS IMPROVEMENT: Success rate is below 60%");
    }
    
    console.log("\n🔍 Step 5: Performance Metrics");
    console.log("-" .repeat(50));
    
    console.log("⚡ OCR Processing:", ocrTime, "ms");
    console.log("⚡ Transaction Extraction:", extractionTime, "ms");
    console.log("⚡ Total Pipeline:", totalTime, "ms");
    console.log("💰 Estimated Cost: ~$0.0005 (Hugging Face)");
    console.log("📊 Daily Limit: 1000 requests");
    
    console.log("\n🎉 Hugging Face Pipeline Test Complete!");
    console.log("=" .repeat(70));
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

// Run the test
testHuggingFaceAccuracy();
