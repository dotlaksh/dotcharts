/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{svelte,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Customizing theme if needed
      colors: {
        lightBackground: "#f8f9fa",
        darkBackground: "#1a202c",
        lightText: "#212529",
        darkText: "#f8f9fa",
      },
    },
  },
  darkMode: "class", // Enable class-based dark mode
  plugins: [],
};
