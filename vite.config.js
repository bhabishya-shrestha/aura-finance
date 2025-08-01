import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Allow external connections
    strictPort: true, // Fail if port is in use
    open: false, // Don't auto-open browser
  },
  define: {
    // Make environment variables available to the client
    __APP_ENV__: JSON.stringify(process.env.VITE_APP_ENV || 'development'),
  },
  build: {
    outDir: 'dist',
    sourcemap: true, // Enable source maps for debugging
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react'],
        },
      },
    },
  },
  // Handle environment variables
  envPrefix: 'VITE_',
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      '@supabase/supabase-js',
    ],
  },
})
