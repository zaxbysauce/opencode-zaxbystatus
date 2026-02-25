/**
 * Abacus AI 账号额度查询模块
 *
 * [输入]: API Key
 * [输出]: 格式化的账号额度状态
 * [定位]: 被 mystatus.ts 调用，处理 Abacus AI 账号
 * [同步]: mystatus.ts, types.ts, utils.ts, i18n.ts
 */

import { t } from "./i18n";
import {
  type QueryResult,
  type MyStatusConfig,
} from "./types";
import {
  fetchWithTimeout,
  maskString,
} from "./utils";

// ============================================================================
// 类型定义
// ============================================================================

/**
 * Abacus AI 使用量响应
 * 灵活的响应结构，因为具体端点未确认
 */
interface AbacusUsageResponse {
  /** 使用量 */
  usage?: number;
  /** 限额 */
  limit?: number;
  /** 积分 */
  credits?: number;
  /** 剩余积分 */
  creditsRemaining?: number;
  /** 已用积分 */
  creditsUsed?: number;
  /** 账户信息 */
  account?: {
    name?: string;
    email?: string;
    plan?: string;
  };
  /** 其他可能的字段 */
  [key: string]: unknown;
}

// ============================================================================
// API 配置
// ============================================================================

const ABACUS_BASE_URL = "https://abacus.ai/api/v0";

// 尝试的端点列表（按优先级排序）
const ABACUS_ENDPOINTS = [
  "/getUsage",
  "/usage",
  "/account",
];

// ============================================================================
// API 调用
// ============================================================================

/**
 * 获取 Abacus AI 使用量信息
 * 尝试多个端点，依次降级直到成功
 * @param apiKey Abacus API Key
 * @returns 使用量数据
 */
async function fetchAbacusUsage(apiKey: string): Promise<AbacusUsageResponse> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "User-Agent": "OpenCode-Status-Plugin/1.0",
  };

  // 依次尝试每个端点
  for (const endpoint of ABACUS_ENDPOINTS) {
    const url = `${ABACUS_BASE_URL}${endpoint}`;
    console.log(`Trying Abacus endpoint: ${endpoint}`);

    try {
      const response = await fetchWithTimeout(url, {
        method: "GET",
        headers,
      });

      // 处理 401 认证错误 - 立即抛出，不尝试其他端点
      if (response.status === 401) {
        throw new Error(t.abacusAuthError);
      }

      // 如果请求成功，解析响应
      if (response.ok) {
        const data = await response.json() as AbacusUsageResponse;
        console.log(`Abacus endpoint ${endpoint} succeeded`);
        return data;
      }

      // 其他错误码，记录并继续尝试下一个端点
      const errorText = await response.text();
      console.log(`Abacus endpoint ${endpoint} failed (${response.status}): ${errorText}`);
    } catch (err) {
      // 如果是认证错误，立即抛出
      if (err instanceof Error && err.message === t.abacusAuthError) {
        throw err;
      }
      // 其他错误，记录并继续
      console.log(`Abacus endpoint ${endpoint} error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 所有端点都失败
  throw new Error(t.abacusAllEndpointsFailed);
}

// ============================================================================
// 格式化输出
// ============================================================================

/**
 * 格式化 Abacus AI 账号状态
 */
function formatAbacusUsage(
  data: AbacusUsageResponse | null,
  apiKey: string,
): string {
  const lines: string[] = [];

  // 标题行：Account: API Key (Abacus AI)
  const maskedKey = maskString(apiKey);
  lines.push(`${t.account} ${maskedKey} (Abacus AI)`);
  lines.push("");

  // 如果没有数据
  if (!data) {
    lines.push(t.noQuotaData);
    lines.push("");
    lines.push(t.abacusEndpointNote);
    return lines.join("\n");
  }

  // 查找可用的使用量信息
  let usage: number | undefined;
  let limit: number | undefined;
  let credits: number | undefined;
  let creditsRemaining: number | undefined;
  let creditsUsed: number | undefined;

  // 尝试从响应中提取使用量信息
  if (typeof data.usage === "number") {
    usage = data.usage;
  }
  if (typeof data.limit === "number") {
    limit = data.limit;
  }
  if (typeof data.credits === "number") {
    credits = data.credits;
  }
  if (typeof data.creditsRemaining === "number") {
    creditsRemaining = data.creditsRemaining;
  }
  if (typeof data.creditsUsed === "number") {
    creditsUsed = data.creditsUsed;
  }

  // 显示使用量信息
  const hasUsageData = usage !== undefined || credits !== undefined || creditsRemaining !== undefined;

  if (hasUsageData) {
    if (credits !== undefined || creditsRemaining !== undefined || creditsUsed !== undefined) {
      // 积分信息
      lines.push(t.abacusCredits + ":");
      if (creditsUsed !== undefined) {
        lines.push(`  ${t.used}: ${creditsUsed.toLocaleString()}`);
      }
      if (creditsRemaining !== undefined) {
        lines.push(`  ${t.abacusCreditsRemaining}: ${creditsRemaining.toLocaleString()}`);
      }
      if (credits !== undefined) {
        lines.push(`  ${t.abacusCreditsTotal}: ${credits.toLocaleString()}`);
      }
    }

    if (usage !== undefined && limit !== undefined) {
      // 使用量/限额信息
      lines.push(t.abacusUsage + ":");
      lines.push(`  ${t.used}: ${usage.toLocaleString()}`);
      lines.push(`  ${t.limit}: ${limit.toLocaleString()}`);
      const remaining = limit - usage;
      lines.push(`  ${t.remaining(0)}: ${remaining.toLocaleString()} (${((remaining / limit) * 100).toFixed(1)}%)`);
    } else if (usage !== undefined) {
      lines.push(`${t.abacusUsage}: ${usage.toLocaleString()}`);
    }
  } else {
    // 没有标准使用量数据，显示原始响应（调试用）
    lines.push(t.noQuotaData);
    lines.push("");
    lines.push(t.abacusEndpointNote);

    // 可选：显示账户信息如果存在
    if (data.account) {
      lines.push("");
      lines.push("Account Info:");
      if (data.account.name) {
        lines.push(`  Name: ${data.account.name}`);
      }
      if (data.account.email) {
        lines.push(`  Email: ${data.account.email}`);
      }
      if (data.account.plan) {
        lines.push(`  Plan: ${data.account.plan}`);
      }
    }
  }

  // 提示说明
  lines.push("");
  lines.push(t.abacusDashboardNote);

  return lines.join("\n");
}

// ============================================================================
// 导出接口
// ============================================================================

/**
 * Abacus 认证数据类型
 */
type AbacusAuthData = MyStatusConfig["abacus"];

/**
 * 查询 Abacus AI 账号额度
 * @param authData Abacus 认证数据
 * @returns 查询结果，如果账号不存在或无效返回 null
 */
export async function queryAbacusUsage(
  authData: AbacusAuthData | undefined,
): Promise<QueryResult | null> {
  // 检查认证数据是否存在且有效
  if (!authData || !authData.key) {
    return null;
  }

  try {
    const usageData = await fetchAbacusUsage(authData.key);
    return {
      success: true,
      output: formatAbacusUsage(usageData, authData.key),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
