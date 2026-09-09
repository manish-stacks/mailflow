import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#171B18",
        paper: "#F2F0E7",
        paperDim: "#E9E5D5",
        // Sealing-wax red — the primary mark. Named `indigo` in code for a
        // smaller diff; the actual hue is a muted brick/clay red.
        indigo: {
          DEFAULT: "#9A3A26",
          dark: "#7A2C1B",
        },
        // Postage brass — secondary mark, used for figures and one accent per view.
        amber: {
          DEFAULT: "#A9812E",
          soft: "#D8BD7F",
        },
        line: "#DAD4C0",
        mist: "#5B6056",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      maxWidth: {
        wrap: "1180px",
      },
      backgroundImage: {
        "route-dash":
          "repeating-linear-gradient(90deg, currentColor 0, currentColor 6px, transparent 6px, transparent 14px)",
      },
    },
  },
  plugins: [],
};

export default config;
