import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Separate entry and output keep the existing app and its build untouched.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5173 },
  build: {
    outDir: 'dist-story',
    rollupOptions: { input: 'story.html' },
  },
});
