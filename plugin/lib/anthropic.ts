/**
 * Anthropic Claude 速率限制查询模块
 *
 * [输入]: API Key
 * [输出]: 格式化的速率限制状态
 * [定位]: 被 mystatus.ts 调用，处理 Anthropic Claude 账号
 * [同步]: mystatus.ts, types.ts, utils.ts, i18n.ts
 */

import { t } from "./i18n";
import {
  type QueryResult,
  type ApiKeyAuthData,
} from "./types";
import {
  formatDuration,
  fetchWithTimeout,
  maskString,
} from "./utils";

// ============================================================================
// 类型定义
// ============================================================================

/**
 * Anthropic 速率限制信息
 * 从响应头中提取
 */
interface AnthropicRateLimits {
  /** 窗口内剩余请求数 */
  requestsRemaining: number;
  /** 窗口内剩余 Token 数 */
  tokensRemaining: number;
  /** Token 重置时间戳 (Unix, 秒) */
  tokensReset?: number;
}

// ============================================================================
// API 配置
// ============================================================================

const ANTHROPIC_MODELS_URL = "https://api.anthropic.com/v1/models";

// ============================================================================
// API 调用
// ============================================================================

/**
 * 获取 Anthropic 速率限制信息
 * 通过调用 models endpoint 并解析响应头获取
 */
async function fetchAnthropicRateLimits(
  apiKey: string,
): Promise<AnthropicRateLimits | null> {
  const response = await fetchWithTimeout(ANTHROPIC_MODELS_URL, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
      "User-Agent": "OpenCode-Status-Plugin/1.0",
    },
  });

  // 401 表示认证失败（无效的 API key）
  if (response.status === 401) {
    throw new Error(t.anthropicAuthError);
  }

  // 其他错误
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(t.anthropicApiError(response.status, errorText));
  }

  // 解析速率限制头
  const requestsRemaining = response.headers.get(
    "anthropic-ratelimit-requests-remaining",
  );
  const tokensRemaining = response.headers.get(
    "anthropic-ratelimit-tokens-remaining",
  );
  const tokensReset = response.headers.get(
    "anthropic-ratelimit-tokens-reset",
  );

  // 如果没有速率限制头，返回 null
  if (!requestsRemaining && !tokensRemaining) {
    return null;
  }

  return {
    requestsRemaining: requestsRemaining
      ? parseInt(requestsRemaining, 10)
      : 0,
    tokensRemaining: tokensRemaining
      ? parseInt(tokensRemaining, 10)
      : 0,
    tokensReset: tokensReset ? parseInt(tokensReset, 10) : undefined,
  };
}

// ============================================================================
// 格式化输出
// ============================================================================

/**
 * 格式化 Anthropic 速率限制状态
 */
function formatAnthropicUsage(
  rateLimits: AnthropicRateLimits | null,
  apiKey: string,
): string {
  const lines: string[] = [];

  // 标题行：Account: API Key (Anthropic Claude)
  const maskedKey = maskString(apiKey);
  lines.push(`${t.account} ${maskedKey} (Anthropic Claude)`);
  lines.push("");

  // 如果没有速率限制数据
  if (!rateLimits) {
    lines.push(t.noQuotaData);
    return lines.join("\n");
  }

  // Rate Limit Status 标题
  lines.push(t.rateLimitTitle);
  lines.push("");

  // 请求剩余数
  const requestsFormatted = rateLimits.requestsRemaining.toLocaleString();
  lines.push(`${t.requestsRemaining}: ${requestsFormatted}`);

  // Token 剩余数
  const tokensFormatted = rateLimits.tokensRemaining.toLocaleString();
  lines.push(`${t.tokensRemaining}: ${tokensFormatted}`);

  // 重置时间
  if (rateLimits.tokensReset) {
    const now = Math.floor(Date.now() / 1000);
    const resetSeconds = Math.max(0, rateLimits.tokensReset - now);
    if (resetSeconds > 0) {
      lines.push(t.resetIn(formatDuration(resetSeconds)));
    }
  }

  // 提示说明
  lines.push("");
  lines.push(t.rateLimitNote);

  return lines.join("\n");
}

// ============================================================================
// 导出接口
// ============================================================================

/**
 * 查询 Anthropic Claude 速率限制
 * @param authData Anthropic 认证数据
 * @returns 查询结果，如果账号不存在或无效返回 null
 */
export async function queryAnthropicUsage(
  authData: ApiKeyAuthData | undefined,
): Promise<QueryResult | null> {
  // 检查认证数据是否存在且有效
  if (!authData || authData.type !== "api" || !authData.key) {
    return null;
  }

  try {
    const rateLimits = await fetchAnthropicRateLimits(authData.key);
    return {
      success: true,
      output: formatAnthropicUsage(rateLimits, authData.key),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
