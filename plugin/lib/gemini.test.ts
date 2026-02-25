/**
 * Tests for Google Gemini API authentication module
 * 
 * Tests verify:
 * 1. API key NOT in URL query parameter
 * 2. API key in x-goog-api-key header
 * 3. Security: apiKey not logged or exposed in error messages
 * 4. Factory pattern implementation
 * 
 * NOTE: These are static analysis tests that verify the source code structure.
 * Coverage reports will show 0% because tests read source code as text rather
 * than executing the module at runtime.
 */

import { describe, it, expect } from "vitest";

// ============================================================================
// Test 1: API Key NOT in URL
// ============================================================================

describe("API Key Security: Not in URL", () => {
  it("should not contain ?key= query parameter in URL", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "gemini.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Verify the URL does NOT contain ?key= pattern
    const urlContainsKeyParam = sourceCode.includes("?key=");
    expect(urlContainsKeyParam).toBe(false);
  });

  it("should not embed apiKey value in URL string", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "gemini.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Check that the URL constant is a clean endpoint
    const urlDef = sourceCode.match(/baseUrl\s*:\s*['"][^'"]+['"]/);
    expect(urlDef).not.toBeNull();

    // Verify the URL doesn't contain template literals with apiKey
    const urlConstant = urlDef![0];
    expect(urlConstant).not.toContain("${");
    expect(urlConstant).not.toContain("apiKey");
  });

  it("should use clean endpoint URL without query parameters", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "gemini.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Verify the URL is just the endpoint
    expect(sourceCode).toContain(
      "https://generativelanguage.googleapis.com"
    );

    // Should NOT have URL construction with apiKey
    const urlConstructionPatterns = [
      "`.*\\$\\{apiKey\\}",
      "\\+\\s*apiKey",
      "apiKey\\s*\\+",
    ];

    for (const pattern of urlConstructionPatterns) {
      const regex = new RegExp(pattern);
      expect(regex.test(sourceCode)).toBe(false);
    }
  });
});

// ============================================================================
// Test 2: API Key in Header
// ============================================================================

describe("API Key Security: In Header", () => {
  it("should set x-goog-api-key header with apiKey value", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "gemini.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Verify the header is set correctly (source uses double quotes)
    expect(sourceCode).toContain('"x-goog-api-key": key');
  });

  it("should include x-goog-api-key in authHeader function", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "gemini.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Find the authHeader function in config - check for the pattern
    const authHeaderPattern = /authHeader:\s*\(key:\s*string\)\s*=>\s*\(\s*{[\s\S]*?"x-goog-api-key"[\s\S]*?}\s*\)/;
    expect(authHeaderPattern.test(sourceCode)).toBe(true);
  });

  it("should have properly formatted x-goog-api-key header", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "gemini.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Check that the header uses the correct format
    // Should be: "x-goog-api-key": key or 'x-goog-api-key': key
    const headerPattern = /["']x-goog-api-key["']\s*:\s*key/;
    expect(headerPattern.test(sourceCode)).toBe(true);
  });

  it("should not use Authorization header with Bearer token", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "gemini.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Gemini API uses x-goog-api-key header, not Authorization: Bearer
    // Verify we're NOT using the old Authorization pattern
    const authHeaderPattern = /Authorization:\s*['"]Bearer\s+\$\{[^}]+\}['"]/;
    expect(authHeaderPattern.test(sourceCode)).toBe(false);
  });
});

// ============================================================================
// Test 3: Security - No API Key Exposure
// ============================================================================

describe("Security: No API Key Exposure", () => {
  it("should not log apiKey in error messages", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "gemini.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Check that error messages don't contain the actual apiKey value
    // Error messages should only use t.geminiInvalidKey or similar
    const errorLines = sourceCode.match(/throw new Error\([^)]+\)/g);

    if (errorLines) {
      for (const line of errorLines) {
        // Error messages should not contain apiKey variable
        expect(line).not.toContain("apiKey");
      }
    }
  });

  it("should not include apiKey in URL construction for error messages", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "gemini.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Verify apiKey is never concatenated into error strings
    const dangerousPatterns = [
      "`.*\\$\\{apiKey\\}",
      "\\+\\s*apiKey",
      "apiKey\\s*\\+",
    ];

    for (const pattern of dangerousPatterns) {
      const regex = new RegExp(pattern);
      expect(regex.test(sourceCode)).toBe(false);
    }
  });

  it("should not expose apiKey in fetch response handling", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "gemini.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Check error handling blocks
    const errorHandling = sourceCode.match(/if \(!response\.ok\)[\s\S]*?throw new Error\([^)]+\)/s);
    if (errorHandling) {
      const errorBlock = errorHandling[0];
      // Verify errorText is used alone, not concatenated with apiKey
      expect(errorBlock).not.toContain("apiKey");
    }
  });

  it("should mask apiKey before displaying in output", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "gemini.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Verify maskString is used on apiKey before display
    expect(sourceCode).toContain("maskString(apiKey)");
  });

  it("should not have console.log statements that could leak apiKey", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "gemini.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Check for console.log statements
    const consoleLogs = sourceCode.match(/console\.(log|error|warn|info|debug)[^;]*;/g);

    if (consoleLogs) {
      for (const log of consoleLogs) {
        // Verify no apiKey is logged
        expect(log).not.toContain("apiKey");
      }
    }
  });
});

// ============================================================================
// Test 4: Factory Pattern Implementation
// ============================================================================

describe("Factory Pattern", () => {
  it("should import createProviderQueryWithHeaders from provider-factory", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "gemini.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("createProviderQueryWithHeaders");
    expect(sourceCode).toContain('from "./provider-factory"');
  });

  it("should use geminiConfig object for factory configuration", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "gemini.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("geminiConfig");
    expect(sourceCode).toContain("name: \"Gemini\"");
    expect(sourceCode).toContain("endpoint: \"/v1beta/models\"");
  });

  it("should export queryGeminiUsage as factory result", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "gemini.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("export const queryGeminiUsage = createProviderQueryWithHeaders(geminiConfig)");
  });

  it("should have parseHeaders function in config", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "gemini.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("parseHeaders:");
    expect(sourceCode).toContain("headers.get(\"x-ratelimit-limit\")");
  });

  it("should use formatGeminiUsage for transform", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "gemini.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("transform:");
    expect(sourceCode).toContain("formatGeminiUsage");
  });
});

// ============================================================================
// Test 5: Code Structure Verification
// ============================================================================

describe("Code Structure", () => {
  it("should have formatGeminiUsage function", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "gemini.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("function formatGeminiUsage");
  });

  it("should use fetchWithTimeout for API calls", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "provider-factory.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Factory uses fetchWithTimeout internally
    expect(sourceCode).toContain("fetchWithTimeout");
  });

  it("should validate apiKey before making API calls", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "provider-factory.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Check that validation happens in the factory
    expect(sourceCode).toContain("!apiKey");
  });

  it("should handle errors gracefully", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "provider-factory.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Check error handling in factory
    expect(sourceCode).toContain("handleProviderError");
  });

  it("should have formatGeminiResetTime helper function", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "gemini.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("function formatGeminiResetTime");
  });
});
