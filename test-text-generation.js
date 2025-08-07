#!/usr/bin/env node

/**
 * Test Text Generation Models
 * Tests different models for comprehensive transaction extraction
 */

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, ".env") });

async function testTextGeneration() {
  console.log("🧪 Testing Text Generation Models");
  console.log("==================================\n");

  try {
    // Check API key
    const apiKey = process.env.VITE_HUGGINGFACE_API_KEY;
    if (!apiKey) {
      console.log("❌ No Hugging Face API key found");
      console.log("   Please set VITE_HUGGINGFACE_API_KEY in your .env file");
      return;
    }
    
    console.log(`✅ API key found: ${apiKey.substring(0, 10)}...`);

    // Test different text generation models
    const models = [
      "gpt2",
      "distilgpt2", 
      "EleutherAI/gpt-neo-125M",
      "microsoft/DialoGPT-small",
      "microsoft/DialoGPT-medium",
      "microsoft/DialoGPT-large",
    ];

    const sampleText = "EVEREST FOOD TRUCK 2 - $27.96 on 08/02/2025. WM SUPERCENTER #475 ROUND ROCK TX - $2.50 on 08/02/2025. DOMINO'S 6615 979-695-9912 TX - $15.13 on 07/30/2025. BUC-EE'S #35 TEMPLE TX - $35.96 on 07/28/2025. TACO BELL #030139 AUSTIN TX - $10.38 on 07/26/2025.";

    for (const model of models) {
      try {
        console.log(`\n🔄 Testing ${model}...`);
        
        const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: `Extract transactions: ${sampleText}`,
            parameters: {
              max_length: 200,
              temperature: 0.1,
              do_sample: false,
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${model}: Available`);
          console.log(`   Response: ${data[0]?.generated_text || 'No generated text'}`);
          console.log(`   Length: ${(data[0]?.generated_text || '').length} characters`);
        } else {
          console.log(`❌ ${model}: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log(`❌ ${model}: ${error.message}`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log("\n📋 Summary:");
    console.log("===========");
    console.log("✅ Available models can be used for transaction extraction");
    console.log("❌ Unavailable models should be avoided");

  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

// Run the text generation test
testTextGeneration();
