/**
 * Kimi (Moonshot) 额度查询模块
 *
 * [输入]: API Key
 * [输出]: 格式化的额度使用情况
 * [定位]: 被 mystatus.ts 调用，处理 Kimi (Moonshot) 和 Kimi Code 账号
 * [同步]: mystatus.ts, types.ts, utils.ts, i18n.ts
 */

import { t } from "./i18n";
import {
  type QueryResult,
  type MyStatusConfig,
  HIGH_USAGE_THRESHOLD,
} from "./types";
import {
  createProgressBar,
  calcRemainPercent,
  fetchWithTimeout,
  maskString,
} from "./utils";

// ============================================================================
// 类型定义
// ============================================================================

interface KimiBalanceResponse {
  code: number;
  data?: {
    balance?: number;
    currency?: string;
    totalQuota?: number;
    usedQuota?: number;
  };
  msg?: string;
}

interface KimiConfig {
  apiUrl: string;
  apiError: (status: number, text: string) => string;
  accountLabel: string;
}

// ============================================================================
// API 调用
// ============================================================================

const MOONSHOT_CONFIG: KimiConfig = {
  apiUrl: "https://api.moonshot.cn/v1/users/me/balance",
  apiError: t.kimiApiError,
  accountLabel: "Moonshot",
};

const KIMI_CODE_CONFIG: KimiConfig = {
  apiUrl: "https://api.kimi.com/coding/v1/users/me/balance",
  apiError: t.kimiCodeApiError,
  accountLabel: "Kimi Code",
};

/**
 * 获取 Kimi 账户余额信息
 */
async function fetchKimiBalance(
  apiKey: string,
  config: KimiConfig,
): Promise<KimiBalanceResponse> {
  const response = await fetchWithTimeout(config.apiUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "OpenCode-Status-Plugin/1.0",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(config.apiError(response.status, errorText));
  }

  const data = (await response.json()) as KimiBalanceResponse;

  if (data.code !== 200) {
    throw new Error(config.apiError(data.code, data.msg || "Unknown error"));
  }

  return data;
}

// ============================================================================
// 格式化输出
// ============================================================================

/**
 * 格式化 Kimi 使用情况
 */
function formatKimiUsage(
  data: KimiBalanceResponse,
  apiKey: string,
  accountLabel: string,
): string {
  const lines: string[] = [];
  const balanceData = data.data;

  // 标题行：Account: API Key (Account Label) - 显示脱敏后的 key
  const maskedKey = maskString(apiKey);
  lines.push(`${t.account}        ${maskedKey} (${accountLabel})`);
  lines.push("");

  // 检查数据是否存在
  if (!balanceData) {
    lines.push(t.noQuotaData);
    return lines.join("\n");
  }

  // 显示余额
  if (balanceData.balance !== undefined) {
    const currency = balanceData.currency || "CNY";
    lines.push(`${t.kimiBalance}: ${balanceData.balance.toFixed(2)} ${currency}`);
  }

  // 显示配额使用情况
  if (
    balanceData.totalQuota !== undefined &&
    balanceData.usedQuota !== undefined
  ) {
    const usedPercent =
      balanceData.totalQuota > 0
        ? (balanceData.usedQuota / balanceData.totalQuota) * 100
        : 0;
    const remainPercent = calcRemainPercent(usedPercent);
    const progressBar = createProgressBar(remainPercent);

    if (lines.length > 2) {
      lines.push(""); // 分隔符
    }

    lines.push(t.kimiQuota);
    lines.push(`${progressBar} ${t.remaining(remainPercent)}`);
    lines.push(
      `${t.used}: ${balanceData.usedQuota.toLocaleString()} / ${balanceData.totalQuota.toLocaleString()}`,
    );

    // 警告：如果使用率超过阈值
    if (usedPercent >= HIGH_USAGE_THRESHOLD) {
      lines.push("");
      lines.push(t.limitReached);
    }
  }

  return lines.join("\n");
}

// ============================================================================
// 导出接口
// ============================================================================

async function queryKimiWithConfig(
  authData: { key: string } | undefined,
  config: KimiConfig,
): Promise<QueryResult | null> {
  // 检查账号是否存在且有效
  if (!authData || !authData.key) {
    return null;
  }

  try {
    const balance = await fetchKimiBalance(authData.key, config);
    return {
      success: true,
      output: formatKimiUsage(balance, authData.key, config.accountLabel),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * 查询 Kimi (Moonshot) 账号额度
 * @param config Kimi (Moonshot) 认证配置
 * @returns 查询结果，如果账号不存在或无效返回 null
 */
export async function queryKimiUsage(
  config: MyStatusConfig["kimi"] | undefined,
): Promise<QueryResult | null> {
  return queryKimiWithConfig(config, MOONSHOT_CONFIG);
}

/**
 * 查询 Kimi Code 账号额度
 * @param config Kimi Code 认证配置
 * @returns 查询结果，如果账号不存在或无效返回 null
 */
export async function queryKimiCodeUsage(
  config: MyStatusConfig["kimi-code"] | undefined,
): Promise<QueryResult | null> {
  return queryKimiWithConfig(config, KIMI_CODE_CONFIG);
}
