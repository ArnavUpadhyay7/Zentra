import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss({
      config: {
        fontFamily: {
          display: ['"Bricolage Grotesque"', "sans-serif"],
          body: ['"DM Sans"', "sans-serif"],
        },
      },
    }),
  ],
});
