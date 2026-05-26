/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        mirai: {
          primary: "#16b8a3",
          primaryDark: "#0e9b89",
          primarySoft: "#e6f7f4",
          accent: "#2563eb",
          bg: "#f4f6f8",
          surface: "#ffffff",
          border: "#e4e8ec",
          text: "#1a2b33",
          muted: "#6b7c85",
          gold: "#f5b301",
          success: "#16a34a",
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
