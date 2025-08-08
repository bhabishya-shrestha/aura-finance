#!/usr/bin/env node

/**
 * Cost Analysis for AI Providers
 * Compares costs between different AI providers
 */

function analyzeCosts() {
  console.log("💰 AI Provider Cost Analysis");
  console.log("============================\n");

  // Provider configurations
  const providers = {
    gemini: {
      costPerRequest: 0.001, // ~$0.001 per request (Gemini is very cheap)
      maxDailyRequests: 150,
      approachingLimitThreshold: 120,
    },
    huggingface: {
      costPerRequest: 0.001, // ~$0.001 per request (DialoGPT is much cheaper than DeepSeek)
      maxDailyRequests: 500,
      approachingLimitThreshold: 400,
    },
  };

  console.log("📊 Cost Comparison:");
  console.log("===================");

  for (const [provider, config] of Object.entries(providers)) {
    const dailyCost = config.costPerRequest * config.maxDailyRequests;
    const monthlyCost = dailyCost * 30;

    console.log(`\n🤖 ${provider.toUpperCase()}:`);
    console.log(`   Cost per request: $${config.costPerRequest.toFixed(3)}`);
    console.log(`   Daily limit: ${config.maxDailyRequests} requests`);
    console.log(`   Daily cost: $${dailyCost.toFixed(2)}`);
    console.log(`   Monthly cost (30 days): $${monthlyCost.toFixed(2)}`);
  }

  console.log("\n📈 Usage Scenarios:");
  console.log("===================");

  // Scenario 1: Light usage (10 requests/day)
  console.log("\n🔸 Light Usage (10 requests/day):");
  for (const [provider, config] of Object.entries(providers)) {
    const dailyCost = config.costPerRequest * 10;
    const monthlyCost = dailyCost * 30;
    console.log(
      `   ${provider}: $${dailyCost.toFixed(2)}/day, $${monthlyCost.toFixed(2)}/month`
    );
  }

  // Scenario 2: Medium usage (25 requests/day)
  console.log("\n🔸 Medium Usage (25 requests/day):");
  for (const [provider, config] of Object.entries(providers)) {
    const dailyCost = config.costPerRequest * 25;
    const monthlyCost = dailyCost * 30;
    console.log(
      `   ${provider}: $${dailyCost.toFixed(2)}/day, $${monthlyCost.toFixed(2)}/month`
    );
  }

  // Scenario 3: Heavy usage (max daily limit)
  console.log("\n🔸 Heavy Usage (max daily limit):");
  for (const [provider, config] of Object.entries(providers)) {
    const dailyCost = config.costPerRequest * config.maxDailyRequests;
    const monthlyCost = dailyCost * 30;
    console.log(
      `   ${provider}: $${dailyCost.toFixed(2)}/day, $${monthlyCost.toFixed(2)}/month`
    );
  }

  console.log("\n💡 Recommendations:");
  console.log("===================");
  console.log("• Both Gemini and Hugging Face are now cost-effective");
  console.log("• DialoGPT provides good quality at very low cost");
  console.log("• Choose based on performance preference, not cost");
  console.log("• Monitor daily usage to stay within limits");

  console.log("\n⚠️  Important Notes:");
  console.log("===================");
  console.log("• These are estimated costs based on current pricing");
  console.log("• Actual costs may vary based on API provider pricing changes");
  console.log("• Daily limits are enforced to control costs");
  console.log("• Consider implementing usage alerts for cost management");

  console.log("\n🔒 Current Limits:");
  console.log("==================");
  console.log("• Gemini: 150 requests/day, 5 requests/minute");
  console.log("• Hugging Face: 50 requests/day, 2 requests/minute");
  console.log("• Hugging Face retry delay: 20 seconds");
  console.log("• Gemini retry delay: 12 seconds");
}

// Run the cost analysis
analyzeCosts();
