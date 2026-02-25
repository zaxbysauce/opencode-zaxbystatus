/**
 * Abacus AI 账号额度查询模块
 * @experimental - API endpoints not verified. May not work correctly.
 *
 * [输入]: API Key
 * [输出]: 格式化的账号额度状态
 * [定位]: 被 mystatus.ts 调用，处理 Abacus AI 账号
 * [同步]: mystatus.ts, types.ts, utils.ts, i18n.ts
 */

import { t } from "./i18n";
import { type MyStatusConfig } from "./types";
import {
  maskString,
} from "./utils";
import { AbacusUsageResponseSchema } from "./schemas";
import { createProviderQuery } from "./provider-factory";

// ============================================================================
// 类型定义
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { AbacusUsageResponse } from "./schemas";

// ============================================================================
// Provider Configuration
// ============================================================================

const abacusConfig = {
  name: "Abacus",
  baseUrl: "https://abacus.ai/api/v0",
  authHeader: (key: string) => ({ Authorization: `Bearer ${key}` }),
  endpoint: "/getUsage",
  schema: AbacusUsageResponseSchema,
  transform: (data: unknown, apiKey: string) => formatAbacusUsage(data, apiKey),
};

// ============================================================================
// 格式化输出
// ============================================================================

/**
 * 格式化 Abacus AI 账号状态
 */
function formatAbacusUsage(
  data: unknown,
  apiKey: string,
): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawData = data as any;
  const lines: string[] = [];

  // 标题行：Account: API Key (Abacus AI)
  const maskedKey = maskString(apiKey);
  lines.push(`${t.account} ${maskedKey} (Abacus AI)`);
  lines.push("");
  lines.push("⚠️ This provider is experimental. API endpoints not verified.");
  lines.push("");

  // 如果没有数据
  if (!rawData) {
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
  if (typeof rawData.usage === "number") {
    usage = rawData.usage;
  }
  if (typeof rawData.limit === "number") {
    limit = rawData.limit;
  }
  if (typeof rawData.credits === "number") {
    credits = rawData.credits;
  }
  if (typeof rawData.creditsRemaining === "number") {
    creditsRemaining = rawData.creditsRemaining;
  }
  if (typeof rawData.creditsUsed === "number") {
    creditsUsed = rawData.creditsUsed;
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
    if (rawData.account) {
      lines.push("");
      lines.push("Account Info:");
      if (rawData.account.name) {
        lines.push(`  Name: ${rawData.account.name}`);
      }
      if (rawData.account.email) {
        lines.push(`  Email: ${rawData.account.email}`);
      }
      if (rawData.account.plan) {
        lines.push(`  Plan: ${rawData.account.plan}`);
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type AbacusAuthData = MyStatusConfig["abacus"];

/**
 * 查询 Abacus AI 账号额度
 * @param authData Abacus 认证数据
 * @returns 查询结果，如果账号不存在或无效返回 null
 */
export const queryAbacusUsage = createProviderQuery(abacusConfig);
