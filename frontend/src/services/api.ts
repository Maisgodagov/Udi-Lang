import axios from 'axios';

// Установка базового URL из переменных окружения
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api', // Используем Vite-специфические переменные окружения
});

// Middleware для добавления токена
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Токен пользователя
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // Добавляем токен в заголовок Authorization
  }
  return config;
});

// Общая обработка ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Функция для регистрации
export const register = (data: { username: string; email: string; password: string }) => {
  return api.post('/auth/register', data);
};

// Функция для логина
export const login = (data: { email: string; password: string }) => {
  return api.post('/auth/login', data);
};

// Другие функции API можно добавить аналогичным образом
export default api;
