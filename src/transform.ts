/**
 * vite-noir - Color Transformation
 *
 * Core color transformation logic using DarkReader's algorithm.
 */

/**************************************************************************
 * TYPES
 **************************************************************************/

export interface RGB {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
  a: number;
}

export interface NoirTheme {
  mode: number;
  brightness: number;
  contrast: number;
  grayscale: number;
  sepia: number;
  darkSchemeBackgroundColor: string;
  darkSchemeTextColor: string;
  lightSchemeBackgroundColor: string;
  lightSchemeTextColor: string;
}

export type ColorType = "background" | "border" | "foreground";

/**************************************************************************
 * CONSTANTS
 **************************************************************************/

export const DEFAULT_THEME: NoirTheme = {
  mode: 1,
  brightness: 100,
  contrast: 90,
  grayscale: 0,
  sepia: 10,
  darkSchemeBackgroundColor: "#181a1b",
  darkSchemeTextColor: "#e8e6e3",
  lightSchemeBackgroundColor: "#dcdad7",
  lightSchemeTextColor: "#181a1b",
};

const MAX_BG_LIGHTNESS = 0.4;
const MIN_FG_LIGHTNESS = 0.55;

/**************************************************************************
 * COLOR PARSING
 **************************************************************************/

const COLOR_REGEX = {
  hex3: /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i,
  hex4: /^#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])$/i,
  hex6: /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i,
  hex8: /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i,
  rgb: /^rgb\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/i,
  rgba: /^rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+%?)\s*\)$/i,
  rgbModern: /^rgb\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+%?))?\s*\)$/i,
  hsl: /^hsl\(\s*([\d.]+)(?:deg)?\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)$/i,
  hsla: /^hsla\(\s*([\d.]+)(?:deg)?\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*,\s*([\d.]+%?)\s*\)$/i,
  hslModern: /^hsl\(\s*([\d.]+)(?:deg)?\s+([\d.]+)%\s+([\d.]+)%\s*(?:\/\s*([\d.]+%?))?\s*\)$/i,
};

const NAMED_COLORS: Record<string, RGB> = {
  white: { r: 255, g: 255, b: 255, a: 1 },
  black: { r: 0, g: 0, b: 0, a: 1 },
  transparent: { r: 0, g: 0, b: 0, a: 0 },
  red: { r: 255, g: 0, b: 0, a: 1 },
  green: { r: 0, g: 128, b: 0, a: 1 },
  blue: { r: 0, g: 0, b: 255, a: 1 },
  gray: { r: 128, g: 128, b: 128, a: 1 },
  grey: { r: 128, g: 128, b: 128, a: 1 },
};

function parseAlpha(value: string): number {
  if (value.endsWith("%")) {
    return parseFloat(value) / 100;
  }
  return parseFloat(value);
}

export function parseColor(colorStr: string): RGB | null {
  if (!colorStr || typeof colorStr !== "string") return null;
  const color = colorStr.trim().toLowerCase();
  if (NAMED_COLORS[color]) return { ...NAMED_COLORS[color] };

  let match;
  if ((match = color.match(COLOR_REGEX.hex6))) {
    return { r: parseInt(match[1], 16), g: parseInt(match[2], 16), b: parseInt(match[3], 16), a: 1 };
  }
  if ((match = color.match(COLOR_REGEX.hex3))) {
    return { r: parseInt(match[1] + match[1], 16), g: parseInt(match[2] + match[2], 16), b: parseInt(match[3] + match[3], 16), a: 1 };
  }
  if ((match = color.match(COLOR_REGEX.hex8))) {
    return { r: parseInt(match[1], 16), g: parseInt(match[2], 16), b: parseInt(match[3], 16), a: parseInt(match[4], 16) / 255 };
  }
  if ((match = color.match(COLOR_REGEX.hex4))) {
    return { r: parseInt(match[1] + match[1], 16), g: parseInt(match[2] + match[2], 16), b: parseInt(match[3] + match[3], 16), a: parseInt(match[4] + match[4], 16) / 255 };
  }
  if ((match = color.match(COLOR_REGEX.rgb))) {
    return { r: Math.round(parseFloat(match[1])), g: Math.round(parseFloat(match[2])), b: Math.round(parseFloat(match[3])), a: 1 };
  }
  if ((match = color.match(COLOR_REGEX.rgba))) {
    return { r: Math.round(parseFloat(match[1])), g: Math.round(parseFloat(match[2])), b: Math.round(parseFloat(match[3])), a: parseAlpha(match[4]) };
  }
  if ((match = color.match(COLOR_REGEX.rgbModern))) {
    return { r: Math.round(parseFloat(match[1])), g: Math.round(parseFloat(match[2])), b: Math.round(parseFloat(match[3])), a: match[4] ? parseAlpha(match[4]) : 1 };
  }
  if ((match = color.match(COLOR_REGEX.hsl))) {
    return hslToRgb(parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]), 1);
  }
  if ((match = color.match(COLOR_REGEX.hsla))) {
    return hslToRgb(parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]), parseAlpha(match[4]));
  }
  if ((match = color.match(COLOR_REGEX.hslModern))) {
    return hslToRgb(parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]), match[4] ? parseAlpha(match[4]) : 1);
  }
  return null;
}

