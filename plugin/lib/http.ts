/**
 * Centralized HTTP client with timeout, retry, and validation
 */

import { validateResponse } from "./utils";
import { z } from "zod";

// ============================================================================
// Types
// ============================================================================

interface RequestOptionsInternal<T> {
  url: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: unknown;
  schema: z.ZodSchema<T>;
  timeoutMs?: number;
  retries?: number;
  context: string; // For error messages
}

interface HttpResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_RETRIES = 3;
const USER_AGENT = "OpenCode-Status-Plugin/1.0";

// ============================================================================
// Helper Functions
// ============================================================================

function isRetryableError(error: Error, status?: number): boolean {
  // Network errors (no status code)
  if (status === undefined) {
    return true;
  }
  // Only retry on 5xx server errors
  return status >= 500 && status < 600;
}

function getBackoffDelay(retryAttempt: number): number {
  return 1000 * Math.pow(2, retryAttempt);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function formatHeaders(headers?: Record<string, string>): string {
  if (!headers) return "{}";
  const formatted: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === "authorization") {
      formatted[key] = "Bearer ***";
    } else {
      formatted[key] = value;
    }
  }
  return JSON.stringify(formatted);
}

// ============================================================================
// Core Request Function
// ============================================================================

async function requestInternal<T>(
  options: RequestOptionsInternal<T>,
): Promise<T> {
  const {
    url,
    method = "GET",
    headers = {},
    body,
    schema,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
    context,
  } = options;

  // Add User-Agent header
  const finalHeaders = {
    ...headers,
    "User-Agent": USER_AGENT,
  };

  let lastError: Error | undefined;
  let lastStatus: number | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Build fetch options
      const fetchOptions: RequestInit = {
        method,
        headers: finalHeaders,
      };

      if (body !== undefined) {
        fetchOptions.body = JSON.stringify(body);
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      let response: Response;

      try {
        response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      lastStatus = response.status;

      // Check for HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(
          `[${context}] HTTP error ${response.status}: ${response.statusText} - ${errorText}`,
        );
        error.name = "HTTPError";

        // Don't retry on 4xx client errors
        if (response.status >= 400 && response.status < 500) {
          throw error;
        }

        // For 5xx errors, throw to trigger retry
        throw error;
      }

      // Parse JSON response
      let rawData: unknown;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        rawData = await response.json();
      } else {
        // For non-JSON responses, store the text
        rawData = await response.text();
      }

      // Validate response against schema
      return validateResponse(rawData, schema, context);

    } catch (err) {
      const error = err as Error;
      lastError = error;

      // Check if we should retry
      const shouldRetry = isRetryableError(error, lastStatus) && attempt < retries;

      if (!shouldRetry) {
        // Re-throw with context
        throw wrapErrorWithContext(error, context);
      }

      // Log retry attempt (optional, can be removed for cleaner output)
      // console.warn(
      //   `[${context}] Request failed (attempt ${attempt + 1}/${retries + 1}): ${error.message}. Retrying in ${getBackoffDelay(attempt) / 1000}s...`
      // );

      // Wait before retry with exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, getBackoffDelay(attempt)),
      );
    }
  }

  // This should never be reached, but just in case
  throw wrapErrorWithContext(
    lastError ?? new Error("Unknown error occurred"),
    context,
  );
}

// ============================================================================
// Error Wrapping
// ============================================================================

function wrapErrorWithContext(error: Error, context: string): Error {
  // Already wrapped
  if (error.message.startsWith(`[${context}]`)) {
    return error;
  }

  // Create new error with context
  const wrappedError = new Error(`[${context}] ${error.message}`);
  wrappedError.name = error.name;
  wrappedError.stack = error.stack;
  return wrappedError;
}

// ============================================================================
// Export
// ============================================================================

export { requestInternal as request, type RequestOptionsInternal as RequestOptions, type HttpResponse };
