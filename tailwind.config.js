import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        dark: {
          ...require("daisyui/src/theming/themes")["dark"],
          "primary": "#10b981",
          "secondary": "#3b82f6",
          "accent": "#f59e0b",
          "base-100": "#111827",
          "base-200": "#1f2937",
          "base-300": "#374151",
        },
      },
    ],
    darkTheme: "dark",
  },
}
