#!/usr/bin/env node

/**
 * Direct Hugging Face Service Test
 * Tests the Hugging Face service directly with a test image
 */

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, ".env") });

// Mock import.meta.env for Node.js environment
global.import = {
  meta: {
    env: process.env,
  },
};

import huggingFaceService from "./src/services/huggingFaceService.js";

async function testHuggingFaceDirect() {
  console.log("🧪 Direct Hugging Face Service Test");
  console.log("====================================\n");

  try {
    // Test 1: Check if service is available
    console.log("🔍 Test 1: Service Availability");
    console.log("--------------------------------");

    const isAvailable = huggingFaceService.isProviderAvailable();
    console.log(`Hugging Face available: ${isAvailable ? "✅" : "❌"}`);

    if (!isAvailable) {
      console.log("❌ Hugging Face service is not available");
      console.log(
        "   Please check your VITE_HUGGINGFACE_API_KEY environment variable"
      );
      return;
    }

    // Test 2: Check API key
    console.log("\n🔑 Test 2: API Key Check");
    console.log("------------------------");

    const apiKey = process.env.VITE_HUGGINGFACE_API_KEY;
    if (!apiKey) {
      console.log("❌ No Hugging Face API key found");
      console.log("   Please set VITE_HUGGINGFACE_API_KEY in your .env file");
      return;
    }

    console.log(`✅ API key found: ${apiKey.substring(0, 10)}...`);
    console.log(`✅ Model: ${huggingFaceService.getBestModel()}`);

    // Test 3: Test text analysis (without image)
    console.log("\n📝 Test 3: Text Analysis");
    console.log("------------------------");

    const testText = `Transaction 1: EVEREST FOOD TRUCK 2 - $27.96 on 08/02/2025
Transaction 2: WM SUPERCENTER #475 ROUND ROCK TX - $2.50 on 08/02/2025
Transaction 3: DOMINO'S 6615 979-695-9912 TX - $15.13 on 07/30/2025`;

    try {
      console.log("🔄 Testing text analysis...");
      const textResult = await huggingFaceService.extractFromText(testText);
      console.log("✅ Text analysis successful");
      console.log(
        "   Transactions found:",
        textResult.transactions?.length || 0
      );
      console.log(
        "   Analysis:",
        textResult.analysis?.substring(0, 100) + "..."
      );
    } catch (error) {
      console.log("❌ Text analysis failed:", error.message);
    }

    // Test 4: Test API endpoint directly
    console.log("\n🌐 Test 4: Direct API Test");
    console.log("--------------------------");

    const model = huggingFaceService.getBestModel();
    const apiUrl = `https://api-inference.huggingface.co/models/${model}`;

    try {
      console.log(`🔄 Testing API endpoint: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: "Hello, this is a test message.",
          parameters: {
            max_length: 50,
            min_length: 10,
            do_sample: false,
            num_beams: 1,
            early_stopping: true,
            temperature: 0.1,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ API endpoint working");
        console.log(
          "   Response received:",
          data[0]?.generated_text ? "Yes" : "No"
        );
      } else {
        console.log(
          `❌ API endpoint failed: ${response.status} ${response.statusText}`
        );
        const errorText = await response.text();
        console.log("   Error details:", errorText.substring(0, 200));
      }
    } catch (error) {
      console.log("❌ API endpoint test failed:", error.message);
    }

    // Test 5: Test rate limiting
    console.log("\n⏱️ Test 5: Rate Limiting");
    console.log("------------------------");

    try {
      await huggingFaceService.checkRateLimit();
      console.log("✅ Rate limit check passed");
    } catch (error) {
      console.log("❌ Rate limit check failed:", error.message);
    }

    console.log("\n📋 Test Summary");
    console.log("===============");
    console.log("✅ Direct Hugging Face service test completed");
    console.log("\n🔧 If tests failed, check:");
    console.log("   1. VITE_HUGGINGFACE_API_KEY is set in .env");
    console.log("   2. API key is valid and has proper permissions");
    console.log("   3. Model is available and not rate limited");
    console.log("   4. Network connectivity to Hugging Face API");
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

// Run the direct test
testHuggingFaceDirect();
