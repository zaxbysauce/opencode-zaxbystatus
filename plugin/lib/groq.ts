/**
 * Groq 速率限制查询模块
 *
 * [输入]: API Key
 * [输出]: 格式化的速率限制状态
 * [定位]: 被 mystatus.ts 调用，处理 Groq 账号
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
  fetchWithTimeout,
} from "./utils";
import { GroqRateLimitsSchema } from "./schemas";
import { createProviderQueryWithHeaders } from "./provider-factory";

// ============================================================================
// Provider Configuration
// ============================================================================

const groqConfig = {
  name: "Groq",
  baseUrl: "https://api.groq.com",
  authHeader: (key: string) => ({ Authorization: `Bearer ${key}` }),
  endpoint: "/openai/v1/models",
  schema: GroqRateLimitsSchema,
  transform: (data: any, apiKey: string) => formatGroqUsage(data, apiKey),
  parseHeaders: (headers: Headers): any | null => {
    const requestLimit = headers.get("x-ratelimit-limit-requests");
    const requestsRemaining = headers.get("x-ratelimit-remaining-requests");
    const requestReset = headers.get("x-ratelimit-reset-requests");
    const tokenLimit = headers.get("x-ratelimit-limit-tokens");
    const tokensRemaining = headers.get("x-ratelimit-remaining-tokens");
    const tokenReset = headers.get("x-ratelimit-reset-tokens");

    // 如果没有任何速率限制头，返回 null
    if (!requestLimit && !requestsRemaining && !tokenLimit && !tokensRemaining) {
      return null;
    }

    return {
      requestLimit: requestLimit ? parseInt(requestLimit, 10) : 0,
      requestsRemaining: requestsRemaining
        ? parseInt(requestsRemaining, 10)
        : 0,
      requestResetSeconds: requestReset ? parseInt(requestReset, 10) : 0,
      tokenLimit: tokenLimit ? parseInt(tokenLimit, 10) : undefined,
      tokensRemaining: tokensRemaining
        ? parseInt(tokensRemaining, 10)
        : undefined,
      tokenResetSeconds: tokenReset ? parseInt(tokenReset, 10) : undefined,
    };
  },
};

// ============================================================================
// 格式化输出
// ============================================================================

/**
 * 格式化 Groq 速率限制状态
 */
function formatGroqUsage(
  rateLimits: any,
  apiKey: string,
): string {
  const lines: string[] = [];

  // 标题行：Account: API Key (Groq)
  const maskedKey = maskString(apiKey);
  lines.push(`${t.account} ${maskedKey} (Groq)`);
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
  const requestsFormatted = rateLimits.requestsRemaining.toLocaleString();
  const limitFormatted = rateLimits.requestLimit.toLocaleString();
  lines.push(`${t.groqRequestsRemaining}: ${t.ofLimit(requestsFormatted, limitFormatted)}`);

  // 请求重置时间
  if (rateLimits.requestResetSeconds > 0) {
    lines.push(t.resetIn(formatDuration(rateLimits.requestResetSeconds)));
  }

  // Token 限制信息（如果有）
  if (rateLimits.tokenLimit && rateLimits.tokensRemaining !== undefined) {
    lines.push("");
    const tokensRemainingFormatted = rateLimits.tokensRemaining.toLocaleString();
    const tokenLimitFormatted = rateLimits.tokenLimit.toLocaleString();
    lines.push(
      `${t.groqTokensRemaining}: ${t.ofLimit(tokensRemainingFormatted, tokenLimitFormatted)}`,
    );

    // Token 重置时间
    if (rateLimits.tokenResetSeconds && rateLimits.tokenResetSeconds > 0) {
      lines.push(t.resetIn(formatDuration(rateLimits.tokenResetSeconds)));
    }
  }

  // 提示说明
  lines.push("");
  lines.push(t.groqRateLimitNote);

  return lines.join("\n");
}

// ============================================================================
// 导出接口
// ============================================================================

/**
 * 查询 Groq 速率限制
 * @param authData Groq 认证数据
 * @returns 查询结果，如果账号不存在或无效返回 null
 */
export const queryGroqUsage = createProviderQueryWithHeaders(groqConfig);
