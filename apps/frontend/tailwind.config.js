/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
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
      },
      boxShadow: {
        card: "0 1px 3px rgba(16, 40, 50, 0.06), 0 1px 2px rgba(16, 40, 50, 0.04)",
        cardHover: "0 4px 16px rgba(16, 40, 50, 0.1)",
      },
    },
  },
  plugins: [],
};
