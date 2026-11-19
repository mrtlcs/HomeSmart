import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";

// The OFL requires the license text to travel with the bundled fonts.
function fontLicenses(): Plugin {
  return {
    name: "homesmart-font-licenses",
    generateBundle() {
      for (const font of ["outfit", "figtree", "fredoka"]) {
        try {
          this.emitFile({
            type: "asset",
            fileName: `fonts/${font}-LICENSE.txt`,
            source: readFileSync(resolve(__dirname, `node_modules/@fontsource-variable/${font}/LICENSE`), "utf8"),
          });
        } catch {
          // license file optional
        }
      }
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), fontLicenses()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    emptyOutDir: true,
    minify: "esbuild",
    target: "es2022",
    modulePreload: false,
    copyPublicDir: false,
    outDir: resolve(__dirname, "../custom_components/homesmart/frontend"),
    rollupOptions: {
      input: resolve(__dirname, "src/main.tsx"),
      preserveEntrySignatures: "strict",
      output: {
        format: "es",
        entryFileNames: "homesmart-panel.js",
        assetFileNames: "fonts/[name]-[hash][extname]",
        inlineDynamicImports: true,
      },
    },
  },
});
