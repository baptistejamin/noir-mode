import { defineConfig } from "eslint/config";
import crisp from "eslint-plugin-crisp";

export default defineConfig([
  crisp.configs["recommended-typescript"],
]);