/**************************************************************************
 * COLOR CONVERSION
 **************************************************************************/

export function hslToRgb(h: number, s: number, l: number, a = 1): RGB {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r: number, g: number, b: number;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255), a };
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s: number;
  const l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s, l };
}

function scale(x: number, fromMin: number, fromMax: number, toMin: number, toMax: number): number {
  return ((x - fromMin) / (fromMax - fromMin)) * (toMax - toMin) + toMin;
}

function clamp(x: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, x));
}

export function rgbToString(rgb: RGB): string {
  const { r, g, b, a } = rgb;
  if (a === 1) {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**************************************************************************
 * COLOR MATRIX
 **************************************************************************/

type Matrix = number[][];

function multiplyMatrices(m1: Matrix, m2: Matrix): Matrix {
  const result: Matrix = [];
  for (let i = 0; i < m1.length; i++) {
    result[i] = [];
    for (let j = 0; j < m2[0].length; j++) {
      let sum = 0;
      for (let k = 0; k < m1[0].length; k++) {
        sum += m1[i][k] * m2[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

const MatrixOps = {
  identity(): Matrix {
    return [
      [1, 0, 0, 0, 0],
      [0, 1, 0, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 0, 1, 0],
      [0, 0, 0, 0, 1],
    ];
  },
  invertNHue(): Matrix {
    return [
      [0.333, -0.667, -0.667, 0, 1],
      [-0.667, 0.333, -0.667, 0, 1],
      [-0.667, -0.667, 0.333, 0, 1],
      [0, 0, 0, 1, 0],
      [0, 0, 0, 0, 1],
    ];
  },
  brightness(v: number): Matrix {
    return [
      [v, 0, 0, 0, 0],
      [0, v, 0, 0, 0],
      [0, 0, v, 0, 0],
      [0, 0, 0, 1, 0],
      [0, 0, 0, 0, 1],
    ];
  },
  contrast(v: number): Matrix {
    const t = (1 - v) / 2;
    return [
      [v, 0, 0, 0, t],
      [0, v, 0, 0, t],
      [0, 0, v, 0, t],
      [0, 0, 0, 1, 0],
      [0, 0, 0, 0, 1],
    ];
  },
  sepia(v: number): Matrix {
    return [
      [(0.393 + 0.607 * (1 - v)), (0.769 - 0.769 * (1 - v)), (0.189 - 0.189 * (1 - v)), 0, 0],
      [(0.349 - 0.349 * (1 - v)), (0.686 + 0.314 * (1 - v)), (0.168 - 0.168 * (1 - v)), 0, 0],
      [(0.272 - 0.272 * (1 - v)), (0.534 - 0.534 * (1 - v)), (0.131 + 0.869 * (1 - v)), 0, 0],
      [0, 0, 0, 1, 0],
      [0, 0, 0, 0, 1],
    ];
  },
  grayscale(v: number): Matrix {
    return [
      [(0.2126 + 0.7874 * (1 - v)), (0.7152 - 0.7152 * (1 - v)), (0.0722 - 0.0722 * (1 - v)), 0, 0],
      [(0.2126 - 0.2126 * (1 - v)), (0.7152 + 0.2848 * (1 - v)), (0.0722 - 0.0722 * (1 - v)), 0, 0],
      [(0.2126 - 0.2126 * (1 - v)), (0.7152 - 0.7152 * (1 - v)), (0.0722 + 0.9278 * (1 - v)), 0, 0],
      [0, 0, 0, 1, 0],
      [0, 0, 0, 0, 1],
    ];
  },
};

function createFilterMatrix(config: NoirTheme): Matrix {
  let m = MatrixOps.identity();
  if (config.sepia !== 0) {
    m = multiplyMatrices(m, MatrixOps.sepia(config.sepia / 100));
  }
  if (config.grayscale !== 0) {
    m = multiplyMatrices(m, MatrixOps.grayscale(config.grayscale / 100));
  }
  if (config.contrast !== 100) {
    m = multiplyMatrices(m, MatrixOps.contrast(config.contrast / 100));
  }
  if (config.brightness !== 100) {
    m = multiplyMatrices(m, MatrixOps.brightness(config.brightness / 100));
  }
  if (config.mode === 1) {
    m = multiplyMatrices(m, MatrixOps.invertNHue());
  }
  return m;
}

function applyColorMatrix([r, g, b]: [number, number, number], matrix: Matrix): [number, number, number] {
  const rgb: Matrix = [[r / 255], [g / 255], [b / 255], [1], [1]];
  const result = multiplyMatrices(matrix, rgb);
  return [0, 1, 2].map((i) => clamp(Math.round(result[i][0] * 255), 0, 255)) as [number, number, number];
}

/**************************************************************************
 * HSL MODIFICATION
 **************************************************************************/

function parseToHSL(color: string): HSL | null {
  const rgb = parseColor(color);
  if (!rgb) return null;
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return { h, s, l, a: rgb.a };
}

function modifyColorWithMatrix(
  rgb: RGB,
  theme: NoirTheme,
  modifyHSL: (hsl: HSL, pole: HSL, anotherPole?: HSL) => HSL,
  poleColor: string,
  anotherPoleColor?: string
): RGB {
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const hslWithAlpha: HSL = { ...hsl, a: rgb.a };

  const pole = parseToHSL(poleColor);
  if (!pole) return rgb;

  const anotherPole = anotherPoleColor ? parseToHSL(anotherPoleColor) ?? undefined : undefined;

  const modified = modifyHSL(hslWithAlpha, pole, anotherPole);
  const hslResult = hslToRgb(modified.h, modified.s * 100, modified.l * 100, modified.a);

  const matrix = createFilterMatrix({ ...theme, mode: 0 });
  const [rf, gf, bf] = applyColorMatrix([hslResult.r, hslResult.g, hslResult.b], matrix);

  return { r: rf, g: gf, b: bf, a: hslResult.a };
}

function modifyBgHSL(hsl: HSL, pole: HSL): HSL {
  const { h, s, l, a } = hsl;
  const isDark = l < 0.5;
  const isBlue = h > 200 && h < 280;
  const isNeutral = s < 0.12 || (l > 0.8 && isBlue);

  if (isDark) {
    const lx = scale(l, 0, 0.5, 0, MAX_BG_LIGHTNESS);
    if (isNeutral) {
      return { h: pole.h, s: pole.s, l: lx, a };
    }
    return { h, s, l: lx, a };
  }

  let lx = scale(l, 0.5, 1, MAX_BG_LIGHTNESS, pole.l);

  if (isNeutral) {
    return { h: pole.h, s: pole.s, l: lx, a };
  }

  let hx = h;
  const isYellow = h > 60 && h < 180;
  if (isYellow) {
    const isCloserToGreen = h > 120;
    if (isCloserToGreen) {
      hx = scale(h, 120, 180, 135, 180);
    } else {
      hx = scale(h, 60, 120, 60, 105);
    }
  }

  if (hx > 40 && hx < 80) {
    lx *= 0.75;
  }

  return { h: hx, s, l: lx, a };
}

function modifyFgHSL(hsl: HSL, pole: HSL): HSL {
  const { h, s, l, a } = hsl;
  const isLight = l > 0.5;
  const isNeutral = l < 0.2 || s < 0.24;
  const isBlue = !isNeutral && h > 205 && h < 245;

  if (isLight) {
    const lx = scale(l, 0.5, 1, MIN_FG_LIGHTNESS, pole.l);
    if (isNeutral) {
      return { h: pole.h, s: pole.s, l: lx, a };
    }
    let hx = h;
    if (isBlue) {
      hx = scale(h, 205, 245, 205, 220);
    }
    return { h: hx, s, l: lx, a };
  }

  if (isNeutral) {
    const lx = scale(l, 0, 0.5, pole.l, MIN_FG_LIGHTNESS);
    return { h: pole.h, s: pole.s, l: lx, a };
  }

  let hx = h;
  let lx: number;
  if (isBlue) {
    hx = scale(h, 205, 245, 205, 220);
    lx = scale(l, 0, 0.5, pole.l, Math.min(1, MIN_FG_LIGHTNESS + 0.05));
  } else {
    lx = scale(l, 0, 0.5, pole.l, MIN_FG_LIGHTNESS);
  }

  return { h: hx, s, l: lx, a };
}

function modifyBorderHSL(hsl: HSL, poleFg: HSL, poleBg?: HSL): HSL {
  const { h, s, l, a } = hsl;
  const isDark = l < 0.5;
  const isNeutral = l < 0.2 || s < 0.24;

  let hx = h;
  let sx = s;

  if (isNeutral && poleBg) {
    if (isDark) {
      hx = poleFg.h;
      sx = poleFg.s;
    } else {
      hx = poleBg.h;
      sx = poleBg.s;
    }
  }

  const lx = scale(l, 0, 1, 0.5, 0.2);

  return { h: hx, s: sx, l: lx, a };
}

/**************************************************************************
 * PUBLIC API
 **************************************************************************/

export function modifyBackgroundColor(rgb: RGB, theme: NoirTheme = DEFAULT_THEME): string {
  const pole = theme.darkSchemeBackgroundColor;
  const result = modifyColorWithMatrix(rgb, theme, modifyBgHSL, pole);
  return rgbToString(result);
}

export function modifyForegroundColor(rgb: RGB, theme: NoirTheme = DEFAULT_THEME): string {
  const pole = theme.darkSchemeTextColor;
  const result = modifyColorWithMatrix(rgb, theme, modifyFgHSL, pole);
  return rgbToString(result);
}

export function modifyBorderColor(rgb: RGB, theme: NoirTheme = DEFAULT_THEME): string {
  const poleFg = theme.darkSchemeTextColor;
  const poleBg = theme.darkSchemeBackgroundColor;
  const result = modifyColorWithMatrix(rgb, theme, modifyBorderHSL, poleFg, poleBg);
  return rgbToString(result);
}

export function getColorType(property: string): ColorType {
  const prop = property.toLowerCase();
  if (prop.includes("background") || prop === "fill" || prop.includes("shadow")) {
    return "background";
  }
  if (prop.includes("border") || prop.includes("outline")) {
    return "border";
  }
  return "foreground";
}

// Global dark mode state
let isDarkModeEnabled = false;

export function setDarkMode(enabled: boolean): void {
  isDarkModeEnabled = enabled;
}

export function getDarkMode(): boolean {
  return isDarkModeEnabled;
}

/**
 * Transform color for dark mode (always transforms, for build-time use)
 */
export function transformColorRaw(colorStr: string, property = "color", theme: NoirTheme = DEFAULT_THEME): string | null {
  const rgb = parseColor(colorStr);
  if (!rgb || rgb.a === 0) return null;

  const colorType = getColorType(property);
  switch (colorType) {
    case "background": return modifyBackgroundColor(rgb, theme);
    case "border": return modifyBorderColor(rgb, theme);
    default: return modifyForegroundColor(rgb, theme);
  }
}

/**
 * Transform color for dark mode (only transforms if dark mode is enabled, for runtime use)
 */
export function transformColor(colorStr: string, property = "color", theme: NoirTheme = DEFAULT_THEME): string {
  if (!isDarkModeEnabled) {
    return colorStr;
  }
  return transformColorRaw(colorStr, property, theme) || colorStr;
}
