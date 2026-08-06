import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    build: {
      target: 'es2022',
      // Raise chunk size warning threshold — Three.js chunks are expected to be large
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          // Manual chunk splitting for optimal caching
          manualChunks: {
            // React + Three.js share a chunk to avoid the circular dependency
            'vendor-three':  ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/drei'],
            // Framer Motion
            'vendor-motion': ['motion'],
            // Image utilities
            'vendor-image':  ['html-to-image', 'heic2any', 'react-easy-crop', 'canvas-confetti', 'qrcode'],
          },
        },
      },
    },

    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },

    // Enable source maps in production for error tracking
    // (remove if bundle privacy is a concern)
    // sourcemap: true,
  };
});
