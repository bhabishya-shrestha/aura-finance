#!/usr/bin/env node

/**
 * Simple Hugging Face API Test
 * Tests the Hugging Face API directly without importing the service
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

    // Test 1: Test GPT-2 model (current model)
    console.log("\n🤖 Test 1: GPT-2 Model Test");
    console.log("----------------------------");

    const model = "gpt2";
    const apiUrl = `https://api-inference.huggingface.co/models/${model}`;

    try {
      console.log(`🔄 Testing GPT-2 model: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs:
            "Extract financial transactions: EVEREST FOOD TRUCK 2 - $27.96",
          parameters: {
            max_length: 100,
            min_length: 20,
            do_sample: false,
            num_beams: 3,
            early_stopping: true,
            temperature: 0.1,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ GPT-2 model working");
        console.log(
          "   Response received:",
          data[0]?.generated_text ? "Yes" : "No"
        );
        if (data[0]?.generated_text) {
          console.log(
            "   Generated text:",
            data[0].generated_text.substring(0, 100) + "..."
          );
        }
      } else {
        console.log(
          `❌ GPT-2 model failed: ${response.status} ${response.statusText}`
        );
        const errorText = await response.text();
        console.log("   Error details:", errorText.substring(0, 200));
      }
    } catch (error) {
      console.log("❌ GPT-2 model test failed:", error.message);
    }

    // Test 2: Test BART-CNN model (previous model)
    console.log("\n📰 Test 2: BART-CNN Model Test");
    console.log("-------------------------------");

    const bartModel = "facebook/bart-large-cnn";
    const bartApiUrl = `https://api-inference.huggingface.co/models/${bartModel}`;

    try {
      console.log(`🔄 Testing BART-CNN model: ${bartApiUrl}`);

      const response = await fetch(bartApiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs:
            "EVEREST FOOD TRUCK 2 - $27.96 on 08/02/2025. WM SUPERCENTER #475 ROUND ROCK TX - $2.50 on 08/02/2025.",
          parameters: {
            max_length: 150,
            min_length: 50,
            do_sample: false,
            num_beams: 5,
            early_stopping: true,
            temperature: 0.1,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ BART-CNN model working");
        console.log(
          "   Response received:",
          data[0]?.summary_text ? "Yes" : "No"
        );
        if (data[0]?.summary_text) {
          console.log(
            "   Summary text:",
            data[0].summary_text.substring(0, 100) + "..."
          );
        }
      } else {
        console.log(
          `❌ BART-CNN model failed: ${response.status} ${response.statusText}`
        );
        const errorText = await response.text();
        console.log("   Error details:", errorText.substring(0, 200));
      }
    } catch (error) {
      console.log("❌ BART-CNN model test failed:", error.message);
    }

    // Test 3: Test with timeout
    console.log("\n⏱️ Test 3: Timeout Test");
    console.log("----------------------");

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
          inputs:
            "Extract financial transactions from this text: EVEREST FOOD TRUCK 2 - $27.96 on 08/02/2025",
          parameters: {
            max_length: 500,
            min_length: 50,
            do_sample: false,
            num_beams: 3,
            early_stopping: true,
            temperature: 0.1,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Timeout test passed");
        console.log("   Response received within 30 seconds");
      } else {
        console.log(
          `❌ Timeout test failed: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("❌ Request timed out after 30 seconds");
      } else {
        console.log("❌ Timeout test failed:", error.message);
      }
    }

    console.log("\n📋 Test Summary");
    console.log("===============");
    console.log("✅ Simple Hugging Face API test completed");
    console.log("\n🔧 Recommendations:");
    console.log("   1. If GPT-2 works but BART-CNN doesn't, use GPT-2");
    console.log("   2. If both fail, check API key and permissions");
    console.log("   3. If timeout occurs, reduce max_length parameter");
    console.log("   4. Consider switching to Gemini API as fallback");
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

// Run the simple test
testHuggingFaceSimple();
