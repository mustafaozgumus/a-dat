import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Vercel veya yerel ortamdaki değişkenleri yükle
  // Use '.' instead of process.cwd() to fix type error if @types/node is missing
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    define: {
      // process.env.API_KEY'i derleme sırasında güvenli bir şekilde yerleştirir
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    server: {
      host: true
    }
  };
});