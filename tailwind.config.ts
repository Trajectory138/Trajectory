import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17201b",
        paper: "#f7f8f6",
        line: "#dfe4df",
        leaf: "#2f6f54",
        sky: "#d7e9ef",
        clay: "#c76d44",
        success: "#2f6f54",
        successSoft: "#e8f4ed",
        warning: "#8a5b00",
        warningSoft: "#fff4cf",
        danger: "#a43f35",
        dangerSoft: "#fbe7e4"
      }
    }
  },
  plugins: []
};

export default config;
