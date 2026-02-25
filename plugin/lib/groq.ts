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
  fetchWithTimeout,
  maskString,
} from "./utils";

// ============================================================================
// 类型定义
// ============================================================================

/**
 * Groq 速率限制信息
 * 从响应头中提取
 */
interface GroqRateLimits {
  /** 窗口内请求限制数 */
  requestLimit: number;
  /** 窗口内剩余请求数 */
  requestsRemaining: number;
  /** 请求重置时间（秒） */
  requestResetSeconds: number;
  /** 窗口内 Token 限制数 */
  tokenLimit?: number;
  /** 窗口内剩余 Token 数 */
  tokensRemaining?: number;
  /** Token 重置时间（秒） */
  tokenResetSeconds?: number;
}

// ============================================================================
// API 配置
// ============================================================================

const GROQ_MODELS_URL = "https://api.groq.com/openai/v1/models";

// ============================================================================
// API 调用
// ============================================================================

/**
 * 获取 Groq 速率限制信息
 * 通过调用 models endpoint 并解析响应头获取
 */
async function fetchGroqRateLimits(
  apiKey: string,
): Promise<GroqRateLimits | null> {
  const response = await fetchWithTimeout(GROQ_MODELS_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "OpenCode-Status-Plugin/1.0",
    },
  });

  // 401 表示认证失败（无效的 API key）
  if (response.status === 401) {
    throw new Error(t.groqAuthError);
  }

  // 其他错误
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(t.groqApiError(response.status, errorText));
  }

  // 解析速率限制头
  const requestLimit = response.headers.get(
    "x-ratelimit-limit-requests",
  );
  const requestsRemaining = response.headers.get(
    "x-ratelimit-remaining-requests",
  );
  const requestReset = response.headers.get(
    "x-ratelimit-reset-requests",
  );
  const tokenLimit = response.headers.get(
    "x-ratelimit-limit-tokens",
  );
  const tokensRemaining = response.headers.get(
    "x-ratelimit-remaining-tokens",
  );
  const tokenReset = response.headers.get(
    "x-ratelimit-reset-tokens",
  );

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
}

// ============================================================================
// 格式化输出
// ============================================================================

/**
 * 格式化 Groq 速率限制状态
 */
function formatGroqUsage(
  rateLimits: GroqRateLimits | null,
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
export async function queryGroqUsage(
  authData: ApiKeyAuthData | undefined,
): Promise<QueryResult | null> {
  // 检查认证数据是否存在且有效
  if (!authData || authData.type !== "api" || !authData.key) {
    return null;
  }

  try {
    const rateLimits = await fetchGroqRateLimits(authData.key);
    return {
      success: true,
      output: formatGroqUsage(rateLimits, authData.key),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
