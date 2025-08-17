/**
 * Lighthouse Authentication Script
 *
 * This script logs in with test credentials before Lighthouse runs performance tests.
 * It ensures the app is in an authenticated state for realistic testing.
 */

module.exports = async page => {
  console.log("🔐 Starting authentication for Lighthouse...");

  try {
    // Navigate to the auth page
    await page.goto("http://localhost:4173/auth");
    console.log("✅ Navigated to auth page");

    // Wait for the login form to be ready
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    console.log("✅ Login form loaded");

    // Fill in the test credentials
    await page.type('input[type="email"]', "tarussilver1@gmail.com");
    await page.type('input[type="password"]', "Test1234");
    console.log("✅ Credentials entered");

    // Click the login button
    await page.click('button[type="submit"]');
    console.log("✅ Login button clicked");

    // Wait for authentication to complete and redirect to dashboard
    await page.waitForNavigation({
      waitUntil: "networkidle0",
      timeout: 15000,
    });
    console.log("✅ Authentication completed, redirected to dashboard");

    // Wait a bit more for the app to fully load
    await page.waitForTimeout(2000);
    console.log("✅ App fully loaded and ready for testing");
  } catch (error) {
    console.error("❌ Authentication failed:", error.message);
    // Continue anyway - Lighthouse will test the auth page if login fails
  }
};
