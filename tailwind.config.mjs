/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme");

export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        JetbrainsMono: ["JetBrainsMono", "monospace"],
      },
      animation: {
        "skew-scroll": "skew-scroll 20s linear infinite",
      },
    },
    keyframes: {
      "skew-scroll": {
        "0%": {
          transform: "translateY(0)",
        },
        "100%": {
          transform: "translateY(-100%)",
        },
      },
    },
  },
  plugins: [],
};
