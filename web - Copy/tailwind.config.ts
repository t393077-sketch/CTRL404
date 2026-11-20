import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        seenil: {
          bg: "#0D1420",
          card: "#131C2E",
          cardHover: "#18243B",
          border: "#1E2C44",
          muted: "#94A3B8",
          primary: "#38BDF8",
        },
        health: {
          excellent: "#10B981", // emerald
          good: "#06B6D4",      // cyan
          fair: "#F59E0B",      // amber
          poor: "#EF4444",      // red
          offline: "#64748B",   // slate
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      }
    },
  },
  plugins: [],
};
export default config;
