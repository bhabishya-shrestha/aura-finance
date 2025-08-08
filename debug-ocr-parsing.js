/**
 * Debug script to analyze OCR parsing issues
 */

// Actual OCR output from the user's console
const actualOCROutput = `
Posting Date | Description Type v| Amount Balance
(® 02/10/2025 AMAZON MKTPL*Q751Z1TH3 Amzn.com/bill WA pr: $15.14 $16.40
(» 02/10/2023 ALDI 75040 PLANO TX Bd $42.22 -$31.54
(® 02/10/2025 AMAZON MKTPLACE PMTS Amzn.com/billWA B= -$7.57 $73.76
(» 02/10/2023 AMAZON MKTPLACE PMTS Amzn.com/billWA Hr $10.81 -$66.19
(® 02/10/2025 Online payment from SAV 7106 <M $42.22 -$55.38
( 02/07/2025 AMAZON MKTPL*Z713289W0 Amzn.com/bill WA p $7.57 -$13.16
( 02/06/2025 Online payment from CHK 7012 <M $10.00 -$20.73
( 02/05/2025 WALMART SUPERCENTER #1234 PLANO TX Bd $30.26 -$10.73
( 02/03/2025 STARBUCKS STORE 10001 AUSTIN TX Bd $42.96 -$12.69
( 02/01/2025 NETFLIX.COM NETFLIX.COM/BILL CA Bd $2.65 -$9.96
( 01/31/2025 SPOTIFY USA SPOTIFY.COM NY Bd $21.28 -$7.31
( 01/27/2025 UBER *TRIP 01/15 UBER.COM Bd $5.00 -$13.97
( 01/25/2025 LYFT *RIDE 01/14 LYFT.COM Bd $6.50 -$8.97
( 01/24/2025 H-E-B #123 AUSTIN TX Bd $13.60 -$2.47
( 01/23/2028 TARGET T-1234 AUSTIN TX Bd $78.55 -$16.07
( 01/21/2028 COSTCO WHSE #123 AUSTIN TX Bd $18.78 -$94.62
( 01/21/2025 SHELL OIL 57557551 AUSTIN TX Bd $12.66 -$75.84
( 01/20/2023 VALERO 12345678 AUSTIN TX Bd $3.99 -$63.18
( 01/18/2025 CHIPOTLE 1234 AUSTIN TX Bd $1.94 -$59.19
( 01/16/2023 PANERA BREAD #123 AUSTIN TX Bd $6.67 -$57.25
( 01/15/2025 JIMMY JOHN'S #123 AUSTIN TX Bd $9.87 -$50.58
( 01/14/2025 SUBWAY #12345 AUSTIN TX Bd $7.65 -$40.71
( 01/13/2025 PIZZA HUT #123 AUSTIN TX Bd $16.78 -$33.06
( 01/12/2025 PAPA JOHN'S #123 AUSTIN TX Bd $14.56 -$16.28
( 01/11/2025 LITTLE CAESARS #123 AUSTIN TX Bd $6.78 -$1.72
( 01/10/2025 MCDONALD'S #12345 AUSTIN TX Bd $8.90 $5.18
( 01/09/2025 BURGER KING #123 AUSTIN TX Bd $7.89 $14.08
( 01/08/2025 WENDY'S #123 AUSTIN TX Bd $6.54 $21.97
( 01/07/2025 SHEETZ #123 AUSTIN TX Bd $12.34 $28.51
( 01/06/2025 WAWA #123 AUSTIN TX Bd $9.87 $40.85
( 01/05/2025 QUIKTRIP #123 AUSTIN TX Bd $5.43 $50.72
Beginning balance as of 01/05/2025 | $56.15
`;

