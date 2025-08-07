#!/usr/bin/env node

/**
 * Test Donut Model for Document Question Answering
 * Tests the naver-clova-ix/donut-base-finetuned-docvqa model
 */

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, ".env") });

async function testDonutModel() {
  console.log("🧪 Donut Model Test");
  console.log("==================\n");

  try {
    // Check API key
    const apiKey = process.env.VITE_HUGGINGFACE_API_KEY;
    if (!apiKey) {
      console.log("❌ No Hugging Face API key found");
      console.log("   Please set VITE_HUGGINGFACE_API_KEY in your .env file");
      return;
    }

    console.log(`✅ API key found: ${apiKey.substring(0, 10)}...`);

    // Test 1: Check if donut model is available
    console.log("\n🤖 Test 1: Donut Model Availability");
    console.log("-----------------------------------");

    const model = "naver-clova-ix/donut-base-finetuned-docvqa";
    const apiUrl = `https://api-inference.huggingface.co/models/${model}`;

    try {
      console.log(`🔄 Testing donut model: ${apiUrl}`);

      // Test with a simple question (without image for availability check)
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: {
            image:
              "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", // 1x1 transparent PNG
            question: "What is this document?",
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Donut model working");
        console.log("   Response received:", data[0]?.answer ? "Yes" : "No");
        if (data[0]?.answer) {
          console.log("   Answer:", data[0].answer.substring(0, 100) + "...");
        }
      } else {
        console.log(
          `❌ Donut model failed: ${response.status} ${response.statusText}`
        );
        const errorText = await response.text();
        console.log("   Error details:", errorText.substring(0, 200));
      }
    } catch (error) {
      console.log("❌ Donut model test failed:", error.message);
    }

    // Test 2: Test with timeout
    console.log("\n⏱️ Test 2: Timeout Handling");
    console.log("----------------------------");

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
          inputs: {
            image:
              "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
            question: "What is this document?",
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Timeout test passed");
        console.log("   Response received within 45 seconds");
      } else {
        console.log(
          `❌ Timeout test failed: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("❌ Request timed out after 45 seconds");
      } else {
        console.log("❌ Timeout test failed:", error.message);
      }
    }

    console.log("\n📋 Test Summary");
    console.log("===============");
    console.log("✅ Donut model test completed");
    console.log("\n🎯 Benefits of Donut model:");
    console.log("   - OCR-free: No separate OCR processing needed");
    console.log("   - Document-specific: Designed for document analysis");
    console.log(
      "   - Question-answering: Perfect for extracting specific info"
    );
    console.log("   - Free tier friendly: More efficient than large models");
    console.log("\n🚀 Ready for financial document analysis!");
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

// Run the donut model test
testDonutModel();
