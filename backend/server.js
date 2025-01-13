const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config(); // Загружаем переменные окружения

// Импорт маршрутов
const { authRoutes } = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const dictionaryRoutes = require('./routes/dictionaryRoutes');

const app = express();

// Логирование запросов
app.use(morgan('combined'));

// Парсим JSON в теле запросов
app.use(express.json());

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
  credentials: true,
};
app.use(cors(corsOptions));

// Тестовый маршрут (проверка API)
app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'Test route is working!' });
});

// Подключаем все API-маршруты
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api', dictionaryRoutes);

// Отдаем файлы из /uploads как статику
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Отдаем фронтенд (build) как статику
app.use(express.static(path.join(__dirname, '../build')));

// Если это путь /api/* и он не найден в вышеописанных маршрутах
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API route not found' });
  }
  next();
});

// Fallback для SPA (React). Если не /api, отдаём index.html
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../build', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('index.html not found');
    }
  });
});

// Глобальный обработчик ошибок (если нужно)
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
