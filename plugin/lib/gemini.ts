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
  fetchWithTimeout,
  maskString,
} from "./utils";

// ============================================================================
// 类型定义
// ============================================================================

/**
 * Gemini 速率限制信息
 * 从响应头中提取
 */
interface GeminiRateLimits {
  /** 配额限制 */
  limit?: number;
  /** 剩余配额 */
  remaining?: number;
  /** 重置时间（Unix 时间戳，秒） */
  reset?: number;
}

// ============================================================================
// API 配置
// ============================================================================

const GEMINI_MODELS_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

// ============================================================================
// API 调用
// ============================================================================

/**
 * 获取 Gemini 速率限制信息
 * 通过调用 models endpoint 并解析响应头获取
 */
async function fetchGeminiRateLimits(
  apiKey: string,
): Promise<GeminiRateLimits | null> {
  const url = `${GEMINI_MODELS_URL}?key=${apiKey}`;
  const response = await fetchWithTimeout(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "OpenCode-Status-Plugin/1.0",
    },
  });

  // 400 表示认证失败（无效的 API key）
  if (response.status === 400) {
    throw new Error(t.geminiInvalidKey);
  }

  // 403 通常表示配额超出或权限不足
  if (response.status === 403) {
    throw new Error(t.geminiApiError(response.status, ""));
  }

  // 其他错误
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(t.geminiApiError(response.status, errorText));
  }

  // 解析速率限制头
  const limit = response.headers.get("x-ratelimit-limit");
  const remaining = response.headers.get("x-ratelimit-remaining");
  const reset = response.headers.get("x-ratelimit-reset");

  // 如果没有任何速率限制头，返回 null
  if (!limit && !remaining) {
    return null;
  }

  return {
    limit: limit ? parseInt(limit, 10) : undefined,
    remaining: remaining ? parseInt(remaining, 10) : undefined,
    reset: reset ? parseInt(reset, 10) : undefined,
  };
}

// ============================================================================
// 格式化输出
// ============================================================================

/**
 * 格式化 Gemini 速率限制状态
 */
function formatGeminiUsage(
  rateLimits: GeminiRateLimits | null,
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
export async function queryGeminiUsage(
  authData: ApiKeyAuthData | undefined,
): Promise<QueryResult | null> {
  // 检查认证数据是否存在且有效
  if (!authData || authData.type !== "api" || !authData.key) {
    return null;
  }

  try {
    const rateLimits = await fetchGeminiRateLimits(authData.key);
    return {
      success: true,
      output: formatGeminiUsage(rateLimits, authData.key),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
