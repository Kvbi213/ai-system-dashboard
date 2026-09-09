import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const groqKey = env.VITE_GROQ_API_KEY || env.GROQ_API_KEY || '';

  return {
    plugins: [react()],
    test: {
      environment: 'jsdom',
      globals: true
    },
    define: {
      'import.meta.env.VITE_GROQ_API_KEY': JSON.stringify(groqKey)
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:5000',
          changeOrigin: true,
          secure: false,
        }
      }
    }
  };
});

