/**
 * Zod validation schemas for all API responses
 */

import { z } from "zod";

// ============================================================================
// OpenAI Schemas
// ============================================================================

export const RateLimitWindowSchema = z.object({
  used_percent: z.number(),
  limit_window_seconds: z.number(),
  reset_after_seconds: z.number(),
});

export type RateLimitWindow = z.infer<typeof RateLimitWindowSchema>;

export const OpenAIUsageSchema = z.object({
  plan_type: z.string(),
  rate_limit: z
    .object({
      limit_reached: z.boolean(),
      primary_window: RateLimitWindowSchema,
      secondary_window: RateLimitWindowSchema.nullable(),
    })
    .nullable(),
});

export type OpenAIUsageResponse = z.infer<typeof OpenAIUsageSchema>;

// ============================================================================
// Zhipu AI / Z.ai Schemas
// ============================================================================

export const UsageLimitItemSchema = z.object({
  type: z.enum(["TIME_LIMIT", "TOKENS_LIMIT"]),
  usage: z.number().optional(),
  currentValue: z.number().optional(),
  percentage: z.number(),
  nextResetTime: z.number().optional(),
});

export type UsageLimitItem = z.infer<typeof UsageLimitItemSchema>;

export const QuotaLimitResponseSchema = z.object({
  code: z.number(),
  msg: z.string(),
  data: z.object({
    limits: z.array(UsageLimitItemSchema),
  }),
  success: z.boolean(),
});

export type QuotaLimitResponse = z.infer<typeof QuotaLimitResponseSchema>;

// ============================================================================
// Google Cloud / Antigravity Schemas
// ============================================================================

export const GoogleQuotaModelSchema = z.object({
  quotaInfo: z
    .object({
      remainingFraction: z.number().optional(),
      resetTime: z.string().optional(),
    })
    .optional(),
});

export type GoogleQuotaModel = z.infer<typeof GoogleQuotaModelSchema>;

export const GoogleQuotaResponseSchema = z.object({
  models: z.record(GoogleQuotaModelSchema),
});

export type GoogleQuotaResponse = z.infer<typeof GoogleQuotaResponseSchema>;

// ============================================================================
// GitHub Copilot Schemas
// ============================================================================

export const CopilotQuotaDetailSchema = z.object({
  entitlement: z.number(),
  overage_count: z.number(),
  overage_permitted: z.boolean(),
  percent_remaining: z.number(),
  quota_id: z.string(),
  quota_remaining: z.number(),
  remaining: z.number(),
  unlimited: z.boolean(),
});

export type CopilotQuotaDetail = z.infer<typeof CopilotQuotaDetailSchema>;

// Alias for backward compatibility
export type QuotaDetail = CopilotQuotaDetail;

export const CopilotQuotaSnapshotsSchema = z.object({
  chat: CopilotQuotaDetailSchema.optional(),
  completions: CopilotQuotaDetailSchema.optional(),
  premium_interactions: CopilotQuotaDetailSchema,
});

export type CopilotQuotaSnapshots = z.infer<
  typeof CopilotQuotaSnapshotsSchema
>;

// Alias for backward compatibility
export type QuotaSnapshots = CopilotQuotaSnapshots;

export const CopilotUsageResponseSchema = z.object({
  access_type_sku: z.string(),
  analytics_tracking_id: z.string(),
  assigned_date: z.string(),
  can_signup_for_limited: z.boolean(),
  chat_enabled: z.boolean(),
  copilot_plan: z.string(),
  organization_login_list: z.array(z.unknown()),
  organization_list: z.array(z.unknown()),
  quota_reset_date: z.string(),
  quota_snapshots: CopilotQuotaSnapshotsSchema,
});

export type CopilotUsageResponse = z.infer<typeof CopilotUsageResponseSchema>;

export const CopilotTokenResponseSchema = z.object({
  token: z.string(),
  expires_at: z.number(),
  refresh_in: z.number(),
  endpoints: z.object({
    api: z.string(),
  }),
});

export type CopilotTokenResponse = z.infer<typeof CopilotTokenResponseSchema>;

export const BillingUsageItemSchema = z.object({
  product: z.string(),
  sku: z.string(),
  model: z.string().optional(),
  unitType: z.string(),
  grossQuantity: z.number(),
  netQuantity: z.number(),
  limit: z.number().optional(),
});

export type BillingUsageItem = z.infer<typeof BillingUsageItemSchema>;

export const BillingUsageResponseSchema = z.object({
  timePeriod: z.object({
    year: z.number(),
    month: z.number().optional(),
  }),
  user: z.string(),
  usageItems: z.array(BillingUsageItemSchema),
});

