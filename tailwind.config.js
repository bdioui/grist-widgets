/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "oklch(var(--border))",
        background: "oklch(var(--background))",
        foreground: "oklch(var(--foreground))",
        ring: "oklch(var(--ring))",
      },
    },
  },
  plugins: [],
}