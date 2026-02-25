/**
 * Shared utility functions used across all provider modules
 */

import { t, currentLang } from "./i18n";
import { REQUEST_TIMEOUT_MS, MyStatusConfig } from "./types";
import { readFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
import { z } from "zod";

// ============================================================================
// 时间格式化
// ============================================================================

export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(t.days(days));
  if (hours > 0) parts.push(t.hours(hours));
  if (minutes > 0 || parts.length === 0) parts.push(t.minutes(minutes));

  return parts.join(currentLang === "en" ? " " : "");
}

// ============================================================================
// 进度条
// ============================================================================

export function createProgressBar(
  remainPercent: number,
  width: number = 30,
): string {
  // 确保百分比在有效范围内
  const safePercent = Math.max(0, Math.min(100, remainPercent));
  const filled = Math.round((safePercent / 100) * width);
  const empty = width - filled;

  const filledChar = "█";
  const emptyChar = "░";

  return filledChar.repeat(filled) + emptyChar.repeat(empty);
}

// ============================================================================
// 数值格式化
// ============================================================================

export function calcRemainPercent(usedPercent: number): number {
  return Math.round(100 - usedPercent);
}

export function formatTokens(tokens: number): string {
  return (tokens / 1000000).toFixed(1) + "M";
}

// ============================================================================
// 网络请求
// ============================================================================

export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(t.timeoutError(Math.round(timeoutMs / 1000)));
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================================
// 安全计算
// ============================================================================

export function safeMax(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.max(...arr);
}

// ============================================================================
// 字符串处理
// ============================================================================

export function maskString(str: string, showChars: number = 4): string {
  if (str.length <= showChars * 2) {
    return str;
  }
  return `${str.slice(0, showChars)}****${str.slice(-showChars)}`;
}

// ============================================================================
// 配置文件读取
// ============================================================================

const MYSTATUS_CONFIG_PATH = join(
  homedir(),
  ".config",
  "opencode",
  "mystatus.json",
);

export async function readMyStatusConfig(): Promise<MyStatusConfig | null> {
  try {
    const content = await readFile(MYSTATUS_CONFIG_PATH, "utf-8");
    const config = JSON.parse(content) as MyStatusConfig;
    return config;
  } catch {
    return null;
  }
}

/**
 * Centralized error handler for provider modules
 * @param err The error caught in catch block
 * @param context Provider name or context for error message
 * @returns QueryResult error object
 */
export function handleProviderError(
  err: unknown,
  context: string,
): { success: false; error: string } {
  const message = err instanceof Error ? err.message : String(err);
  return {
    success: false,
    error: `[${context}] ${message}`,
  };
}

// ============================================================================
// Runtime Validation (Zod)
// ============================================================================

/**
 * Validate API response data against a Zod schema
 * @param data The raw data to validate
 * @param schema The Zod schema to validate against
 * @param context Context string for error messages (e.g., provider name)
 * @returns The validated and parsed data
 * @throws Error if validation fails
 */
export function validateResponse<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  context: string,
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(
      `[${context}] Invalid API response: ${result.error.message}`,
    );
  }
  return result.data;
}
