/**
 * vite-noir - PostCSS Plugin
 *
 * Generates dark mode CSS patches at build time.
 */

import type { Plugin, Rule, Declaration, Root } from "postcss";
import { transformColorRaw, DEFAULT_THEME, type NoirTheme } from "./transform.js";

/**************************************************************************
 * TYPES
 **************************************************************************/

export interface NoirPostcssOptions {
  darkModeSelector?: string;
  theme?: Partial<NoirTheme>;
  ignore?: string[];
  ignoreSelectors?: string[];
}

/**************************************************************************
 * PLUGIN
 **************************************************************************/

const COLOR_PROPERTIES = new Set([
  "color", "background", "background-color", "border", "border-color",
  "border-top-color", "border-right-color", "border-bottom-color", "border-left-color",
  "outline", "outline-color", "box-shadow", "text-shadow", "fill", "stroke",
  "caret-color", "text-decoration-color", "column-rule-color",
]);

function isColorProperty(prop: string): boolean {
  return COLOR_PROPERTIES.has(prop) || prop.includes("color") ||
         prop.includes("background") || prop.includes("border") || prop.includes("shadow");
}

const CSS_COLOR_REGEX = /(?<!\$)#(?:[0-9a-fA-F]{3,4}){1,2}\b|rgba?\([^)]+\)|hsla?\([^)]+\)|(?<![a-z-])(?:white|black|gray|grey|red|green|blue|transparent|currentcolor)(?![a-z-])/gi;

function transformValue(value: string, property: string, theme: NoirTheme): string | null {
  let result = value;
  let hasChanges = false;
  const matches = Array.from(value.matchAll(CSS_COLOR_REGEX)).reverse();

  for (const match of matches) {
    const color = match[0];
    const darkColor = transformColorRaw(color, property, theme);
    if (darkColor && darkColor.toLowerCase() !== color.toLowerCase()) {
      result = result.slice(0, match.index) + darkColor + result.slice(match.index! + color.length);
      hasChanges = true;
    }
  }
  return hasChanges ? result : null;
}

function noirPostcss(options: NoirPostcssOptions = {}): Plugin {
  const { darkModeSelector = ".dark-mode", theme: userTheme = {}, ignore = [], ignoreSelectors = [] } = options;
  const theme: NoirTheme = { ...DEFAULT_THEME, ...userTheme };

  return {
    postcssPlugin: "vite-noir",
    Once(root: Root) {
      const newRules: Array<{ after: Rule; darkRule: Rule }> = [];

      // Get source file path for ignore matching
      const sourceFile = root.source?.input?.file || "";

      // Check if this file should be ignored
      if (ignore.some((pattern) => sourceFile.includes(pattern))) {
        return;
      }

      root.walkRules((rule: Rule) => {
        if (rule.selector.includes(darkModeSelector) ||
            (rule.parent?.type === "atrule" && (rule.parent as { name?: string }).name === "keyframes")) {
          return;
        }

        // Skip selectors matching ignore patterns
        if (ignoreSelectors.some((pattern) => rule.selector.includes(pattern))) {
          return;
        }

        const darkDecls: Array<{ prop: string; value: string; important: boolean }> = [];
        rule.walkDecls((decl: Declaration) => {
          if (!isColorProperty(decl.prop)) return;
          const darkValue = transformValue(decl.value, decl.prop, theme);
          if (darkValue) {
            darkDecls.push({ prop: decl.prop, value: darkValue, important: decl.important });
          }
        });

        if (darkDecls.length > 0) {
          const darkSelector = rule.selector.split(",").map((sel) => {
            sel = sel.trim();
            if (sel === ":root" || sel === "html" || sel === "body") {
              return `${sel}${darkModeSelector}`;
            }
            return `${darkModeSelector} ${sel}`;
          }).join(", ");

          const darkRule = rule.clone({ selector: darkSelector });
          darkRule.removeAll();
          for (const { prop, value, important } of darkDecls) {
            const decl = rule.first?.clone({ prop, value, important }) || { prop, value, important };
            if ("source" in decl && rule.source) {
              decl.source = rule.source;
            }
            darkRule.append(decl);
          }
          newRules.push({ after: rule, darkRule });
        }
      });

      for (const { after, darkRule } of newRules) {
        after.after(darkRule);
      }
    },
  };
}

noirPostcss.postcss = true;

export default noirPostcss;
export { noirPostcss };
