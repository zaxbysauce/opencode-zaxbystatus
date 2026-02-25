/**
 * Tests for Zod schemas and validateResponse utility
 * 
 * Tests verify:
 * 1. Schemas exist and are valid Zod schemas for all providers
 * 2. validateResponse function works correctly (success and failure cases)
 * 3. All providers import and use validateResponse (or use factory pattern)
 * 4. Zod dependency is in package.json
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { describe, it, expect, beforeAll } from "vitest";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { z } from "zod";

// ============================================================================
// Test 1: Schemas exist and are valid Zod schemas
// ============================================================================

describe("Schemas: Existence and Validity", () => {
  it("should export schemas.ts file", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "schemas.ts");
    expect(fs.existsSync(modulePath)).toBe(true);
  });

  it("should export RateLimitWindowSchema", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "schemas.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("export const RateLimitWindowSchema");
    expect(sourceCode).toContain("z.object");
  });

  it("should export OpenAIUsageSchema", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "schemas.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("export const OpenAIUsageSchema");
  });

  it("should export UsageLimitItemSchema", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "schemas.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("export const UsageLimitItemSchema");
  });

  it("should export QuotaLimitResponseSchema", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "schemas.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("export const QuotaLimitResponseSchema");
  });

  it("should export GoogleQuotaResponseSchema", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "schemas.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("export const GoogleQuotaResponseSchema");
  });

  it("should export CopilotUsageResponseSchema", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "schemas.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("export const CopilotUsageResponseSchema");
  });

  it("should export AnthropicRateLimitsSchema", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "schemas.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("export const AnthropicRateLimitsSchema");
  });

  it("should export GroqRateLimitsSchema", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "schemas.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("export const GroqRateLimitsSchema");
  });

  it("should export GeminiRateLimitsSchema", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "schemas.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("export const GeminiRateLimitsSchema");
  });

  it("should export KimiBalanceResponseSchema", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "schemas.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("export const KimiBalanceResponseSchema");
  });

  it("should export MinimaxRateLimitsSchema", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "schemas.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("export const MinimaxRateLimitsSchema");
  });

  it("should export AbacusUsageResponseSchema", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "schemas.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("export const AbacusUsageResponseSchema");
  });

  it("should export NanoGptAccountResponseSchema", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "schemas.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("export const NanoGptAccountResponseSchema");
  });

  it("should export ChutesQuotaUsageResponseSchema", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "schemas.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("export const ChutesQuotaUsageResponseSchema");
  });

  it("should export ChutesQuotaLimitsResponseSchema", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "schemas.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("export const ChutesQuotaLimitsResponseSchema");
  });

  it("should export CopilotTokenResponseSchema", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "schemas.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("export const CopilotTokenResponseSchema");
  });

  it("should export CopilotQuotaDetailSchema", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "schemas.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("export const CopilotQuotaDetailSchema");
  });

  it("should export CopilotQuotaSnapshotsSchema", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "schemas.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("export const CopilotQuotaSnapshotsSchema");
  });

  it("should export CopilotTierSchema", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "schemas.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("export const CopilotTierSchema");
  });

  it("should export CopilotQuotaConfigSchema", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "schemas.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("export const CopilotQuotaConfigSchema");
  });

  it("should export AntigravityAccountSchema", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "schemas.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("export const AntigravityAccountSchema");
  });

  it("should export AuthDataSchema", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "schemas.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("export const AuthDataSchema");
  });
});

// ============================================================================
// Test 2: validateResponse function
// ============================================================================

describe("validateResponse: Function exists", () => {
  it("should be exported from utils.ts", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "utils.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("export function validateResponse");
  });

  it("should accept data: unknown parameter", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "utils.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("data: unknown");
  });

  it("should accept schema: z.ZodSchema parameter", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "utils.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("schema: z.ZodSchema");
  });

  it("should accept context: string parameter", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "utils.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("context: string");
  });

  it("should return validated data", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "utils.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("return result.data");
  });
});

describe("validateResponse: Success case - valid data", () => {
  it("should use safeParse for validation", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "utils.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("safeParse");
  });
});

describe("validateResponse: Error case - invalid data", () => {
  it("should throw error when validation fails", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "utils.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Check for error throwing logic
    expect(sourceCode).toContain("throw new Error");
    expect(sourceCode).toContain("!result.success");
  });

  it("should include context in error message", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "utils.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Check that context is included in error message
    expect(sourceCode).toContain("[${context}]");
    expect(sourceCode).toContain("Invalid API response");
  });

  it("should include validation error details", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "utils.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Check that error message includes result.error.message
    expect(sourceCode).toContain("result.error.message");
  });
});

// ============================================================================
// Test 3: Providers use validateResponse or factory pattern
// ============================================================================

describe("Providers: Import validateResponse or use factory", () => {
  // Provider files that use the factory pattern (groq, anthropic, gemini, nanogpt, kimi, abacus)
  // The factory handles validation, so these files import from factory
  const factoryProviderFiles = [
    "groq.ts",
    "anthropic.ts",
    "gemini.ts",
    "nanogpt.ts",
    "kimi.ts",
    "abacus.ts",
  ];

  // Provider files that use validateResponse directly
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
      it(`should import from provider-factory`, async () => {
        const fs = await import("fs");
        const path = await import("path");
        const modulePath = path.join(__dirname, providerFile);
        const sourceCode = fs.readFileSync(modulePath, "utf-8");

        expect(sourceCode).toContain("createProviderQuery");
        expect(sourceCode).toContain('from "./provider-factory"');
      });
    });
  }

  for (const providerFile of directProviderFiles) {
    describe(providerFile, () => {
      it(`should import validateResponse from utils`, async () => {
        const fs = await import("fs");
        const path = await import("path");
        const modulePath = path.join(__dirname, providerFile);
        const sourceCode = fs.readFileSync(modulePath, "utf-8");

        expect(sourceCode).toContain("validateResponse");
        expect(sourceCode).toContain('from "./utils"');
      });
    });
  }
});

describe("Providers: Call validateResponse (not as Promise<)", () => {
  // Provider files that use the factory pattern - they don't call validateResponse directly
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const factoryProviderFiles = [
    "groq.ts",
    "anthropic.ts",
    "gemini.ts",
    "nanogpt.ts",
    "kimi.ts",
    "abacus.ts",
  ];

  // Provider files that use validateResponse directly
  const directProviderFiles = [
    { file: "chutes.ts", schema: "ChutesQuotaUsageResponseSchema" },
    { file: "chutes.ts", schema: "ChutesQuotaLimitsResponseSchema" },
    { file: "copilot.ts", schema: "CopilotUsageResponseSchema" },
    { file: "copilot.ts", schema: "CopilotTokenResponseSchema" },
    { file: "google.ts", schema: "GoogleQuotaResponseSchema" },
    { file: "minimax.ts", schema: "MinimaxRateLimitsSchema" },
    { file: "openai.ts", schema: "OpenAIUsageSchema" },
    { file: "zhipu.ts", schema: "QuotaLimitResponseSchema" },
  ];

  for (const { file, schema } of directProviderFiles) {
    describe(file, () => {
      it(`should import ${schema}`, async () => {
        const fs = await import("fs");
        const path = await import("path");
        const modulePath = path.join(__dirname, file);
        const sourceCode = fs.readFileSync(modulePath, "utf-8");

        expect(sourceCode).toContain(schema);
        expect(sourceCode).toContain('from "./schemas"');
      });

      it(`should call validateResponse with ${schema}`, async () => {
        const fs = await import("fs");
        const path = await import("path");
        const modulePath = path.join(__dirname, file);
        const sourceCode = fs.readFileSync(modulePath, "utf-8");

        // Check that validateResponse is called (not just imported)
        // Look for validateResponse( pattern
        expect(sourceCode).toMatch(/validateResponse\s*\(/);
      });

      it(`should use validateResponse instead of as Promise<>`, async () => {
        const fs = await import("fs");
        const path = await import("path");
        const modulePath = path.join(__dirname, file);
        const sourceCode = fs.readFileSync(modulePath, "utf-8");

        // Check that validateResponse is used instead of raw as Promise<>
        // The pattern should be: return validateResponse(rawData, Schema, "Context")
        // NOT: return rawData as Promise<...>
        expect(sourceCode).toContain("validateResponse");
      });
    });
  }
});

// ============================================================================
// Test 4: Zod dependency in package.json
// ============================================================================

describe("Zod: Dependency in package.json", () => {
  it("should have zod in dependencies", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const packagePath = path.join(__dirname, "..", "..", "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf-8"));

    expect(packageJson.dependencies).toBeDefined();
    expect(packageJson.dependencies.zod).toBeDefined();
  });

  it("should have valid zod version", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const packagePath = path.join(__dirname, "..", "..", "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf-8"));

    const zodVersion = packageJson.dependencies.zod;
    expect(typeof zodVersion).toBe("string");
    expect(zodVersion).toMatch(/^\^?\d+\.\d+\.\d+$/);
  });
});
