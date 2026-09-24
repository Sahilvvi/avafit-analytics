import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "var(--surface-1)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        plane: "var(--page-plane)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        gridline: "var(--gridline)",
        baseline: "var(--baseline)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        accent: "rgb(var(--accent-rgb) / <alpha-value>)",
        "accent-ink": "var(--accent-ink)",
        brand: "rgb(var(--brand-rgb) / <alpha-value>)",
        series: {
          1: "var(--series-1)",
          2: "var(--series-2)",
          3: "var(--series-3)",
          4: "var(--series-4)",
          5: "var(--series-5)",
          6: "var(--series-6)",
          7: "var(--series-7)",
          8: "var(--series-8)",
        },
        status: {
          good: "rgb(var(--status-good-rgb) / <alpha-value>)",
          warning: "rgb(var(--status-warning-rgb) / <alpha-value>)",
          serious: "rgb(var(--status-serious-rgb) / <alpha-value>)",
          critical: "rgb(var(--status-critical-rgb) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["var(--font-dm-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        card: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
