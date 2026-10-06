import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ecolab: {
          blue: "#0066CC",
          cyan: "#00A3E0",
          green: "#00C853",
          ink: "#12263A",
          mist: "#F4F8FC"
        }
      },
      boxShadow: {
        soft: "0 18px 60px rgba(16, 52, 89, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
