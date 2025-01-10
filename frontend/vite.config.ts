import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',  // Прокси для всех запросов, начинающихся с /api
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'build'),  // Указываем папку для сборки
    sourcemap: true,  // Генерация исходных карт для отладки
    assetsDir: 'assets',  // Все ассеты будут помещены в папку assets внутри папки build
    rollupOptions: {
      output: {
        // Оптимизация выхода
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});
