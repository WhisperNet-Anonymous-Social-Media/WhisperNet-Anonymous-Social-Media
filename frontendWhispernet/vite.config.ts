import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      events: path.resolve(__dirname, './src/shims/events.ts'),
      util: path.resolve(__dirname, './src/shims/util.ts'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react_vendor: ['react', 'react-dom', 'react-router-dom'],
          ui_vendor: ['framer-motion', 'lucide-react', 'sonner'],
          rtc_vendor: ['simple-peer', 'socket.io-client'],
        },
      },
    },
  },
});
