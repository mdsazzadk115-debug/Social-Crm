import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 'base' কে './' দিলে অ্যাপটি যেকোনো সাব-ফোল্ডারে (যেমন: domain.com/app) চললেও অ্যাসেট লোড হবে।
  base: './', 
  build: {
    outDir: 'dist', // আউটপুট ফোল্ডারের নাম
    assetsDir: 'assets', // অ্যাসেট ফোল্ডারের নাম
    sourcemap: false,
  }
});