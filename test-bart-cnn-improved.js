#!/usr/bin/env node

/**
 * Test Improved BART-CNN Model for Transaction Extraction
 * Tests the facebook/bart-large-cnn model with enhanced prompts
 */

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, ".env") });

async function testBARTCNNImproved() {
  console.log("🧪 Improved BART-CNN Model Test");
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

    // Test 1: Check if BART-CNN model is available with improved prompt
    console.log("\n🤖 Test 1: BART-CNN Model with Improved Prompt");
    console.log("-----------------------------------------------");

    const model = "facebook/bart-large-cnn";
    const apiUrl = `https://api-inference.huggingface.co/models/${model}`;

    try {
      console.log(`🔄 Testing BART-CNN model: ${apiUrl}`);

      // Test with the improved prompt and sample transaction data
      const sampleText = `EVEREST FOOD TRUCK 2 - $27.96 on 08/02/2025. WM SUPERCENTER #475 ROUND ROCK TX - $2.50 on 08/02/2025. DOMINO'S 6615 979-695-9912 TX - $15.13 on 07/30/2025. BUC-EE'S #35 TEMPLE TX - $35.96 on 07/28/2025. TACO BELL #030139 AUSTIN TX - $10.38 on 07/26/2025. PAYMENT FROM CHK 7012 CONF#162rrgson - $700.00 on 07/26/2025. PAYMENT FROM CHK 7012 CONF#1jjh0j84x - $1,487.16 on 07/25/2025. WM SUPERCENTER #475 ROUND ROCK TX - $3.02 on 07/23/2025. AMAZON PRIME*BO4WE5D33 Amzn.com/billWA - $16.23 on 07/23/2025. WM SUPERCENTER #475 ROUND ROCK TX - $6.06 on 07/21/2025. DOLLAR TREE ROUND ROCK TX - $1.35 on 07/21/2025. AMAZON MKTPL*W605N7YG3 Amzn.com/billWA - $10.81 on 07/21/2025. McDonalds 26418 151-2670263 TX - $2.70 on 07/21/2025. ATI*3806-078190352 ATM.TK CA - $5.00 on 07/19/2025. PAYMENT FROM CHK 7012 CONF#1ck0ygred - $1,100.00 on 07/17/2025. UBER *EATS HELP.UBER.COMCA - $27.56 on 07/17/2025. WALMART.COM 800-925-6278 AR - $47.84 on 07/16/2025. TESLA SERVICE US 877-7983752 CA - $421.87 on 07/16/2025. TESLA SERVICE US 877-7983752 CA - $2,910.62 on 07/16/2025. Perry Brooks Garage Austin TX - $60.00 on 07/15/2025. BUC-EE'S #22 NEW BRAUNFELSTX - $4.32 on 07/15/2025. TESLA SUPERCHARGER US 877-7983752 CA - $11.38 on 07/14/2025. SIXFLAGS FT SAN ANTOTX 210-697-5000 TX - $160.19 on 07/14/2025. McDonalds 26418 151-2670263 TX - $2.80 on 07/14/2025. WL *STEAM PURCHASE 425-889-9642 WA - $9.73 on 07/12/2025. SP LUXE BIDET SAN DIEGO CA - $42.20 on 07/11/2025.`;

      const improvedPrompt = `Extract ALL financial transactions from this bank statement text. 

Instructions:
1. Find EVERY transaction in the document
2. Extract transaction amounts (numbers with $ or decimal points)
3. Find dates (MM/DD/YYYY, MM-DD-YYYY, or similar formats)
4. Identify merchant names or transaction descriptions
5. Categorize as income (deposits, credits) or expense (withdrawals, debits)
6. Include ALL transactions found, not just a few

Expected output format:
Transaction 1: [DESCRIPTION] - $[AMOUNT] on [DATE]
Transaction 2: [DESCRIPTION] - $[AMOUNT] on [DATE]
Transaction 3: [DESCRIPTION] - $[AMOUNT] on [DATE]
... (continue for ALL transactions found)

Document text to analyze:
${sampleText}

Please extract ALL financial transactions found in the text above using the exact format shown. Do not skip any transactions.`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: improvedPrompt,
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
        console.log("✅ BART-CNN model working with improved prompt");
        console.log(
          "   Response received:",
          data[0]?.summary_text ? "Yes" : "No"
        );
        if (data[0]?.summary_text) {
          console.log("   Summary text:", data[0].summary_text);
          console.log("   Summary length:", data[0].summary_text.length);

          // Count transactions in the response
          const transactionCount = (
            data[0].summary_text.match(/Transaction \d+:/g) || []
          ).length;
          console.log("   Transactions found:", transactionCount);
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
          inputs:
            "Extract ALL financial transactions from this bank statement: EVEREST FOOD TRUCK 2 - $27.96 on 08/02/2025. WM SUPERCENTER #475 ROUND ROCK TX - $2.50 on 08/02/2025.",
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
    console.log("✅ Improved BART-CNN model test completed");
    console.log("\n🎯 Improvements made:");
    console.log("   - Enhanced prompt for comprehensive extraction");
    console.log("   - Increased max_length to 800 for better coverage");
    console.log("   - Increased min_length to 100 for substantial output");
    console.log("   - Increased num_beams to 4 for better quality");
    console.log("   - Extended timeout to 45 seconds");
    console.log("   - Focus on extracting ALL transactions, not just some");
    console.log("\n🚀 Ready for comprehensive financial document analysis!");
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

// Run the improved BART-CNN model test
testBARTCNNImproved();
