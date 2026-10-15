import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` keeps asset paths relative, so the build works on GitHub Pages
// under any repository name (e.g. https://<user>.github.io/PathForge/).
export default defineConfig({
  base: './',
  plugins: [react()],
});
