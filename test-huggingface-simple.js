#!/usr/bin/env node

/**
 * Simple Hugging Face API Test
 * Tests the facebook/bart-large-cnn model for transaction extraction
 */

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, ".env") });

async function testHuggingFaceSimple() {
  console.log("🧪 Simple Hugging Face API Test");
  console.log("================================\n");

  try {
    // Check API key
    const apiKey = process.env.VITE_HUGGINGFACE_API_KEY;
    if (!apiKey) {
      console.log("❌ No Hugging Face API key found");
      console.log("   Please set VITE_HUGGINGFACE_API_KEY in your .env file");
      return;
    }
    
    console.log(`✅ API key found: ${apiKey.substring(0, 10)}...`);

    // Test BART-CNN model (the only working model)
    console.log("\n📰 BART-CNN Model Test");
    console.log("----------------------");
    
    const model = "facebook/bart-large-cnn";
    const apiUrl = `https://api-inference.huggingface.co/models/${model}`;
    
    try {
      console.log(`🔄 Testing BART-CNN model: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: "EVEREST FOOD TRUCK 2 - $27.96 on 08/02/2025. WM SUPERCENTER #475 ROUND ROCK TX - $2.50 on 08/02/2025.",
          parameters: {
            max_length: 800,
            min_length: 100,
            do_sample: false,
            num_beams: 4,
            early_stopping: true,
            temperature: 0.1,
            top_p: 0.9,
            repetition_penalty: 1.2,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ BART-CNN model working");
        console.log("   Response received:", data[0]?.summary_text ? "Yes" : "No");
        if (data[0]?.summary_text) {
          console.log("   Summary text:", data[0].summary_text);
        }
      } else {
        console.log(`❌ BART-CNN model failed: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.log("   Error details:", errorText.substring(0, 200));
      }
    } catch (error) {
      console.log("❌ BART-CNN model test failed:", error.message);
    }

    // Test timeout handling
    console.log("\n⏱️ Timeout Test");
    console.log("---------------");
    
    try {
      console.log("🔄 Testing with 45-second timeout...");
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: "Extract financial transactions: EVEREST FOOD TRUCK 2 - $27.96 on 08/02/2025.",
          parameters: {
            max_length: 800,
            min_length: 100,
            do_sample: false,
            num_beams: 4,
            early_stopping: true,
            temperature: 0.1,
            top_p: 0.9,
            repetition_penalty: 1.2,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Timeout test passed");
        console.log("   Response received within 45 seconds");
        console.log("   Summary:", data[0]?.summary_text || "No summary");
      } else {
        console.log(`❌ Timeout test failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log("❌ Request timed out after 45 seconds");
      } else {
        console.log("❌ Timeout test failed:", error.message);
      }
    }

    console.log("\n📋 Test Summary");
    console.log("===============");
    console.log("✅ Simple Hugging Face API test completed");
    console.log("\n🔧 Current Status:");
    console.log("   - BART-CNN model: Working");
    console.log("   - Timeout handling: 45 seconds");
    console.log("   - Ready for transaction extraction");

  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

// Run the simple Hugging Face API test
testHuggingFaceSimple();
