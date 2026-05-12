import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        neon: {
          DEFAULT: "#39ff14",
          dim: "#1a5c12",
          glow: "#6dff4a",
        },
        surface: {
          DEFAULT: "#0d1117",
          card: "#12181f",
          raised: "#1a222d",
        },
      },
      boxShadow: {
        neon: "0 0 20px rgba(57, 255, 20, 0.25)",
        card: "0 4px 24px rgba(0, 0, 0, 0.45)",
      },
      backgroundImage: {
        "grid-radial":
          "radial-gradient(circle at 20% 20%, rgba(57,255,20,0.08) 0%, transparent 40%), radial-gradient(circle at 80% 0%, rgba(0,200,255,0.06) 0%, transparent 35%)",
      },
    },
  },
  plugins: [],
};
export default config;