export type BillingUsageResponse = z.infer<typeof BillingUsageResponseSchema>;

// ============================================================================
// Anthropic Rate Limit Schemas (Headers)
// ============================================================================

export const AnthropicRateLimitsSchema = z.object({
  requestsRemaining: z.number(),
  tokensRemaining: z.number(),
  tokensReset: z.number().optional(),
});

export type AnthropicRateLimits = z.infer<typeof AnthropicRateLimitsSchema>;

// ============================================================================
// Groq Rate Limit Schemas (Headers)
// ============================================================================

export const GroqRateLimitsSchema = z.object({
  requestLimit: z.number(),
  requestsRemaining: z.number(),
  requestResetSeconds: z.number(),
  tokenLimit: z.number().optional(),
  tokensRemaining: z.number().optional(),
  tokenResetSeconds: z.number().optional(),
});

export type GroqRateLimits = z.infer<typeof GroqRateLimitsSchema>;

// ============================================================================
// Gemini Rate Limit Schemas (Headers)
// ============================================================================

export const GeminiRateLimitsSchema = z.object({
  limit: z.number().optional(),
  remaining: z.number().optional(),
  reset: z.number().optional(),
});

export type GeminiRateLimits = z.infer<typeof GeminiRateLimitsSchema>;

// ============================================================================
// Kimi Schemas
// ============================================================================

export const KimiBalanceResponseSchema = z.object({
  code: z.number(),
  data: z
    .object({
      balance: z.number().optional(),
      currency: z.string().optional(),
      totalQuota: z.number().optional(),
      usedQuota: z.number().optional(),
    })
    .optional(),
  msg: z.string().optional(),
});

export type KimiBalanceResponse = z.infer<typeof KimiBalanceResponseSchema>;

// ============================================================================
// MiniMax Rate Limit Schemas (Headers)
// ============================================================================

export const MinimaxRateLimitsSchema = z.object({
  limit: z.number(),
  remaining: z.number(),
  reset: z.number().optional(),
});

export type MinimaxRateLimits = z.infer<typeof MinimaxRateLimitsSchema>;

// ============================================================================
// Abacus AI Schemas
// ============================================================================

export const AbacusUsageResponseSchema = z.object({
  usage: z.number().optional(),
  limit: z.number().optional(),
  credits: z.number().optional(),
  creditsRemaining: z.number().optional(),
  creditsUsed: z.number().optional(),
  account: z
    .object({
      name: z.string().optional(),
      email: z.string().optional(),
      plan: z.string().optional(),
    })
    .optional(),
  // Allow additional unknown fields
  _unknown: z.record(z.unknown()).optional(),
});

export type AbacusUsageResponse = z.infer<typeof AbacusUsageResponseSchema>;

// ============================================================================
// Nano-GPT Schemas
// ============================================================================

export const NanoGptUsageSchema = z.object({
  today: z.number().optional(),
  thisMonth: z.number().optional(),
});

export type NanoGptUsage = z.infer<typeof NanoGptUsageSchema>;

export const NanoGptAccountResponseSchema = z.object({
  balance: z.number().optional(),
  currency: z.string().optional(),
  rpdLimit: z.number().optional(),
  usdPerDayLimit: z.number().optional(),
  usage: NanoGptUsageSchema.optional(),
  // Allow additional unknown fields
  _unknown: z.record(z.unknown()).optional(),
});

export type NanoGptAccountResponse = z.infer<
  typeof NanoGptAccountResponseSchema
>;

// ============================================================================
// Chutes AI Schemas
// ============================================================================

export const ChutesQuotaUsageItemSchema = z.object({
  quotaType: z.string(),
  name: z.string(),
  used: z.number(),
  limit: z.number(),
  percentage: z.number(),
  resetAt: z.number().optional(),
});

export type ChutesQuotaUsageItem = z.infer<
  typeof ChutesQuotaUsageItemSchema
>;

export const ChutesQuotaUsageResponseSchema = z.object({
  currentPeriodUsage: z.array(ChutesQuotaUsageItemSchema),
  userId: z.string(),
});

export type ChutesQuotaUsageResponse = z.infer<
  typeof ChutesQuotaUsageResponseSchema
>;

export const ChutesQuotaLimitItemSchema = z.object({
  quotaType: z.string(),
  name: z.string(),
  limit: z.number(),
  unit: z.string().optional(),
});

export type ChutesQuotaLimitItem = z.infer<
  typeof ChutesQuotaLimitItemSchema
>;

