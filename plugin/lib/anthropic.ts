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
  maskString,
} from "./utils";
import { AnthropicRateLimitsSchema } from "./schemas";
import { createProviderQueryWithHeaders } from "./provider-factory";

// ============================================================================
// Provider Configuration
// ============================================================================

const anthropicConfig = {
  name: "Anthropic",
  baseUrl: "https://api.anthropic.com",
  authHeader: (key: string) => ({ "x-api-key": key, "anthropic-version": "2023-06-01" }),
  endpoint: "/v1/models",
  schema: AnthropicRateLimitsSchema,
  transform: (data: any, apiKey: string) => formatAnthropicUsage(data, apiKey),
  parseHeaders: (headers: Headers): any | null => {
    const requestsRemaining = headers.get("anthropic-ratelimit-requests-remaining");
    const tokensRemaining = headers.get("anthropic-ratelimit-tokens-remaining");
    const tokensReset = headers.get("anthropic-ratelimit-tokens-reset");

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
  },
};

// ============================================================================
// 格式化输出
// ============================================================================

/**
 * 格式化 Anthropic 速率限制状态
 */
function formatAnthropicUsage(
  rateLimits: any,
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
export const queryAnthropicUsage = createProviderQueryWithHeaders(anthropicConfig);
