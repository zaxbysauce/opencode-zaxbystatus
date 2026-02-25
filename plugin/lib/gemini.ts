/**
 * Google Gemini (AI Studio) 速率限制查询模块
 *
 * [输入]: API Key
 * [输出]: 格式化的速率限制状态
 * [定位]: 被 mystatus.ts 调用，处理 Google Gemini 账号
 * [同步]: mystatus.ts, types.ts, utils.ts, i18n.ts
 */

import { t } from "./i18n";
import {
  type QueryResult,
  type ApiKeyAuthData,
} from "./types";
import {
  maskString,
} from "./utils";
import { GeminiRateLimitsSchema } from "./schemas";
import { createProviderQueryWithHeaders } from "./provider-factory";

// ============================================================================
// Provider Configuration
// ============================================================================

const geminiConfig = {
  name: "Gemini",
  baseUrl: "https://generativelanguage.googleapis.com",
  authHeader: (key: string) => ({ "x-goog-api-key": key }),
  endpoint: "/v1beta/models",
  schema: GeminiRateLimitsSchema,
  transform: (data: any, apiKey: string) => formatGeminiUsage(data, apiKey),
  parseHeaders: (headers: Headers): any | null => {
    const limit = headers.get("x-ratelimit-limit");
    const remaining = headers.get("x-ratelimit-remaining");
    const reset = headers.get("x-ratelimit-reset");

    // 如果没有任何速率限制头，返回 null
    if (!limit && !remaining) {
      return null;
    }

    return {
      limit: limit ? parseInt(limit, 10) : undefined,
      remaining: remaining ? parseInt(remaining, 10) : undefined,
      reset: reset ? parseInt(reset, 10) : undefined,
    };
  },
};

// ============================================================================
// 格式化输出
// ============================================================================

/**
 * 格式化 Gemini 速率限制状态
 */
function formatGeminiUsage(
  rateLimits: any,
  apiKey: string,
): string {
  const lines: string[] = [];

  // 标题行：Account: API Key (Google Gemini)
  const maskedKey = maskString(apiKey);
  lines.push(`${t.account} ${maskedKey} (Google Gemini)`);
  lines.push("");

  // Rate Limit Status 标题
  lines.push(t.rateLimitTitle);
  lines.push("");

  // 如果没有速率限制数据
  if (!rateLimits) {
    lines.push(t.noQuotaData);
    return lines.join("\n");
  }

  // 配额限制信息
  if (rateLimits.limit !== undefined && rateLimits.remaining !== undefined) {
    const remainingFormatted = rateLimits.remaining.toLocaleString();
    const limitFormatted = rateLimits.limit.toLocaleString();
    lines.push(`${t.geminiQuotaRemaining}: ${t.ofLimit(remainingFormatted, limitFormatted)}`);
  } else if (rateLimits.remaining !== undefined) {
    const remainingFormatted = rateLimits.remaining.toLocaleString();
    lines.push(`${t.geminiQuotaRemaining}: ${remainingFormatted}`);
  } else if (rateLimits.limit !== undefined) {
    const limitFormatted = rateLimits.limit.toLocaleString();
    lines.push(`${t.geminiQuotaLimit}: ${limitFormatted}`);
  }

  // 重置时间
  if (rateLimits.reset) {
    const now = Math.floor(Date.now() / 1000);
    const resetSeconds = Math.max(0, rateLimits.reset - now);
    if (resetSeconds > 0) {
      // reset 是绝对时间戳，需要转换为秒数
      lines.push(t.resetIn(formatGeminiResetTime(resetSeconds)));
    }
  }

  // 提示说明
  lines.push("");
  lines.push(t.geminiRateLimitNote);

  return lines.join("\n");
}

/**
 * 格式化重置时间
 * Google 返回的是绝对时间戳，不是秒数
 */
function formatGeminiResetTime(resetSeconds: number): string {
  if (resetSeconds < 60) {
    return t.minutes(0);
  } else if (resetSeconds < 3600) {
    const minutes = Math.floor(resetSeconds / 60);
    return t.minutes(minutes);
  } else if (resetSeconds < 86400) {
    const hours = Math.floor(resetSeconds / 3600);
    return t.hours(hours);
  } else {
    const days = Math.floor(resetSeconds / 86400);
    return t.days(days);
  }
}

// ============================================================================
// 导出接口
// ============================================================================

/**
 * 查询 Google Gemini 速率限制
 * @param authData Gemini 认证数据
 * @returns 查询结果，如果账号不存在或无效返回 null
 */
export const queryGeminiUsage = createProviderQueryWithHeaders(geminiConfig);
