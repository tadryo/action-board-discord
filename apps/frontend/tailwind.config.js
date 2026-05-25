/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        discord: {
          bg: "#313338",
          surface: "#2b2d31",
          card: "#1e1f22",
          brand: "#5865f2",
          green: "#57f287",
          yellow: "#fee75c",
          red: "#ed4245",
          text: "#dbdee1",
          muted: "#949ba4",
        },
      },
    },
  },
  plugins: [],
};
