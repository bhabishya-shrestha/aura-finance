#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const plaidServicePath = path.join(
  __dirname,
  "..",
  "src",
  "services",
  "plaidService.js"
);

// Read the file
let content = fs.readFileSync(plaidServicePath, "utf8");

// Function to remove try/catch wrappers
function removeTryCatchWrappers(content) {
  // Pattern to match try/catch blocks that just re-throw
  const tryCatchPattern =
    /(\s+)try\s*{\s*([^}]+)\s*}\s*catch\s*\(\s*error\s*\)\s*{\s*throw\s+error\s*;\s*}/g;

  return content.replace(tryCatchPattern, (match, indent, tryContent) => {
    // Remove the try/catch wrapper and keep the content with proper indentation
    const lines = tryContent.split("\n");
    const indentedLines = lines.map((line) => {
      if (line.trim() === "") return "";
      return indent + line;
    });
    return indentedLines.join("\n");
  });
}

// Apply the fix multiple times to catch all instances
let previousContent = "";
while (content !== previousContent) {
  previousContent = content;
  content = removeTryCatchWrappers(content);
}

// Write the file back
fs.writeFileSync(plaidServicePath, content, "utf8");

console.log("Fixed remaining try/catch wrappers in plaidService.js");
