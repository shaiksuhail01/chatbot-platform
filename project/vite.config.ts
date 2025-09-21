import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: 'dist',       // Ensure Vite outputs build files to 'dist'
    emptyOutDir: true,    // Clears 'dist' before building
  },
  base: '/',              // Needed if deploying to root domain
});
