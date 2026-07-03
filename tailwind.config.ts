import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#0b0b12",
        surface: "#141420",
        "surface-2": "#1c1c2c",
        border: "#2a2a3c",
        accent: {
          DEFAULT: "#7c5cff",
          soft: "#a78bfa",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(124, 92, 255, 0.25)",
      },
      backgroundImage: {
        "radial-fade":
          "radial-gradient(60% 60% at 50% 0%, rgba(124,92,255,0.18) 0%, rgba(11,11,18,0) 70%)",
      },
    },
  },
  plugins: [],
};

export default config;
