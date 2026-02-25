/**
 * OpenCode 额度状态查询插件
 *
 * [输入]: ~/.local/share/opencode/auth.json 和 ~/.config/opencode/antigravity-accounts.json 中的认证信息
 * [输出]: 带进度条的额度使用情况展示
 * [定位]: 通过 mystatus 工具查询各账号额度
 * [同步]: lib/openai.ts, lib/zhipu.ts, lib/google.ts, lib/anthropic.ts, lib/groq.ts, lib/gemini.ts, lib/kimi.ts, lib/minimax.ts, lib/abacus.ts, lib/nanogpt.ts, lib/chutes.ts, lib/types.ts, lib/i18n.ts
 */

import { type Plugin, tool } from "@opencode-ai/plugin";
import { readFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";

import { t } from "./lib/i18n";
import { type AuthData, type QueryResult } from "./lib/types";
import { queryOpenAIUsage } from "./lib/openai";
import { queryZaiUsage, queryZhipuUsage } from "./lib/zhipu";
import { queryGoogleUsage } from "./lib/google";
import { queryCopilotUsage } from "./lib/copilot";
import { queryAnthropicUsage } from "./lib/anthropic";
import { queryGroqUsage } from "./lib/groq";
import { queryGeminiUsage } from "./lib/gemini";
import { queryKimiUsage, queryKimiCodeUsage } from "./lib/kimi";
import { queryMinimaxUsage } from "./lib/minimax";
import { queryAbacusUsage } from "./lib/abacus";
import { queryNanoGptUsage } from "./lib/nanogpt";
import { queryChutesUsage } from "./lib/chutes";
import { readMyStatusConfig } from "./lib/utils";

// ============================================================================
// 插件导出（唯一导出，避免其他函数被当作插件加载）
// ============================================================================

export const MyStatusPlugin: Plugin = async () => {
  return {
    tool: {
      mystatus: tool({
        description: "Query account quota usage for all configured AI platforms. Returns remaining quota percentages, usage stats, and reset countdowns with visual progress bars. Supports: OpenAI, Anthropic Claude, Groq, Google Gemini, Zhipu AI, Z.ai, Google Antigravity, Kimi, MiniMax, Abacus, Nano-GPT, Chutes, and GitHub Copilot.",
        args: {},
        async execute() {
          // 1. 读取 auth.json
          const authPath = join(homedir(), ".local/share/opencode/auth.json");
          let authData: AuthData;

          try {
            const content = await readFile(authPath, "utf-8");
            authData = JSON.parse(content);
          } catch (err) {
            return t.authError(
              authPath,
              err instanceof Error ? err.message : String(err),
            );
          }

          // 读取 mystatus.json 配置
          const myStatusConfig = await readMyStatusConfig();

          // 2. 并行查询所有平台（Google 不依赖 authData）
          const [
            openaiResult, zhipuResult, zaiResult, googleResult, copilotResult,
            anthropicResult, groqResult, geminiResult, kimiResult, kimiCodeResult,
            minimaxResult, abacusResult, nanoGptResult, chutesResult
          ] = await Promise.all([
            queryOpenAIUsage(authData.openai),
            queryZhipuUsage(authData["zhipuai-coding-plan"]),
            queryZaiUsage(authData["zai-coding-plan"]),
            queryGoogleUsage(),
            queryCopilotUsage(authData["github-copilot"]),
            queryAnthropicUsage(authData.anthropic),
            queryGroqUsage(authData.groq),
            queryGeminiUsage(authData.gemini),
            queryKimiUsage(myStatusConfig?.kimi),
            queryKimiCodeUsage(myStatusConfig?.["kimi-code"]),
            queryMinimaxUsage(myStatusConfig?.minimax),
            queryAbacusUsage(myStatusConfig?.abacus),
            queryNanoGptUsage(myStatusConfig?.["nano-gpt"]),
            queryChutesUsage(myStatusConfig?.chutes),
          ]);

          // 3. 收集结果
          const results: string[] = [];
          const errors: string[] = [];

          // 处理 OpenAI 结果
          collectResult(openaiResult, t.openaiTitle, results, errors);

          // 处理智谱结果
          collectResult(zhipuResult, t.zhipuTitle, results, errors);

          // 处理 Z.ai 结果
          collectResult(zaiResult, t.zaiTitle, results, errors);

          // 处理 Google 结果
          collectResult(googleResult, t.googleTitle, results, errors);

          // 处理 GitHub Copilot 结果
          collectResult(copilotResult, t.copilotTitle, results, errors);

          // 处理 Anthropic 结果
          collectResult(anthropicResult, t.anthropicTitle, results, errors);

          // 处理 Groq 结果
          collectResult(groqResult, t.groqTitle, results, errors);

          // 处理 Gemini 结果
          collectResult(geminiResult, t.geminiTitle, results, errors);

          // 处理 Kimi 结果
          collectResult(kimiResult, t.kimiTitle, results, errors);

          // 处理 Kimi Code 结果
          collectResult(kimiCodeResult, t.kimiCodeTitle, results, errors);

          // 处理 MiniMax 结果
          collectResult(minimaxResult, t.minimaxTitle, results, errors);

          // 处理 Abacus 结果
          collectResult(abacusResult, t.abacusTitle, results, errors);

          // 处理 Nano-GPT 结果
          collectResult(nanoGptResult, t.nanoGptTitle, results, errors);

          // 处理 Chutes 结果
          collectResult(chutesResult, t.chutesTitle, results, errors);

          // 4. 汇总输出
          if (results.length === 0 && errors.length === 0) {
            return t.noAccounts;
          }

          let output = results.join("\n");

          if (errors.length > 0) {
            if (output) output += "\n\n";
            output += t.queryFailed + errors.join("\n");
          }

          return output;
        },
      }),
    },
  };
};

/**
 * 收集查询结果到 results 和 errors 数组
 * 注意：这是内部函数，不导出，避免被 OpenCode 当作插件加载
 */
function collectResult(
  result: QueryResult | null,
  title: string,
  results: string[],
  errors: string[],
): void {
  if (!result) return;

  if (result.success && result.output) {
    if (results.length > 0) results.push(""); // 分隔符
    results.push(title);
    results.push("");
    results.push(result.output);
  } else if (result.error) {
    errors.push(result.error);
  }
}
