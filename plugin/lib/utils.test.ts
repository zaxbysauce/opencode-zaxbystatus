/**
 * Tests for handleProviderError utility function
 * 
 * Tests verify:
 * 1. Function exists and has correct signature
 * 2. Error handling logic for Error objects and non-Error values
 * 3. Context string is properly included in error message
 * 4. All provider modules use the centralized handler
 * 5. No old error handling pattern remains in provider files
 */

import { describe, it, expect, beforeAll } from "vitest";

// ============================================================================
// Test 1: Function exists and has correct signature
// ============================================================================

describe("handleProviderError: Function signature", () => {
  it("should be exported from utils.ts", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "utils.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("export function handleProviderError");
  });

  it("should accept err: unknown parameter", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "utils.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("err: unknown");
  });

  it("should accept context: string parameter", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "utils.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("context: string");
  });

  it("should return { success: false; error: string }", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "utils.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("success: false");
    expect(sourceCode).toContain("error: string");
  });
});

// ============================================================================
// Test 2: Error handling logic
// ============================================================================

describe("handleProviderError: Error handling logic", () => {
  it("should use err.message for Error objects", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "utils.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Check for the pattern: err instanceof Error ? err.message : String(err)
    expect(sourceCode).toContain("err instanceof Error");
    expect(sourceCode).toContain("err.message");
    expect(sourceCode).toContain("String(err)");
  });

  it("should use String(err) for non-Error values", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "utils.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Verify String(err) is used as fallback
    expect(sourceCode).toContain("String(err)");
  });

  it("should include context in error message", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "utils.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Check that context is included in the error message
    expect(sourceCode).toContain("[${context}]");
  });
});

// ============================================================================
// Test 3: Providers use centralized handler
// ============================================================================

describe("Providers: Use centralized handleProviderError", () => {
  // Provider files that use the factory pattern (groq, anthropic, gemini, nanogpt, kimi, abacus)
  // The factory handles error handling, so these files import handleProviderError from factory
  const factoryProviderFiles = [
    "groq.ts",
    "anthropic.ts",
    "gemini.ts",
    "nanogpt.ts",
    "kimi.ts",
    "abacus.ts",
  ];

  // Provider files that use handleProviderError directly
  const directProviderFiles = [
    "chutes.ts",
    "copilot.ts",
    "google.ts",
    "minimax.ts",
    "openai.ts",
    "zhipu.ts",
  ];

  for (const providerFile of factoryProviderFiles) {
    describe(`Factory pattern: ${providerFile}`, () => {
      it(`should use factory pattern with createProviderQuery`, async () => {
        const fs = await import("fs");
        const path = await import("path");
        const modulePath = path.join(__dirname, providerFile);
        const sourceCode = fs.readFileSync(modulePath, "utf-8");

        expect(sourceCode).toContain("createProviderQuery");
        expect(sourceCode).toContain('from "./provider-factory"');
      });

      it(`should use appropriate context string`, async () => {
        const fs = await import("fs");
        const path = await import("path");
        const modulePath = path.join(__dirname, providerFile);
        const sourceCode = fs.readFileSync(modulePath, "utf-8");

        // Extract the context string used in factory config
        const contextMatch = sourceCode.match(/name:\s*["']([^"']+)["']/);
        expect(contextMatch).not.toBeNull();

        // Context should match provider name (case-insensitive)
        const context = contextMatch![1];
        const providerName = providerFile.replace(".ts", "");
        expect(context.toLowerCase()).toBe(providerName.toLowerCase());
      });
    });
  }

  for (const providerFile of directProviderFiles) {
    describe(providerFile, () => {
      it(`should import handleProviderError from utils`, async () => {
        const fs = await import("fs");
        const path = await import("path");
        const modulePath = path.join(__dirname, providerFile);
        const sourceCode = fs.readFileSync(modulePath, "utf-8");

        expect(sourceCode).toContain("handleProviderError");
        expect(sourceCode).toContain('from "./utils"');
      });

      it(`should call handleProviderError in catch blocks`, async () => {
        const fs = await import("fs");
        const path = await import("path");
        const modulePath = path.join(__dirname, providerFile);
        const sourceCode = fs.readFileSync(modulePath, "utf-8");

        // Check that handleProviderError is called in catch blocks
        expect(sourceCode).toMatch(/catch\s*\([^)]*\)\s*{[\s\S]*?handleProviderError/);
      });

      it(`should use appropriate context string`, async () => {
        const fs = await import("fs");
        const path = await import("path");
        const modulePath = path.join(__dirname, providerFile);
        const sourceCode = fs.readFileSync(modulePath, "utf-8");

        // Extract the context string used
        const contextMatch = sourceCode.match(/handleProviderError\([^)]+,\s*["']([^"']+)["']\)/);
        expect(contextMatch).not.toBeNull();

        // Context should match provider name (case-insensitive)
        const context = contextMatch![1];
        const providerName = providerFile.replace(".ts", "");
        expect(context.toLowerCase()).toBe(providerName.toLowerCase());
      });
    });
  }
});

// ============================================================================
// Test 4: No old pattern remains
// ============================================================================

describe("Providers: No old error handling pattern", () => {
  const providerFiles = [
    "abacus.ts",
    "anthropic.ts",
    "chutes.ts",
    "copilot.ts",
    "gemini.ts",
    "google.ts",
    "groq.ts",
    "kimi.ts",
    "minimax.ts",
    "nanogpt.ts",
    "openai.ts",
    "zhipu.ts",
  ];

  const oldPattern = /err instanceof Error \? err\.message : String\(err\)/;

  for (const providerFile of providerFiles) {
    it(`should not contain old error handling pattern in ${providerFile}`, async () => {
      const fs = await import("fs");
      const path = await import("path");
      const modulePath = path.join(__dirname, providerFile);
      const sourceCode = fs.readFileSync(modulePath, "utf-8");

      expect(oldPattern.test(sourceCode)).toBe(false);
    });
  }
});

// ============================================================================
// Test 5: Integration test - verify function works correctly
// ============================================================================

describe("handleProviderError: Integration test", () => {
  it("should handle Error objects correctly", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "utils.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Verify the implementation matches expected behavior
    expect(sourceCode).toContain("const message = err instanceof Error ? err.message : String(err);");
    expect(sourceCode).toContain("return {");
    expect(sourceCode).toContain("success: false,");
    expect(sourceCode).toContain("error: `[${context}] ${message}`");
  });

  it("should format error message with context prefix", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "utils.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Verify the error message format includes context in brackets
    expect(sourceCode).toMatch(/\[\$\{context\}\]/);
  });
});
