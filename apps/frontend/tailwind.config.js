/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // mirai brand colors (Tailwind utilities)
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
        // shadcn/ui CSS-variable-based colors (used by Card, Button, Badge, etc.)
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
        card: "0 1px 3px rgba(16, 40, 50, 0.06), 0 1px 2px rgba(16, 40, 50, 0.04)",
        cardHover: "0 4px 16px rgba(16, 40, 50, 0.1)",
        soft: "var(--shadow-soft)",
        "soft-lg": "var(--shadow-soft-lg)",
      },
      fontSize: {
        xxs: "0.625rem",
        xxl: "1.375rem",
      },
      ringOffsetColor: {
        background: "var(--background)",
      },
    },
  },
  plugins: [],
};
