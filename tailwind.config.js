/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FDF6EE",
        warmwhite: "#FFFAF4",
        navy: "#2B3856",
        navydark: "#1E2A42",
        gold: "#8B5E3C",
        goldmuted: "#A07848",
        bordercream: "#E8DDD0",
        warmgray: "#6B6058",
        charcoal: "#3A3632",
      },
      fontFamily: {
        serif: ["'Playfair Display'", "Georgia", "serif"],
        sans: ["'Josefin Sans'", "system-ui", "sans-serif"],
        script: ["'Great Vibes'", "cursive"],
      },
    },
  },
  plugins: [],
};