function analyzeOCRFormat() {
  console.log("🔍 Analyzing OCR Output Format");
  console.log("=".repeat(60));

  const lines = actualOCROutput
    .split("\n")
    .filter(line => line.trim().length > 0);

  console.log("📄 Sample Lines:");
  lines.slice(1, 5).forEach((line, index) => {
    console.log(`${index + 1}. "${line}"`);
  });

  console.log("\n🔍 Pattern Analysis:");

  // Test different regex patterns
  const testPatterns = [
    {
      name: "Current Pattern 1",
      pattern:
        /\([®»]\s*([0-9]{2}\/[0-9]{2}\/[0-9]{4})\s+([A-Z][A-Z\s&.,#0-9*-]+?)\s+[A-Za-z\s&.,#0-9*-]*\s+\$?([0-9,]+\.?[0-9]*)\s+\$?[0-9,]+\.?[0-9]*/gi,
    },
    {
      name: "Current Pattern 2",
      pattern:
        /([0-9]{2}\/[0-9]{2}\/[0-9]{4})\s+([A-Z][A-Z\s&.,#0-9*-]+?)\s+[A-Za-z\s&.,#0-9*-]*\s+\$?([0-9,]+\.?[0-9]*)\s+\$?[0-9,]+\.?[0-9]*/gi,
    },
    {
      name: "New Pattern - Focus on Amount",
      pattern:
        /([0-9]{2}\/[0-9]{2}\/[0-9]{4})\s+([A-Z][A-Z\s&.,#0-9*-]+?)\s+[A-Za-z\s&.,#0-9*-]*\s+\$([0-9,]+\.?[0-9]*)\s+\$?[0-9,]+\.?[0-9]*/gi,
    },
    {
      name: "Simplified Pattern",
      pattern:
        /([0-9]{2}\/[0-9]{2}\/[0-9]{4})\s+([A-Z][A-Z\s&.,#0-9*-]+?)\s+\$([0-9,]+\.?[0-9]*)/gi,
    },
  ];

  for (const testPattern of testPatterns) {
    console.log(`\n🧪 Testing: ${testPattern.name}`);
    console.log("-".repeat(40));

    let matchCount = 0;
    for (const line of lines) {
      const matches = [...line.matchAll(testPattern.pattern)];
      for (const match of matches) {
        matchCount++;
        console.log(`Match ${matchCount}:`);
        console.log(`  Full: "${match[0]}"`);
        console.log(`  Date: "${match[1]}"`);
        console.log(`  Description: "${match[2]}"`);
        console.log(`  Amount: "${match[3]}"`);
        console.log(`  Line: "${line}"`);
        console.log("");
      }
    }

    console.log(`Total matches: ${matchCount}`);
  }
}

function testImprovedPatterns() {
  console.log("\n🔧 Testing Improved Patterns");
  console.log("=".repeat(60));

  // Improved patterns based on analysis
  const improvedPatterns = [
    // Pattern 1: Handle OCR artifacts and extract correct amounts
    /([0-9]{2}\/[0-9]{2}\/[0-9]{4})\s+([A-Z][A-Z\s&.,#0-9*-]+?)\s+[A-Za-z\s&.,#0-9*-]*\s+\$([0-9,]+\.?[0-9]*)\s+\$?[0-9,]+\.?[0-9]*/gi,
    // Pattern 2: Handle lines without OCR artifacts
    /([0-9]{2}\/[0-9]{2}\/[0-9]{4})\s+([A-Z][A-Z\s&.,#0-9*-]+?)\s+[A-Za-z\s&.,#0-9*-]*\s+\$([0-9,]+\.?[0-9]*)\s+\$?[0-9,]+\.?[0-9]*/gi,
    // Pattern 3: Simplified version focusing on key elements
    /([0-9]{2}\/[0-9]{2}\/[0-9]{4})\s+([A-Z][A-Z\s&.,#0-9*-]+?)\s+\$([0-9,]+\.?[0-9]*)/gi,
  ];

  const allMatches = [];
  const lines = actualOCROutput
    .split("\n")
    .filter(line => line.trim().length > 0);

  for (const line of lines) {
    for (const pattern of improvedPatterns) {
      const matches = [...line.matchAll(pattern)];
      for (const match of matches) {
        if (match[0].includes("Beginning balance")) continue;

        const date = match[1];
        const description = match[2].trim();
        const amount = match[3].replace(/,/g, "");

        // Clean up description by removing common OCR artifacts
        let cleanDescription = description;

        // Remove common OCR artifacts and partial matches
        const artifactsToRemove = [
          " Bd",
          " Hr",
          " p",
          " <M",
          " pr:",
          " B=",
          " NETFLIX.COM/BILL",
          " SPOTIFY.COM",
          " UBER.COM",
          " LYFT.COM",
          " Amzn.com/bill",
          " Amzn.com/billWA",
          " Amzn.com/bill CA",
          " Amzn.com/bill WA",
          " 7106",
          " 7012",
          " 1234",
          " 10001",
          " 57557551",
          " 12345678",
          " 12345",
          " 01/15",
          " 01/14",
          " 01/13",
          " 01/12",
          " 01/11",
          " 01/10",
          " 01/09",
          " 01/08",
          " 01/07",
          " 01/06",
          " 01/05",
          " 02/10",
          " 02/07",
          " 02/06",
          " 02/05",
          " 02/03",
          " 02/01",
          " 01/31",
          " 01/27",
          " 01/25",
          " 01/24",
          " 01/23",
          " 01/21",
          " 01/20",
          " 01/18",
          " 01/16",
          " 01/15",
          " 01/14",
          " 01/13",
          " 01/12",
          " 01/11",
          " 01/10",
          " 01/09",
          " 01/08",
          " 01/07",
          " 01/06",
          " 01/05",
        ];

        for (const artifact of artifactsToRemove) {
          cleanDescription = cleanDescription.replace(artifact, "");
        }

        // Additional cleanup
        cleanDescription = cleanDescription.replace(/\s+/g, " ").trim();

        // Skip if description is too short or just numbers/dates
        if (cleanDescription.length < 3) continue;
        if (/^[0-9]+$/.test(cleanDescription)) continue;
        if (/^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/.test(cleanDescription)) continue;

        // Skip if amount is not valid
        if (isNaN(parseFloat(amount))) continue;
        if (parseFloat(amount) < 0.01 || parseFloat(amount) > 1000000) continue;

        allMatches.push({
          description: cleanDescription,
          amount: parseFloat(amount),
          date: date,
          originalLine: line,
        });
      }
    }
  }

  // Remove duplicates
  const uniqueMatches = [];
  for (const match of allMatches) {
    const isDuplicate = uniqueMatches.some(
      t =>
        t.description === match.description &&
        Math.abs(t.amount - match.amount) < 0.01 &&
        t.date === match.date
    );
    if (!isDuplicate) {
      uniqueMatches.push(match);
    }
  }

  console.log(`📋 Extracted ${uniqueMatches.length} transactions`);
  console.log("\n📄 Sample Transactions:");
  uniqueMatches.slice(0, 10).forEach((transaction, index) => {
    console.log(
      `${index + 1}. ${transaction.description} | $${transaction.amount} | ${transaction.date}`
    );
  });

  const expectedTransactions = 27;
  const successRate = (uniqueMatches.length / expectedTransactions) * 100;
  console.log(
    `\n🎯 Success Rate: ${successRate.toFixed(1)}% (${uniqueMatches.length}/${expectedTransactions})`
  );

  return uniqueMatches;
}

// Run the analysis
analyzeOCRFormat();
testImprovedPatterns();
