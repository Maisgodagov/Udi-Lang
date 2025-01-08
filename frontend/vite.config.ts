import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Прокси для всех запросов, начинающихся с /api
      '/api': 'http://localhost:3001',  // Указываем адрес и порт бэкенда
    },
  },
})
