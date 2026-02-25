import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["plugin/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["plugin/lib/google.ts"],
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },
  },
});
