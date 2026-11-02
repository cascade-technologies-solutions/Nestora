import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Auto-detect deployment target:
// - GitHub Actions (without Vercel) defaults to "/Nestora/" for GitHub Pages
// - Vercel, Netlify, Render, Docker, and local dev default to root "/"
const isGitHubPages = process.env.GITHUB_ACTIONS === "true" && !process.env.VERCEL;
const defaultBase = isGitHubPages ? "/Nestora/" : "/";
const base = process.env.VITE_BASE_PATH || defaultBase;

export default defineConfig({
  plugins: [react()],
  base,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // Fix alias for "@/components/..."
    },
  },
});
