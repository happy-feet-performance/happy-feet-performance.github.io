import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  root: ".",
  plugins: [
    react(),
    // Legacy classic-script dashboards aren't part of the module graph,
    // so copy them into the build output verbatim.
    viteStaticCopy({
      targets: [{ src: "js/**/*", dest: "." }],
    }),
  ],
  build: {
    outDir: "dist",
  },
});
