/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Core brand & ledger tokens ────────────────────────────────────────
        "brand-maroon":   "#6E2A2E",
        "brand-turmeric": "#BD8A1E",
        "ledger-paper":   "#E7E4DC",
        "ledger-surface": "#F4F2EC",
        "ledger-hairline":"#D8D4C7",
        "ledger-divider": "#E0DCD0",
        "ledger-canvas":  "#E7E4DC",

        // ── Analytics: ink-blue accent ────────────────────────────────────────
        "ink-blue": "#3B5166",

        // ── Inventory: bahi-khata aliases ─────────────────────────────────────
        "bahi-canvas":   "#E7E4DC",
        "bahi-surface":  "#F4F2EC",
        "bahi-maroon":   "#6E2A2E",
        "bahi-hairline": "#D8D4C7",
        "bahi-rule":     "#E0DCD0",
        "stock-green":    "#2D5A27",
        "stock-turmeric": "#D4A017",
        "stock-red":      "#B33B2E",

        // ── Material Design surface tokens ────────────────────────────────────
        "primary":                   "#51141a",
        "on-primary":                "#ffffff",
        "primary-container":         "#6e2a2e",
        "on-primary-container":      "#f09294",
        "primary-fixed":             "#ffdad9",
        "primary-fixed-dim":         "#ffb3b3",
        "on-primary-fixed":          "#3d050c",
        "on-primary-fixed-variant":  "#763034",
        "inverse-primary":           "#ffb3b3",

        "secondary":                  "#4b6176",
        "on-secondary":               "#ffffff",
        "secondary-container":        "#cee5ff",
        "on-secondary-container":     "#50677c",
        "secondary-fixed":            "#cee5ff",
        "secondary-fixed-dim":        "#b2c9e2",
        "on-secondary-fixed":         "#041d30",
        "on-secondary-fixed-variant": "#33495d",

        "tertiary":                   "#00321d",
        "on-tertiary":                "#ffffff",
        "tertiary-container":         "#004b2e",
        "on-tertiary-container":      "#7aba95",
        "tertiary-fixed":             "#aff1c9",
        "tertiary-fixed-dim":         "#94d5ae",
        "on-tertiary-fixed":          "#002112",
        "on-tertiary-fixed-variant":  "#0b5134",

        "error":              "#ba1a1a",
        "on-error":           "#ffffff",
        "error-container":    "#ffdad6",
        "on-error-container": "#93000a",

        "surface":                  "#fff8f7",
        "surface-bright":           "#fff8f7",
        "surface-dim":              "#e6d7d6",
        "surface-variant":          "#eedfde",
        "surface-container-lowest": "#ffffff",
        "surface-container-low":    "#fff0f0",
        "surface-container":        "#faeaea",
        "surface-container-high":   "#f4e5e4",
        "surface-container-highest":"#eedfde",
        "surface-tint":             "#93474a",

        "background":        "#fff8f7",
        "on-background":     "#211a1a",
        "on-surface":        "#211a1a",
        "on-surface-variant":"#544342",
        "inverse-surface":   "#372e2e",
        "inverse-on-surface":"#fdedec",

        "outline":         "#867272",
        "outline-variant": "#d9c1c0",
      },

      fontSize: {
        "headline-lg":    ["30px", { lineHeight: "36px", fontWeight: "700" }],
        "headline-md":    ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "headline-sm":    ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "body-lg":        ["18px", { lineHeight: "26px", fontWeight: "400" }],
        "body-md":        ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-sm":        ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "number-display": ["24px", { lineHeight: "32px", letterSpacing: "-0.02em", fontWeight: "500" }],
        "number-data":    ["15px", { lineHeight: "20px", fontWeight: "400" }],
      },

      borderRadius: {
        DEFAULT: "0.25rem",
        lg:      "0.5rem",
        xl:      "0.75rem",
        card:    "14px",
        full:    "9999px",
      },

      spacing: {
        "row-height-min":    "56px",
        "container-padding": "20px",
        "stack-gap":         "12px",
        "margin-rule":       "4px",
        "gutter":            "16px",
      },

      fontFamily: {
        "headline-lg": ["Zilla Slab", "serif"],
        "headline-md": ["Zilla Slab", "serif"],
        "headline-sm": ["Zilla Slab", "serif"],
        "body-lg":     ["IBM Plex Sans", "sans-serif"],
        "body-md":     ["IBM Plex Sans", "sans-serif"],
        "body-sm":     ["IBM Plex Sans", "sans-serif"],
        "number-display": ["IBM Plex Mono", "monospace"],
        "number-data":    ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
}
