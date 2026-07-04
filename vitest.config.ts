import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

// Aliases let tests run without a TS build — they map the workspace packages to source.
export default defineConfig({
  resolve: {
    alias: {
      "@funtog/contracts": resolve(__dirname, "packages/contracts/src/index.ts"),
      "@funtog/mocks": resolve(__dirname, "packages/mocks/src/index.ts"),
      "@funtog/test-harness": resolve(__dirname, "packages/test-harness/src/index.ts"),
    },
  },
  test: {
    include: ["packages/**/tests/**/*.test.ts", "services/**/tests/**/*.test.ts"],
  },
});
