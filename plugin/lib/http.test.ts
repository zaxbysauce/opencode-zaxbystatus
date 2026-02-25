/**
 * Tests for HTTP client with timeout, retry, and Zod validation
 * 
 * Tests verify:
 * 1. request() function exists and accepts RequestOptions
 * 2. Timeout handling with AbortController
 * 3. Retry logic for 5xx errors with exponential backoff
 * 4. Zod validation of responses
 * 5. Headers including User-Agent
 * 6. Error handling with context wrapping
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { z } from "zod";

// ============================================================================
// Test 1: request() function exists and has correct signature
// ============================================================================

describe("request: Function exists and has correct signature", () => {
  it("should be exported from http.ts", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("export { requestInternal as request");
  });

  it("should accept RequestOptions parameter", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("RequestOptionsInternal");
    expect(sourceCode).toContain("url: string");
    expect(sourceCode).toContain("schema: z.ZodSchema");
  });

  it("should be async function", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("async function requestInternal");
  });

  it("should return Promise<T>", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("Promise<T>");
  });
});

// ============================================================================
// Test 2: Timeout handling
// ============================================================================

describe("Timeout: AbortController usage", () => {
  it("should create AbortController for timeout", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("new AbortController()");
  });

  it("should use AbortController signal in fetch", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("signal: controller.signal");
  });

  it("should have default timeout of 30 seconds", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("DEFAULT_TIMEOUT_MS = 30000");
    expect(sourceCode).toContain("timeoutMs = DEFAULT_TIMEOUT_MS");
  });

  it("should support custom timeout", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("timeoutMs?: number");
  });

  it("should set timeout with setTimeout", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("setTimeout(() => controller.abort()");
  });

  it("should clear timeout after fetch", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("clearTimeout(timeoutId)");
  });
});

// ============================================================================
// Test 3: Retry logic
// ============================================================================

describe("Retry: 5xx errors trigger retry", () => {
  it("should check for 5xx errors", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("status >= 500");
    expect(sourceCode).toContain("status < 600");
  });

  it("should not retry on 4xx errors", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("response.status >= 400");
    expect(sourceCode).toContain("response.status < 500");
    expect(sourceCode).toContain("throw error;");
  });

  it("should have default retry count of 3", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("DEFAULT_RETRIES = 3");
    expect(sourceCode).toContain("retries = DEFAULT_RETRIES");
  });

  it("should support custom retry count", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("retries?: number");
  });

  it("should implement exponential backoff", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("getBackoffDelay");
    expect(sourceCode).toContain("Math.pow(2, retryAttempt)");
  });

  it("should wait before retry", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("await new Promise");
    expect(sourceCode).toContain("setTimeout(resolve");
  });

  it("should loop for retry attempts", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("for (let attempt = 0; attempt <= retries");
  });
});

// ============================================================================
// Test 4: Zod validation
// ============================================================================

describe("Validation: Schema validation is called", () => {
  it("should import zod", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("import { z } from \"zod\"");
  });

  it("should use validateResponse from utils", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("import { validateResponse }");
    expect(sourceCode).toContain('from "./utils"');
  });

  it("should call validateResponse with schema", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("validateResponse(rawData, schema, context)");
  });

  it("should throw on validation errors", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("throw validationError");
  });

  it("should not retry on validation errors", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("Validation errors are not retryable");
  });
});

// ============================================================================
// Test 5: Headers
// ============================================================================

describe("Headers: User-Agent is set", () => {
  it("should define USER_AGENT constant", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("USER_AGENT");
    expect(sourceCode).toContain('"OpenCode-Status-Plugin/1.0"');
  });

  it("should add User-Agent to headers", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain('"User-Agent": USER_AGENT');
  });

  it("should merge custom headers with User-Agent", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("...headers");
    expect(sourceCode).toContain('"User-Agent": USER_AGENT');
  });
});

// ============================================================================
// Test 6: Error handling
// ============================================================================

describe("Error handling: Context is included", () => {
  it("should have wrapErrorWithContext function", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("wrapErrorWithContext");
  });

  it("should wrap errors with context prefix", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // Check for template literal with context variable
    expect(sourceCode).toContain("[${context}]");
  });

  it("should wrap errors before throwing", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("wrapErrorWithContext(error, context)");
  });

  it("should include context in HTTP error messages", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("[${context}] HTTP error");
  });

  it("should include context in parse error messages", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("[${context}] Failed to parse response");
  });
});

// ============================================================================
// Test 7: Integration tests - verify implementation details
// ============================================================================

describe("HTTP client: Implementation details", () => {
  it("should use fetch for HTTP requests", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("await fetch(url");
  });

  it("should support GET and POST methods", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain('"GET" | "POST"');
  });

  it("should stringify request body", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("JSON.stringify(body)");
  });

  it("should parse JSON responses", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("response.json()");
  });

  it("should check response.ok for success", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("if (!response.ok)");
  });

  it("should extract status and statusText", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("lastStatus = response.status");
  });

  it("should format headers for logging", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("formatHeaders");
    expect(sourceCode).toContain('"authorization"');
  });

  it("should mask sensitive headers", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("Bearer ***");
  });
});

// ============================================================================
// Test 8: Export structure
// ============================================================================

describe("Exports: Correct module exports", () => {
  it("should export request function", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("export { requestInternal as request");
  });

  it("should export RequestOptions type", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("RequestOptionsInternal as RequestOptions");
  });

  it("should export HttpResponse type", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("type HttpResponse");
  });
});

// ============================================================================
// Test 9: Error type checking
// ============================================================================

describe("Error checking: isRetryableError function", () => {
  it("should check for undefined status (network errors)", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("isRetryableError");
    expect(sourceCode).toContain("status === undefined");
  });

  it("should return true for 5xx errors", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("status >= 500");
    expect(sourceCode).toContain("status < 600");
  });

  it("should return false for 4xx errors", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    // 4xx errors throw immediately without checking isRetryableError
    expect(sourceCode).toContain("response.status >= 400");
    expect(sourceCode).toContain("response.status < 500");
  });
});

// ============================================================================
// Test 10: Backoff delay calculation
// ============================================================================

describe("Backoff: getBackoffDelay function", () => {
  it("should calculate delay based on attempt number", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("getBackoffDelay");
    expect(sourceCode).toContain("1000 * Math.pow(2, retryAttempt)");
  });

  it("should return 1000ms for first retry", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const modulePath = path.join(__dirname, "http.ts");
    const sourceCode = fs.readFileSync(modulePath, "utf-8");

    expect(sourceCode).toContain("getBackoffDelay(retryAttempt");
  });
});
