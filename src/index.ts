/**
 * vite-noir
 *
 * Build-time dark mode CSS generation for Vite using DarkReader's color transformation algorithm.
 */

import type { Plugin, UserConfig } from "vite";
import type { AcceptedPlugin } from "postcss";
import { noirPostcss, type NoirPostcssOptions } from "./postcss.js";

/**************************************************************************
 * TYPES
 **************************************************************************/

export interface NoirPluginOptions extends NoirPostcssOptions {}

/**************************************************************************
 * VITE PLUGIN
 **************************************************************************/

export default function noirPlugin(options: NoirPluginOptions = {}): Plugin {
  return {
    name: "vite-noir",
    config(config: UserConfig) {
      const postcssConfig = config.css?.postcss;
      const existingPlugins: AcceptedPlugin[] = 
        (typeof postcssConfig === "object" && postcssConfig !== null && "plugins" in postcssConfig)
          ? (postcssConfig.plugins as AcceptedPlugin[]) || []
          : [];
      
      return {
        css: {
          postcss: {
            plugins: [...existingPlugins, noirPostcss(options) as AcceptedPlugin],
          },
        },
      };
    },
  };
}

/**************************************************************************
 * RE-EXPORTS
 **************************************************************************/

export { noirPlugin };
export { noirPostcss, type NoirPostcssOptions } from "./postcss.js";
export {
  transformColor,
  transformColorRaw,
  parseColor,
  rgbToString,
  setDarkMode,
  getDarkMode,
  DEFAULT_THEME,
  type NoirTheme,
  type RGB,
  type HSL,
  type ColorType,
} from "./transform.js";
