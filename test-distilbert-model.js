#!/usr/bin/env node

/**
 * Test DistilBERT Model for Extractive Question Answering
 * Tests the distilbert/distilbert-base-cased-distilled-squad model
 */

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, ".env") });

async function testDistilbertModel() {
  console.log("🧪 DistilBERT Model Test");
  console.log("========================\n");

  try {
    // Check API key
    const apiKey = process.env.VITE_HUGGINGFACE_API_KEY;
    if (!apiKey) {
      console.log("❌ No Hugging Face API key found");
      console.log("   Please set VITE_HUGGINGFACE_API_KEY in your .env file");
      return;
    }
    
    console.log(`✅ API key found: ${apiKey.substring(0, 10)}...`);

    // Test 1: Check if distilbert model is available
    console.log("\n🤖 Test 1: DistilBERT Model Availability");
    console.log("----------------------------------------");
    
    const model = "distilbert/distilbert-base-cased-distilled-squad";
    const apiUrl = `https://api-inference.huggingface.co/models/${model}`;
    
    try {
      console.log(`🔄 Testing distilbert model: ${apiUrl}`);
      
      // Test with a simple question and context
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: {
            question: "What is the transaction amount?",
            context: "EVEREST FOOD TRUCK 2 - $27.96 on 08/02/2025. WM SUPERCENTER #475 ROUND ROCK TX - $2.50 on 08/02/2025."
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ DistilBERT model working");
        console.log("   Response received:", data.answer ? "Yes" : "No");
        if (data.answer) {
          console.log("   Answer:", data.answer);
        }
        if (data.score) {
          console.log("   Confidence score:", data.score);
        }
      } else {
        console.log(`❌ DistilBERT model failed: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.log("   Error details:", errorText.substring(0, 200));
      }
    } catch (error) {
      console.log("❌ DistilBERT model test failed:", error.message);
    }

    // Test 2: Test with timeout
    console.log("\n⏱️ Test 2: Timeout Handling");
    console.log("----------------------------");
    
    try {
      console.log("🔄 Testing with 30-second timeout...");
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: {
            question: "What are the merchant names?",
            context: "DOMINO'S 6615 979-695-9912 TX - $15.13 on 07/30/2025. BUC-EE'S #35 TEMPLE TX - $35.96 on 07/28/2025."
          }
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Timeout test passed");
        console.log("   Response received within 30 seconds");
        console.log("   Answer:", data.answer || "No answer");
      } else {
        console.log(`❌ Timeout test failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log("❌ Request timed out after 30 seconds");
      } else {
        console.log("❌ Timeout test failed:", error.message);
      }
    }

    console.log("\n📋 Test Summary");
    console.log("===============");
    console.log("✅ DistilBERT model test completed");
    console.log("\n🎯 Benefits of DistilBERT model:");
    console.log("   - Fast and efficient: Distilled version of BERT");
    console.log("   - Question-answering: Perfect for extracting specific info");
    console.log("   - Free tier friendly: Smaller model size");
    console.log("   - High accuracy: Retains most of BERT's performance");
    console.log("\n🚀 Ready for financial document analysis!");

  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

// Run the distilbert model test
testDistilbertModel();
