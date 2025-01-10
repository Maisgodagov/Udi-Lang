const express = require('express');
const path = require('path');
const cors = require('cors');
const { authRoutes } = require('./routes/authRoutes');
const { userRoutes } = require('./routes/userRoutes');
const dictionaryRoutes = require('./routes/dictionaryRoutes');  // Путь к маршруту словаря

const app = express();
app.use(express.json());
app.use(cors());

// Отдаем файлы из папки 'uploads' как статические
app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // Путь для загрузки файлов

// Отдаем статику из папки 'build' (для фронтенда)
app.use(express.static(path.join(__dirname, '../build')));  // Путь для статики фронтенда

// Маршруты для API
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api', dictionaryRoutes);  // Путь к маршруту словаря

// Обслуживаем index.html для всех не-api запросов (для поддержки React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// Запускаем сервер на порту 3001
app.listen(3001, () => {
  console.log('Server running on port 3001');
});
