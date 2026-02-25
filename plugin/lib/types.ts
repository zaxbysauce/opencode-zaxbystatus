/**
 * 共享类型定义
 *
 * [定位]: 被所有平台模块共享使用的类型
 * [同步]: openai.ts, zhipu.ts, google.ts, mystatus.ts
 */

// ============================================================================
// 查询结果类型
// ============================================================================

/**
 * 平台查询结果
 */
export interface QueryResult {
  success: boolean;
  output?: string;
  error?: string;
}

// ============================================================================
// 认证数据类型
// ============================================================================

/**
 * OpenAI OAuth 认证数据
 */
export interface OpenAIAuthData {
  type: "oauth";
  access?: string;
  refresh?: string;
  expires?: number;
}

/**
 * 智谱 AI API 认证数据
 */
export interface ZhipuAuthData {
  type: "api";
  key?: string;
}

/**
 * GitHub Copilot 认证数据
 */
export interface CopilotAuthData {
  type: "oauth";
  refresh?: string;
  access?: string;
  expires?: number;
}

/**
 * Generic API key authentication data
 * Used by providers with simple API key auth
 */
export interface ApiKeyAuthData {
  type: "api";
  key: string;
}

/**
 * Copilot subscription tier
 * See: https://docs.github.com/en/copilot/about-github-copilot/subscription-plans-for-github-copilot
 */
export type CopilotTier = "free" | "pro" | "pro+" | "business" | "enterprise";

/**
 * Copilot quota token configuration
 * Stored in ~/.config/opencode/copilot-quota-token.json
 *
 * Users can create a fine-grained PAT with "Plan" read permission
 * to enable quota checking via the public GitHub REST API.
 */
export interface CopilotQuotaConfig {
  /** Fine-grained PAT with "Plan" read permission */
  token: string;
  /** GitHub username (for API calls) */
  username: string;
  /** Copilot subscription tier (determines monthly quota limit) */
  tier: CopilotTier;
}

/**
 * Antigravity 账号（来自 ~/.config/opencode/antigravity-accounts.json）
 */
export interface AntigravityAccount {
  email?: string;
  refreshToken: string;
  projectId?: string;
  managedProjectId?: string;
  addedAt: number;
  lastUsed: number;
  rateLimitResetTimes?: Record<string, number>;
}

/**
 * Antigravity 账号文件
 */
export interface AntigravityAccountsFile {
  version: number;
  accounts: AntigravityAccount[];
}

/**
 * MyStatus configuration file
 * Located at ~/.config/opencode/mystatus.json
 * Used for providers not stored in OpenCode's native auth.json
 */
export interface MyStatusConfig {
  /** Chutes JWT token */
  chutes?: { token: string };
  /** Kimi (Moonshot) API key */
  kimi?: { key: string };
  /** Kimi Code API key */
  "kimi-code"?: { key: string };
  /** MiniMax API key with optional group ID */
  minimax?: { key: string; groupId?: string };
  /** Abacus API key */
  abacus?: { key: string };
  /** Nano-GPT API key */
  "nano-gpt"?: { key: string };
}

/**
 * 完整认证数据结构
 * Read from ~/.local/share/opencode/auth.json
 */
export interface AuthData {
  openai?: OpenAIAuthData;
  "zhipuai-coding-plan"?: ZhipuAuthData;
  "zai-coding-plan"?: ZhipuAuthData;
  "github-copilot"?: CopilotAuthData;
  /** Anthropic API key */
  anthropic?: ApiKeyAuthData;
  /** Groq API key */
  groq?: ApiKeyAuthData;
  /** Google Gemini (AI Studio) API key */
  gemini?: ApiKeyAuthData;
}

// ============================================================================
// 常量配置
// ============================================================================

/** 高使用率警告阈值（百分比） */
export const HIGH_USAGE_THRESHOLD = 80;

/** API 请求超时时间（毫秒） */
export const REQUEST_TIMEOUT_MS = 10000;
