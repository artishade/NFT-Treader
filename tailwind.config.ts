import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        acid: {
          DEFAULT: "hsl(var(--acid))",
          dim: "hsl(var(--acid) / 0.14)",
          bright: "hsl(var(--acid-bright))",
        },
        volt: "hsl(var(--volt))",
        down: "hsl(var(--down))",
      },
      fontFamily: {
        display: ['"Space Grotesk"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        marquee: "marquee 46s linear infinite",
        "fade-up": "fade-up 0.55s cubic-bezier(0.22,1,0.36,1) both",
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
        shimmer: "shimmer 1.6s linear infinite",
      },
      boxShadow: {
        glow: "0 0 0 1px hsl(var(--acid) / 0.35), 0 0 34px -6px hsl(var(--acid) / 0.4)",
        "glow-sm": "0 0 18px -4px hsl(var(--acid) / 0.45)",
        card: "0 1px 0 0 hsl(var(--border)), 0 12px 32px -18px rgb(0 0 0 / 0.8)",
      },
    },
  },
  plugins: [],
} satisfies Config;
