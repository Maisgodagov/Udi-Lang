const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const { authRoutes } = require('./routes/authRoutes');
const { userRoutes } = require('./routes/userRoutes');
const dictionaryRoutes = require('./routes/dictionaryRoutes');
require('dotenv').config(); // Загружаем переменные окружения

const app = express();
app.use(express.json());
app.use(morgan('combined')); // Логирование запросов

// Настройка CORS
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  process.env.FRONTEND_URL || 'http://localhost:5173',
];

const corsOptions = {
  origin: (origin, callback) => {
    // Разрешаем запросы только с указанных доменов
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Позволяем передавать куки или токены
};

// Применение CORS
app.use(cors(corsOptions));

// API тестовый маршрут
app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'Test route is working!' });
});

// API маршруты
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api', dictionaryRoutes);

// Статические файлы (uploads и build)
app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // Для загрузок
app.use(express.static(path.join(__dirname, '../build'))); // Для фронтенда

// Обслуживание React-приложения
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../build', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('index.html not found');
    }
  });
});

// Обработка ошибок для API маршрутов
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API route not found' });
  }
  next();
});

// Обработка глобальных ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// Запуск сервера
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`Allowed Origins: ${allowedOrigins.join(', ')}`);
});
