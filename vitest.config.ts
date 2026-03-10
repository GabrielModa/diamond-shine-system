import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    globals: true,
    include: ["tests/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    exclude: ["tests/e2e/**"],
  },
});
