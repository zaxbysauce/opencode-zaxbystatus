/**
 * Provider factory module for creating consistent query functions
 */

import { z } from "zod";
import { QueryResult } from "./types";
import { request } from "./http";
import { handleProviderError, fetchWithTimeout } from "./utils";

// ============================================================================
// Provider Configuration Interface
// ============================================================================

export interface ProviderConfig<T> {
  name: string;
  baseUrl: string;
  authHeader: (key: string) => Record<string, string>;
  endpoint: string;
  schema: z.ZodSchema<T>;
  transform: (data: T, apiKey: string) => string;
}

export interface ProviderHeaderConfig<T> {
  name: string;
  baseUrl: string;
  authHeader: (key: string) => Record<string, string>;
  endpoint: string;
  schema: z.ZodSchema<T>;
  transform: (data: T, apiKey: string) => string;
  parseHeaders: (headers: Headers) => T | null;
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createProviderQuery<T>(
  config: ProviderConfig<T>
) {
  return async (apiKey: string | undefined): Promise<QueryResult | null> => {
    if (!apiKey) return null;

    try {
      const data = await request<T>({
        url: `${config.baseUrl}${config.endpoint}`,
        headers: config.authHeader(apiKey),
        schema: config.schema,
        context: config.name,
      });

      return {
        success: true,
        output: config.transform(data, apiKey),
      };
    } catch (err) {
      return handleProviderError(err, config.name);
    }
  };
}

export function createProviderQueryWithHeaders<T>(
  config: ProviderHeaderConfig<T>
) {
  return async (apiKey: string | undefined): Promise<QueryResult | null> => {
    if (!apiKey) return null;

    try {
      const response = await fetchWithTimeout(
        `${config.baseUrl}${config.endpoint}`,
        {
          method: "GET",
          headers: config.authHeader(apiKey),
        }
      );

      // Parse rate limits from headers
      const data = config.parseHeaders(response.headers);

      // Return null if no rate limit data
      if (!data) {
        return {
          success: true,
          output: config.transform(null as any, apiKey),
        };
      }

      return {
        success: true,
        output: config.transform(data, apiKey),
      };
    } catch (err) {
      return handleProviderError(err, config.name);
    }
  };
}
