import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
<<<<<<< HEAD
  base: '/',
=======
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: '/preset-sites/halo-usd/',
>>>>>>> 4f21f9c16c268e9ae3efe6f9381f77c3d6037719
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});

