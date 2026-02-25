/**
 * Nano-GPT 账号额度查询模块
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
  fetchWithTimeout,
  maskString,
} from "./utils";

// ============================================================================
// 类型定义
// ============================================================================

/**
 * Nano-GPT 账号响应
 */
interface NanoGptAccountResponse {
  /** 账户余额 */
  balance?: number;
  /** 货币单位 */
  currency?: string;
  /** 每日请求限制 (RPD) */
  rpdLimit?: number;
  /** 每日 USD 限制 */
  usdPerDayLimit?: number;
  /** 使用量信息 */
  usage?: {
    /** 今日使用量 */
    today?: number;
    /** 本月使用量 */
    thisMonth?: number;
  };
  /** 其他可能的字段 */
  [key: string]: unknown;
}

/**
 * Nano-GPT 余额响应（备用端点）
 */
interface NanoGptBalanceResponse {
  /** 余额 */
  balance?: number;
  /** 货币单位 */
  currency?: string;
  /** 其他可能的字段 */
  [key: string]: unknown;
}

// ============================================================================
// API 配置
// ============================================================================

const NANOGPT_BASE_URL = "https://nano-gpt.com/api";

// ============================================================================
// API 调用
// ============================================================================

/**
 * 获取 Nano-GPT 账号信息
 * 优先尝试 /account 端点，失败则降级到 /balance
 * @param apiKey Nano-GPT API Key
 * @returns 账号数据
 */
async function fetchNanoGptAccount(apiKey: string): Promise<NanoGptAccountResponse | NanoGptBalanceResponse> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "User-Agent": "OpenCode-Status-Plugin/1.0",
  };

  // 首先尝试 /account 端点
  const accountUrl = `${NANOGPT_BASE_URL}/account`;
  console.log("Trying Nano-GPT endpoint: /account");

  try {
    const accountResponse = await fetchWithTimeout(accountUrl, {
      method: "GET",
      headers,
    });

    // 处理 401 认证错误
    if (accountResponse.status === 401) {
      throw new Error(t.nanoGptAuthError);
    }

    // 处理 429 速率限制
    if (accountResponse.status === 429) {
      const retryAfter = accountResponse.headers.get("Retry-After");
      throw new Error(t.nanoGptRateLimitError(retryAfter));
    }

    // 如果请求成功
    if (accountResponse.ok) {
      const data = await accountResponse.json() as NanoGptAccountResponse;
      console.log("Nano-GPT /account endpoint succeeded");
      return data;
    }

    // 其他错误，记录并继续尝试备用端点
    const errorText = await accountResponse.text();
    console.log(`Nano-GPT /account endpoint failed (${accountResponse.status}): ${errorText}`);
  } catch (err) {
    // 如果是认证错误，立即抛出
    if (err instanceof Error && err.message === t.nanoGptAuthError) {
      throw err;
    }
    // 如果是速率限制错误，立即抛出
    if (err instanceof Error && err.message.startsWith("⚠️")) {
      throw err;
    }
    // 其他错误，记录并继续
    console.log(`Nano-GPT /account endpoint error: ${err instanceof Error ? err.message : String(err)}`);
  }

  // 备用：尝试 /balance 端点
  const balanceUrl = `${NANOGPT_BASE_URL}/balance`;
  console.log("Trying Nano-GPT endpoint: /balance");

  try {
    const balanceResponse = await fetchWithTimeout(balanceUrl, {
      method: "GET",
      headers,
    });

    // 处理 401 认证错误
    if (balanceResponse.status === 401) {
      throw new Error(t.nanoGptAuthError);
    }

    // 处理 429 速率限制
    if (balanceResponse.status === 429) {
      const retryAfter = balanceResponse.headers.get("Retry-After");
      throw new Error(t.nanoGptRateLimitError(retryAfter));
    }

    // 如果请求成功
    if (balanceResponse.ok) {
      const data = await balanceResponse.json() as NanoGptBalanceResponse;
      console.log("Nano-GPT /balance endpoint succeeded");
      return data;
    }

    // 其他错误
    const errorText = await balanceResponse.text();
    throw new Error(t.nanoGptApiError(balanceResponse.status, errorText));
  } catch (err) {
    // 如果是认证错误或速率限制错误，立即抛出
    if (err instanceof Error && (err.message === t.nanoGptAuthError || err.message.startsWith("⚠️"))) {
      throw err;
    }
    // 抛出账户端点的错误
    throw err;
  }
}

// ============================================================================
// 格式化输出
// ============================================================================

/**
 * 格式化 Nano-GPT 账号状态
 */
function formatNanoGptUsage(
  data: NanoGptAccountResponse | NanoGptBalanceResponse | null,
  apiKey: string,
): string {
  const lines: string[] = [];

  // 标题行：Account: API Key (Nano-GPT)
  const maskedKey = maskString(apiKey);
  lines.push(`${t.account} ${maskedKey} (Nano-GPT)`);
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
export async function queryNanoGptUsage(
  authData: NanoGptAuthData | undefined,
): Promise<QueryResult | null> {
  // 检查认证数据是否存在且有效
  if (!authData || !authData.key) {
    return null;
  }

  try {
    const accountData = await fetchNanoGptAccount(authData.key);
    return {
      success: true,
      output: formatNanoGptUsage(accountData, authData.key),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
