import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pitch: "#0b6b3a",
        pitchdark: "#06351d",
      },
    },
  },
  plugins: [],
};

export default config;
