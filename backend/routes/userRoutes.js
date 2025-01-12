const express = require('express');
const { getProfile } = require('../controllers/userController');  // Убедись, что правильно импортирована функция
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Используем getProfile как обработчик для маршрута
router.get('/profile', authMiddleware, getProfile);  // Прокачиваешь запрос на правильный обработчик

module.exports = router; // Экспортируем router напрямую
