import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/GeotabAdd-In/', // Set this to your repository name
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
