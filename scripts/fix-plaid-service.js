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
  "plaidService.js",
);

// Read the file
let content = fs.readFileSync(plaidServicePath, "utf8");

// Remove unnecessary try/catch wrappers
// Pattern: try { ... } catch (error) { throw error; }
const tryCatchPattern =
  /(\s+)try\s*{\s*([^}]+)\s*}\s*catch\s*\(\s*error\s*\)\s*{\s*throw\s+error\s*;\s*}/g;

content = content.replace(tryCatchPattern, (match, indent, tryContent) => {
  // Remove the try/catch wrapper and keep the content
  return indent + tryContent.trim();
});

// Write the file back
fs.writeFileSync(plaidServicePath, content, "utf8");

console.log("Fixed unnecessary try/catch wrappers in plaidService.js");
