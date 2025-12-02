/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src//*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        dark: "#0A0F1F",
        panel: "#101726",
        accent: "#6ee7b7"
      }
    }
  },
  plugins: [],
};
