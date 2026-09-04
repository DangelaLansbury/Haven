import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative asset URLs work both in local previews and under a GitHub Pages repository path.
  base: './',
  build: {
    outDir: 'dist',
  },
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
});
