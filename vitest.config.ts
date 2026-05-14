import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    globals: false,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: [
        "src/index.ts",        // entry-point wiring, not logic
        "src/tools/**",        // MCP tool orchestration layer
        "src/relay/broadcaster.ts", // WebSocket I/O
        "src/nostr/ws_pool.ts",     // WebSocket I/O
        "src/relay/health.ts",      // WebSocket I/O
        "src/relay/selector.ts",    // wraps ws_pool
        "src/location/geo.ts",      // external fetch (getFuzzyLocation)
        "src/ai/**",           // external LLM calls
        "src/evolution/**",    // evolution engine
      ],
      thresholds: {
        branches:  20,
        functions: 20,
        lines:     20,
        statements: 20,
      },
      reporter: ["text", "lcov"],
    },
  },
});
