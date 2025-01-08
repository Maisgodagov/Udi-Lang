import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',  // Базовый URL для бэкенда
});

// Функция для регистрации
export const register = (data: { username: string; email: string; password: string }) => {
  return api.post('/auth/register', data);
};

// Функция для логина
export const login = (data: { email: string; password: string }) => {
  return api.post('/auth/login', data);
};
