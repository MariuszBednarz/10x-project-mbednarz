import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "node", // Default to fast node environment for utility tests
    setupFiles: ["./src/test/setup-node.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "dist", ".astro"],
    // Optimize to prevent timeouts - run test files sequentially
    fileParallelism: false,
    testTimeout: 15000, // 15 seconds per test
    hookTimeout: 15000, // 15 seconds for setup hooks
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
