import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativa: funciona no GitHub Pages (/Mirante3D/), Netlify e Vercel sem ajuste
export default defineConfig({
  base: './',
  plugins: [react()],
});
