/**
 * Chutes AI 额度查询模块
 *
 * [输入]: JWT Token
 * [输出]: 格式化的额度使用情况
 * [定位]: 被 mystatus.ts 调用，处理 Chutes AI 账号
 * [同步]: mystatus.ts, types.ts, utils.ts, i18n.ts
 */

import { t } from "./i18n";
import {
  type QueryResult,
  type MyStatusConfig,
  HIGH_USAGE_THRESHOLD,
} from "./types";
import {
  formatDuration,
  createProgressBar,
  calcRemainPercent,
  fetchWithTimeout,
  safeMax,
  maskString,
  handleProviderError,
  validateResponse,
} from "./utils";
import {
  ChutesQuotaUsageResponseSchema,
  ChutesQuotaLimitsResponseSchema,
} from "./schemas";

// ============================================================================
// 类型定义
// ============================================================================

import type {
  ChutesQuotaUsageItem,
  ChutesQuotaUsageResponse,
  ChutesQuotaLimitItem,
  ChutesQuotaLimitsResponse,
} from "./schemas";

// ============================================================================
// API 配置
// ============================================================================

const CHUTES_QUOTA_USAGE_URL =
  "https://api.chutes.ai/users/me/quota_usage/me";
const CHUTES_QUOTA_LIMITS_URL = "https://api.chutes.ai/users/me/quotas";

// ============================================================================
// API 调用
// ============================================================================

/**
 * 获取 Chutes 配额使用量
 */
async function fetchChutesQuotaUsage(
  token: string,
): Promise<ChutesQuotaUsageResponse> {
  const response = await fetchWithTimeout(CHUTES_QUOTA_USAGE_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "OpenCode-Status-Plugin/1.0",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) {
      throw new Error(t.chutesAuthError);
    }
    throw new Error(t.chutesApiError(response.status, errorText));
  }

  const rawData = await response.json();
  return validateResponse(rawData, ChutesQuotaUsageResponseSchema, "Chutes");
}

/**
 * 获取 Chutes 配额限制
 */
async function fetchChutesQuotas(
  token: string,
): Promise<ChutesQuotaLimitsResponse> {
  const response = await fetchWithTimeout(CHUTES_QUOTA_LIMITS_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "OpenCode-Status-Plugin/1.0",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) {
      throw new Error(t.chutesAuthError);
    }
    throw new Error(t.chutesApiError(response.status, errorText));
  }

  const rawData = await response.json();
  return validateResponse(rawData, ChutesQuotaLimitsResponseSchema, "Chutes");
}

// ============================================================================
// 格式化输出
// ============================================================================

/**
 * 格式化 Chutes 使用情况
 */
function formatChutesUsage(
  usage: ChutesQuotaUsageResponse,
  quotas: ChutesQuotaLimitsResponse,
  token: string,
): string {
  const lines: string[] = [];

  // 标题行：Account: Token (Chutes AI)
  const maskedToken = maskString(token);
  lines.push(`${t.account} ${maskedToken} (Chutes AI)`);
  lines.push("");

  // 获取使用量数据
  const usageItems = usage.currentPeriodUsage;

  // 空数组检查
  if (!usageItems || usageItems.length === 0) {
    lines.push(t.noQuotaData);
    return lines.join("\n");
  }

  // 创建配额名称到限制的映射
  const quotaLimitsMap = new Map<string, ChutesQuotaLimitItem>();
  for (const quota of quotas.quotas) {
    quotaLimitsMap.set(quota.name, quota);
  }

  // 遍历每个使用量项并格式化
  for (const item of usageItems) {
    const remainPercent = calcRemainPercent(item.percentage);
    const progressBar = createProgressBar(remainPercent);

    // 配额类型/名称
    lines.push(item.name || item.quotaType);

    // 进度条和剩余百分比
    lines.push(`${progressBar} ${t.remaining(remainPercent)}`);

    // 已用 / 总量
    const used = item.used.toLocaleString();
    const limit = item.limit.toLocaleString();
    lines.push(`${t.used}: ${used} / ${limit}`);

    // 重置时间
    if (item.resetAt) {
      const now = Math.floor(Date.now() / 1000);
      const resetSeconds = Math.max(0, item.resetAt - now);
      if (resetSeconds > 0) {
        lines.push(t.resetIn(formatDuration(resetSeconds)));
      }
    }

    // 每个配额项之间添加空行
    lines.push("");
  }

  // 警告：如果任一配额使用率超过阈值
  const maxPercentage = safeMax(usageItems.map((l) => l.percentage));
  if (maxPercentage >= HIGH_USAGE_THRESHOLD) {
    lines.push(t.limitReached);
  }

  return lines.join("\n");
}

// ============================================================================
// 导出接口
// ============================================================================

/**
 * 查询 Chutes AI 账号额度
 * @param config Chutes 认证配置（包含 token）
 * @returns 查询结果，如果账号不存在或无效返回 null
 */
export async function queryChutesUsage(
  config: MyStatusConfig["chutes"] | undefined,
): Promise<QueryResult | null> {
  // 检查配置是否存在且包含 token
  if (!config || !config.token) {
    return null;
  }

  try {
    // 并行获取使用量和配额限制
    const [usage, quotas] = await Promise.all([
      fetchChutesQuotaUsage(config.token),
      fetchChutesQuotas(config.token),
    ]);

    return {
      success: true,
      output: formatChutesUsage(usage, quotas, config.token),
    };
  } catch (err) {
    return handleProviderError(err, "Chutes");
  }
}
