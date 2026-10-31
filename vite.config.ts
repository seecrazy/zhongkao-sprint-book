import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages project URL:
// https://<username>.github.io/zhongkao-sprint-book/
export default defineConfig({
  plugins: [react()],
  base: "/zhongkao-sprint-book/",
  server: {
    port: 5175,
    open: true,
  },
});
