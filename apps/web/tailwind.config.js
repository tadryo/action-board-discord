/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        mirai: {
          primary: "#30baa7",
          primaryDark: "#2aa693",
          primaryDeep: "#0d6b5e",
          primarySoft: "#e2f6f3",
          accent: "#64d8c6",
          bg: "#f6f2e8",
          bgDeep: "#efe9da",
          surface: "#ffffff",
          border: "#e5e5e5",
          borderSoft: "#ececec",
          text: "#0a0a0a",
          muted: "#737373",
          mutedFg: "#525252",
          gold: "#fde047",
          success: "#059669",
          danger: "#dc2626",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted-color)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent-color)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
      },
      backgroundImage: {
        "mirai-gradient": "linear-gradient(135deg, #64d8c6, #bcecd3)",
        "gradient-hero": "linear-gradient(180deg, #64d8c6 0%, #bcecd3 100%)",
        "gradient-primary": "linear-gradient(90deg, #2aa693, #30baa7)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        "soft-lg": "var(--shadow-soft-lg)",
      },
      fontSize: {
        xxs: "0.625rem",
      },
    },
  },
  plugins: [],
};
