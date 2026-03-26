import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    postcss: "src/postcss.ts",
    transform: "src/transform.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
});
