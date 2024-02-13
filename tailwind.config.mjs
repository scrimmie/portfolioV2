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
        marquee: "marquee 30s linear infinite",
      },
    },
    keyframes: {
      marquee: {
        "0%": {
          transform: "translateX(0%)",
        },
        "100%": {
          transform: "translateX(-200%)",
        },
      },
    },
  },
  plugins: [],
};
