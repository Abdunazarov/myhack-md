import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    globalSetup: ["./vitest.global-setup.ts"],
    include: ["src/**/*.test.ts"],
    testTimeout: 60000,
    fileParallelism: false,
    // module1 → module2 → z-full (demo reset must run last)
    sequence: { shuffle: false },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