export const ChutesQuotaLimitsResponseSchema = z.object({
  quotas: z.array(ChutesQuotaLimitItemSchema),
  userId: z.string(),
});

export type ChutesQuotaLimitsResponse = z.infer<
  typeof ChutesQuotaLimitsResponseSchema
>;

// ============================================================================
// Google Cloud / Antigravity Additional Types
// ============================================================================

/** 单个模型的额度信息 */
export interface ModelQuota {
  displayName: string;
  remainPercent: number;
  resetTimeDisplay: string;
}

/** 账号额度信息 */
export interface AccountQuotaInfo {
  email: string;
  models: ModelQuota[];
  maxUsage: number;
}

/** 模型配置 */
export interface ModelConfig {
  key: string;
  altKey?: string;
  display: string;
}

// ============================================================================
// AuthData Structure
// ============================================================================

/**
 * OpenAI OAuth auth data
 */
export const OpenAIAuthDataSchema = z.object({
  type: z.literal("oauth"),
  access: z.string().optional(),
  refresh: z.string().optional(),
  expires: z.number().optional(),
});

export type OpenAIAuthData = z.infer<typeof OpenAIAuthDataSchema>;

/**
 * Zhipu AI API key auth data
 */
export const ZhipuAuthDataSchema = z.object({
  type: z.literal("api"),
  key: z.string().optional(),
});

export type ZhipuAuthData = z.infer<typeof ZhipuAuthDataSchema>;

/**
 * GitHub Copilot auth data
 */
export const CopilotAuthDataSchema = z.object({
  type: z.literal("oauth"),
  refresh: z.string().optional(),
  access: z.string().optional(),
  expires: z.number().optional(),
});

export type CopilotAuthData = z.infer<typeof CopilotAuthDataSchema>;

/**
 * Generic API key auth data
 */
export const ApiKeyAuthDataSchema = z.object({
  type: z.literal("api"),
  key: z.string(),
});

export type ApiKeyAuthData = z.infer<typeof ApiKeyAuthDataSchema>;

/**
 * Copilot tier
 */
export const CopilotTierSchema = z.enum(["free", "pro", "pro+", "business", "enterprise"]);

export type CopilotTier = z.infer<typeof CopilotTierSchema>;

/**
 * Copilot quota config
 */
export const CopilotQuotaConfigSchema = z.object({
  token: z.string(),
  username: z.string(),
  tier: CopilotTierSchema,
});

export type CopilotQuotaConfig = z.infer<typeof CopilotQuotaConfigSchema>;

/**
 * Antigravity account
 */
export const AntigravityAccountSchema = z.object({
  email: z.string().optional(),
  refreshToken: z.string(),
  projectId: z.string().optional(),
  managedProjectId: z.string().optional(),
  addedAt: z.number(),
  lastUsed: z.number(),
  rateLimitResetTimes: z.record(z.number()).optional(),
});

export type AntigravityAccount = z.infer<typeof AntigravityAccountSchema>;

/**
 * Antigravity accounts file
 */
export const AntigravityAccountsFileSchema = z.object({
  version: z.number(),
  accounts: z.array(AntigravityAccountSchema),
});

export type AntigravityAccountsFile = z.infer<
  typeof AntigravityAccountsFileSchema
>;

/**
 * MyStatus config
 */
export const MyStatusConfigSchema = z.object({
  chutes: z
    .object({
      token: z.string(),
    })
    .optional(),
  kimi: z
    .object({
      key: z.string(),
    })
    .optional(),
  "kimi-code": z
    .object({
      key: z.string(),
    })
    .optional(),
  minimax: z
    .object({
      key: z.string(),
      groupId: z.string().optional(),
    })
    .optional(),
  abacus: z
    .object({
      key: z.string(),
    })
    .optional(),
  "nano-gpt": z
    .object({
      key: z.string(),
    })
    .optional(),
});

export type MyStatusConfig = z.infer<typeof MyStatusConfigSchema>;

/**
 * Full auth data structure
 */
export const AuthDataSchema = z.object({
  openai: OpenAIAuthDataSchema.optional(),
  "zhipuai-coding-plan": ZhipuAuthDataSchema.optional(),
  "zai-coding-plan": ZhipuAuthDataSchema.optional(),
  "github-copilot": CopilotAuthDataSchema.optional(),
  anthropic: ApiKeyAuthDataSchema.optional(),
  groq: ApiKeyAuthDataSchema.optional(),
  gemini: ApiKeyAuthDataSchema.optional(),
});

export type AuthData = z.infer<typeof AuthDataSchema>;
