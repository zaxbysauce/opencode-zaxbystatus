/**
 * MiniMax 速率限制查询模块
 *
 * [输入]: API Key + optional GroupId
 * [输出]: 格式化的速率限制状态
 * [定位]: 被 mystatus.ts 调用，处理 MiniMax 账号
 * [同步]: mystatus.ts, types.ts, utils.ts, i18n.ts
 */

import { t } from "./i18n";
import {
  type QueryResult,
} from "./types";
import {
  formatDuration,
  fetchWithTimeout,
  maskString,
  handleProviderError,
  validateResponse,
} from "./utils";
import { MinimaxRateLimitsSchema } from "./schemas";

// ============================================================================
// 类型定义
// ============================================================================

import type { MinimaxRateLimits } from "./schemas";

// ============================================================================
// API 配置
// ============================================================================

const MINIMAX_MODELS_URL_PRIMARY = "https://api.minimax.io/v1/models";
const MINIMAX_MODELS_URL_FALLBACK = "https://api.minimax.chat/v1/models";

// ============================================================================
// API 调用
// ============================================================================

/**
 * 获取 MiniMax 速率限制信息
 * 通过调用 models endpoint 并解析响应头获取
 * 先尝试主要端点，失败后尝试备用端点
 */
async function fetchMinimaxRateLimits(
  apiKey: string,
  groupId?: string,
): Promise<MinimaxRateLimits | null> {
  // 构建请求头
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "User-Agent": "OpenCode-Status-Plugin/1.0",
  };

  // 如果提供了 groupId，添加到请求头
  if (groupId) {
    headers["X-Group-Id"] = groupId;
  }

  // 首先尝试主要端点
  try {
    const response = await fetchWithTimeout(MINIMAX_MODELS_URL_PRIMARY, {
      method: "GET",
      headers,
    });

    // 处理响应
    if (response.status === 401) {
      throw new Error(t.minimaxAuthError);
    }

    // 其他错误
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(t.minimaxApiError(response.status, errorText));
    }

    // 解析速率限制头
    return parseRateLimitHeaders(response);
  } catch {
    // 如果主要端点失败，尝试备用端点

    const response = await fetchWithTimeout(MINIMAX_MODELS_URL_FALLBACK, {
      method: "GET",
      headers,
    });

    // 处理响应
    if (response.status === 401) {
      throw new Error(t.minimaxAuthError);
    }

    // 其他错误
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(t.minimaxApiError(response.status, errorText));
    }

    // 解析速率限制头
    return parseRateLimitHeaders(response);
  }
}

/**
 * 解析响应头中的速率限制信息
 */
function parseRateLimitHeaders(response: Response): MinimaxRateLimits | null {
  const limit = response.headers.get("x-ratelimit-limit");
  const remaining = response.headers.get("x-ratelimit-remaining");
  const reset = response.headers.get("x-ratelimit-reset");

  // 如果没有任何速率限制头，返回 null
  if (!limit && !remaining) {
    return null;
  }

  const rawData = {
    limit: limit ? parseInt(limit, 10) : 0,
    remaining: remaining ? parseInt(remaining, 10) : 0,
    reset: reset ? parseInt(reset, 10) : undefined,
  };

  return validateResponse(rawData, MinimaxRateLimitsSchema, "MiniMax");
}

// ============================================================================
// 格式化输出
// ============================================================================

/**
 * 格式化 MiniMax 速率限制状态
 */
function formatMinimaxUsage(
  rateLimits: MinimaxRateLimits | null,
  apiKey: string,
  hasGroupId: boolean,
): string {
  const lines: string[] = [];

  // 标题行：Account: API Key (MiniMax)
  const maskedKey = maskString(apiKey);
  const accountLabel = hasGroupId ? "(MiniMax - Group)" : "(MiniMax)";
  lines.push(`${t.account} ${maskedKey} ${accountLabel}`);
  lines.push("");

  // 如果没有速率限制数据
  if (!rateLimits) {
    lines.push(t.noQuotaData);
    return lines.join("\n");
  }

  // Rate Limit Status 标题
  lines.push(t.rateLimitTitle);
  lines.push("");

  // 请求限制信息
  const remainingFormatted = rateLimits.remaining.toLocaleString();
  const limitFormatted = rateLimits.limit.toLocaleString();
  lines.push(`${t.minimaxRequestsRemaining}: ${t.ofLimit(remainingFormatted, limitFormatted)}`);

  // 重置时间
  if (rateLimits.reset) {
    const now = Math.floor(Date.now() / 1000);
    const resetSeconds = Math.max(0, rateLimits.reset - now);
    if (resetSeconds > 0) {
      lines.push(t.resetIn(formatDuration(resetSeconds)));
    }
  }

  // 提示说明
  lines.push("");
  lines.push(t.minimaxDashboardNote);

  return lines.join("\n");
}

// ============================================================================
// 导出接口
// ============================================================================

/**
 * MiniMax 认证数据类型
 */
interface MinimaxAuthData {
  key: string;
  groupId?: string;
}

/**
 * 查询 MiniMax 速率限制
 * @param authData MiniMax 认证数据
 * @returns 查询结果，如果账号不存在或无效返回 null
 */
export async function queryMinimaxUsage(
  authData: MinimaxAuthData | undefined,
): Promise<QueryResult | null> {
  // 检查认证数据是否存在且有效
  if (!authData || !authData.key) {
    return null;
  }

  try {
    const rateLimits = await fetchMinimaxRateLimits(authData.key, authData.groupId);
    return {
      success: true,
      output: formatMinimaxUsage(rateLimits, authData.key, !!authData.groupId),
    };
  } catch (err) {
    return handleProviderError(err, "MiniMax");
  }
}
