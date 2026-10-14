import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Supabase settings, baked into the client bundle (src/lib/db/core.js).
  // Locally: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.local.
  // On Netlify: either those, or the existing SUPABASE_URL /
  // SUPABASE_ANON_KEY environment variables. Only these two are exposed.
  const env = loadEnv(mode, process.cwd(), "");
  const pick = (name) => env[`VITE_${name}`] || env[name] || "";

  return {
    root: ".",
    plugins: [react()],
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(pick("SUPABASE_URL")),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(pick("SUPABASE_ANON_KEY")),
    },
    build: {
      outDir: "dist",
    },
  };
});
