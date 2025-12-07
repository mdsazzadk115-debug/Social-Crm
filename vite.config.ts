import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 'base' কে './' দিলে অ্যাপটি যেকোনো সাব-ফোল্ডারে (যেমন: domain.com/app) চললেও অ্যাসেট লোড হবে।
  base: './', 
  server: {
    // Proxy Setup for Local Development (Connects React to PHP XAMPP/WAMP)
    proxy: {
      '/api': {
        target: 'http://localhost/social_ads_expert', // আপনার প্রোজেক্ট ফোল্ডারের নাম দিন
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist', // আউটপুট ফোল্ডারের নাম
    assetsDir: 'assets', // অ্যাসেট ফোল্ডারের নাম
    sourcemap: false,
  }
});