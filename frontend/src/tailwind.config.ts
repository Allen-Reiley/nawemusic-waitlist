// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    // Add this line to include Tremor components
    "./node_modules/@tremor/react/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Tremor uses specific colors you can map here if needed
    },
  },
  plugins: [],
};
export default config;