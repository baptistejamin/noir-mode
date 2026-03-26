# vite-noir

Build-time dark mode CSS generation for Vite. Automatically transforms your CSS colors into dark mode variants using DarkReader's color algorithm.

## Features

- **Zero runtime overhead** - Dark mode CSS is generated at build time
- **PostCSS plugin** - Works with any CSS, SCSS, or preprocessor
- **Vite plugin** - Easy integration with Vite projects
- **Runtime transform** - For dynamic inline styles (e.g., Vue/React components)
- **DarkReader algorithm** - Battle-tested color transformation

## Installation

```bash
npm install vite-noir
```

## Usage

### Vite Plugin

The simplest way to use vite-noir is as a Vite plugin:

```javascript
// vite.config.js
import noir from "vite-noir";

export default {
  plugins: [
    noir({
      darkModeSelector: ".dark-mode", // CSS selector for dark mode
      theme: {
        darkSchemeBackgroundColor: "#181a1b",
        darkSchemeTextColor: "#e8e6e3",
      },
    }),
  ],
};
```

### PostCSS Plugin

You can also use it directly as a PostCSS plugin:

```javascript
// vite.config.js
import { noirPostcss } from "vite-noir/postcss";

export default {
  css: {
    postcss: {
      plugins: [
        noirPostcss({
          darkModeSelector: ".dark-mode",
        }),
      ],
    },
  },
};
```

### Runtime Transform

For inline styles that can't be processed at build time (e.g., dynamic colors in Vue/React components):

```javascript
import { transformColor, setDarkMode } from "vite-noir/transform";

// Call this when dark mode is toggled
setDarkMode(true);

// Transform a color (returns original if dark mode is off)
const darkColor = transformColor("#ffffff", "background-color");
// => "#181a1b" (when dark mode is on)
// => "#ffffff" (when dark mode is off)
```

#### Vue Example

```vue
<script>
import { transformColor } from "vite-noir/transform";

export default {
  props: {
    color: String,
  },
  computed: {
    isDarkMode() {
      return this.$store.getters["common/getDarkMode"];
    },
    transformedColor() {
      if (this.isDarkMode) {
        return transformColor(this.color, "color");
      }
      return this.color;
    },
  },
};
</script>
```

## How It Works

vite-noir scans your CSS for color properties and generates corresponding dark mode rules:

**Input:**
```css
.button {
  background-color: #ffffff;
  color: #000000;
}
```

**Output:**
```css
.button {
  background-color: #ffffff;
  color: #000000;
}
.dark-mode .button {
  background-color: #181a1b;
  color: #e8e6e3;
}
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `darkModeSelector` | `string` | `".dark-mode"` | CSS selector to prefix dark mode rules |
| `theme.darkSchemeBackgroundColor` | `string` | `"#181a1b"` | Target background color for dark mode |
| `theme.darkSchemeTextColor` | `string` | `"#e8e6e3"` | Target text color for dark mode |
| `theme.brightness` | `number` | `100` | Brightness adjustment (0-200) |
| `theme.contrast` | `number` | `90` | Contrast adjustment (0-200) |
| `theme.sepia` | `number` | `10` | Sepia filter (0-100) |
| `theme.grayscale` | `number` | `0` | Grayscale filter (0-100) |

## API

### `vite-noir` (default export)

Vite plugin that automatically configures PostCSS.

### `vite-noir/postcss`

- `noirPostcss(options)` - PostCSS plugin

### `vite-noir/transform`

- `transformColor(color, property, theme?)` - Transform color (respects dark mode state)
- `transformColorRaw(color, property, theme?)` - Always transform (for build-time use)
- `setDarkMode(enabled)` - Set global dark mode state
- `getDarkMode()` - Get current dark mode state
- `parseColor(colorStr)` - Parse CSS color to RGB
- `rgbToString(rgb)` - Convert RGB to CSS color string

## Supported Color Formats

- Hex: `#fff`, `#ffffff`, `#ffffffff`
- RGB: `rgb(255, 255, 255)`, `rgba(255, 255, 255, 0.5)`
- HSL: `hsl(0, 0%, 100%)`, `hsla(0, 0%, 100%, 0.5)`
- Modern syntax: `rgb(255 255 255 / 50%)`
- Named colors: `white`, `black`, `transparent`, etc.

## Credits

Color transformation algorithm based on [DarkReader](https://github.com/nicemicro/darkreader).

## License

MIT © [Crisp IM SAS](https://crisp.chat)
