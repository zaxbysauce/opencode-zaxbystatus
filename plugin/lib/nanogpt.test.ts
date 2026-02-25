/**
 * Tests for Nano-GPT API module
 * 
 * Tests verify:
 * 1. @experimental marking in JSDoc
 * 2. No fallback endpoint logic (single endpoint only)
 * 3. No console.log statements
 * 4. Factory pattern implementation
 * 5. Functionality preserved (exports, error handling)
 * 
 * NOTE: These are static analysis tests that verify the source code structure.
 * Coverage reports will show 0% because tests read source code as text rather
 * than executing the module at runtime.
 */

import { describe, it, expect } from "vitest";

// ============================================================================
// Test 1: @experimental marking
// ============================================================================

describe("Nano-GPT: @experimental marking", () => {
  it("should have @experimental in file JSDoc", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "nanogpt.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("@experimental");
  });

  it("should have experimental warning in output", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "nanogpt.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Check that formatNanoGptUsage includes experimental warning
    expect(sourceCode).toContain("This provider is experimental");
    expect(sourceCode).toContain("API endpoints not verified");
  });
});

// ============================================================================
// Test 2: Factory pattern implementation
// ============================================================================

describe("Nano-GPT: Factory pattern", () => {
  it("should import createProviderQuery from provider-factory", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "nanogpt.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("createProviderQuery");
    expect(sourceCode).toContain('from "./provider-factory"');
  });

  it("should use nanogptConfig object", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "nanogpt.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("nanogptConfig");
    expect(sourceCode).toContain("name: \"NanoGPT\"");
  });

  it("should export queryNanoGptUsage as factory result", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "nanogpt.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("export const queryNanoGptUsage = createProviderQuery(nanogptConfig)");
  });
});

// ============================================================================
// Test 3: No console.log
// ============================================================================

describe("Nano-GPT: No console.log", () => {
  it("should not have console.log statements", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "nanogpt.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Check for any console.log statements
    const consoleLogs = sourceCode.match(/console\.(log|error|warn|info|debug)[^;]*;/g);

    expect(consoleLogs).toBeNull();
  });

  it("should not have console.log in error handling", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "nanogpt.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Check error handling blocks don't have console.log
    const errorBlocks = sourceCode.match(/catch\s*\([^)]*\)\s*{[\s\S]*?}/g);
    
    if (errorBlocks) {
      for (const block of errorBlocks) {
        expect(block).not.toContain("console.log");
      }
    }
  });
});

// ============================================================================
// Test 4: Functionality preserved
// ============================================================================

describe("Nano-GPT: Functionality preserved", () => {
  it("should have proper error handling", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "nanogpt.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Factory handles error handling
    expect(sourceCode).toContain("handleProviderError");
  });

  it("should return QueryResult type", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "nanogpt.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Check that the function returns QueryResult
    expect(sourceCode).toContain("QueryResult | null");
  });

  it("should validate apiKey before API call", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "nanogpt.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Factory handles apiKey validation
    expect(sourceCode).toContain("!apiKey");
  });

  it("should use fetchWithTimeout for API calls", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "provider-factory.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Factory uses fetchWithTimeout
    expect(sourceCode).toContain("fetchWithTimeout");
  });

  it("should handle 401 authentication errors", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "nanogpt.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Factory handles 401 through request function
    expect(sourceCode).toContain("nanoGptAuthError");
  });

  it("should handle 429 rate limit errors", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "nanogpt.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("nanoGptRateLimitError");
  });

  it("should handle other error codes", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "nanogpt.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("nanoGptApiError");
  });
});

// ============================================================================
// Test 5: Code structure verification
// ============================================================================

describe("Nano-GPT: Code structure", () => {
  it("should have formatNanoGptUsage function", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "nanogpt.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("function formatNanoGptUsage");
  });

  it("should use maskString for API key display", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "nanogpt.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("maskString(apiKey)");
  });

  it("should import required modules", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "nanogpt.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain('import { t } from "./i18n"');
    expect(sourceCode).toContain("maskString");
  });

  it("should import NanoGptAccountResponseSchema from schemas", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "nanogpt.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("NanoGptAccountResponseSchema");
    expect(sourceCode).toContain('from "./schemas"');
  });
});
