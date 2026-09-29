import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      // NodeNext TypeScript uses .js extensions in source imports,
      // but Vite needs to find the .ts file. Strip .js so Vite's
      // default extension resolution can locate .ts files.
      {
        find: /^(\.{1,2}\/.+)\.js$/,
        replacement: "$1",
      },
    ],
  },
  test: {
    globals: false,
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
