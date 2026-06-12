import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://onandemo.jass.gg",
  vite: {
    plugins: [tailwindcss()],
  },
});
