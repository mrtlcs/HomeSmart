import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: resolve(__dirname, '../custom_components/homesmart/frontend'),
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/homesmart-panel.ts'),
      formats: ['es'],
      fileName: () => 'homesmart-panel.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'homesmart-panel.js',
      },
    },
    minify: 'esbuild',
    sourcemap: false,
  },
  server: {
    port: 3000,
    open: false,
  },
});
