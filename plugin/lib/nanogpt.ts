/**
 * Nano-GPT 账号额度查询模块
 * @experimental - API endpoints not verified. May not work correctly.
 *
 * [输入]: API Key
 * [输出]: 格式化的账号额度状态
 * [定位]: 被 mystatus.ts 调用，处理 Nano-GPT 账号
 * [同步]: mystatus.ts, types.ts, utils.ts, i18n.ts
 */

import { t } from "./i18n";
import {
  type QueryResult,
  type MyStatusConfig,
} from "./types";
import {
  maskString,
} from "./utils";
import { NanoGptAccountResponseSchema } from "./schemas";
import { createProviderQuery } from "./provider-factory";

// ============================================================================
// 类型定义
// ============================================================================

import type { NanoGptAccountResponse } from "./schemas";

// ============================================================================
// Provider Configuration
// ============================================================================

const nanogptConfig = {
  name: "NanoGPT",
  baseUrl: "https://nano-gpt.com/api",
  authHeader: (key: string) => ({ Authorization: `Bearer ${key}` }),
  endpoint: "/account",
  schema: NanoGptAccountResponseSchema,
  transform: (data: any, apiKey: string) => formatNanoGptUsage(data, apiKey),
};

// ============================================================================
// 格式化输出
// ============================================================================

/**
 * 格式化 Nano-GPT 账号状态
 */
function formatNanoGptUsage(
  data: any,
  apiKey: string,
): string {
  const lines: string[] = [];

  // 标题行：Account: API Key (Nano-GPT)
  const maskedKey = maskString(apiKey);
  lines.push(`${t.account} ${maskedKey} (Nano-GPT)`);
  lines.push("");
  lines.push("⚠️ This provider is experimental. API endpoints not verified.");
  lines.push("");

  // 如果没有数据
  if (!data) {
    lines.push(t.noQuotaData);
    return lines.join("\n");
  }

  // 显示标题
  lines.push(t.nanoGptTitle.replace("## ", "").trim());
  lines.push("");

  // 账户余额
  if (typeof data.balance === "number") {
    const currency = data.currency || "USD";
    lines.push(`${t.nanoGptBalance}: ${currency} ${data.balance.toFixed(2)}`);
  }

  // 尝试转换为账户响应类型以获取更多信息
  const accountData = data as NanoGptAccountResponse;

  // 每日请求限制 (RPD)
  if (typeof accountData.rpdLimit === "number") {
    lines.push(`${t.nanoGptRpdLimit}: ${accountData.rpdLimit.toLocaleString()}`);
  }

  // 每日 USD 限制
  if (typeof accountData.usdPerDayLimit === "number") {
    lines.push(`${t.nanoGptUsdLimit}: $${accountData.usdPerDayLimit.toFixed(2)}`);
  }

  // 今日使用量
  if (accountData.usage && typeof accountData.usage.today === "number") {
    lines.push(`${t.nanoGptTodayUsage}: ${accountData.usage.today.toLocaleString()}`);
  }

  // 如果没有任何数据
  if (lines.length <= 3) {
    lines.push(t.noQuotaData);
  }

  return lines.join("\n");
}

// ============================================================================
// 导出接口
// ============================================================================

/**
 * Nano-GPT 认证数据类型
 */
type NanoGptAuthData = MyStatusConfig["nano-gpt"];

/**
 * 查询 Nano-GPT 账号额度
 * @param authData Nano-GPT 认证数据
 * @returns 查询结果，如果账号不存在或无效返回 null
 */
export const queryNanoGptUsage = createProviderQuery(nanogptConfig);
