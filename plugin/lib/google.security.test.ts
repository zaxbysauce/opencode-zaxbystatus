/**
 * Adversarial Security Tests for Google Cloud quota module
 * 
 * Tests verify:
 * 1. Secret leakage prevention - env vars not exposed in logs/errors
 * 2. Injection vulnerabilities - env vars not used in URL construction
 * 3. Timing attacks - validation before network activity
 * 4. Empty/null handling - proper handling of missing/empty env vars
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";

// ============================================================================
// Test 1: Secret Leakage Prevention
// ============================================================================

describe("Security: Secret Leakage Prevention", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should not log client_id in error messages", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "google.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Check that client_id is NOT in any error message template
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const errorMessages = [
      "Google OAuth credentials not configured",
      "Please set GOOGLE_CLIENT_ID",
      "environment variables",
    ];

    // Verify error messages don't contain the actual credential values
    // (they should only mention the variable names, not the values)
    expect(sourceCode).toContain("Google OAuth credentials not configured");
    expect(sourceCode).toContain("Please set");
    expect(sourceCode).toContain("environment variables");

    // Verify the error message construction doesn't concatenate the actual values
    const errorLine = sourceCode.match(/throw new Error\([^)]+\)/s);
    if (errorLine) {
      const errorMsg = errorLine[0];
      // Should not contain: ` + GOOGLE_CLIENT_ID + ` or similar concatenation
      expect(errorMsg).not.toContain(" + GOOGLE_CLIENT_ID");
      expect(errorMsg).not.toContain(" + GOOGLE_CLIENT_SECRET");
    }
  });

  it("should not expose client_secret in any string concatenation", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "google.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Check that client_secret is never concatenated into strings
    // that might be logged or displayed
    const dangerousPatterns = [
      // Template literal concatenation
      "`.*\\$\\{GOOGLE_CLIENT_SECRET\\}",
      // String concatenation
      "\\+\\s*GOOGLE_CLIENT_SECRET",
      "GOOGLE_CLIENT_SECRET\\s*\\+",
    ];

    for (const pattern of dangerousPatterns) {
      const regex = new RegExp(pattern);
      expect(regex.test(sourceCode)).toBe(false);
    }
  });

  it("should not include credentials in URL construction", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "google.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Check that URLs are not constructed with credentials
    const urlPatterns = [
      // Should not have: `https://...?client_id=${GOOGLE_CLIENT_ID}`
      "\\$\\{GOOGLE_CLIENT_ID\\}",
      "\\$\\{GOOGLE_CLIENT_SECRET\\}",
    ];

    for (const pattern of urlPatterns) {
      const regex = new RegExp(pattern);
      expect(regex.test(sourceCode)).toBe(false);
    }
  });

  it("should not log credentials in fetch error responses", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "google.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Check that error responses don't include credentials
    // The errorText from response.text() should not be concatenated with credentials
    const errorHandling = sourceCode.match(/if \(!response\.ok\)[\s\S]*?throw new Error\([^)]+\)/s);
    if (errorHandling) {
      const errorBlock = errorHandling[0];
      // Verify errorText is used alone, not concatenated with credentials
      expect(errorBlock).not.toContain("GOOGLE_CLIENT_ID");
      expect(errorBlock).not.toContain("GOOGLE_CLIENT_SECRET");
    }
  });
});

// ============================================================================
// Test 2: Injection Vulnerability Prevention
// ============================================================================

describe("Security: Injection Vulnerability Prevention", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should not interpolate env vars into user-facing output", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "google.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Check that client_id and client_secret are never used in:
    // 1. Display strings
    // 2. Error messages shown to users
    // 3. Progress bar labels
    // 4. Any user-facing text

    const userFacingPatterns = [
      // Check formatAccountQuota doesn't include credentials
      /formatAccountQuota[\s\S]*?GOOGLE_CLIENT_ID/s,
      /formatAccountQuota[\s\S]*?GOOGLE_CLIENT_SECRET/s,
      // Check error messages don't include credential values
      /googleApiError[\s\S]*?GOOGLE_CLIENT_ID/s,
      /googleApiError[\s\S]*?GOOGLE_CLIENT_SECRET/s,
    ];

    for (const pattern of userFacingPatterns) {
      expect(pattern.test(sourceCode)).toBe(false);
    }
  });

  it("should not use env vars in URL construction", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "google.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Check that URLs are constants, not constructed with env vars
    const urlConstants = [
      "GOOGLE_QUOTA_API_URL",
      "GOOGLE_TOKEN_REFRESH_URL",
    ];

    for (const urlName of urlConstants) {
      const urlDef = sourceCode.match(new RegExp(`${urlName}\\s*=\\s*['"][^'"]+['"]`));
      expect(urlDef).not.toBeNull();
      // Verify the URL doesn't contain template literals with env vars
      expect(urlDef![0]).not.toContain("${");
    }

    // Verify fetch calls use the constant URLs directly
    const fetchCalls = sourceCode.match(/fetch\([^)]+\)/g);
    if (fetchCalls) {
      for (const call of fetchCalls) {
        expect(call).not.toContain("GOOGLE_CLIENT_ID");
        expect(call).not.toContain("GOOGLE_CLIENT_SECRET");
      }
    }
  });

  it("should not include credentials in Authorization headers", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "google.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Check that Authorization header uses access_token only
    // (not client_id or client_secret)
    const authHeaderPattern = /Authorization:\s*['"`]Bearer\s+\$\{[^}]+\}['"`]/;
    const authMatches = sourceCode.match(authHeaderPattern);

    if (authMatches) {
      // The Bearer token should be accessToken (the variable name), not credentials
      // The variable is 'accessToken' (camelCase) in the source
      expect(authMatches[0]).toContain("accessToken");
      expect(authMatches[0]).not.toContain("GOOGLE_CLIENT_ID");
      expect(authMatches[0]).not.toContain("GOOGLE_CLIENT_SECRET");
    } else {
      // If no match, check that no credentials are in auth headers
      const authHeaderPattern2 = /Authorization:\s*['"`][^'"]+['"`]/;
      const authMatches2 = sourceCode.match(authHeaderPattern2);
      if (authMatches2) {
        expect(authMatches2[0]).not.toContain("GOOGLE_CLIENT_ID");
        expect(authMatches2[0]).not.toContain("GOOGLE_CLIENT_SECRET");
      }
    }
  });
});

// ============================================================================
// Test 3: Timing Attack Prevention
// ============================================================================

describe("Security: Timing Attack Prevention", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should validate env vars BEFORE any network activity", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "google.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Find the refreshAccessToken function
    const funcStart = sourceCode.indexOf("async function refreshAccessToken");
    const funcEnd = sourceCode.indexOf("// ============================================================================", funcStart);
    const funcBody = sourceCode.substring(funcStart, funcEnd);

    // Find validation index
    const validationIndex = funcBody.indexOf("if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET)");

    // Find fetch index
    const fetchIndex = funcBody.indexOf("await fetch(GOOGLE_TOKEN_REFRESH_URL");

    // Validation MUST happen before fetch
    expect(validationIndex).toBeGreaterThan(-1);
    expect(fetchIndex).toBeGreaterThan(-1);
    expect(validationIndex).toBeLessThan(fetchIndex);

    // Verify validation is the FIRST thing in the function (after parameter list)
    const validationLine = funcBody.substring(validationIndex).split("\n")[0];
    const fetchLine = funcBody.substring(fetchIndex).split("\n")[0];

    // Validation should come before any network calls
    expect(funcBody.indexOf(validationLine)).toBeLessThan(funcBody.indexOf(fetchLine));
  });

  it("should throw error synchronously before network call", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "google.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Extract the refreshAccessToken function body
    const funcStart = sourceCode.indexOf("async function refreshAccessToken");
    const funcBody = sourceCode.substring(funcStart);

    // Check that validation happens before await fetch
    const validationPos = funcBody.indexOf("if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET)");
    const fetchPos = funcBody.indexOf("await fetch(");

    expect(validationPos).toBeGreaterThan(-1);
    expect(fetchPos).toBeGreaterThan(-1);
    expect(validationPos).toBeLessThan(fetchPos);

    // Verify the error is thrown synchronously (no async before validation)
    const validationBeforeFetch = funcBody.substring(validationPos, fetchPos);
    expect(validationBeforeFetch).toContain("throw new Error");
  });

  it("should not have variable timing based on credential validation", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "google.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // The validation should be a simple boolean check
    // No network calls or delays should be involved
    const validationPattern = /if\s*\(\s*!\s*GOOGLE_CLIENT_ID\s*\|\|\s*!\s*GOOGLE_CLIENT_SECRET\s*\)/;
    expect(validationPattern.test(sourceCode)).toBe(true);

    // Verify the validation is a simple check, not involving any async operations
    const validationIndex = sourceCode.indexOf("if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET)");
    const nextLine = sourceCode.substring(validationIndex).split("\n")[1];

    // Next line should be throw new Error, not something that could cause timing variation
    expect(nextLine).toContain("throw new Error");
  });
});

// ============================================================================
// Test 4: Empty/Null Handling
// ============================================================================

describe("Security: Empty/Null Handling", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should handle undefined env vars correctly", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "google.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Verify the validation handles undefined
    expect(sourceCode).toContain("!GOOGLE_CLIENT_ID");
    expect(sourceCode).toContain("!GOOGLE_CLIENT_SECRET");

    // The validation should use strict inequality or falsy check
    // Both undefined and null should be caught
    const validationPattern = /if\s*\(\s*!\s*GOOGLE_CLIENT_ID\s*\|\|\s*!\s*GOOGLE_CLIENT_SECRET\s*\)/;
    expect(validationPattern.test(sourceCode)).toBe(true);
  });

  it("should handle empty string env vars correctly", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "google.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // The validation uses ! which catches empty strings
    // !"" === true, so empty strings will be rejected
    expect(sourceCode).toContain("!GOOGLE_CLIENT_ID");
    expect(sourceCode).toContain("!GOOGLE_CLIENT_SECRET");

    // Verify the error message mentions both variables
    expect(sourceCode).toContain("GOOGLE_CLIENT_ID");
    expect(sourceCode).toContain("GOOGLE_CLIENT_SECRET");
  });

  it("should reject empty string client_id", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "google.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // The validation `!GOOGLE_CLIENT_ID` will be true for:
    // - undefined
    // - null
    // - empty string ""
    // - 0
    // - false

    // This is correct behavior - we want to reject empty strings
    const validationPattern = /if\s*\(\s*!\s*GOOGLE_CLIENT_ID\s*\|\|\s*!\s*GOOGLE_CLIENT_SECRET\s*\)/;
    expect(validationPattern.test(sourceCode)).toBe(true);
  });

  it("should provide clear error message for missing credentials", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "google.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Error message should clearly indicate what's missing
    const errorMsg = "Google OAuth credentials not configured";
    expect(sourceCode).toContain(errorMsg);

    // Should mention both variables that need to be set
    expect(sourceCode).toContain("GOOGLE_CLIENT_ID");
    expect(sourceCode).toContain("GOOGLE_CLIENT_SECRET");
    expect(sourceCode).toContain("environment variables");
  });

  it("should not proceed with network call if env vars are empty", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "google.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Extract the refreshAccessToken function
    const funcStart = sourceCode.indexOf("async function refreshAccessToken");
    const funcEnd = sourceCode.indexOf("// ============================================================================", funcStart);
    const funcBody = sourceCode.substring(funcStart, funcEnd);

    // Find the validation block
    const validationIndex = funcBody.indexOf("if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET)");
    const validationBlock = funcBody.substring(validationIndex);

    // The validation should throw before any network activity
    const throwIndex = validationBlock.indexOf("throw new Error");

    // Verify the validation block contains the throw statement
    expect(throwIndex).toBeGreaterThan(-1);

    // Verify the validation happens before the fetch call in the function
    const fetchIndex = funcBody.indexOf("await fetch(");
    expect(validationIndex).toBeLessThan(fetchIndex);
  });
});

// ============================================================================
// Test 5: Additional Security Checks
// ============================================================================

describe("Security: Additional Checks", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should not have console.log statements that could leak credentials", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "google.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Check for console.log statements that might include credentials
    const consoleLogs = sourceCode.match(/console\.(log|error|warn|info|debug)[^;]*;/g);

    if (consoleLogs) {
      for (const log of consoleLogs) {
        // Verify no credential variables are logged
        expect(log).not.toContain("GOOGLE_CLIENT_ID");
        expect(log).not.toContain("GOOGLE_CLIENT_SECRET");
        expect(log).not.toContain("client_id");
        expect(log).not.toContain("client_secret");
      }
    }
  });

  it("should not include credentials in URLSearchParams", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "google.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Check URLSearchParams construction
    const paramsPattern = /new URLSearchParams\([^)]+\)/s;
    const paramsMatch = sourceCode.match(paramsPattern);

    if (paramsMatch) {
      const params = paramsMatch[0];
      // Should contain the required params but not expose secrets in logs
      expect(params).toContain("client_id");
      expect(params).toContain("client_secret");
      expect(params).toContain("refresh_token");
      expect(params).toContain("grant_type");

      // Verify the params are constructed safely (not concatenated with env vars)
      expect(params).not.toContain("${GOOGLE_CLIENT_ID}");
      expect(params).not.toContain("${GOOGLE_CLIENT_SECRET}");
    }
  });

  it("should validate all required env vars before use", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "google.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Check that both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are validated
    const validationPattern = /if\s*\(\s*!\s*GOOGLE_CLIENT_ID\s*\|\|\s*!\s*GOOGLE_CLIENT_SECRET\s*\)/;
    expect(validationPattern.test(sourceCode)).toBe(true);

    // Verify the validation is in the right function
    const funcStart = sourceCode.indexOf("async function refreshAccessToken");
    const funcEnd = sourceCode.indexOf("// ============================================================================", funcStart);
    const funcBody = sourceCode.substring(funcStart, funcEnd);

    expect(funcBody).toContain("if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET)");
  });

  it("should not expose credentials in stack traces", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "google.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Error messages should not include credential values
    // They should only mention the variable names for user guidance
    const errorMessages = sourceCode.match(/throw new Error\([^)]+\)/s);

    if (errorMessages) {
      for (const msg of errorMessages) {
        // The error message should be generic, not include actual values
        expect(msg).not.toContain("= ");
        // Should not have: "Error: client_id is [actual-value]"
      }
    }
  });
});
